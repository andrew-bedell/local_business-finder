// Vercel serverless function: Customer team management
// GET — list team members for caller's customer
// PATCH — update team member (is_active, display_name, role) — owner only

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET' && req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || 'https://xagfwyknlutmmtfufbfi.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
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

    if (req.method === 'GET') {
      // List all team members for this customer
      const teamRes = await fetch(
        `${supabaseUrl}/rest/v1/customer_users?customer_id=eq.${caller.customer_id}&select=id,auth_user_id,role,email,display_name,is_active,invited_at,joined_at,created_at&order=created_at.asc`,
        { headers: supabaseHeaders }
      );
      const teamData = await teamRes.json();
      return res.status(200).json(teamData || []);
    }

    if (req.method === 'PATCH') {
      // Only owner can modify team members
      if (caller.role !== 'owner') {
        return res.status(403).json({ error: 'Only the owner can modify team members' });
      }

      const { member_id, is_active, display_name, role } = req.body || {};
      if (!member_id) {
        return res.status(400).json({ error: 'member_id is required' });
      }

      // Verify member belongs to same customer
      const memberRes = await fetch(
        `${supabaseUrl}/rest/v1/customer_users?id=eq.${encodeURIComponent(member_id)}&customer_id=eq.${caller.customer_id}&select=id,role`,
        { headers: supabaseHeaders }
      );
      const memberData = await memberRes.json();
      if (!Array.isArray(memberData) || memberData.length === 0) {
        return res.status(404).json({ error: 'Team member not found' });
      }

      // Can't modify the owner
      if (memberData[0].role === 'owner') {
        return res.status(403).json({ error: 'Cannot modify the owner account' });
      }

      // Build update payload
      const updatePayload = {};
      if (typeof is_active === 'boolean') updatePayload.is_active = is_active;
      if (display_name !== undefined) updatePayload.display_name = display_name;
      if (role && ['manager', 'employee'].includes(role)) updatePayload.role = role;

      if (Object.keys(updatePayload).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      const updateRes = await fetch(
        `${supabaseUrl}/rest/v1/customer_users?id=eq.${encodeURIComponent(member_id)}`,
        {
          method: 'PATCH',
          headers: { ...supabaseHeaders, 'Prefer': 'return=representation' },
          body: JSON.stringify(updatePayload),
        }
      );

      if (!updateRes.ok) {
        const errText = await updateRes.text().catch(() => '');
        console.error('Update team member error:', updateRes.status, errText);
        return res.status(502).json({ error: 'Failed to update team member' });
      }

      const updated = await updateRes.json();
      return res.status(200).json(updated[0] || {});
    }
  } catch (err) {
    console.error('Customer team error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
