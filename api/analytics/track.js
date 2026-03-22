// Vercel serverless function: Receive analytics tracking events from published websites
// POST — { business_id, website_id, event_type, page_url, referrer, device_type, metadata }
// Lightweight, fire-and-forget — called via sendBeacon from tracking script

import { createHash } from 'crypto';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(204).end(); // Silently fail — don't break the user's browsing
  }

  // Parse body — sendBeacon sends as text, fetch sends as JSON
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(204).end();
  }

  const { business_id, website_id, event_type, page_url, referrer, device_type, metadata } = body || {};

  if (!business_id || !event_type) {
    return res.status(204).end();
  }

  const validTypes = ['page_view', 'click_phone', 'click_email', 'click_directions', 'click_social', 'form_submit'];
  if (!validTypes.includes(event_type)) {
    return res.status(204).end();
  }

  // Generate a visitor fingerprint from IP + User-Agent (no PII stored)
  const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
  const ua = req.headers['user-agent'] || 'unknown';
  const visitor_id = createHash('sha256').update(ip + '|' + ua).digest('hex').substring(0, 16);

  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal',
  };

  try {
    const payload = {
      business_id: parseInt(business_id, 10),
      website_id: website_id ? parseInt(website_id, 10) : null,
      event_type,
      page_url: page_url ? String(page_url).substring(0, 2000) : null,
      referrer: referrer ? String(referrer).substring(0, 500) : null,
      device_type: ['desktop', 'mobile', 'tablet'].includes(device_type) ? device_type : 'desktop',
      visitor_id,
      metadata: metadata || {},
    };

    // Fire and forget — don't wait for response to return to client
    fetch(`${supabaseUrl}/rest/v1/analytics_events`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    }).catch(err => console.error('Analytics insert error:', err));

    return res.status(204).end();
  } catch (err) {
    console.error('Analytics track error:', err);
    return res.status(204).end();
  }
}
