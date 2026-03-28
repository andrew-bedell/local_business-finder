// Vercel serverless function: Get demo page analytics
// GET ?days=30&search=&limit=50&offset=0
// Returns: totals, sessions list, pagination

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

  const { days = '30', search = '', limit = '50', offset = '0' } = req.query;
  const numDays = Math.min(parseInt(days, 10) || 30, 90);
  const numLimit = Math.min(parseInt(limit, 10) || 50, 200);
  const numOffset = parseInt(offset, 10) || 0;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - numDays);
  const startIso = startDate.toISOString();

  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  try {
    // If search term provided, find matching business IDs first
    let businessFilter = '';
    let businessMap = {};

    if (search.trim()) {
      const searchRes = await fetch(
        `${supabaseUrl}/rest/v1/businesses?name=ilike.*${encodeURIComponent(search.trim())}*&select=id,name`,
        { headers }
      );
      if (searchRes.ok) {
        const matches = await searchRes.json();
        if (matches.length === 0) {
          return res.status(200).json({
            totals: { total_demo_views: 0, unique_visitors: 0, avg_duration_seconds: 0, businesses_viewed: 0 },
            sessions: [],
            total_sessions: 0,
            days: numDays,
          });
        }
        matches.forEach(b => { businessMap[b.id] = b.name; });
        const ids = matches.map(b => b.id);
        businessFilter = `&business_id=in.(${ids.join(',')})`;
      }
    }

    // Fetch demo events
    const eventsRes = await fetch(
      `${supabaseUrl}/rest/v1/analytics_events?event_type=in.(demo_view,demo_leave)&created_at=gte.${encodeURIComponent(startIso)}${businessFilter}&select=id,business_id,website_id,event_type,page_url,referrer,device_type,visitor_id,metadata,created_at&order=created_at.desc`,
      { headers }
    );

    if (!eventsRes.ok) {
      const errText = await eventsRes.text().catch(() => '');
      return res.status(502).json({ error: 'Failed to fetch demo events', detail: errText });
    }

    const events = await eventsRes.json();

    // Collect all business IDs we need names for
    const businessIds = new Set();
    events.forEach(e => { if (e.business_id) businessIds.add(e.business_id); });

    // Fetch business names (if not already from search)
    if (!search.trim() && businessIds.size > 0) {
      const idsArr = Array.from(businessIds);
      const batchSize = 50;
      for (let i = 0; i < idsArr.length; i += batchSize) {
        const batch = idsArr.slice(i, i + batchSize);
        const namesRes = await fetch(
          `${supabaseUrl}/rest/v1/businesses?id=in.(${batch.join(',')})&select=id,name`,
          { headers }
        );
        if (namesRes.ok) {
          const names = await namesRes.json();
          names.forEach(b => { businessMap[b.id] = b.name; });
        }
      }
    }

    // Group events into sessions: match demo_view + demo_leave by visitor_id + website_id
    // A "session" starts with a demo_view. Match the closest demo_leave within 1 hour.
    const viewEvents = events.filter(e => e.event_type === 'demo_view');
    const leaveEvents = events.filter(e => e.event_type === 'demo_leave');

    // Index leave events by visitor_id + website_id for matching
    const leaveIndex = {};
    leaveEvents.forEach(e => {
      const key = (e.visitor_id || '') + '|' + (e.website_id || '');
      if (!leaveIndex[key]) leaveIndex[key] = [];
      leaveIndex[key].push(e);
    });

    // Build sessions from view events
    const sessions = [];
    const uniqueVisitors = new Set();
    const businessesViewed = new Set();
    let totalDuration = 0;
    let durationCount = 0;

    for (const view of viewEvents) {
      const key = (view.visitor_id || '') + '|' + (view.website_id || '');
      const viewTime = new Date(view.created_at).getTime();
      let duration = null;

      // Find matching leave event (closest after view, within 1 hour)
      const leaves = leaveIndex[key] || [];
      for (let i = 0; i < leaves.length; i++) {
        const leaveTime = new Date(leaves[i].created_at).getTime();
        if (leaveTime >= viewTime && leaveTime - viewTime < 3600000) {
          duration = leaves[i].metadata?.duration_seconds ?? null;
          leaves.splice(i, 1); // Consume this leave event
          break;
        }
      }

      if (view.visitor_id) uniqueVisitors.add(view.visitor_id);
      if (view.business_id) businessesViewed.add(view.business_id);

      if (duration !== null && duration > 0) {
        totalDuration += duration;
        durationCount++;
      }

      sessions.push({
        visitor_id: view.visitor_id || '',
        business_id: view.business_id,
        business_name: businessMap[view.business_id] || 'Unknown',
        website_id: view.website_id,
        timestamp: view.created_at,
        duration_seconds: duration,
        device_type: view.device_type || 'desktop',
        referrer: view.referrer || null,
        page_url: view.page_url || null,
      });
    }

    // Sort sessions by timestamp descending (already from query, but ensure)
    sessions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Paginate
    const totalSessions = sessions.length;
    const paginatedSessions = sessions.slice(numOffset, numOffset + numLimit);

    return res.status(200).json({
      totals: {
        total_demo_views: viewEvents.length,
        unique_visitors: uniqueVisitors.size,
        avg_duration_seconds: durationCount > 0 ? Math.round(totalDuration / durationCount) : 0,
        businesses_viewed: businessesViewed.size,
      },
      sessions: paginatedSessions,
      total_sessions: totalSessions,
      days: numDays,
    });
  } catch (err) {
    console.error('Demo stats error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
