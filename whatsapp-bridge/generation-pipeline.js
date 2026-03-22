// Website generation pipeline — runs async after user confirms data
// Orchestrates: research report → AI photos → HTML generation → publish → customer account

const { createClient } = require('@supabase/supabase-js');
const { updateFlow } = require('./db');
const { fetchBusinessDetails, compileBusinessDataForPrompt, buildPhotoInventory } = require('./compile-business-data');

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

    // 2. Compile business data for prompts
    console.log('[Pipeline] Step 2: Compiling business data...');
    const businessData = compileBusinessDataForPrompt(business, reviews, photos, socialProfiles);

    // 3. Generate research report (SSE stream)
    console.log('[Pipeline] Step 3: Generating research report...');
    const researchReport = await generateResearchReport(businessData, business.name, language);

    // 4. Create generated_websites row
    console.log('[Pipeline] Step 4: Creating website record...');
    const websiteId = await createWebsiteRecord(sb, businessId, researchReport);

    // 5. Generate AI photos (from photoAssetPlan)
    console.log('[Pipeline] Step 5: Generating AI photos...');
    const aiPhotos = await generateAIPhotos(researchReport, businessId, sb);

    // 6. Build photo inventory (enriched + AI-generated)
    console.log('[Pipeline] Step 6: Building photo inventory...');
    const photoInventory = buildPhotoInventory(photos);

    // Add AI-generated photos to inventory
    aiPhotos.forEach((photo, i) => {
      photoInventory.push({
        id: `ai_generated_${i}`,
        type: 'ai_generated',
        url: photo.url,
      });
    });

    // 7. Generate website HTML
    console.log('[Pipeline] Step 7: Generating website HTML...');
    const html = await generateWebsiteHtml(businessData, researchReport, photoInventory, business.name, language);

    // 8. Save HTML to website record
    console.log('[Pipeline] Step 8: Saving HTML...');
    await sb
      .from('generated_websites')
      .update({
        config: {
          researchReport,
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
  // Process in batches of 3
  for (let i = 0; i < aiSlots.length; i += 3) {
    const batch = aiSlots.slice(i, i + 3);
    const batchResults = await Promise.allSettled(
      batch.map(async (slot) => {
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
      })
    );

    for (const r of batchResults) {
      if (r.status === 'fulfilled' && r.value?.url) {
        results.push(r.value);
      }
    }
  }

  return results;
}


/**
 * Generate the website HTML.
 */
async function generateWebsiteHtml(businessData, researchReport, photoInventory, name, language) {
  const resp = await fetch(`${API_BASE}/api/ai/generate-website`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessData,
      researchReport,
      photoInventory: photoInventory.map(p => ({ id: p.id, type: p.type, url: p.url })),
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
