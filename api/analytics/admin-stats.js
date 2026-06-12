// Vercel serverless function: Admin-only website analytics overview
// GET ?days=30&search=&metric=page_views&sortDirection=desc&limit=25&offset=0

import { ensureEmployeeSession } from '../_lib/employee-session.js';

const WEBSITE_EVENT_TYPES = [
  'page_view',
  'click_phone',
  'click_email',
  'click_directions',
  'click_social',
  'form_submit',
];

const VALID_METRICS = new Set([
  'page_views',
  'unique_visitors',
  'contact_clicks',
  'phone_clicks',
  'direction_clicks',
  'form_submissions',
  'social_clicks',
  'last_visit',
]);

const CONTACT_EVENT_TYPES = new Set([
  'click_phone',
  'click_email',
  'click_directions',
  'click_social',
  'form_submit',
]);

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

  const session = await ensureEmployeeSession(req, res, {
    supabaseUrl,
    serviceKey: supabaseKey,
    requireAdmin: true,
  });
  if (!session) return;

  const days = clampInt(req.query.days, 30, 1, 180);
  const limit = clampInt(req.query.limit, 25, 1, 100);
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
  const metric = VALID_METRICS.has(req.query.metric) ? req.query.metric : 'page_views';
  const sortDirection = req.query.sortDirection === 'asc' ? 'asc' : 'desc';
  const search = String(req.query.search || '').trim().toLowerCase();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startIso = startDate.toISOString();

  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  try {
    const [events, websites] = await Promise.all([
      fetchAnalyticsEvents({ supabaseUrl, headers, startIso }),
      fetchPublishedWebsites({ supabaseUrl, headers }),
    ]);

    const businessMap = await buildBusinessMap({ supabaseUrl, headers, events, websites });
    const rows = buildRows({ events, websites, businessMap });
    const filteredRows = filterRows(rows, search);
    sortRows(filteredRows, metric, sortDirection);

    const paginatedRows = filteredRows.slice(offset, offset + limit).map(serializeRow);
    const totals = buildTotals(filteredRows);

    return res.status(200).json({
      days,
      metric,
      sortDirection,
      limit,
      offset,
      total_rows: filteredRows.length,
      has_more: offset + limit < filteredRows.length,
      totals,
      topChannels: buildTopList(filteredRows, 'channelMap', 10).map(([channel, count]) => ({ channel, count })),
      topReferrers: buildTopList(filteredRows, 'sourceMap', 10).map(([source, count]) => ({ source, count })),
      topLocations: buildTopList(filteredRows, 'locationMap', 10).map(([location, count]) => ({ location, count })),
      deviceBreakdown: buildDeviceBreakdown(filteredRows),
      rows: paginatedRows,
    });
  } catch (err) {
    console.error('Admin analytics error:', err);
    return res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  }
}

async function fetchAnalyticsEvents({ supabaseUrl, headers, startIso }) {
  const url = `${supabaseUrl}/rest/v1/analytics_events?created_at=gte.${encodeURIComponent(startIso)}&event_type=in.(${WEBSITE_EVENT_TYPES.join(',')})&select=business_id,website_id,event_type,page_url,referrer,device_type,visitor_id,metadata,created_at&order=created_at.desc`;
  return fetchPagedJson(url, headers, 1000, 25000, 'Failed to fetch analytics events');
}

async function fetchPublishedWebsites({ supabaseUrl, headers }) {
  const url = `${supabaseUrl}/rest/v1/generated_websites?status=eq.published&select=id,business_id,published_url,custom_domain,domain_status,site_status,status,created_at,published_at,businesses(id,name,address_city,address_country,category,pipeline_status,slug)&order=published_at.desc`;
  return fetchPagedJson(url, headers, 1000, 5000, 'Failed to fetch published websites');
}

async function fetchPagedJson(url, headers, pageSize, maxRows, errorMessage) {
  const rows = [];
  for (let offset = 0; offset < maxRows; offset += pageSize) {
    const response = await fetch(url, {
      headers: {
        ...headers,
        'Range-Unit': 'items',
        Range: `${offset}-${offset + pageSize - 1}`,
      },
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw Object.assign(new Error(errorMessage), { status: 502, detail });
    }
    const batch = await response.json();
    if (!Array.isArray(batch)) {
      throw Object.assign(new Error(errorMessage), { status: 502 });
    }
    rows.push(...batch);
    if (batch.length < pageSize) break;
  }
  return rows;
}

async function buildBusinessMap({ supabaseUrl, headers, events, websites }) {
  const businessMap = new Map();
  for (const website of websites) {
    if (website.businesses && website.business_id) {
      businessMap.set(String(website.business_id), website.businesses);
    }
  }

  const missingIds = Array.from(new Set(
    events
      .map((event) => event.business_id)
      .filter((id) => id && !businessMap.has(String(id)))
  ));

  for (let i = 0; i < missingIds.length; i += 100) {
    const batch = missingIds.slice(i, i + 100);
    const response = await fetch(
      `${supabaseUrl}/rest/v1/businesses?id=in.(${batch.join(',')})&select=id,name,address_city,address_country,category,pipeline_status,slug`,
      { headers }
    );
    if (!response.ok) continue;
    const businesses = await response.json();
    businesses.forEach((business) => {
      businessMap.set(String(business.id), business);
    });
  }

  return businessMap;
}

function buildRows({ events, websites, businessMap }) {
  const rowsByBusiness = new Map();

  for (const website of websites) {
    const row = getOrCreateRow(rowsByBusiness, website.business_id, businessMap.get(String(website.business_id)));
    if (!row.website_id || isNewer(website.published_at || website.created_at, row.published_at || row.website_created_at)) {
      row.website_id = website.id || null;
      row.published_url = website.custom_domain && website.domain_status === 'verified'
        ? `https://${website.custom_domain}`
        : website.published_url || null;
      row.website_created_at = website.created_at || null;
      row.published_at = website.published_at || null;
      row.site_status = website.site_status || website.status || null;
    }
    row.website_count += 1;
  }

  for (const event of events) {
    const row = getOrCreateRow(rowsByBusiness, event.business_id, businessMap.get(String(event.business_id)));
    row.event_count += 1;
    if (isNewer(event.created_at, row.last_visit)) row.last_visit = event.created_at;

    if (event.event_type === 'page_view') {
      const classification = classifyTrafficSource(event);
      row.page_views += 1;
      if (event.visitor_id) row.visitorSet.add(event.visitor_id);
      increment(row.channelMap, classification.channel);
      increment(row.sourceMap, classification.source);
      increment(row.locationMap, getEventLocation(event));
      increment(row.deviceMap, event.device_type || 'desktop');
      increment(row.pageMap, getPagePath(event.page_url));
      row.sourceClassifications.push(classification);
    } else if (event.event_type === 'click_phone') {
      row.phone_clicks += 1;
    } else if (event.event_type === 'click_email') {
      row.email_clicks += 1;
    } else if (event.event_type === 'click_directions') {
      row.direction_clicks += 1;
    } else if (event.event_type === 'click_social') {
      row.social_clicks += 1;
    } else if (event.event_type === 'form_submit') {
      row.form_submissions += 1;
    }

    if (CONTACT_EVENT_TYPES.has(event.event_type)) {
      row.contact_clicks += 1;
    }
  }

  return Array.from(rowsByBusiness.values()).map((row) => {
    row.unique_visitors = row.visitorSet.size;
    row.top_channel = topEntry(row.channelMap)[0];
    row.top_source = topEntry(row.sourceMap)[0];
    row.top_source_detail = getTopClassification(row.sourceClassifications);
    row.top_location = topEntry(row.locationMap)[0];
    row.top_page = topEntry(row.pageMap)[0];
    return row;
  });
}

function getOrCreateRow(rowsByBusiness, businessId, business) {
  const key = String(businessId || 'unknown');
  if (!rowsByBusiness.has(key)) {
    rowsByBusiness.set(key, {
      business_id: businessId || null,
      business_name: business?.name || 'Unknown Business',
      business_city: business?.address_city || '',
      business_country: business?.address_country || '',
      category: business?.category || '',
      pipeline_status: business?.pipeline_status || '',
      slug: business?.slug || '',
      website_id: null,
      published_url: null,
      website_created_at: null,
      published_at: null,
      site_status: null,
      website_count: 0,
      event_count: 0,
      page_views: 0,
      unique_visitors: 0,
      contact_clicks: 0,
      phone_clicks: 0,
      email_clicks: 0,
      direction_clicks: 0,
      social_clicks: 0,
      form_submissions: 0,
      last_visit: null,
      top_source: null,
      top_channel: null,
      top_source_detail: null,
      top_location: null,
      top_page: null,
      visitorSet: new Set(),
      sourceClassifications: [],
      channelMap: {},
      sourceMap: {},
      locationMap: {},
      deviceMap: {},
      pageMap: {},
    });
  }
  return rowsByBusiness.get(key);
}

function filterRows(rows, search) {
  if (!search) return rows;
  return rows.filter((row) => {
    const haystack = [
      row.business_name,
      row.business_city,
      row.business_country,
      row.category,
      row.published_url,
      row.top_source,
      row.top_channel,
      row.top_location,
    ].join(' ').toLowerCase();
    return haystack.includes(search);
  });
}

function sortRows(rows, metric, sortDirection) {
  rows.sort((a, b) => {
    const aValue = getSortValue(a, metric);
    const bValue = getSortValue(b, metric);
    if (aValue === null && bValue === null) return compareText(a.business_name, b.business_name);
    if (aValue === null) return 1;
    if (bValue === null) return -1;
    if (aValue === bValue) return compareText(a.business_name, b.business_name);
    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
  });
}

function getSortValue(row, metric) {
  if (metric === 'last_visit') {
    if (!row.last_visit) return null;
    const time = new Date(row.last_visit).getTime();
    return Number.isNaN(time) ? null : time;
  }
  return Number(row[metric] || 0);
}

function buildTotals(rows) {
  const visitors = new Set();
  const totals = rows.reduce((acc, row) => {
    acc.page_views += row.page_views;
    acc.contact_clicks += row.contact_clicks;
    acc.phone_clicks += row.phone_clicks;
    acc.email_clicks += row.email_clicks;
    acc.direction_clicks += row.direction_clicks;
    acc.social_clicks += row.social_clicks;
    acc.form_submissions += row.form_submissions;
    acc.tracked_sites += (row.website_id || row.event_count > 0) ? 1 : 0;
    acc.sites_with_visits += row.page_views > 0 ? 1 : 0;
    row.visitorSet.forEach((visitorId) => visitors.add(visitorId));
    return acc;
  }, {
    page_views: 0,
    unique_visitors: 0,
    contact_clicks: 0,
    phone_clicks: 0,
    email_clicks: 0,
    direction_clicks: 0,
    social_clicks: 0,
    form_submissions: 0,
    tracked_sites: 0,
    sites_with_visits: 0,
  });
  totals.unique_visitors = visitors.size;
  return totals;
}

function buildTopList(rows, mapKey, limit) {
  const aggregate = {};
  rows.forEach((row) => {
    Object.entries(row[mapKey] || {}).forEach(([key, count]) => {
      aggregate[key] = (aggregate[key] || 0) + count;
    });
  });
  return Object.entries(aggregate)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

function buildDeviceBreakdown(rows) {
  const aggregate = {};
  rows.forEach((row) => {
    Object.entries(row.deviceMap || {}).forEach(([key, count]) => {
      aggregate[key] = (aggregate[key] || 0) + count;
    });
  });
  const total = Object.values(aggregate).reduce((sum, count) => sum + count, 0) || 1;
  return {
    desktop: Math.round(((aggregate.desktop || 0) / total) * 100),
    mobile: Math.round(((aggregate.mobile || 0) / total) * 100),
    tablet: Math.round(((aggregate.tablet || 0) / total) * 100),
  };
}

function serializeRow(row) {
  return {
    business_id: row.business_id,
    business_name: row.business_name,
    business_city: row.business_city,
    business_country: row.business_country,
    category: row.category,
    pipeline_status: row.pipeline_status,
    website_id: row.website_id,
    published_url: row.published_url,
    site_status: row.site_status,
    page_views: row.page_views,
    unique_visitors: row.unique_visitors,
    contact_clicks: row.contact_clicks,
    phone_clicks: row.phone_clicks,
    email_clicks: row.email_clicks,
    direction_clicks: row.direction_clicks,
    social_clicks: row.social_clicks,
    form_submissions: row.form_submissions,
    last_visit: row.last_visit,
    top_source: row.top_source || 'Direct',
    top_channel: row.top_channel || 'Direct / Unknown',
    top_source_detail: row.top_source_detail || null,
    top_location: row.top_location || 'Unknown',
    top_page: row.top_page || '/',
  };
}

function classifyTrafficSource(event) {
  const attribution = event.metadata?.attribution || {};
  const utmSource = cleanLabel(attribution.utm_source);
  const utmMedium = cleanLabel(attribution.utm_medium).toLowerCase();
  const utmCampaign = cleanLabel(attribution.utm_campaign);
  const referrer = cleanLabel(event.referrer).replace(/^www\./i, '');
  const referrerSource = titleizeSource(referrer);

  if (utmSource) {
    return {
      channel: classifyUtmChannel(utmSource, utmMedium, attribution),
      source: titleizeSource(utmSource),
      campaign: utmCampaign || null,
      medium: utmMedium || null,
      basis: 'utm',
      confidence: 'high',
      known: true,
    };
  }

  if (attribution.gclid) {
    return clickIdClassification('Paid Search', 'Google Ads', 'gclid');
  }
  if (attribution.msclkid) {
    return clickIdClassification('Paid Search', 'Microsoft Ads', 'msclkid');
  }
  if (attribution.ttclid) {
    return clickIdClassification('Paid Social', 'TikTok Ads', 'ttclid');
  }
  if (attribution.fbclid) {
    return clickIdClassification('Organic Social', 'Facebook Click', 'fbclid', 'medium');
  }

  if (referrer) {
    return {
      channel: classifyReferrerChannel(referrer),
      source: referrerSource,
      campaign: null,
      medium: null,
      basis: 'referrer',
      confidence: 'medium',
      known: true,
    };
  }

  return {
    channel: 'Direct / Unknown',
    source: 'Direct / Unknown',
    campaign: null,
    medium: null,
    basis: 'none',
    confidence: 'low',
    known: false,
  };
}

function classifyUtmChannel(source, medium, attribution) {
  if (attribution.gclid || attribution.msclkid) return 'Paid Search';
  if (attribution.ttclid) return 'Paid Social';

  const sourceKind = getKnownSourceKind(source);
  if (matchesAny(medium, ['paid_social', 'paidsocial', 'paid-social', 'social-paid'])) return 'Paid Social';
  if (matchesAny(medium, ['cpc', 'ppc', 'paid', 'paid-search', 'sem', 'search-ad', 'ads', 'ad'])) {
    return sourceKind === 'social' ? 'Paid Social' : 'Paid Search';
  }
  if (matchesAny(medium, ['organic', 'seo', 'organic-search'])) return 'Organic Search';
  if (matchesAny(medium, ['social', 'organic-social', 'social-post', 'profile', 'bio'])) return 'Organic Social';
  if (matchesAny(medium, ['email', 'newsletter'])) return 'Email';
  if (matchesAny(medium, ['sms', 'whatsapp', 'messenger', 'dm', 'chat'])) return 'Messaging';
  if (matchesAny(medium, ['referral', 'partner', 'affiliate'])) return 'Referral';
  if (matchesAny(medium, ['qr', 'offline', 'print', 'flyer'])) return 'Offline / QR';

  if (sourceKind === 'search') return 'Organic Search';
  if (sourceKind === 'social') return 'Organic Social';
  if (sourceKind === 'messaging') return 'Messaging';
  return 'Tagged Campaign';
}

function classifyReferrerChannel(referrer) {
  const sourceKind = getKnownSourceKind(referrer);
  if (sourceKind === 'search') return 'Organic Search';
  if (sourceKind === 'social') return 'Organic Social';
  if (sourceKind === 'messaging') return 'Messaging';
  if (isOwnSiteReferrer(referrer)) return 'Internal';
  return 'Referral';
}

function clickIdClassification(channel, source, basis, confidence = 'high') {
  return {
    channel,
    source,
    campaign: null,
    medium: null,
    basis,
    confidence,
    known: true,
  };
}

function getTopClassification(classifications) {
  if (!Array.isArray(classifications) || classifications.length === 0) return null;
  const ranked = {};
  classifications.forEach((item) => {
    const key = [item.channel, item.source, item.campaign || '', item.medium || '', item.basis].join('|');
    if (!ranked[key]) ranked[key] = { ...item, count: 0 };
    ranked[key].count += 1;
  });
  return Object.values(ranked).sort((a, b) => b.count - a.count)[0] || null;
}

function matchesAny(value, needles) {
  const normalized = String(value || '').toLowerCase();
  if (!normalized) return false;
  return needles.some((needle) => normalized === needle || normalized.includes(needle));
}

function getKnownSourceKind(source) {
  const lower = String(source || '').toLowerCase();
  const searchDomains = ['google', 'bing', 'yahoo', 'duckduckgo', 'baidu', 'yandex', 'ecosia', 'brave'];
  const socialDomains = ['facebook', 'instagram', 'tiktok', 'linkedin', 'twitter', 'x.com', 'youtube', 'pinterest', 'reddit', 'snapchat', 'threads'];
  const messagingDomains = ['whatsapp', 'wa.me', 'messenger', 'telegram', 'line.me'];
  if (searchDomains.some((item) => lower.includes(item))) return 'search';
  if (socialDomains.some((item) => lower.includes(item))) return 'social';
  if (messagingDomains.some((item) => lower.includes(item))) return 'messaging';
  return 'other';
}

function isOwnSiteReferrer(referrer) {
  const lower = String(referrer || '').toLowerCase();
  return lower.includes('ahoratengopagina.com') || lower.includes('vercel.app') || lower.includes('localhost');
}

function getEventLocation(event) {
  const geo = event.metadata?.geo || {};
  const city = cleanLabel(geo.city);
  const region = cleanLabel(geo.region);
  const country = cleanLabel(geo.country);
  if (city && region && country) return `${city}, ${region}, ${country}`;
  if (city && country) return `${city}, ${country}`;
  if (region && country) return `${region}, ${country}`;
  if (country) return country;
  return 'Unknown';
}

function getPagePath(pageUrl) {
  if (!pageUrl) return '/';
  try {
    const url = new URL(String(pageUrl), 'https://site.local');
    return url.pathname || '/';
  } catch {
    return String(pageUrl).substring(0, 120);
  }
}

function increment(map, key) {
  const safeKey = key || 'Unknown';
  map[safeKey] = (map[safeKey] || 0) + 1;
}

function topEntry(map) {
  const entries = Object.entries(map || {});
  if (entries.length === 0) return [null, 0];
  return entries.sort((a, b) => b[1] - a[1])[0];
}

function isNewer(candidate, current) {
  if (!candidate) return false;
  if (!current) return true;
  return new Date(candidate).getTime() > new Date(current).getTime();
}

function clampInt(value, fallback, min, max) {
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function compareText(a, b) {
  return String(a || '').localeCompare(String(b || ''));
}

function cleanLabel(value) {
  return String(value || '').trim().substring(0, 120);
}

function titleizeSource(source) {
  const raw = cleanLabel(source).replace(/^www\./i, '');
  const known = {
    'l.instagram.com': 'Instagram',
    'instagram.com': 'Instagram',
    'instagram': 'Instagram',
    'tiktok.com': 'TikTok',
    'www.tiktok.com': 'TikTok',
    'tiktok': 'TikTok',
    'facebook.com': 'Facebook',
    'l.facebook.com': 'Facebook',
    'lm.facebook.com': 'Facebook',
    'm.facebook.com': 'Facebook',
    'facebook': 'Facebook',
    'google.com': 'Google',
    'google': 'Google',
    'bing.com': 'Bing',
    'bing': 'Bing',
    'wa.me': 'WhatsApp',
    'web.whatsapp.com': 'WhatsApp',
    'api.whatsapp.com': 'WhatsApp',
    'whatsapp': 'WhatsApp',
    'linkedin.com': 'LinkedIn',
    'linkedin': 'LinkedIn',
    'twitter.com': 'X / Twitter',
    'x.com': 'X / Twitter',
    'youtube.com': 'YouTube',
    'youtu.be': 'YouTube',
    'pinterest.com': 'Pinterest',
    'reddit.com': 'Reddit',
    'duckduckgo.com': 'DuckDuckGo',
    'yahoo.com': 'Yahoo',
  };
  const lower = raw.toLowerCase();
  if (known[lower]) return known[lower];
  return raw || 'Direct';
}
