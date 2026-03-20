import { enrichBusiness } from '../_lib/enrich-business.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { businessId } = req.body || {};
  if (!businessId) return res.status(400).json({ error: 'businessId is required' });

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const searchApiKey = process.env.SEARCHAPI_KEY;

  if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: 'Server config missing' });
  if (!searchApiKey) return res.status(500).json({ error: 'SEARCHAPI_KEY not configured' });

  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  // 1. Look up business to get place_id, name, address
  const bizRes = await fetch(
    `${supabaseUrl}/rest/v1/businesses?id=eq.${businessId}&select=place_id,name,address_full`,
    { headers }
  );
  if (!bizRes.ok) return res.status(500).json({ error: 'Failed to fetch business' });
  const businesses = await bizRes.json();
  if (businesses.length === 0) return res.status(404).json({ error: 'Business not found' });

  const biz = businesses[0];
  const placeId = biz.place_id;

  if (!placeId || placeId.startsWith('marketing-')) {
    return res.status(400).json({ error: 'No Google place ID — cannot enrich' });
  }

  // 2. Search for data_id using SearchAPI google_maps engine
  let dataId = null;
  try {
    const query = [biz.name, biz.address_full].filter(Boolean).join(' ');
    const params = new URLSearchParams({
      engine: 'google_maps',
      q: query,
      api_key: searchApiKey,
    });
    const searchRes = await fetch('https://www.searchapi.io/api/v1/search?' + params.toString());
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      const results = searchData.local_results || [];
      // Match by place_id
      const match = results.find(r => r.place_id === placeId);
      if (match) dataId = match.data_id || null;
      // Fallback: use first result if only one returned
      if (!dataId && results.length === 1) dataId = results[0].data_id || null;
    }
  } catch (e) {
    console.warn('data_id lookup failed (non-blocking):', e.message);
  }

  // 3. Run enrichment (awaited, not fire-and-forget)
  try {
    await enrichBusiness({
      businessId,
      placeId,
      dataId,
      businessName: biz.name,
      businessAddress: biz.address_full,
      supabaseUrl,
      supabaseKey,
    });
    return res.status(200).json({ success: true, dataId: dataId || null });
  } catch (err) {
    console.error('Enrichment failed:', err);
    return res.status(500).json({ error: 'Enrichment failed: ' + err.message });
  }
}
