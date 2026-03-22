// Vercel serverless function: Get analytics stats for a business
// GET ?businessId=123&days=30
// Returns: summary stats, daily breakdown, top referrers, device breakdown

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

  const { businessId, days = '30' } = req.query;
  if (!businessId) {
    return res.status(400).json({ error: 'Missing required query param: businessId' });
  }

  const numDays = Math.min(parseInt(days, 10) || 30, 90);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - numDays);
  const startIso = startDate.toISOString();

  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  try {
    // Fetch raw events for the period
    const eventsRes = await fetch(
      `${supabaseUrl}/rest/v1/analytics_events?business_id=eq.${encodeURIComponent(businessId)}&created_at=gte.${encodeURIComponent(startIso)}&select=event_type,referrer,device_type,visitor_id,created_at&order=created_at.asc`,
      { headers }
    );

    if (!eventsRes.ok) {
      const errText = await eventsRes.text().catch(() => '');
      return res.status(502).json({ error: 'Failed to fetch analytics', detail: errText });
    }

    const events = await eventsRes.json();

    // Also try to get pre-computed summaries
    const startDateStr = startDate.toISOString().split('T')[0];
    const summariesRes = await fetch(
      `${supabaseUrl}/rest/v1/analytics_summaries?business_id=eq.${encodeURIComponent(businessId)}&date=gte.${startDateStr}&order=date.asc`,
      { headers }
    );
    const summaries = summariesRes.ok ? await summariesRes.json() : [];

    // Compute stats from raw events
    const totals = {
      page_views: 0,
      unique_visitors: new Set(),
      phone_clicks: 0,
      email_clicks: 0,
      direction_clicks: 0,
      social_clicks: 0,
      form_submissions: 0,
    };

    const dailyMap = {};       // date string → { page_views, unique_visitors Set, ... }
    const referrerMap = {};    // domain → count
    const deviceMap = {};      // device_type → count

    for (const event of events) {
      const dateKey = event.created_at.split('T')[0];

      // Initialize daily bucket
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = {
          date: dateKey,
          page_views: 0,
          unique_visitors: new Set(),
          phone_clicks: 0,
          email_clicks: 0,
          direction_clicks: 0,
          social_clicks: 0,
          form_submissions: 0,
        };
      }

      const day = dailyMap[dateKey];

      switch (event.event_type) {
        case 'page_view':
          totals.page_views++;
          day.page_views++;
          if (event.visitor_id) {
            totals.unique_visitors.add(event.visitor_id);
            day.unique_visitors.add(event.visitor_id);
          }
          break;
        case 'click_phone':
          totals.phone_clicks++;
          day.phone_clicks++;
          break;
        case 'click_email':
          totals.email_clicks++;
          day.email_clicks++;
          break;
        case 'click_directions':
          totals.direction_clicks++;
          day.direction_clicks++;
          break;
        case 'click_social':
          totals.social_clicks++;
          day.social_clicks++;
          break;
        case 'form_submit':
          totals.form_submissions++;
          day.form_submissions++;
          break;
      }

      // Referrers (only for page_views)
      if (event.event_type === 'page_view' && event.referrer) {
        referrerMap[event.referrer] = (referrerMap[event.referrer] || 0) + 1;
      }

      // Device breakdown
      if (event.device_type) {
        deviceMap[event.device_type] = (deviceMap[event.device_type] || 0) + 1;
      }
    }

    // Build daily array with all dates in range (fill zeros for missing days)
    const daily = [];
    const cursor = new Date(startDate);
    const today = new Date();
    while (cursor <= today) {
      const dateKey = cursor.toISOString().split('T')[0];
      const dayData = dailyMap[dateKey];
      daily.push({
        date: dateKey,
        page_views: dayData ? dayData.page_views : 0,
        unique_visitors: dayData ? dayData.unique_visitors.size : 0,
        phone_clicks: dayData ? dayData.phone_clicks : 0,
        email_clicks: dayData ? dayData.email_clicks : 0,
        direction_clicks: dayData ? dayData.direction_clicks : 0,
        social_clicks: dayData ? dayData.social_clicks : 0,
        form_submissions: dayData ? dayData.form_submissions : 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    // Sort referrers by count descending
    const topReferrers = Object.entries(referrerMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([domain, count]) => ({ domain, count }));

    // Device breakdown as percentages
    const totalDeviceEvents = Object.values(deviceMap).reduce((a, b) => a + b, 0) || 1;
    const deviceBreakdown = {
      desktop: Math.round(((deviceMap.desktop || 0) / totalDeviceEvents) * 100),
      mobile: Math.round(((deviceMap.mobile || 0) / totalDeviceEvents) * 100),
      tablet: Math.round(((deviceMap.tablet || 0) / totalDeviceEvents) * 100),
    };

    return res.status(200).json({
      totals: {
        page_views: totals.page_views,
        unique_visitors: totals.unique_visitors.size,
        phone_clicks: totals.phone_clicks,
        email_clicks: totals.email_clicks,
        direction_clicks: totals.direction_clicks,
        social_clicks: totals.social_clicks,
        form_submissions: totals.form_submissions,
      },
      daily,
      topReferrers,
      deviceBreakdown,
      days: numDays,
    });
  } catch (err) {
    console.error('Analytics stats error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
