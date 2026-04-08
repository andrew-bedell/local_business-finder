// Vercel serverless function: Customer-triggered website generation
// POST — authenticated customer triggers the full generation pipeline
// Pipeline: fetch data → research report → AI photos → write content → generate HTML → publish

import { resolveCustomerBusiness } from '../_lib/resolve-customer-business.js';
import {
  compileBusinessDataForPrompt,
  buildPhotoInventory,
  generateResearchReport,
  generateAIPhotos,
  buildPhotoManifest,
  fetchEnrichedData,
} from '../_lib/website-pipeline.js';

export const config = { maxDuration: 300 };

const API_BASE = process.env.API_BASE_URL || 'https://ahoratengopagina.com';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL || 'https://xagfwyknlutmmtfufbfi.supabase.co';
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return res.status(503).json({ error: 'Service role key not configured' });
  }

  const supabaseHeaders = {
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  };

  // Step 1: Resolve customer → business via JWT auth
  let businessId, customerId;
  try {
    const resolved = await resolveCustomerBusiness(req, supabaseUrl, serviceKey);
    businessId = resolved.businessId;
    customerId = resolved.customerId;
  } catch (authErr) {
    const status = authErr.status || 401;
    return res.status(status).json({ error: authErr.message });
  }

  const { mode, existingWebsiteId } = req.body || {};
  const isUpdate = mode === 'update' && existingWebsiteId;

  try {
    // Step 2: Fetch business data
    console.log(`[GenerateWebsite] Starting ${isUpdate ? 'UPDATE' : 'NEW'} for business ${businessId}, customer ${customerId}`);
    const bizRes = await fetch(
      `${supabaseUrl}/rest/v1/businesses?id=eq.${businessId}&select=*`,
      { headers: supabaseHeaders }
    );
    const bizData = await bizRes.json();
    if (!Array.isArray(bizData) || bizData.length === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }
    const business = bizData[0];

    // Step 3: Fetch enriched data
    const { reviews, photos, socialProfiles, menus, services } = await fetchEnrichedData(businessId, supabaseUrl, supabaseHeaders);

    // Step 4: Rate limit check
    // Updates: 1 per hour. New generation: 1 per 24 hours.
    const existingWebRes = await fetch(
      `${supabaseUrl}/rest/v1/generated_websites?business_id=eq.${businessId}&select=id,created_at,last_edited_at,version&order=created_at.desc&limit=1`,
      { headers: supabaseHeaders }
    );
    const existingWebData = await existingWebRes.json();
    if (Array.isArray(existingWebData) && existingWebData.length > 0) {
      const existing = existingWebData[0];
      const lastTime = new Date(existing.last_edited_at || existing.created_at);
      const hoursSince = (Date.now() - lastTime.getTime()) / (1000 * 60 * 60);

      if (isUpdate) {
        // Updates rate limit: 1 per hour
        if (hoursSince < 1) {
          return res.status(429).json({
            error: 'Puedes actualizar tu página web una vez por hora.',
            existingWebsiteId: existing.id,
            minutesRemaining: Math.ceil(60 - hoursSince * 60),
          });
        }
      } else {
        // New generation rate limit: 1 per 24 hours
        if (hoursSince < 24) {
          return res.status(429).json({
            error: 'Website generation limit: one per 24 hours',
            existingWebsiteId: existing.id,
            hoursRemaining: Math.ceil(24 - hoursSince),
          });
        }
      }
    } else if (isUpdate) {
      // Can't update if no website exists
      return res.status(400).json({ error: 'No existing website to update' });
    }

    // Step 5: Compile business data into a text prompt
    const businessData = compileBusinessDataForPrompt(business, reviews, photos, socialProfiles, menus, services);

    // Determine language from address country
    const country = business.address_country || '';
    const spanishCountries = ['MX', 'CO', 'AR', 'PE', 'CL', 'EC', 'VE', 'GT', 'CU', 'DO', 'HN', 'SV', 'NI', 'CR', 'PA', 'UY', 'PY', 'BO'];
    const language = spanishCountries.includes(country) ? 'es' : 'es'; // Default to Spanish

    // Step 6: Build photo inventory from photos rows
    const photoInventory = buildPhotoInventory(photos, supabaseUrl);

    // Step 7: Call /api/ai/research-report (SSE response)
    console.log('[GenerateWebsite] Step 7: Generating research report...');
    const researchReport = await generateResearchReport(businessData, business.name, language);

    // Step 8: Create or update generated_websites row
    let websiteId;
    if (isUpdate) {
      // Update existing website record
      console.log(`[GenerateWebsite] Step 8: Updating website record ${existingWebsiteId}...`);
      const existingVersion = (Array.isArray(existingWebData) && existingWebData.length > 0) ? (existingWebData[0].version || 1) : 1;
      const updateWebRes = await fetch(
        `${supabaseUrl}/rest/v1/generated_websites?id=eq.${existingWebsiteId}`,
        {
          method: 'PATCH',
          headers: { ...supabaseHeaders, 'Prefer': 'return=representation' },
          body: JSON.stringify({
            status: 'draft',
            version: existingVersion + 1,
            last_edited_at: new Date().toISOString(),
            config: { researchReport },
          }),
        }
      );
      const updateWebData = await updateWebRes.json();
      if (!updateWebRes.ok || !Array.isArray(updateWebData) || updateWebData.length === 0) {
        console.error('[GenerateWebsite] Failed to update website record:', updateWebData);
        return res.status(502).json({ error: 'Failed to update website record' });
      }
      websiteId = existingWebsiteId;
    } else {
      // Create new website record
      console.log('[GenerateWebsite] Step 8: Creating website record...');
      const insertWebRes = await fetch(
        `${supabaseUrl}/rest/v1/generated_websites`,
        {
          method: 'POST',
          headers: { ...supabaseHeaders, 'Prefer': 'return=representation' },
          body: JSON.stringify({
            business_id: businessId,
            template_name: 'ai_generated',
            status: 'draft',
            version: 1,
            config: { researchReport },
          }),
        }
      );
      const insertWebData = await insertWebRes.json();
      if (!insertWebRes.ok || !Array.isArray(insertWebData) || insertWebData.length === 0) {
        console.error('[GenerateWebsite] Failed to create website record:', insertWebData);
        return res.status(502).json({ error: 'Failed to create website record' });
      }
      websiteId = insertWebData[0].id;
    }

    // Step 9: Generate AI photos for generate_ai slots (max 3 parallel)
    console.log('[GenerateWebsite] Step 9: Generating AI photos...');
    const aiPhotos = await generateAIPhotos(researchReport, businessId, supabaseUrl, supabaseHeaders);

    // Add AI photos to inventory
    const sectionCounts = {};
    aiPhotos.forEach((photo) => {
      const section = (photo.section || 'photo').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const idx = sectionCounts[section] || 0;
      sectionCounts[section] = idx + 1;
      photoInventory.push({
        id: `ai_${section}_${idx}`,
        type: 'ai_generated',
        url: photo.url,
      });
    });

    // Step 10: Build photo manifest
    console.log('[GenerateWebsite] Step 10: Building photo manifest...');
    const photoManifest = buildPhotoManifest(researchReport.photoAssetPlan || [], photoInventory);

    // Step 11: Call /api/ai/write-content
    console.log('[GenerateWebsite] Step 11: Writing website content...');
    const writeContentRes = await fetch(`${API_BASE}/api/ai/write-content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        researchReport,
        businessData,
        photoManifest,
        language,
        category: business.category || '',
        subcategory: business.subcategory || '',
      }),
    });
    if (!writeContentRes.ok) {
      const errText = await writeContentRes.text().catch(() => '');
      throw new Error(`Content writing API failed (${writeContentRes.status}): ${errText.substring(0, 200)}`);
    }
    const websiteContent = await writeContentRes.json();
    if (!websiteContent.hero && !websiteContent.about) {
      throw new Error('Content writing returned incomplete content');
    }

    // Step 12: Call /api/ai/generate-website
    console.log('[GenerateWebsite] Step 12: Generating website HTML...');
    const generateHtmlRes = await fetch(`${API_BASE}/api/ai/generate-website`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        websiteContent,
        designPalette: researchReport.designPalette || {},
        photoManifest: (photoManifest || []).map(p => ({ section: p.section, slot: p.slot, url: p.url })),
        name: business.name,
        language,
        category: business.category || '',
        subcategory: business.subcategory || '',
        phone: business.phone || '',
        whatsapp: business.whatsapp || '',
        address: business.address_full || '',
        mapsUrl: business.maps_url || '',
        socialProfiles: socialProfiles.map(sp => ({ platform: sp.platform, url: sp.profile_url })),
        menuItems: menus.map(m => ({ category: m.menu_category, name: m.item_name, description: m.item_description, price: m.price, currency: m.currency })),
        services: services.map(s => ({ name: s.name, description: s.description, price: s.price, currency: s.currency })),
        founderName: business.owner_name || '',
        founderDescription: business.founder_description || '',
        researchReport,
      }),
    });
    if (!generateHtmlRes.ok) {
      const errText = await generateHtmlRes.text().catch(() => '');
      throw new Error(`Website generation API failed (${generateHtmlRes.status}): ${errText.substring(0, 200)}`);
    }
    const generateResult = await generateHtmlRes.json();
    if (!generateResult.html) {
      throw new Error('Website generation returned no HTML');
    }

    // Step 13: Update generated_websites row with HTML
    console.log('[GenerateWebsite] Step 13: Saving HTML to website record...');
    const updateWebRes = await fetch(
      `${supabaseUrl}/rest/v1/generated_websites?id=eq.${websiteId}`,
      {
        method: 'PATCH',
        headers: { ...supabaseHeaders, 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          status: 'draft',
          config: {
            researchReport,
            websiteContent,
            draft_html: generateResult.html,
            html: generateResult.html,
          },
        }),
      }
    );
    if (!updateWebRes.ok) {
      const errText = await updateWebRes.text().catch(() => '');
      console.error('[GenerateWebsite] Failed to save HTML:', errText);
      throw new Error('Failed to save generated HTML');
    }

    // Step 14: Publish website
    console.log('[GenerateWebsite] Step 14: Publishing website...');
    const publishRes = await fetch(`${API_BASE}/api/websites/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ websiteId, action: 'publish' }),
    });
    if (!publishRes.ok) {
      const errText = await publishRes.text().catch(() => '');
      console.error('[GenerateWebsite] Publish failed:', errText);
      // Website was generated but not published — return partial success
      return res.status(200).json({
        success: true,
        websiteId,
        publishedUrl: null,
        warning: 'Website generated but publishing failed. It can be published manually.',
      });
    }
    const publishResult = await publishRes.json();
    const publishedUrl = publishResult?.website?.published_url;

    // Step 15: Return success
    console.log(`[GenerateWebsite] Complete! Published URL: ${publishedUrl}`);
    return res.status(200).json({
      success: true,
      websiteId,
      publishedUrl,
    });
  } catch (err) {
    console.error(`[GenerateWebsite] Failed for business ${businessId}:`, err);
    return res.status(500).json({ error: err.message || 'Website generation failed' });
  }
}
