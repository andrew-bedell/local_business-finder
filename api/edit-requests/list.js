// Vercel serverless function: List edit requests with filters and joined data
// GET — returns edit requests with business name, customer email/name

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }

  const { status, priority, business_id, limit, offset } = req.query;

  const supabaseHeaders = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
  };

  try {
    // Build query with filters
    let url = `${supabaseUrl}/rest/v1/edit_requests?select=*&order=created_at.desc`;

    if (status) url += `&status=eq.${encodeURIComponent(status)}`;
    if (priority) url += `&priority=eq.${encodeURIComponent(priority)}`;
    if (business_id) url += `&business_id=eq.${encodeURIComponent(business_id)}`;

    const pageLimit = Math.min(parseInt(limit) || 100, 500);
    const pageOffset = parseInt(offset) || 0;

    const fetchHeaders = {
      ...supabaseHeaders,
      'Range': `${pageOffset}-${pageOffset + pageLimit - 1}`,
      'Prefer': 'count=exact',
    };

    const response = await fetch(url, { headers: fetchHeaders });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Edit requests list error:', response.status, err);
      return res.status(502).json({ error: 'Failed to fetch edit requests' });
    }

    const editRequests = await response.json();
    const contentRange = response.headers.get('content-range');
    const total = contentRange ? parseInt(contentRange.split('/')[1]) || 0 : editRequests.length;

    if (!editRequests.length) {
      return res.status(200).json({ editRequests: [], total: 0 });
    }

    // Collect unique business_ids and customer_ids for batch lookup
    const bizIds = [...new Set(editRequests.map(r => r.business_id).filter(Boolean))];
    const custIds = [...new Set(editRequests.map(r => r.customer_id).filter(Boolean))];

    // Fetch business names and customer info in parallel
    const [bizMap, custMap] = await Promise.all([
      fetchBusinessNames(bizIds, supabaseUrl, supabaseHeaders),
      fetchCustomerInfo(custIds, supabaseUrl, supabaseHeaders),
    ]);

    // Merge joined data into each request
    const enriched = editRequests.map(r => ({
      ...r,
      business_name: bizMap[r.business_id] || '',
      customer_email: custMap[r.customer_id]?.email || '',
      customer_name: custMap[r.customer_id]?.contact_name || '',
    }));

    return res.status(200).json({ editRequests: enriched, total });
  } catch (err) {
    console.error('Edit requests list error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function fetchBusinessNames(ids, supabaseUrl, headers) {
  if (!ids.length) return {};
  const filter = ids.map(id => `id.eq.${id}`).join(',');
  const res = await fetch(
    `${supabaseUrl}/rest/v1/businesses?or=(${encodeURIComponent(filter)})&select=id,name`,
    { headers }
  );
  const data = await res.json();
  const map = {};
  if (Array.isArray(data)) data.forEach(b => { map[b.id] = b.name; });
  return map;
}

async function fetchCustomerInfo(ids, supabaseUrl, headers) {
  if (!ids.length) return {};
  const filter = ids.map(id => `id.eq.${id}`).join(',');
  const res = await fetch(
    `${supabaseUrl}/rest/v1/customers?or=(${encodeURIComponent(filter)})&select=id,email,contact_name`,
    { headers }
  );
  const data = await res.json();
  const map = {};
  if (Array.isArray(data)) data.forEach(c => { map[c.id] = c; });
  return map;
}
