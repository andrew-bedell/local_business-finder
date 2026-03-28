// Vercel serverless function: Public employee application submission
// POST = submit a new application (no auth required)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || 'https://xagfwyknlutmmtfufbfi.supabase.co';
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return res.status(503).json({ error: 'Service role key not configured' });
  }

  try {
    const { name, email, phone, message } = req.body || {};

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ error: 'name and email are required' });
    }

    // Check if a pending application already exists for this email
    const pendingRes = await fetch(
      `${supabaseUrl}/rest/v1/employee_applications?email=eq.${encodeURIComponent(email)}&status=eq.pending&select=id`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
      }
    );
    if (!pendingRes.ok) {
      console.error('Check pending error:', pendingRes.status, await pendingRes.text());
      return res.status(502).json({ error: 'Failed to check existing applications' });
    }
    const pendingData = await pendingRes.json();
    if (Array.isArray(pendingData) && pendingData.length > 0) {
      return res.status(409).json({ error: 'Ya tienes una solicitud pendiente' });
    }

    // Check if an employee with this email already exists
    const empRes = await fetch(
      `${supabaseUrl}/rest/v1/employees?email=eq.${encodeURIComponent(email)}&select=id`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
      }
    );
    if (!empRes.ok) {
      console.error('Check employee error:', empRes.status, await empRes.text());
      return res.status(502).json({ error: 'Failed to check existing employees' });
    }
    const empData = await empRes.json();
    if (Array.isArray(empData) && empData.length > 0) {
      return res.status(409).json({ error: 'Ya eres parte del equipo' });
    }

    // Insert the application
    const insertBody = { name, email };
    if (phone) insertBody.phone = phone;
    if (message) insertBody.message = message;

    const insertRes = await fetch(
      `${supabaseUrl}/rest/v1/employee_applications`,
      {
        method: 'POST',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(insertBody),
      }
    );

    if (!insertRes.ok) {
      const errText = await insertRes.text();
      console.error('Insert application error:', insertRes.status, errText);
      return res.status(502).json({ error: 'Failed to submit application' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Employee apply error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
