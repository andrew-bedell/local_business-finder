// Vercel serverless function: List and update employees
// GET = list all employees (admin only), PATCH = update an employee (admin only)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabaseUrl = process.env.SUPABASE_URL || 'https://xagfwyknlutmmtfufbfi.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return res.status(503).json({ error: 'Service role key not configured' });
  }

  // Verify caller is an admin
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }
  const token = authHeader.slice(7);

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

    // Check if caller is admin
    const empRes = await fetch(
      `${supabaseUrl}/rest/v1/employees?auth_user_id=eq.${userData.id}&role=eq.admin&is_active=eq.true&select=id`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
      }
    );
    const empData = await empRes.json();
    if (!Array.isArray(empData) || empData.length === 0) {
      return res.status(403).json({ error: 'Only admins can manage employees' });
    }

    if (req.method === 'GET') {
      // List all employees
      const listRes = await fetch(
        `${supabaseUrl}/rest/v1/employees?select=id,auth_user_id,email,display_name,role,is_active,invited_at,joined_at,created_at&order=created_at.asc`,
        {
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
          },
        }
      );
      if (!listRes.ok) {
        return res.status(502).json({ error: 'Failed to list employees' });
      }
      const employees = await listRes.json();
      return res.status(200).json(employees);
    }

    if (req.method === 'PATCH') {
      const { id, is_active, display_name, role } = req.body || {};
      if (!id) {
        return res.status(400).json({ error: 'Employee id is required' });
      }

      // Build update object
      const updates = {};
      if (typeof is_active === 'boolean') updates.is_active = is_active;
      if (typeof display_name === 'string') updates.display_name = display_name;
      if (typeof role === 'string' && (role === 'admin' || role === 'employee')) updates.role = role;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      const updateRes = await fetch(
        `${supabaseUrl}/rest/v1/employees?id=eq.${id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(updates),
        }
      );

      if (!updateRes.ok) {
        const errText = await updateRes.text();
        console.error('Employee update error:', updateRes.status, errText);
        return res.status(502).json({ error: 'Failed to update employee' });
      }

      const updated = await updateRes.json();
      return res.status(200).json(updated);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Employee list/update error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
