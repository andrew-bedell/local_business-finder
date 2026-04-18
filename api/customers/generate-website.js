// Vercel serverless function: Customer-triggered website generation
// POST — authenticated customer triggers the full generation pipeline
// Pipeline: fetch data → research report → AI photos → write content → generate HTML → publish

import { resolveCustomerBusiness } from '../_lib/resolve-customer-business.js';
import { buildWebsiteConfig } from '../_lib/website-config.js';
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
      `${supabaseUrl}/rest/v1/generated_websites?business_id=eq.${businessId}&select=id,created_at,last_edited_at,version,status,published_url,config&order=created_at.desc&limit=1`,
      { headers: supabaseHeaders }
    );
    const existingWebData = await existingWebRes.json();
    const latestWebsite = Array.isArray(existingWebData) && existingWebData.length > 0 ? existingWebData[0] : null;
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

    // Step 8: Generate AI photos for generate_ai slots (max 3 parallel)
    console.log('[GenerateWebsite] Step 8: Generating AI photos...');
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

    // Step 9: Build photo manifest
    console.log('[GenerateWebsite] Step 9: Building photo manifest...');
    const photoManifest = buildPhotoManifest(researchReport.photoAssetPlan || [], photoInventory);

    // Step 10: Call /api/ai/write-content
    console.log('[GenerateWebsite] Step 10: Writing website content...');
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

    // Step 11: Call /api/ai/generate-website
    console.log('[GenerateWebsite] Step 11: Generating website HTML...');
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

    // Step 12: Save generated HTML only after it exists, so we never leave an empty preview row behind.
    let websiteId = existingWebsiteId;
    const savedConfig = buildWebsiteConfig({
      existingConfig: latestWebsite?.config,
      researchReport,
      websiteContent,
      photoManifest,
      html: generateResult.html,
    });

    if (isUpdate) {
      console.log(`[GenerateWebsite] Step 12: Saving HTML to existing website ${existingWebsiteId}...`);
      const existingVersion = latestWebsite?.version || 1;
      const updateWebRes = await fetch(
        `${supabaseUrl}/rest/v1/generated_websites?id=eq.${existingWebsiteId}`,
        {
          method: 'PATCH',
          headers: { ...supabaseHeaders, 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            version: existingVersion + 1,
            last_edited_at: new Date().toISOString(),
            config: savedConfig,
          }),
        }
      );
      if (!updateWebRes.ok) {
        const errText = await updateWebRes.text().catch(() => '');
        console.error('[GenerateWebsite] Failed to save HTML:', errText);
        throw new Error('Failed to save generated HTML');
      }
    } else {
      console.log('[GenerateWebsite] Step 12: Creating website record with completed HTML...');
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
            config: savedConfig,
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

    // Step 13: Publish only when needed.
    let publishedUrl = latestWebsite?.published_url || null;
    const shouldPublish = !isUpdate || latestWebsite?.status !== 'published' || !latestWebsite?.published_url;

    if (shouldPublish) {
      console.log('[GenerateWebsite] Step 13: Publishing website...');
      const publishRes = await fetch(`${API_BASE}/api/websites/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteId, action: 'publish' }),
      });
      if (!publishRes.ok) {
        const errText = await publishRes.text().catch(() => '');
        console.error('[GenerateWebsite] Publish failed:', errText);
        return res.status(200).json({
          success: true,
          websiteId,
          publishedUrl,
          warning: 'Website generated but publishing failed. It can be published manually.',
        });
      }
      const publishResult = await publishRes.json();
      publishedUrl = publishResult?.website?.published_url || publishedUrl;
    }

    // Step 14: Return success
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
