// Vercel serverless function: Scheduling configuration
// GET — returns scheduling_type + scheduling_config for caller's business
// PATCH — updates scheduling_type and/or scheduling_config on businesses table

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET' && req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || 'https://xagfwyknlutmmtfufbfi.supabase.co';
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return res.status(503).json({ error: 'Service role key not configured' });
  }

  // Verify caller JWT
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
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!userRes.ok) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const userData = await userRes.json();

    // Look up caller's customer_users record
    const callerRes = await fetch(
      `${supabaseUrl}/rest/v1/customer_users?auth_user_id=eq.${userData.id}&select=id,customer_id,role`,
      { headers: supabaseHeaders }
    );
    const callerData = await callerRes.json();
    if (!Array.isArray(callerData) || callerData.length === 0) {
      return res.status(403).json({ error: 'No customer account found' });
    }
    const caller = callerData[0];

    // Get business_id from customer record
    const custRes = await fetch(
      `${supabaseUrl}/rest/v1/customers?id=eq.${caller.customer_id}&select=business_id`,
      { headers: supabaseHeaders }
    );
    const custData = await custRes.json();
    if (!Array.isArray(custData) || custData.length === 0) {
      return res.status(404).json({ error: 'Customer record not found' });
    }
    const businessId = custData[0].business_id;

    if (req.method === 'GET') {
      const bizRes = await fetch(
        `${supabaseUrl}/rest/v1/businesses?id=eq.${businessId}&select=scheduling_type,scheduling_config`,
        { headers: supabaseHeaders }
      );
      const bizData = await bizRes.json();
      if (!Array.isArray(bizData) || bizData.length === 0) {
        return res.status(404).json({ error: 'Business not found' });
      }
      return res.status(200).json(bizData[0]);
    }

    if (req.method === 'PATCH') {
      // Only owner or manager can update config
      if (caller.role !== 'owner' && caller.role !== 'manager') {
        return res.status(403).json({ error: 'Only owner or manager can update scheduling config' });
      }

      const { scheduling_type, scheduling_config } = req.body || {};
      const updatePayload = {};

      if (scheduling_type !== undefined) {
        if (scheduling_type !== null && !['appointment_based', 'class_based'].includes(scheduling_type)) {
          return res.status(400).json({ error: 'Invalid scheduling_type' });
        }
        updatePayload.scheduling_type = scheduling_type;
      }

      if (scheduling_config !== undefined) {
        if (typeof scheduling_config !== 'object' || Array.isArray(scheduling_config)) {
          return res.status(400).json({ error: 'scheduling_config must be an object' });
        }
        updatePayload.scheduling_config = scheduling_config;
      }

      if (Object.keys(updatePayload).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      const updateRes = await fetch(
        `${supabaseUrl}/rest/v1/businesses?id=eq.${businessId}`,
        {
          method: 'PATCH',
          headers: { ...supabaseHeaders, 'Prefer': 'return=representation' },
          body: JSON.stringify(updatePayload),
        }
      );

      if (!updateRes.ok) {
        const errText = await updateRes.text().catch(() => '');
        console.error('Update scheduling config error:', updateRes.status, errText);
        return res.status(502).json({ error: 'Failed to update scheduling config' });
      }

      const updated = await updateRes.json();
      return res.status(200).json({
        scheduling_type: updated[0]?.scheduling_type || null,
        scheduling_config: updated[0]?.scheduling_config || {},
      });
    }
  } catch (err) {
    console.error('Scheduling config error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
