// Website generation pipeline — runs async after user confirms data
// Orchestrates: research report → AI photos → HTML generation → publish → customer account

const { createClient } = require('@supabase/supabase-js');
const { updateFlow } = require('./db');
const { fetchBusinessDetails, compileBusinessDataForPrompt, buildPhotoInventory, calculateCompleteness } = require('./compile-business-data');

const API_BASE = process.env.API_BASE_URL || 'https://ahoratengopagina.com';


/**
 * Run the full website generation pipeline.
 * Called fire-and-forget — sends WhatsApp messages directly when done.
 *
 * @param {Object} opts
 * @param {string} opts.flowId — Onboarding flow UUID
 * @param {number} opts.businessId — Business ID
 * @param {string} opts.phone — Canonical phone
 * @param {string} opts.chatId — WhatsApp chat ID (e.g., 5216241234567@c.us)
 * @param {Object|null} opts.client — WhatsApp client for sending messages
 * @param {Object} opts.collected — Collected user info { contactName, email, businessName, ... }
 */
async function runGenerationPipeline({ flowId, businessId, phone, chatId, client, collected }) {
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

  console.log(`[Pipeline] Starting for business ${businessId}, flow ${flowId}`);

  try {
    // 1. Fetch enriched data
    console.log('[Pipeline] Step 1: Fetching enriched data...');
    const { business, reviews, photos, socialProfiles } = await fetchBusinessDetails(businessId);

    // Determine language from address country
    const country = business.address_country || '';
    const language = ['MX', 'CO', 'AR', 'PE', 'CL', 'EC', 'VE', 'GT', 'CU', 'DO', 'HN', 'SV', 'NI', 'CR', 'PA', 'UY', 'PY', 'BO'].includes(country) ? 'es' : 'es'; // Default to Spanish for WhatsApp onboarding

    // 2. Data completeness gate
    console.log('[Pipeline] Step 2: Checking data completeness...');
    const completeness = calculateCompleteness(business, reviews, photos, socialProfiles);
    console.log(`[Pipeline] Data completeness score: ${completeness}`);

    // Persist score
    await sb.from('businesses').update({ data_completeness_score: completeness }).eq('id', businessId);

    if (completeness < 30) {
      const msg = 'Necesitamos más información sobre tu negocio para crear una buena página web. Un asesor te contactará pronto.';
      if (client && chatId) await client.sendMessage(chatId, msg).catch(() => {});
      await updateFlow(flowId, { step: 'needs_data', flow_data: { collected, completeness } });
      return { success: false, reason: 'insufficient_data', completeness };
    }

    if (completeness < 50) {
      console.warn(`[Pipeline] Low data completeness (${completeness}). Website may be thin.`);
    }

    // 3. Compile business data for prompts
    console.log('[Pipeline] Step 3: Compiling business data...');
    const businessData = compileBusinessDataForPrompt(business, reviews, photos, socialProfiles);

    // 4. Generate research report (SSE stream)
    console.log('[Pipeline] Step 4: Generating research report...');
    const researchReport = await generateResearchReport(businessData, business.name, language);

    // 5. Create generated_websites row
    console.log('[Pipeline] Step 5: Creating website record...');
    const websiteId = await createWebsiteRecord(sb, businessId, researchReport);

    // 6. Generate AI photos (from photoAssetPlan)
    console.log('[Pipeline] Step 6: Generating AI photos...');
    const aiPhotos = await generateAIPhotos(researchReport, businessId, sb);

    // 7. Build photo inventory (enriched + AI-generated)
    console.log('[Pipeline] Step 7: Building photo inventory...');
    const photoInventory = buildPhotoInventory(photos);

    // Add AI-generated photos to inventory with section-based IDs
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

    // 8. Build photo manifest (resolve section→URL)
    console.log('[Pipeline] Step 8: Building photo manifest...');
    const photoManifest = buildPhotoManifest(researchReport.photoAssetPlan || [], photoInventory);

    // 9. Write website content (Sonnet)
    console.log('[Pipeline] Step 9: Writing website content...');
    const websiteContent = await writeWebsiteContent(businessData, researchReport, photoManifest, language);

    // 10. Generate website HTML (Haiku — layout only)
    console.log('[Pipeline] Step 10: Generating website HTML...');
    let html = await generateWebsiteHtml(websiteContent, researchReport.designPalette, photoManifest, business.name, language);

    // 11. Validate HTML
    console.log('[Pipeline] Step 11: Validating HTML...');
    const validation = validateHtml(html, websiteContent, photoManifest, researchReport.designPalette);
    if (!validation.valid) {
      console.warn(`[Pipeline] HTML validation issues: ${validation.issues.join(', ')} (${validation.sizeKb.toFixed(1)}KB)`);
      // Retry once
      console.log('[Pipeline] Retrying HTML generation...');
      html = await generateWebsiteHtml(websiteContent, researchReport.designPalette, photoManifest, business.name, language);
      const retryValidation = validateHtml(html, websiteContent, photoManifest, researchReport.designPalette);
      if (!retryValidation.valid) {
        console.warn(`[Pipeline] Retry also failed validation: ${retryValidation.issues.join(', ')}`);
        // Save as draft, don't auto-publish
        await sb.from('generated_websites').update({
          status: 'draft',
          config: { researchReport, websiteContent, draft_html: html, html, validationIssues: retryValidation.issues },
        }).eq('id', websiteId);
        console.warn('[Pipeline] Saved as draft for operator review due to validation failures');
      }
    }

    // 12. Save HTML to website record
    console.log('[Pipeline] Step 12: Saving HTML...');
    await sb
      .from('generated_websites')
      .update({
        config: {
          researchReport,
          websiteContent,
          draft_html: html,
          html,
        },
      })
      .eq('id', websiteId);

    // 9. Publish website
    console.log('[Pipeline] Step 9: Publishing website...');
    const publishResult = await publishWebsite(websiteId);
    const publishedUrl = publishResult?.website?.published_url;

    // 10. Update flow with website ID
    await updateFlow(flowId, {
      website_id: websiteId,
      flow_data: {
        collected,
        websiteId,
        publishedUrl,
      },
    });

    // 11. Create customer account (free signup)
    console.log('[Pipeline] Step 10: Creating customer account...');
    await createCustomerAccount(businessId, collected);

    // 12. Mark flow complete
    await updateFlow(flowId, { step: 'complete' });

    // 13. Send completion message via WhatsApp
    console.log(`[Pipeline] Complete! Published URL: ${publishedUrl}`);
    const completionMsg = buildCompletionMessage(publishedUrl, business.name);

    if (client && chatId) {
      try {
        await client.sendMessage(chatId, completionMsg);
        console.log(`[Pipeline] Sent completion message to ${chatId}`);
      } catch (sendErr) {
        console.error('[Pipeline] Failed to send completion message:', sendErr);
      }
    }

    return { success: true, publishedUrl, websiteId };
  } catch (err) {
    console.error(`[Pipeline] Failed for business ${businessId}:`, err);

    await updateFlow(flowId, {
      step: 'error',
      flow_data: { collected, lastError: err.message },
    });

    // Try to notify user of failure
    if (client && chatId) {
      try {
        await client.sendMessage(chatId, 'Lo sentimos, hubo un problema creando tu página web. Un asesor se comunicará contigo pronto para resolverlo. 🙏');
      } catch {
        // Ignore send failure
      }
    }

    throw err;
  }
}


// ── Pipeline step implementations ──

/**
 * Call /api/ai/research-report and parse the SSE stream.
 */
async function generateResearchReport(businessData, name, language) {
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
    // (handles truncated responses where the JSON got cut off)
    console.warn('Research report JSON parse failed, attempting recovery:', firstErr.message);

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
        console.error('Research report JSON recovery also failed:', secondErr.message);
        throw secondErr;
      }
    }

    throw firstErr;
  }
}


/**
 * Create a generated_websites row.
 */
async function createWebsiteRecord(sb, businessId, researchReport) {
  const { data, error } = await sb
    .from('generated_websites')
    .insert({
      business_id: businessId,
      template_name: 'ai_generated',
      status: 'draft',
      version: 1,
      config: { researchReport },
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to create website record: ${error.message}`);
  return data.id;
}


/**
 * Generate AI photos based on the photoAssetPlan.
 * Runs up to 3 in parallel.
 */
async function generateAIPhotos(researchReport, businessId, sb) {
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
      console.warn(`[Pipeline] AI photo generation failed for ${slot.section}:`, resp.status);
      return null;
    }

    const result = await resp.json();

    // Save to business_photos
    if (result.url) {
      await sb.from('business_photos').insert({
        business_id: businessId,
        source: 'ai_generated',
        photo_type: 'ai_generated',
        url: result.url,
        caption: slot.slot,
      }).catch(err => console.warn('[Pipeline] Failed to save AI photo:', err.message));
    }

    return result;
  }

  // Process in batches of 3
  for (let i = 0; i < aiSlots.length; i += 3) {
    const batch = aiSlots.slice(i, i + 3);
    const batchResults = await Promise.allSettled(
      batch.map(slot => generateOnePhoto(slot))
    );

    // Collect successes and failures
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
      console.log(`[Pipeline] Retrying ${failedSlots.length} failed photo(s)...`);
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

  console.log(`[Pipeline] AI photos: ${results.length}/${aiSlots.length} generated successfully`);
  if (results.length < aiSlots.length) {
    const missing = aiSlots
      .filter(slot => !results.some(r => r.section === slot.section && r.slot === slot.slot))
      .map(s => s.section);
    console.warn(`[Pipeline] Missing photo sections: ${missing.join(', ')}`);
  }

  return results;
}


/**
 * Build a photo manifest that resolves the research report's photo asset plan
 * to concrete URLs from the photo inventory.
 */
function buildPhotoManifest(photoAssetPlan, photoInventory) {
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
 * Write website content via the Sonnet content writing API.
 */
async function writeWebsiteContent(businessData, researchReport, photoManifest, language) {
  const resp = await fetch(`${API_BASE}/api/ai/write-content`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ researchReport, businessData, photoManifest, language }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Content writing API failed (${resp.status}): ${text.substring(0, 200)}`);
  }

  const content = await resp.json();
  if (!content.hero && !content.about) {
    throw new Error('Content writing returned incomplete content');
  }

  return content;
}


/**
 * Generate the website HTML (Haiku assembles pre-written content into HTML/CSS).
 */
async function generateWebsiteHtml(websiteContent, designPalette, photoManifest, name, language) {
  const resp = await fetch(`${API_BASE}/api/ai/generate-website`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      websiteContent,
      designPalette,
      photoManifest: (photoManifest || []).map(p => ({ section: p.section, slot: p.slot, url: p.url })),
      name,
      language,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Website generation API failed (${resp.status}): ${text.substring(0, 200)}`);
  }

  const result = await resp.json();
  if (!result.html) throw new Error('Website generation returned no HTML');

  return result.html;
}


/**
 * Validate generated HTML for structural correctness and content presence.
 */
function validateHtml(html, websiteContent, photoManifest, designPalette) {
  const issues = [];

  // Structure
  if (!html.includes('<!DOCTYPE html>')) issues.push('missing_doctype');
  if (!html.includes('</html>')) issues.push('unclosed_html');
  if (!html.includes('<head>') || !html.includes('</head>')) issues.push('missing_head');
  if (!html.includes('<body>') || !html.includes('</body>')) issues.push('missing_body');

  // Content presence
  if (websiteContent?.hero?.headline && !html.includes(websiteContent.hero.headline.substring(0, 30))) {
    issues.push('missing_headline');
  }

  // Photo usage (at least 3 manifest URLs embedded)
  const embeddedPhotos = (photoManifest || []).filter(p => html.includes(p.url));
  if (embeddedPhotos.length < 3 && (photoManifest || []).length >= 3) issues.push('too_few_photos');

  // Design palette (primary color should appear in CSS)
  if (designPalette?.primaryColor && !html.toLowerCase().includes(designPalette.primaryColor.toLowerCase())) {
    issues.push('missing_primary_color');
  }

  // Size
  const sizeKb = Buffer.byteLength(html, 'utf8') / 1024;
  if (sizeKb < 5) issues.push('too_small');
  if (sizeKb > 25) issues.push('too_large');

  return { valid: issues.length === 0, issues, sizeKb };
}


/**
 * Publish the website.
 */
async function publishWebsite(websiteId) {
  const resp = await fetch(`${API_BASE}/api/websites/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ websiteId, action: 'publish' }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Publish API failed (${resp.status}): ${text.substring(0, 200)}`);
  }

  return await resp.json();
}


/**
 * Create a free customer account via the existing endpoint.
 */
async function createCustomerAccount(businessId, collected) {
  try {
    const resp = await fetch(`${API_BASE}/api/free-signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessId,
        customerEmail: collected.email,
        customerName: collected.contactName,
        customerPhone: collected.phone || null,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      // 409 = customer already exists, which is fine
      if (resp.status === 409) {
        console.log('[Pipeline] Customer already exists, skipping signup');
        return;
      }
      console.warn(`[Pipeline] Free signup returned ${resp.status}: ${text.substring(0, 200)}`);
    }
  } catch (err) {
    // Non-blocking — don't fail the pipeline for account creation
    console.error('[Pipeline] Customer account creation failed:', err);
  }
}


/**
 * Build the completion message with published URL and portal link.
 */
function buildCompletionMessage(publishedUrl, businessName) {
  let msg = `🎉 ¡Tu página web está lista!\n\n`;
  msg += `*${businessName}*\n`;
  if (publishedUrl) msg += `🌐 ${publishedUrl}\n`;
  msg += `\n📱 Administra tu página en: ahoratengopagina.com/mipagina\n`;
  msg += `\nTe enviamos un correo con los datos de acceso a tu portal. Si necesitas hacer cambios en tu página, escríbenos aquí o desde el portal. 😊`;
  return msg;
}


module.exports = { runGenerationPipeline };
