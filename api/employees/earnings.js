// Vercel serverless function: Get employee earnings dashboard data
// GET — returns commission stats and customer list for the authenticated employee

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL || 'https://xagfwyknlutmmtfufbfi.supabase.co';
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return res.status(503).json({ error: 'Service role key not configured' });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }
  const token = authHeader.slice(7);

  const supabaseHeaders = {
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  };

  try {
    // Get user from JWT
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${token}` },
    });
    if (!userRes.ok) return res.status(401).json({ error: 'Invalid token' });
    const userData = await userRes.json();

    // Get employee record
    const empRes = await fetch(
      `${supabaseUrl}/rest/v1/employees?auth_user_id=eq.${userData.id}&is_active=eq.true&select=id,tracking_code`,
      { headers: supabaseHeaders }
    );
    const empData = await empRes.json();
    if (!Array.isArray(empData) || empData.length === 0) {
      return res.status(403).json({ error: 'Not an active employee' });
    }
    const employee = empData[0];

    // Get customers attributed to this employee, with business name and subscriptions
    const custRes = await fetch(
      `${supabaseUrl}/rest/v1/customers?sales_rep_employee_id=eq.${employee.id}&select=id,contact_name,email,monthly_price,currency,created_at,business_id,businesses(name),subscriptions(id,status,stripe_price_id,current_period_start,current_period_end)`,
      { headers: supabaseHeaders }
    );
    if (!custRes.ok) {
      console.error('Customers query error:', custRes.status, await custRes.text().catch(() => ''));
      return res.status(502).json({ error: 'Failed to load earnings data' });
    }
    const customers = await custRes.json();

    // Get products for commission amounts (keyed by stripe_price_id)
    const prodRes = await fetch(
      `${supabaseUrl}/rest/v1/products?is_active=eq.true&select=name,stripe_price_id,commission_amount`,
      { headers: supabaseHeaders }
    );
    const products = await prodRes.json();
    const commissionByPrice = {};
    const nameByPrice = {};
    if (Array.isArray(products)) {
      products.forEach(p => {
        if (p.stripe_price_id) {
          commissionByPrice[p.stripe_price_id] = parseFloat(p.commission_amount) || 100;
          nameByPrice[p.stripe_price_id] = p.name || 'Plan';
        }
      });
    }

    // Build customer list with commission info
    let thisMonthAmount = 0;
    let activeCount = 0;
    const customerList = [];

    (customers || []).forEach(cust => {
      const businessName = cust.businesses ? cust.businesses.name : 'Unknown';
      const subs = cust.subscriptions || [];

      // Find the most relevant subscription (prefer active)
      const activeSub = subs.find(s => s.status === 'active') || subs[0];
      const status = activeSub ? activeSub.status : 'none';
      const stripePriceId = activeSub ? activeSub.stripe_price_id : null;
      const commission = stripePriceId ? (commissionByPrice[stripePriceId] || 100) : 100;
      const planName = stripePriceId ? (nameByPrice[stripePriceId] || 'Plan') : 'Plan';

      if (status === 'active') {
        thisMonthAmount += commission;
        activeCount++;
      }

      customerList.push({
        businessName,
        contactName: cust.contact_name || cust.email,
        plan: planName,
        monthlyCommission: commission,
        status,
        since: cust.created_at ? cust.created_at.split('T')[0] : null,
      });
    });

    return res.status(200).json({
      trackingCode: employee.tracking_code || null,
      thisMonth: {
        amount: thisMonthAmount,
        currency: 'MXN',
        activeCount,
      },
      customers: customerList,
    });
  } catch (err) {
    console.error('Earnings endpoint error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
