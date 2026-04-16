import { runTrackedBusinessEnrichment } from '../_lib/enrichment-runner.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { businessId } = req.body || {};
  if (!businessId) return res.status(400).json({ error: 'businessId is required' });

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const searchApiKey = process.env.SEARCHAPI_KEY;

  if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: 'Server config missing' });
  if (!searchApiKey) return res.status(500).json({ error: 'SEARCHAPI_KEY not configured' });

  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  // 1. Look up business to get place_id + context
  const bizRes = await fetch(
    `${supabaseUrl}/rest/v1/businesses?id=eq.${businessId}&select=place_id,name,address_full`,
    { headers }
  );
  if (!bizRes.ok) return res.status(500).json({ error: 'Failed to fetch business' });
  const businesses = await bizRes.json();
  if (businesses.length === 0) return res.status(404).json({ error: 'Business not found' });

  const biz = businesses[0];
  const placeId = biz.place_id;

  if (!placeId) {
    return res.status(400).json({ error: 'No Google place ID — cannot enrich' });
  }

  // 2. Run tracked enrichment
  try {
    const result = await runTrackedBusinessEnrichment({
      businessId,
      placeId,
      businessName: biz.name,
      businessAddress: biz.address_full,
      supabaseUrl,
      supabaseKey,
    });

    return res.status(200).json({
      success: !!result.success,
      status: result.status,
      dataId: result.dataId || null,
      error: result.error || null,
      nextRetryAt: result.nextRetryAt || null,
    });
  } catch (err) {
    console.error('Enrichment failed:', err);
    return res.status(500).json({ error: 'Enrichment failed: ' + err.message });
  }
}
