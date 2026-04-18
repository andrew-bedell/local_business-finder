// Vercel serverless function: Fetch website preview data
// GET ?id=<uuid> — returns website HTML + business info

import { getWebsiteHtml } from '../_lib/website-config.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }

  const websiteId = req.query.id;
  if (!websiteId) {
    return res.status(400).json({ error: 'Missing required parameter: id' });
  }

  try {
    const supabaseHeaders = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    };

    // Fetch website with joined business data
    const response = await fetch(
      `${supabaseUrl}/rest/v1/generated_websites?id=eq.${encodeURIComponent(websiteId)}&select=*,businesses(id,name,phone,address_full,category)`,
      {
        headers: supabaseHeaders,
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Preview fetch error:', err);
      return res.status(502).json({ error: 'Failed to fetch website' });
    }

    const data = await response.json();
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Website not found' });
    }

    const website = data[0];
    const business = website.businesses || {};
    let html = getWebsiteHtml(website.config);
    let resolvedFromWebsiteId = null;

    if (!html && website.business_id) {
      const fallbackResponse = await fetch(
        `${supabaseUrl}/rest/v1/generated_websites?business_id=eq.${website.business_id}&id=neq.${encodeURIComponent(website.id)}&order=created_at.desc&select=id,config,status,published_url&limit=10`,
        { headers: supabaseHeaders }
      );

      if (fallbackResponse.ok) {
        const fallbackCandidates = await fallbackResponse.json();
        const fallbackWebsite = (Array.isArray(fallbackCandidates) ? fallbackCandidates : [])
          .find((candidate) => getWebsiteHtml(candidate.config));

        if (fallbackWebsite) {
          html = getWebsiteHtml(fallbackWebsite.config);
          resolvedFromWebsiteId = fallbackWebsite.id;
        }
      } else {
        console.warn('Preview fallback fetch failed for website:', website.id);
      }
    }

    return res.status(200).json({
      html,
      businessName: business.name || '',
      businessId: business.id || null,
      businessPhone: business.phone || '',
      websiteId: website.id,
      status: website.status,
      resolvedFromWebsiteId,
    });
  } catch (err) {
    console.error('Preview fetch error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
