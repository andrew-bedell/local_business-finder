// Vercel serverless function: Auto-generate websites for qualifying businesses
// Runs as a cron job every 10 minutes, capped at 24 websites/day
// Protected by CRON_SECRET header

import { generateWebsiteForBusiness } from '../_lib/website-pipeline.js';
import { hasWebsiteHtml } from '../_lib/website-config.js';

export const config = { maxDuration: 300 };

const DAILY_CAP = 24;
const TIME_BUDGET_MS = 240_000; // 240s, leaving 60s buffer within 300s maxDuration

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Auth check (Vercel cron sends GET with Bearer CRON_SECRET)
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers['authorization'];
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    const supabaseKeyAlt = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseKeyAlt || authHeader !== `Bearer ${supabaseKeyAlt}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  // Kill switch
  if (process.env.AUTO_GENERATE_ENABLED === 'false') {
    return res.status(200).json({ message: 'Auto-generation is disabled' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }

  const supabaseHeaders = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  try {
    // Count today's auto-generated websites
    const todayMidnight = new Date();
    todayMidnight.setUTCHours(0, 0, 0, 0);
    const todayStr = todayMidnight.toISOString();

    const countRes = await fetch(
      `${supabaseUrl}/rest/v1/generated_websites?created_at=gte.${todayStr}&config->>auto_generated=eq.true&select=id`,
      { headers: supabaseHeaders }
    );
    const todayGenerated = countRes.ok ? (await countRes.json()) : [];
    const todayCount = Array.isArray(todayGenerated) ? todayGenerated.length : 0;

    if (todayCount >= DAILY_CAP) {
      return res.status(200).json({ message: 'Daily cap reached', dailyTotal: todayCount });
    }

    const remaining = DAILY_CAP - todayCount;

    // Query eligible businesses
    // Criteria: has name, address_full, phone; has reviews; has photos; no generated website with HTML; pipeline_status in saved/lead; operational
    const eligibleQuery = `${supabaseUrl}/rest/v1/rpc/get_eligible_for_auto_generate`;
    let eligible = [];

    // Try RPC first, fall back to REST query
    const rpcRes = await fetch(eligibleQuery, {
      method: 'POST',
      headers: supabaseHeaders,
      body: JSON.stringify({ max_count: Math.min(remaining, 3) }),
    });

    if (rpcRes.ok) {
      eligible = await rpcRes.json();
    } else {
      // Fallback: use REST API with filters
      // This is less precise (can't do left join + subquery easily) but works as a fallback
      console.log('[AutoGenerate] RPC not available, using REST fallback query');

      // Get businesses with basic requirements
      const bizRes = await fetch(
        `${supabaseUrl}/rest/v1/businesses?` +
        `name=not.is.null&name=neq.&` +
        `address_full=not.is.null&address_full=neq.&` +
        `phone=not.is.null&phone=neq.&` +
        `pipeline_status=in.(saved,lead)&` +
        `and=(or(business_status.eq.OPERATIONAL,business_status.is.null),or(whatsapp_status.eq.valid,whatsapp_status.eq.unvalidated,whatsapp_status.is.null))&` +
        `select=id,name,address_full,address_country,phone,whatsapp,category,subcategory,types,business_status,` +
        `description,price_level,service_options,amenities,highlights,payment_methods,languages_spoken,` +
        `accessibility_info,parking_info,year_established,owner_name,founder_description,hours,rating,review_count,` +
        `maps_url,pipeline_status,email,outreach_steps&` +
        `order=created_at.asc&limit=20`,
        { headers: supabaseHeaders }
      );

      if (!bizRes.ok) {
        const errText = await bizRes.text();
        throw new Error(`Failed to query businesses: ${errText.substring(0, 200)}`);
      }

      const candidates = await bizRes.json();

      // Filter out businesses that already have generated websites with HTML
      for (const biz of candidates) {
        if (eligible.length >= Math.min(remaining, 3)) break;

        // Check for existing website
        const webRes = await fetch(
          `${supabaseUrl}/rest/v1/generated_websites?business_id=eq.${biz.id}&select=id,config&limit=1`,
          { headers: supabaseHeaders }
        );
        const webData = webRes.ok ? await webRes.json() : [];
        const hasWebsite = Array.isArray(webData) && webData.some(w => hasWebsiteHtml(w.config));
        if (hasWebsite) continue;

        // Skip cancelled businesses
        if (biz.outreach_steps && biz.outreach_steps._cancelled) continue;

        // Check for reviews
        const revRes = await fetch(
          `${supabaseUrl}/rest/v1/business_reviews?business_id=eq.${biz.id}&select=id&limit=1`,
          { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
        );
        const revData = revRes.ok ? await revRes.json() : [];
        if (!Array.isArray(revData) || revData.length === 0) continue;

        // Check for photos
        const photoRes = await fetch(
          `${supabaseUrl}/rest/v1/business_photos?business_id=eq.${biz.id}&select=id&limit=1`,
          { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
        );
        const photoData = photoRes.ok ? await photoRes.json() : [];
        if (!Array.isArray(photoData) || photoData.length === 0) continue;

        eligible.push(biz);
      }
    }

    if (eligible.length === 0) {
      return res.status(200).json({ message: 'No eligible businesses found', dailyTotal: todayCount });
    }

    console.log(`[AutoGenerate] Found ${eligible.length} eligible businesses. Daily count: ${todayCount}/${DAILY_CAP}`);

    // Process sequentially, checking time budget
    const startTime = Date.now();
    let processed = 0;
    const results = [];

    for (const business of eligible) {
      const elapsed = Date.now() - startTime;
      if (elapsed > TIME_BUDGET_MS) {
        console.log(`[AutoGenerate] Time budget exceeded (${elapsed}ms), stopping`);
        break;
      }

      try {
        console.log(`[AutoGenerate] Processing ${business.name} (${business.id})...`);
        const result = await generateWebsiteForBusiness(business, supabaseUrl, supabaseHeaders, { autoGenerated: true });

        // Update pipeline_status to cold_outreach_ready
        await fetch(
          `${supabaseUrl}/rest/v1/businesses?id=eq.${business.id}`,
          {
            method: 'PATCH',
            headers: { ...supabaseHeaders, 'Prefer': 'return=minimal' },
            body: JSON.stringify({
              pipeline_status: 'cold_outreach_ready',
              pipeline_status_changed_at: new Date().toISOString(),
            }),
          }
        );

        processed++;
        results.push({ businessId: business.id, name: business.name, websiteId: result.websiteId, publishedUrl: result.publishedUrl });
        console.log(`[AutoGenerate] Successfully generated website for ${business.name}`);
      } catch (err) {
        console.error(`[AutoGenerate] Failed for ${business.name} (${business.id}):`, err.message);
        results.push({ businessId: business.id, name: business.name, error: err.message });
      }
    }

    return res.status(200).json({
      processed,
      remaining: DAILY_CAP - todayCount - processed,
      dailyTotal: todayCount + processed,
      results,
    });
  } catch (err) {
    console.error('[AutoGenerate] Cron job failed:', err);
    return res.status(500).json({ error: err.message || 'Auto-generate cron failed' });
  }
}
