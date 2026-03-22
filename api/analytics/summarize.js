// Vercel Cron function: Daily analytics summarization
// Rolls up yesterday's analytics_events into analytics_summaries
// Configured to run daily at 3:00 AM UTC via vercel.json cron

export default async function handler(req, res) {
  // Verify this is a cron invocation (Vercel sets this header)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Also allow manual triggering with service key
    const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseKey || authHeader !== `Bearer ${supabaseKey}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }

  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  try {
    // Summarize yesterday's data
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    const dayStart = dateStr + 'T00:00:00.000Z';
    const dayEnd = dateStr + 'T23:59:59.999Z';

    // Fetch all events for yesterday
    const eventsRes = await fetch(
      `${supabaseUrl}/rest/v1/analytics_events?created_at=gte.${dayStart}&created_at=lte.${dayEnd}&select=business_id,event_type,referrer,device_type,visitor_id&order=business_id.asc`,
      { headers }
    );

    if (!eventsRes.ok) {
      const errText = await eventsRes.text().catch(() => '');
      console.error('Failed to fetch events for summarization:', errText);
      return res.status(502).json({ error: 'Failed to fetch events' });
    }

    const events = await eventsRes.json();

    if (events.length === 0) {
      return res.status(200).json({ message: 'No events to summarize', date: dateStr });
    }

    // Group events by business_id
    const bizMap = {};
    for (const event of events) {
      const bid = event.business_id;
      if (!bizMap[bid]) {
        bizMap[bid] = {
          page_views: 0,
          unique_visitors: new Set(),
          phone_clicks: 0,
          email_clicks: 0,
          direction_clicks: 0,
          social_clicks: 0,
          form_submissions: 0,
          referrers: {},
          devices: {},
        };
      }

      const biz = bizMap[bid];

      switch (event.event_type) {
        case 'page_view':
          biz.page_views++;
          if (event.visitor_id) biz.unique_visitors.add(event.visitor_id);
          if (event.referrer) biz.referrers[event.referrer] = (biz.referrers[event.referrer] || 0) + 1;
          break;
        case 'click_phone': biz.phone_clicks++; break;
        case 'click_email': biz.email_clicks++; break;
        case 'click_directions': biz.direction_clicks++; break;
        case 'click_social': biz.social_clicks++; break;
        case 'form_submit': biz.form_submissions++; break;
      }

      if (event.device_type) {
        biz.devices[event.device_type] = (biz.devices[event.device_type] || 0) + 1;
      }
    }

    // Upsert summaries for each business
    let upsertCount = 0;
    for (const [businessId, data] of Object.entries(bizMap)) {
      // Sort referrers and keep top 10
      const topReferrers = {};
      Object.entries(data.referrers)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([domain, count]) => { topReferrers[domain] = count; });

      // Device breakdown as percentages
      const totalDeviceEvents = Object.values(data.devices).reduce((a, b) => a + b, 0) || 1;
      const deviceBreakdown = {
        desktop: Math.round(((data.devices.desktop || 0) / totalDeviceEvents) * 100),
        mobile: Math.round(((data.devices.mobile || 0) / totalDeviceEvents) * 100),
        tablet: Math.round(((data.devices.tablet || 0) / totalDeviceEvents) * 100),
      };

      const summaryPayload = {
        business_id: parseInt(businessId, 10),
        date: dateStr,
        page_views: data.page_views,
        unique_visitors: data.unique_visitors.size,
        phone_clicks: data.phone_clicks,
        email_clicks: data.email_clicks,
        direction_clicks: data.direction_clicks,
        social_clicks: data.social_clicks,
        form_submissions: data.form_submissions,
        top_referrers: topReferrers,
        device_breakdown: deviceBreakdown,
      };

      // Upsert (insert on conflict update)
      const upsertRes = await fetch(
        `${supabaseUrl}/rest/v1/analytics_summaries?on_conflict=business_id,date`,
        {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify(summaryPayload),
        }
      );

      if (upsertRes.ok) {
        upsertCount++;
      } else {
        const errText = await upsertRes.text().catch(() => '');
        console.error(`Summary upsert failed for business ${businessId}:`, errText);
      }
    }

    return res.status(200).json({
      message: `Summarized ${events.length} events for ${upsertCount} businesses`,
      date: dateStr,
    });
  } catch (err) {
    console.error('Analytics summarize error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
