import { buildWebsiteConfig } from './website-config.js';
import {
  compileBusinessDataForPrompt,
  buildPhotoInventory,
  deriveProductRows,
  generateResearchReport,
  generateAIPhotos,
  buildPhotoManifestWithSuitability,
  fetchEnrichedData,
  hasUnscannedWebsitePhotos,
  scanPhotoTextOverlaysForBusiness,
} from './website-pipeline.js';

const API_BASE = process.env.API_BASE_URL || 'https://ahoratengopagina.com';
const INTERNAL_API_HEADERS = {
  'Content-Type': 'application/json',
  'x-internal-service-key': process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '',
};

async function loadRows(url, supabaseHeaders) {
  const response = await fetch(url, { headers: supabaseHeaders });
  const data = await response.json().catch(() => []);
  if (!response.ok) {
    const detail = Array.isArray(data) ? '' : (data?.message || data?.error || '');
    throw new Error(detail || `Supabase request failed (${response.status})`);
  }
  return Array.isArray(data) ? data : [];
}

async function patchWebsite({ websiteId, supabaseUrl, supabaseHeaders, body }) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/generated_websites?id=eq.${encodeURIComponent(websiteId)}`,
    {
      method: 'PATCH',
      headers: { ...supabaseHeaders, 'Prefer': 'return=minimal' },
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Failed to save generated HTML: ${errText.substring(0, 200)}`);
  }
}

async function insertWebsite({ supabaseUrl, supabaseHeaders, body }) {
  const response = await fetch(`${supabaseUrl}/rest/v1/generated_websites`, {
    method: 'POST',
    headers: { ...supabaseHeaders, 'Prefer': 'return=representation' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => []);
  if (!response.ok || !Array.isArray(data) || data.length === 0) {
    const detail = Array.isArray(data) ? '' : (data?.message || data?.error || '');
    throw new Error(detail || 'Failed to create website record');
  }
  return data[0];
}

async function notifyStage(onStage, stage, progress) {
  if (typeof onStage !== 'function') return;
  await onStage(stage, progress);
}

export async function runCustomerWebsiteGenerationJob({
  job,
  supabaseUrl,
  supabaseHeaders,
  onStage,
}) {
  const businessId = job.business_id;
  const isUpdate = job.mode === 'update' && job.existing_website_id;

  await notifyStage(onStage, 'research', 10);
  console.log(`[CustomerWebsiteRunner] Starting ${isUpdate ? 'UPDATE' : 'NEW'} for business ${businessId}`);

  const businesses = await loadRows(
    `${supabaseUrl}/rest/v1/businesses?id=eq.${encodeURIComponent(businessId)}&select=*`,
    supabaseHeaders
  );
  if (businesses.length === 0) throw new Error('Business not found');
  const business = businesses[0];

  let enriched = await fetchEnrichedData(businessId, supabaseUrl, supabaseHeaders);
  if (hasUnscannedWebsitePhotos(enriched.photos)) {
    try {
      const scanResult = await scanPhotoTextOverlaysForBusiness(businessId);
      if (scanResult.flagged > 0) {
        console.log(`[CustomerWebsiteRunner] Flagged ${scanResult.flagged}/${scanResult.scanned} text-heavy photo(s) for ${business.name}`);
      }
      enriched = await fetchEnrichedData(businessId, supabaseUrl, supabaseHeaders);
    } catch (scanErr) {
      console.warn('[CustomerWebsiteRunner] Photo text scan failed; unscanned Google/AI photos will be excluded:', scanErr.message);
    }
  }

  const { reviews, websitePhotos, socialProfiles, menus, services } = enriched;
  const existingWebsites = await loadRows(
    `${supabaseUrl}/rest/v1/generated_websites?business_id=eq.${encodeURIComponent(businessId)}&select=id,created_at,last_edited_at,version,status,published_url,config&order=created_at.desc&limit=1`,
    supabaseHeaders
  );
  const latestWebsite = existingWebsites.length > 0 ? existingWebsites[0] : null;
  let targetWebsite = latestWebsite;

  if (isUpdate) {
    const targetRows = await loadRows(
      `${supabaseUrl}/rest/v1/generated_websites?id=eq.${encodeURIComponent(job.existing_website_id)}&business_id=eq.${encodeURIComponent(businessId)}&select=id,created_at,last_edited_at,version,status,published_url,config&limit=1`,
      supabaseHeaders
    );
    if (targetRows.length === 0) throw new Error('No existing website to update');
    targetWebsite = targetRows[0];
  }

  if (latestWebsite) {
    const lastTime = new Date(latestWebsite.last_edited_at || latestWebsite.created_at);
    const hoursSince = (Date.now() - lastTime.getTime()) / (1000 * 60 * 60);
    if (isUpdate && hoursSince < 1) {
      throw new Error('Puedes actualizar tu página web una vez por hora.');
    }
    if (!isUpdate && hoursSince < 24) {
      throw new Error('Website generation limit: one per 24 hours');
    }
  } else if (isUpdate) {
    throw new Error('No existing website to update');
  }

  const products = deriveProductRows(business, services);
  const businessData = compileBusinessDataForPrompt(
    business,
    reviews,
    websitePhotos,
    socialProfiles,
    menus,
    services,
    products
  );
  const language = 'es';
  const photoInventory = buildPhotoInventory(websitePhotos, supabaseUrl);

  console.log('[CustomerWebsiteRunner] Generating research report...');
  const researchReport = await generateResearchReport(businessData, business.name, language);

  await notifyStage(onStage, 'photos', 30);
  console.log('[CustomerWebsiteRunner] Generating AI photos...');
  const aiPhotos = await generateAIPhotos(researchReport, businessId, supabaseUrl, supabaseHeaders, {
    existingPhotoCount: photoInventory.length,
  });

  const sectionCounts = {};
  aiPhotos.forEach((photo) => {
    const section = (photo.section || 'photo').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const idx = sectionCounts[section] || 0;
    sectionCounts[section] = idx + 1;
    photoInventory.push({
      bucket: 'photos',
      id: `ai_${section}_${idx}`,
      originalUrl: photo.url,
      storagePath: photo.storagePath || null,
      type: 'ai_generated',
      url: photo.url,
    });
  });

  await notifyStage(onStage, 'content', 50);
  console.log('[CustomerWebsiteRunner] Building photo manifest...');
  const photoManifest = await buildPhotoManifestWithSuitability(
    researchReport.photoAssetPlan || [],
    photoInventory,
    supabaseUrl
  );

  console.log('[CustomerWebsiteRunner] Writing website content...');
  const writeContentRes = await fetch(`${API_BASE}/api/ai/write-content`, {
    method: 'POST',
    headers: INTERNAL_API_HEADERS,
    body: JSON.stringify({
      researchReport,
      businessData,
      photoManifest,
      language,
      category: business.category || '',
      subcategory: business.subcategory || '',
      country: business.address_country || '',
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

  await notifyStage(onStage, 'build', 72);
  console.log('[CustomerWebsiteRunner] Generating website HTML...');
  const generateHtmlRes = await fetch(`${API_BASE}/api/ai/generate-website`, {
    method: 'POST',
    headers: INTERNAL_API_HEADERS,
    body: JSON.stringify({
      websiteContent,
      designPalette: researchReport.designPalette || {},
      photoManifest: (photoManifest || []).map(p => ({
        section: p.section,
        slot: p.slot,
        url: p.url,
        objectPosition: p.objectPosition || null,
        desktopPosition: p.desktopPosition || null,
        mobilePosition: p.mobilePosition || null,
        heroSuitability: p.heroSuitability || null,
      })),
      name: business.name,
      language,
      category: business.category || '',
      subcategory: business.subcategory || '',
      phone: business.phone || '',
      whatsapp: business.whatsapp || '',
      address: business.address_full || '',
      city: business.address_city || '',
      state: business.address_state || '',
      country: business.address_country || '',
      hours: business.hours || [],
      rating: business.rating || null,
      reviewCount: business.review_count || null,
      paymentMethods: business.payment_methods || [],
      highlights: business.highlights || [],
      serviceOptions: business.service_options || [],
      mapsUrl: business.maps_url || '',
      socialProfiles: socialProfiles.map(sp => ({ platform: sp.platform, url: sp.profile_url })),
      menuItems: menus.map(m => ({ category: m.menu_category, name: m.item_name, description: m.item_description, price: m.price, currency: m.currency })),
      services: services.map(s => ({ name: s.name, description: s.description, price: s.price, currency: s.currency, photo_url: s.photo_url || '' })),
      products: products.map(p => ({ name: p.name, description: p.description, price: p.price, currency: p.currency, photo_url: p.photo_url || '' })),
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

  await notifyStage(onStage, 'publish', 88);
  let websiteId = job.existing_website_id || null;
  const savedConfig = buildWebsiteConfig({
    existingConfig: isUpdate ? targetWebsite?.config : undefined,
    researchReport,
    websiteContent,
    photoManifest,
    html: generateResult.html,
  });

  if (isUpdate) {
    const existingVersion = targetWebsite?.version || 1;
    await patchWebsite({
      websiteId,
      supabaseUrl,
      supabaseHeaders,
      body: {
        version: existingVersion + 1,
        last_edited_at: new Date().toISOString(),
        config: savedConfig,
      },
    });
  } else {
    const inserted = await insertWebsite({
      supabaseUrl,
      supabaseHeaders,
      body: {
        business_id: businessId,
        template_name: 'ai_generated',
        status: 'draft',
        version: 1,
        generated_at: new Date().toISOString(),
        config: savedConfig,
      },
    });
    websiteId = inserted.id;
  }

  let publishedUrl = targetWebsite?.published_url || null;
  const shouldPublish = !isUpdate || targetWebsite?.status !== 'published' || !targetWebsite?.published_url;
  let warning = null;

  if (shouldPublish) {
    console.log('[CustomerWebsiteRunner] Publishing website...');
    const publishRes = await fetch(`${API_BASE}/api/websites/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ websiteId, action: 'publish' }),
    });
    if (publishRes.ok) {
      const publishResult = await publishRes.json();
      publishedUrl = publishResult?.website?.published_url || publishedUrl;
    } else {
      const errText = await publishRes.text().catch(() => '');
      console.error('[CustomerWebsiteRunner] Publish failed:', errText.substring(0, 200));
      warning = 'Website generated but publishing failed. It can be published manually.';
    }
  }

  console.log(`[CustomerWebsiteRunner] Complete. Published URL: ${publishedUrl}`);
  return {
    success: true,
    websiteId,
    publishedUrl,
    warning,
  };
}
