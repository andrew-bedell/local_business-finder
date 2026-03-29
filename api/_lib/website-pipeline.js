// Shared website generation pipeline functions
// Used by both api/customers/generate-website.js and api/cron/generate-websites.js

const API_BASE = process.env.API_BASE_URL || 'https://ahoratengopagina.com';

/**
 * Compile business data into a formatted text string for AI prompts.
 */
export function compileBusinessDataForPrompt(business, reviews, photos, socialProfiles, menus, services) {
  const sections = [];

  // Identity
  sections.push('=== BUSINESS IDENTITY ===');
  sections.push(`Name: ${business.name || 'Unknown'}`);
  if (business.address_full) sections.push(`Address: ${business.address_full}`);
  if (business.phone) sections.push(`Phone: ${business.phone}`);
  if (business.category) sections.push(`Category: ${business.category}`);
  if (business.subcategory) sections.push(`Subcategory: ${business.subcategory}`);
  if (business.types && business.types.length > 0) {
    sections.push(`Google Types: ${business.types.join(', ')}`);
  }
  if (business.business_status) sections.push(`Status: ${business.business_status}`);

  // Business details
  const detailFields = [
    ['Description', business.description],
    ['Price Level', business.price_level ? '$'.repeat(business.price_level) : null],
    ['Service Options', business.service_options?.join(', ')],
    ['Amenities', business.amenities?.join(', ')],
    ['Highlights', business.highlights?.join(', ')],
    ['Payment Methods', business.payment_methods?.join(', ')],
    ['Languages Spoken', business.languages_spoken?.join(', ')],
    ['Accessibility', business.accessibility_info],
    ['Parking', business.parking_info],
    ['Year Established', business.year_established],
    ['Owner', business.owner_name],
  ];
  const activeDetails = detailFields.filter(([, v]) => v);
  if (activeDetails.length > 0) {
    sections.push('');
    sections.push('=== BUSINESS DETAILS ===');
    activeDetails.forEach(([label, val]) => sections.push(`${label}: ${val}`));
  }

  // Founder description
  if (business.founder_description) {
    sections.push('');
    sections.push('=== FOUNDER ===');
    if (business.owner_name) sections.push(`Name: ${business.owner_name}`);
    sections.push(`Story: ${business.founder_description}`);
  }

  // Ratings overview
  if (business.rating || business.review_count) {
    sections.push('');
    sections.push('=== RATINGS & REVIEWS OVERVIEW ===');
    if (business.rating) sections.push(`Google Rating: ${business.rating} / 5`);
    if (business.review_count) sections.push(`Total Reviews: ${business.review_count}`);
  }

  // Google reviews
  const googleReviews = reviews.filter(r => r.source === 'google').slice(0, 15);
  if (googleReviews.length > 0) {
    sections.push('');
    sections.push('=== GOOGLE REVIEWS ===');
    googleReviews.forEach((r, i) => {
      const author = r.author_name || 'Anonymous';
      const stars = r.rating ? `${r.rating}★` : '';
      const text = r.review_text || r.text || '';
      sections.push(`Review ${i + 1} (${stars} by ${author}): "${text}"`);
    });
  }

  // Facebook reviews
  const fbReviews = reviews.filter(r => r.source === 'facebook').slice(0, 5);
  if (fbReviews.length > 0) {
    sections.push('');
    sections.push('=== FACEBOOK REVIEWS ===');
    fbReviews.forEach((r, i) => {
      const author = r.author_name || 'Anonymous';
      const stars = r.rating ? `${r.rating}★` : '';
      const text = r.review_text || r.text || '';
      sections.push(`FB Review ${i + 1} (${stars} by ${author}): "${text}"`);
    });
  }

  // Business hours
  if (business.hours && business.hours.length > 0) {
    sections.push('');
    sections.push('=== BUSINESS HOURS ===');
    business.hours.forEach(h => sections.push(h));
  }

  // Social media profiles
  if (socialProfiles && socialProfiles.length > 0) {
    sections.push('');
    sections.push('=== SOCIAL MEDIA PROFILES ===');
    socialProfiles.forEach(sp => {
      let line = `${sp.platform}: ${sp.profile_url || 'N/A'}`;
      if (sp.handle) line += ` (@${sp.handle})`;
      if (sp.follower_count) line += ` | ${sp.follower_count} followers`;
      if (sp.post_count) line += ` | ${sp.post_count} posts`;
      sections.push(line);
    });
  }

  // Services
  if (services && services.length > 0) {
    sections.push('');
    sections.push('=== SERVICES ===');
    services.forEach((s, i) => {
      let line = `${i + 1}. ${s.name}`;
      if (s.description) line += ` — ${s.description}`;
      if (s.price) line += ` (${s.currency || 'MXN'} $${s.price})`;
      sections.push(line);
    });
  }

  // Menu items
  if (menus && menus.length > 0) {
    sections.push('');
    sections.push('=== MENU ITEMS ===');
    const categories = {};
    menus.forEach(m => {
      const cat = m.menu_category || 'Other';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(m);
    });
    Object.entries(categories).forEach(([cat, items]) => {
      sections.push(`[${cat}]`);
      items.forEach(m => {
        let line = `  - ${m.item_name}`;
        if (m.item_description) line += `: ${m.item_description}`;
        if (m.price) line += ` (${m.currency || 'MXN'} $${m.price})`;
        sections.push(line);
      });
    });
  }

  // Photo inventory
  if (photos && photos.length > 0) {
    sections.push('');
    sections.push('=== PHOTO INVENTORY ===');
    sections.push(`Total Photos Available: ${photos.length}`);
    photos.forEach((p, i) => {
      const id = `${p.source || 'unknown'}_photo_${i}`;
      let line = `ID: ${id} | Source: ${p.source || 'unknown'} | Type: ${p.photo_type || 'unclassified'}`;
      if (p.caption) line += ` | Caption: "${p.caption.substring(0, 150)}"`;
      sections.push(line);
    });
  }

  return sections.join('\n');
}


/**
 * Build photo inventory array from business_photos rows.
 * Maps storage_path to public URL when available.
 */
export function buildPhotoInventory(photos, supabaseUrl) {
  return (photos || []).map((p, i) => ({
    id: `${p.source || 'unknown'}_photo_${i}`,
    type: p.photo_type || 'unclassified',
    url: p.storage_path
      ? `${supabaseUrl}/storage/v1/object/public/photos/${p.storage_path}`
      : p.url,
  }));
}


/**
 * Call /api/ai/research-report and parse the SSE stream response.
 */
export async function generateResearchReport(businessData, name, language) {
  const resp = await fetch(`${API_BASE}/api/ai/research-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ businessData, name, language }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Research report API failed (${resp.status}): ${text.substring(0, 200)}`);
  }

  // Parse SSE stream — collect all text chunks
  const body = await resp.text();
  let fullText = '';

  const lines = body.split('\n');
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') break;
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
          fullText += parsed.delta.text;
        }
      } catch {
        // Non-JSON SSE line, might be raw text
        fullText += data;
      }
    }
  }

  // Extract JSON from the accumulated text
  const jsonMatch = fullText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to extract JSON from research report response');
  }

  let jsonStr = jsonMatch[0];

  // Clean up common Claude JSON issues: trailing commas before ] or }
  jsonStr = jsonStr.replace(/,\s*([\]}])/g, '$1');

  try {
    return JSON.parse(jsonStr);
  } catch (firstErr) {
    // If still failing, try to find the last complete top-level brace
    console.warn('[WebsitePipeline] Research report JSON parse failed, attempting recovery:', firstErr.message);

    let braceDepth = 0;
    let lastValidEnd = -1;
    for (let i = 0; i < jsonStr.length; i++) {
      if (jsonStr[i] === '{') braceDepth++;
      else if (jsonStr[i] === '}') {
        braceDepth--;
        if (braceDepth === 0) { lastValidEnd = i; break; }
      }
    }

    if (lastValidEnd > 0) {
      const trimmed = jsonStr.substring(0, lastValidEnd + 1)
        .replace(/,\s*([\]}])/g, '$1');
      try {
        return JSON.parse(trimmed);
      } catch (secondErr) {
        console.error('[WebsitePipeline] Research report JSON recovery also failed:', secondErr.message);
        throw secondErr;
      }
    }

    throw firstErr;
  }
}


/**
 * Generate AI photos based on the photoAssetPlan.
 * Runs up to 3 in parallel with retry on failure.
 */
export async function generateAIPhotos(researchReport, businessId, supabaseUrl, supabaseHeaders) {
  const plan = researchReport?.photoAssetPlan || [];
  const aiSlots = plan.filter(p => p.recommendation === 'generate_ai' && p.aiPrompt);

  if (aiSlots.length === 0) return [];

  const results = [];

  async function generateOnePhoto(slot) {
    const resp = await fetch(`${API_BASE}/api/ai/generate-photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: slot.aiPrompt,
        section: slot.section,
        slot: slot.slot,
      }),
    });

    if (!resp.ok) {
      console.warn(`[WebsitePipeline] AI photo generation failed for ${slot.section}:`, resp.status);
      return null;
    }

    const result = await resp.json();

    // Save to business_photos table
    if (result.url) {
      const saveRes = await fetch(
        `${supabaseUrl}/rest/v1/business_photos`,
        {
          method: 'POST',
          headers: { ...supabaseHeaders, 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            business_id: businessId,
            source: 'ai_generated',
            photo_type: 'ai_generated',
            url: result.url,
            caption: slot.slot,
          }),
        }
      );
      if (!saveRes.ok) {
        console.warn('[WebsitePipeline] Failed to save AI photo record');
      }
    }

    return result;
  }

  // Process in batches of 3
  for (let i = 0; i < aiSlots.length; i += 3) {
    const batch = aiSlots.slice(i, i + 3);
    const batchResults = await Promise.allSettled(
      batch.map(slot => generateOnePhoto(slot))
    );

    // Collect successes and track failures for retry
    const failedSlots = [];
    for (let j = 0; j < batch.length; j++) {
      if (batchResults[j].status === 'fulfilled' && batchResults[j].value?.url) {
        results.push(batchResults[j].value);
      } else {
        failedSlots.push(batch[j]);
      }
    }

    // Retry failed slots once
    if (failedSlots.length > 0) {
      console.log(`[WebsitePipeline] Retrying ${failedSlots.length} failed photo(s)...`);
      const retryResults = await Promise.allSettled(
        failedSlots.map(slot => generateOnePhoto(slot))
      );
      for (const r of retryResults) {
        if (r.status === 'fulfilled' && r.value?.url) {
          results.push(r.value);
        }
      }
    }
  }

  console.log(`[WebsitePipeline] AI photos: ${results.length}/${aiSlots.length} generated successfully`);
  return results;
}


/**
 * Build a photo manifest that resolves the research report's photo asset plan
 * to concrete URLs from the photo inventory.
 */
export function buildPhotoManifest(photoAssetPlan, photoInventory) {
  const usedUrls = new Set();
  const manifest = [];

  for (const item of photoAssetPlan) {
    let url = null;

    if (item.recommendation === 'use_existing' && item.existingPhotoId) {
      const match = photoInventory.find(p => p.id === item.existingPhotoId);
      url = match?.url || null;
    }

    if (!url && item.recommendation === 'generate_ai') {
      const section = (item.section || '').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const match = photoInventory.find(p => p.id.startsWith(`ai_${section}_`));
      url = match?.url || null;
    }

    // Fallback: any unused photo
    if (!url) {
      const fallback = photoInventory.find(p => !usedUrls.has(p.url));
      url = fallback?.url || (photoInventory[0]?.url || null);
    }

    if (url) {
      usedUrls.add(url);
      manifest.push({ section: item.section, slot: item.slot, url });
    }
  }

  return manifest;
}


/**
 * Fetch enriched business data (reviews, photos, social profiles, menus, services) in parallel.
 */
export async function fetchEnrichedData(businessId, supabaseUrl, supabaseHeaders) {
  const [reviewsRes, photosRes, socialsRes, menusRes, servicesRes] = await Promise.all([
    fetch(
      `${supabaseUrl}/rest/v1/business_reviews?business_id=eq.${businessId}&select=*&order=sentiment_score.desc.nullslast&limit=20`,
      { headers: supabaseHeaders }
    ),
    fetch(
      `${supabaseUrl}/rest/v1/business_photos?business_id=eq.${businessId}&select=*&limit=30`,
      { headers: supabaseHeaders }
    ),
    fetch(
      `${supabaseUrl}/rest/v1/business_social_profiles?business_id=eq.${businessId}&select=*`,
      { headers: supabaseHeaders }
    ),
    fetch(
      `${supabaseUrl}/rest/v1/business_menus?business_id=eq.${businessId}&select=*`,
      { headers: supabaseHeaders }
    ),
    fetch(
      `${supabaseUrl}/rest/v1/business_services?business_id=eq.${businessId}&select=*&order=sort_order.asc`,
      { headers: supabaseHeaders }
    ),
  ]);

  return {
    reviews: (await reviewsRes.json()) || [],
    photos: (await photosRes.json()) || [],
    socialProfiles: (await socialsRes.json()) || [],
    menus: (await menusRes.json()) || [],
    services: (await servicesRes.json()) || [],
  };
}


/**
 * Run the full website generation pipeline for a single business.
 * Returns { websiteId, publishedUrl } on success.
 */
export async function generateWebsiteForBusiness(business, supabaseUrl, supabaseHeaders, options = {}) {
  const { autoGenerated = false } = options;
  const businessId = business.id;

  // Fetch enriched data
  const { reviews, photos, socialProfiles, menus, services } = await fetchEnrichedData(businessId, supabaseUrl, supabaseHeaders);

  // Auto-parse menu photos if we have menu photos but no menu items yet
  if (menus.length === 0) {
    const menuPhotos = photos
      .filter(p => p.photo_type === 'menu')
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    if (menuPhotos.length > 0) {
      const latestMenu = menuPhotos[0];
      const photoUrl = latestMenu.storage_path
        ? `${supabaseUrl}/storage/v1/object/public/photos/${latestMenu.storage_path}`
        : latestMenu.url;

      try {
        console.log(`[WebsitePipeline] Auto-parsing menu photo for ${business.name}...`);
        const parseRes = await fetch(`${API_BASE}/api/menu/parse`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoUrl, currency: business.currency || 'MXN' }),
        });

        if (parseRes.ok) {
          const parsed = await parseRes.json();
          if (parsed.items && parsed.items.length > 0) {
            const menuRows = parsed.items.map(item => ({
              business_id: businessId,
              source_photo_id: latestMenu.id,
              menu_category: item.menu_category,
              item_name: item.item_name,
              item_description: item.item_description || '',
              price: item.price,
              currency: item.currency || 'MXN',
            }));

            await fetch(`${supabaseUrl}/rest/v1/business_menus`, {
              method: 'POST',
              headers: { ...supabaseHeaders, 'Prefer': 'return=minimal' },
              body: JSON.stringify(menuRows),
            });

            menus.push(...menuRows);
            console.log(`[WebsitePipeline] Auto-parsed ${menuRows.length} menu items from photo`);
          }
        }
      } catch (err) {
        console.warn('[WebsitePipeline] Menu auto-parse failed:', err.message);
      }
    }
  }

  // Compile business data for prompt
  const businessData = compileBusinessDataForPrompt(business, reviews, photos, socialProfiles, menus, services);

  // Determine language
  const country = business.address_country || '';
  const spanishCountries = ['MX', 'CO', 'AR', 'PE', 'CL', 'EC', 'VE', 'GT', 'CU', 'DO', 'HN', 'SV', 'NI', 'CR', 'PA', 'UY', 'PY', 'BO'];
  const language = spanishCountries.includes(country) ? 'es' : 'es'; // Default to Spanish

  // Build photo inventory
  const photoInventory = buildPhotoInventory(photos, supabaseUrl);

  // Generate research report
  console.log(`[WebsitePipeline] Generating research report for ${business.name}...`);
  const researchReport = await generateResearchReport(businessData, business.name, language);

  // Create generated_websites row
  console.log(`[WebsitePipeline] Creating website record...`);
  const configObj = { researchReport };
  if (autoGenerated) configObj.auto_generated = true;

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
        config: configObj,
      }),
    }
  );
  const insertWebData = await insertWebRes.json();
  if (!insertWebRes.ok || !Array.isArray(insertWebData) || insertWebData.length === 0) {
    console.error('[WebsitePipeline] Failed to create website record:', insertWebData);
    throw new Error('Failed to create website record');
  }
  const websiteId = insertWebData[0].id;

  // Generate AI photos
  console.log(`[WebsitePipeline] Generating AI photos...`);
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

  // Build photo manifest
  const photoManifest = buildPhotoManifest(researchReport.photoAssetPlan || [], photoInventory);

  // Write content
  console.log(`[WebsitePipeline] Writing website content...`);
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

  // Generate HTML
  console.log(`[WebsitePipeline] Generating website HTML...`);
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

  // Save HTML to website record
  console.log(`[WebsitePipeline] Saving HTML...`);
  const saveConfig = { researchReport, websiteContent, draft_html: generateResult.html, html: generateResult.html };
  if (autoGenerated) saveConfig.auto_generated = true;

  const updateWebRes = await fetch(
    `${supabaseUrl}/rest/v1/generated_websites?id=eq.${websiteId}`,
    {
      method: 'PATCH',
      headers: { ...supabaseHeaders, 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        status: 'draft',
        config: saveConfig,
      }),
    }
  );
  if (!updateWebRes.ok) {
    const errText = await updateWebRes.text().catch(() => '');
    console.error('[WebsitePipeline] Failed to save HTML:', errText);
    throw new Error('Failed to save generated HTML');
  }

  // Publish website
  console.log(`[WebsitePipeline] Publishing website...`);
  const publishRes = await fetch(`${API_BASE}/api/websites/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ websiteId, action: 'publish' }),
  });

  let publishedUrl = null;
  if (publishRes.ok) {
    const publishResult = await publishRes.json();
    publishedUrl = publishResult?.website?.published_url;
  } else {
    const errText = await publishRes.text().catch(() => '');
    console.warn(`[WebsitePipeline] Publish failed for ${business.name}:`, errText.substring(0, 200));
  }

  console.log(`[WebsitePipeline] Complete for ${business.name}! Published URL: ${publishedUrl}`);
  return { websiteId, publishedUrl };
}
