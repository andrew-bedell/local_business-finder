// Vercel serverless function: Get or generate employee tracking code
// GET — returns tracking code + link for the authenticated employee

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
      `${supabaseUrl}/rest/v1/employees?auth_user_id=eq.${userData.id}&is_active=eq.true&select=id,display_name,tracking_code`,
      { headers: supabaseHeaders }
    );
    const empData = await empRes.json();
    if (!Array.isArray(empData) || empData.length === 0) {
      return res.status(403).json({ error: 'Not an active employee' });
    }
    const employee = empData[0];

    let trackingCode = employee.tracking_code;

    // Auto-generate if null
    if (!trackingCode) {
      const baseName = (employee.display_name || 'emp')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 4) || 'emp';

      // Try up to 5 times in case of unique constraint collision
      for (let attempt = 0; attempt < 5; attempt++) {
        const randomPart = Array.from({ length: 4 }, () =>
          'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
        ).join('');
        const candidate = baseName + randomPart;

        const updateRes = await fetch(
          `${supabaseUrl}/rest/v1/employees?id=eq.${employee.id}`,
          {
            method: 'PATCH',
            headers: { ...supabaseHeaders, 'Prefer': 'return=representation' },
            body: JSON.stringify({ tracking_code: candidate }),
          }
        );

        if (updateRes.ok) {
          const updated = await updateRes.json();
          if (updated && updated.length > 0) {
            trackingCode = updated[0].tracking_code;
            break;
          }
        }
        // If 409 conflict or similar, retry with different random part
        if (attempt === 4) {
          return res.status(500).json({ error: 'Failed to generate unique tracking code' });
        }
      }
    }

    return res.status(200).json({
      code: trackingCode,
      link: `https://ahoratengopagina.com/planes?rep=${trackingCode}`,
    });
  } catch (err) {
    console.error('Tracking code error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
