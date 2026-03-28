// Vercel serverless function: List and update employee applications
// GET = list pending applications (admin only), PATCH = update status (admin only)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabaseUrl = process.env.SUPABASE_URL || 'https://xagfwyknlutmmtfufbfi.supabase.co';
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return res.status(503).json({ error: 'Service role key not configured' });
  }

  // Verify caller is an admin employee
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
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${token}` },
    });
    if (!userRes.ok) return res.status(401).json({ error: 'Invalid token' });
    const userData = await userRes.json();

    const empRes = await fetch(
      `${supabaseUrl}/rest/v1/employees?auth_user_id=eq.${userData.id}&role=eq.admin&is_active=eq.true&select=id`,
      { headers: supabaseHeaders }
    );
    const empData = await empRes.json();
    if (!Array.isArray(empData) || empData.length === 0) {
      return res.status(403).json({ error: 'Only admins can manage applications' });
    }
    const adminId = empData[0].id;

    if (req.method === 'GET') {
      const listRes = await fetch(
        `${supabaseUrl}/rest/v1/employee_applications?status=eq.pending&order=created_at.asc&select=id,name,email,phone,message,created_at`,
        { headers: supabaseHeaders }
      );
      if (!listRes.ok) {
        return res.status(502).json({ error: 'Failed to load applications' });
      }
      const applications = await listRes.json();
      return res.status(200).json(applications);
    }

    if (req.method === 'PATCH') {
      const { id, status } = req.body || {};
      if (!id || !status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'id and status (approved/rejected) are required' });
      }

      const updateRes = await fetch(
        `${supabaseUrl}/rest/v1/employee_applications?id=eq.${encodeURIComponent(id)}`,
        {
          method: 'PATCH',
          headers: { ...supabaseHeaders, 'Prefer': 'return=representation' },
          body: JSON.stringify({
            status,
            reviewed_by: adminId,
            reviewed_at: new Date().toISOString(),
          }),
        }
      );

      if (!updateRes.ok) {
        const errText = await updateRes.text();
        console.error('Application update error:', updateRes.status, errText);
        return res.status(502).json({ error: 'Failed to update application' });
      }

      const updated = await updateRes.json();
      return res.status(200).json(updated);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Applications error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
