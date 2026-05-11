// Vercel cron: expire PaginaPro free trials and lock their published pages.

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const cronSecret = process.env.CRON_SECRET;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }

  if (cronSecret) {
    const authHeader = req.headers.authorization || '';
    const querySecret = req.query?.secret || '';
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (bearer !== cronSecret && querySecret !== cronSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  try {
    const now = new Date().toISOString();
    const trialRes = await fetch(
      `${supabaseUrl}/rest/v1/subscriptions?status=eq.trialing&current_period_end=lte.${encodeURIComponent(now)}&select=id,customer_id,current_period_end,customers(id,business_id,email,contact_name)`,
      { headers }
    );

    if (!trialRes.ok) {
      const detail = await trialRes.text().catch(() => '');
      return res.status(502).json({ error: 'Failed to load expired trials', detail });
    }

    const trials = await trialRes.json();
    const results = [];

    for (const trial of trials || []) {
      const customer = Array.isArray(trial.customers) ? trial.customers[0] : trial.customers;
      const businessId = customer?.business_id;
      if (!businessId) {
        results.push({ subscriptionId: trial.id, skipped: 'missing_business_id' });
        continue;
      }

      const lockRes = await fetch(
        `${supabaseUrl}/rest/v1/generated_websites?business_id=eq.${encodeURIComponent(businessId)}&status=eq.published`,
        {
          method: 'PATCH',
          headers: { ...headers, 'Prefer': 'return=representation' },
          body: JSON.stringify({ site_status: 'suspended' }),
        }
      );
      const lockedWebsites = lockRes.ok ? await lockRes.json() : [];

      const subPatchRes = await fetch(
        `${supabaseUrl}/rest/v1/subscriptions?id=eq.${encodeURIComponent(trial.id)}`,
        {
          method: 'PATCH',
          headers: { ...headers, 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            status: 'cancelled',
            cancelled_at: now,
          }),
        }
      );

      const businessPatchRes = await fetch(
        `${supabaseUrl}/rest/v1/businesses?id=eq.${encodeURIComponent(businessId)}`,
        {
          method: 'PATCH',
          headers: { ...headers, 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            pipeline_status: 'inactive_customer',
            pipeline_status_changed_at: now,
          }),
        }
      );

      results.push({
        subscriptionId: trial.id,
        businessId,
        lockedWebsites: Array.isArray(lockedWebsites) ? lockedWebsites.length : 0,
        subscriptionUpdated: subPatchRes.ok,
        businessUpdated: businessPatchRes.ok,
      });
    }

    return res.status(200).json({ success: true, expired: results.length, results });
  } catch (err) {
    console.error('Expire trials error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
