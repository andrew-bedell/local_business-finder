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

  const validTypes = ['page_view', 'click_phone', 'click_email', 'click_directions', 'click_social', 'form_submit', 'demo_view', 'demo_leave'];
  if (!validTypes.includes(event_type)) {
    return res.status(204).end();
  }

  // Generate a visitor fingerprint from IP + User-Agent (no PII stored)
  const forwarded = req.headers['x-forwarded-for'] || '';
  const ip = forwarded.split(',')[0].trim() || req.headers['x-real-ip'] || 'unknown';
  const ua = req.headers['user-agent'] || 'unknown';
  const visitor_id = createHash('sha256').update(ip + '|' + ua).digest('hex').substring(0, 16);

  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal',
  };

  // Check if this IP belongs to an employee — skip tracking if so
  if (ip !== 'unknown') {
    try {
      const excludeRes = await fetch(
        `${supabaseUrl}/rest/v1/excluded_ips?ip_address=eq.${encodeURIComponent(ip)}&select=id&limit=1`,
        { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
      );
      if (excludeRes.ok) {
        const rows = await excludeRes.json();
        if (rows && rows.length > 0) {
          return res.status(204).end(); // Employee IP — skip
        }
      }
    } catch {
      // If check fails, proceed with tracking (fail open)
    }
  }

  try {
    const eventMetadata = normalizeMetadata(metadata, req, page_url);

    const payload = {
      business_id: parseInt(business_id, 10),
      website_id: website_id || null,
      event_type,
      page_url: page_url ? String(page_url).substring(0, 2000) : null,
      referrer: normalizeReferrer(referrer),
      device_type: ['desktop', 'mobile', 'tablet'].includes(device_type) ? device_type : 'desktop',
      visitor_id,
      metadata: eventMetadata,
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

function normalizeMetadata(metadata, req, pageUrl) {
  const base = metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? metadata : {};
  const normalized = { ...base };
  const geo = getGeoFromHeaders(req);
  if (Object.keys(geo).length > 0) {
    normalized.geo = { ...(base.geo && typeof base.geo === 'object' ? base.geo : {}), ...geo };
  }

  const attribution = getAttributionFromPageUrl(pageUrl);
  if (Object.keys(attribution).length > 0) {
    normalized.attribution = {
      ...(base.attribution && typeof base.attribution === 'object' ? base.attribution : {}),
      ...attribution,
    };
  }

  return normalized;
}

function getGeoFromHeaders(req) {
  const city = decodeHeader(req, 'x-vercel-ip-city') || decodeHeader(req, 'x-city');
  const region = decodeHeader(req, 'x-vercel-ip-country-region') || decodeHeader(req, 'x-region');
  const country = (decodeHeader(req, 'x-vercel-ip-country') || decodeHeader(req, 'cf-ipcountry') || '').toUpperCase();
  const latitude = parseCoordinate(decodeHeader(req, 'x-vercel-ip-latitude'));
  const longitude = parseCoordinate(decodeHeader(req, 'x-vercel-ip-longitude'));
  const timezone = decodeHeader(req, 'x-vercel-ip-timezone');
  const continent = decodeHeader(req, 'x-vercel-ip-continent');

  const geo = {};
  if (city) geo.city = city;
  if (region) geo.region = region;
  if (country) geo.country = country;
  if (continent) geo.continent = continent;
  if (latitude !== null) geo.latitude = latitude;
  if (longitude !== null) geo.longitude = longitude;
  if (timezone) geo.timezone = timezone;
  return geo;
}

function decodeHeader(req, name) {
  const value = req.headers[name] || req.headers[name.toLowerCase()];
  if (!value) return '';
  const raw = Array.isArray(value) ? value[0] : String(value);
  try {
    return decodeURIComponent(raw.replace(/\+/g, ' ')).trim().substring(0, 120);
  } catch {
    return raw.trim().substring(0, 120);
  }
}

function parseCoordinate(value) {
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function normalizeReferrer(referrer) {
  if (!referrer) return null;
  const raw = String(referrer).trim();
  if (!raw) return null;
  try {
    return new URL(raw).hostname.replace(/^www\./, '').substring(0, 500) || null;
  } catch {
    return raw
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .split('/')[0]
      .substring(0, 500) || null;
  }
}

function getAttributionFromPageUrl(pageUrl) {
  if (!pageUrl) return {};
  try {
    const url = new URL(String(pageUrl), 'https://site.local');
    const params = url.searchParams;
    const attribution = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid', 'ttclid', 'msclkid'].forEach((key) => {
      const value = params.get(key);
      if (value) attribution[key] = value.substring(0, 200);
    });
    return attribution;
  } catch {
    return {};
  }
}
