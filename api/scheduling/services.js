// Vercel serverless function: Booking services CRUD
// GET — list services for caller's business
// POST — create new service
// PATCH — update service
// DELETE — soft-delete (set is_active=false)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || 'https://xagfwyknlutmmtfufbfi.supabase.co';
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return res.status(503).json({ error: 'Service role key not configured' });
  }

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

    // ── GET: list services ──
    if (req.method === 'GET') {
      const showInactive = req.query.show_inactive === 'true';
      let url = `${supabaseUrl}/rest/v1/booking_services?business_id=eq.${businessId}&select=*&order=sort_order.asc,name.asc`;
      if (!showInactive) {
        url += '&is_active=eq.true';
      }
      const svcRes = await fetch(url, { headers: supabaseHeaders });
      const svcData = await svcRes.json();
      return res.status(200).json(svcData || []);
    }

    // Write operations require owner or manager
    if (caller.role !== 'owner' && caller.role !== 'manager') {
      return res.status(403).json({ error: 'Only owner or manager can manage services' });
    }

    // ── POST: create service ──
    if (req.method === 'POST') {
      const { name, description, duration_minutes, price, currency, category, max_capacity, requires_membership, color } = req.body || {};
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'name is required' });
      }
      if (!duration_minutes || duration_minutes < 1) {
        return res.status(400).json({ error: 'duration_minutes must be at least 1' });
      }

      const payload = {
        business_id: businessId,
        name: name.trim(),
        description: description || null,
        duration_minutes: parseInt(duration_minutes, 10),
        price: price != null ? parseFloat(price) : 0,
        currency: currency || 'MXN',
        category: category || null,
        max_capacity: max_capacity ? parseInt(max_capacity, 10) : 1,
        requires_membership: requires_membership || false,
        color: color || null,
      };

      const createRes = await fetch(
        `${supabaseUrl}/rest/v1/booking_services`,
        {
          method: 'POST',
          headers: { ...supabaseHeaders, 'Prefer': 'return=representation' },
          body: JSON.stringify(payload),
        }
      );

      if (!createRes.ok) {
        const errText = await createRes.text().catch(() => '');
        console.error('Create service error:', createRes.status, errText);
        return res.status(502).json({ error: 'Failed to create service' });
      }

      const created = await createRes.json();
      return res.status(201).json(created[0] || {});
    }

    // ── PATCH: update service ──
    if (req.method === 'PATCH') {
      const { id, name, description, duration_minutes, price, currency, category, max_capacity, requires_membership, color, sort_order } = req.body || {};
      if (!id) {
        return res.status(400).json({ error: 'id is required' });
      }

      // Verify service belongs to caller's business
      const checkRes = await fetch(
        `${supabaseUrl}/rest/v1/booking_services?id=eq.${encodeURIComponent(id)}&business_id=eq.${businessId}&select=id`,
        { headers: supabaseHeaders }
      );
      const checkData = await checkRes.json();
      if (!Array.isArray(checkData) || checkData.length === 0) {
        return res.status(404).json({ error: 'Service not found' });
      }

      const updatePayload = {};
      if (name !== undefined) updatePayload.name = name;
      if (description !== undefined) updatePayload.description = description;
      if (duration_minutes !== undefined) updatePayload.duration_minutes = parseInt(duration_minutes, 10);
      if (price !== undefined) updatePayload.price = parseFloat(price);
      if (currency !== undefined) updatePayload.currency = currency;
      if (category !== undefined) updatePayload.category = category;
      if (max_capacity !== undefined) updatePayload.max_capacity = parseInt(max_capacity, 10);
      if (requires_membership !== undefined) updatePayload.requires_membership = requires_membership;
      if (color !== undefined) updatePayload.color = color;
      if (sort_order !== undefined) updatePayload.sort_order = sort_order;

      if (Object.keys(updatePayload).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      const updateRes = await fetch(
        `${supabaseUrl}/rest/v1/booking_services?id=eq.${encodeURIComponent(id)}`,
        {
          method: 'PATCH',
          headers: { ...supabaseHeaders, 'Prefer': 'return=representation' },
          body: JSON.stringify(updatePayload),
        }
      );

      if (!updateRes.ok) {
        const errText = await updateRes.text().catch(() => '');
        console.error('Update service error:', updateRes.status, errText);
        return res.status(502).json({ error: 'Failed to update service' });
      }

      const updated = await updateRes.json();
      return res.status(200).json(updated[0] || {});
    }

    // ── DELETE: soft-delete service ──
    if (req.method === 'DELETE') {
      const serviceId = req.query.id || (req.body && req.body.id);
      if (!serviceId) {
        return res.status(400).json({ error: 'id is required' });
      }

      // Verify service belongs to caller's business
      const checkRes = await fetch(
        `${supabaseUrl}/rest/v1/booking_services?id=eq.${encodeURIComponent(serviceId)}&business_id=eq.${businessId}&select=id`,
        { headers: supabaseHeaders }
      );
      const checkData = await checkRes.json();
      if (!Array.isArray(checkData) || checkData.length === 0) {
        return res.status(404).json({ error: 'Service not found' });
      }

      const delRes = await fetch(
        `${supabaseUrl}/rest/v1/booking_services?id=eq.${encodeURIComponent(serviceId)}`,
        {
          method: 'PATCH',
          headers: { ...supabaseHeaders, 'Prefer': 'return=representation' },
          body: JSON.stringify({ is_active: false }),
        }
      );

      if (!delRes.ok) {
        const errText = await delRes.text().catch(() => '');
        console.error('Delete service error:', delRes.status, errText);
        return res.status(502).json({ error: 'Failed to deactivate service' });
      }

      return res.status(200).json({ success: true });
    }
  } catch (err) {
    console.error('Service management error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
