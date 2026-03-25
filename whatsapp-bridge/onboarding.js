// WhatsApp self-service onboarding flow — state machine with Claude extraction
// Guides unknown contacts through: collect info → search → verify → enrich → confirm → generate → complete

const Anthropic = require('@anthropic-ai/sdk');
const { findActiveFlow, createFlow, updateFlow, getFlow } = require('./db');

const API_BASE = process.env.API_BASE_URL || 'https://ahoratengopagina.com';

let anthropic = null;
function getAnthropic() {
  if (!anthropic) anthropic = new Anthropic();
  return anthropic;
}


// ── Public API ──

/**
 * Check if a phone number has an active onboarding flow.
 *
 * @param {string} phone — Canonical phone (e.g., +526241234567)
 * @returns {{ active: boolean, flowId?: string, step?: string }}
 */
async function checkOnboardingFlow(phone) {
  const flow = await findActiveFlow(phone);
  if (!flow) return { active: false };
  return { active: true, flowId: flow.id, step: flow.step };
}


/**
 * Start a new onboarding flow.
 *
 * @param {string} conversationId — Existing conversation UUID
 * @param {string} phone — Canonical phone
 * @param {string} chatId — WhatsApp chat ID for sending messages later
 * @param {Object} [preCollected={}] — Data already collected from pre-flow conversation
 * @returns {string|null} Welcome message to send, or null on failure
 */
async function startOnboardingFlow(conversationId, phone, chatId, preCollected = {}) {
  // If we have a businessId, fetch email from the DB so we don't re-ask
  if (preCollected.businessId && !preCollected.email) {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
      const { data: biz } = await sb
        .from('businesses')
        .select('contact_email')
        .eq('id', preCollected.businessId)
        .single();
      if (biz?.contact_email) {
        preCollected.email = biz.contact_email;
      }
    } catch (err) {
      console.warn('Failed to fetch email from business:', err.message);
    }
  }

  const flowId = await createFlow({
    conversationId,
    phone,
    chatId,
    initialData: { collected: preCollected },
  });

  if (!flowId) return null;

  // If we already have a businessId, link it to the flow immediately
  if (preCollected.businessId) {
    await updateFlow(flowId, { business_id: preCollected.businessId });
  }

  // Figure out what we still need
  const missing = getMissingFields(preCollected);

  if (missing.length === 0) {
    const flow = await getFlow(flowId);

    // If we already have a businessId, skip search/verify — go straight to enrich
    if (preCollected.businessId) {
      flow.flow_data.businessId = preCollected.businessId;
      await updateFlow(flowId, { step: 'enrich', flow_data: flow.flow_data });
      return await handleEnrich(flowId, flow.flow_data);
    }

    // Otherwise search Google Places
    await updateFlow(flowId, { step: 'search_business', flow_data: flow.flow_data });
    return await handleSearchBusiness(flowId, flow.flow_data);
  }

  // Ask for missing fields
  return buildCollectInfoPrompt(missing, preCollected);
}


/**
 * Handle an inbound message for an active onboarding flow.
 *
 * @param {string} flowId — Flow UUID
 * @param {string} message — User's message text
 * @param {string} conversationId — For context
 * @param {string} phone — Canonical phone
 * @param {Object} [extras={}] — Extra context (e.g., { client } for sending async messages)
 * @returns {string|null} Reply to send, or null if handled asynchronously
 */
async function handleOnboardingMessage(flowId, message, conversationId, phone, extras = {}) {
  const flow = await getFlow(flowId);
  if (!flow) return 'Lo siento, hubo un problema. Un asesor te contactará pronto.';

  // Update activity timestamp
  await updateFlow(flowId, { flow_data: flow.flow_data });

  try {
    switch (flow.step) {
      case 'collect_info':
        return await handleCollectInfo(flowId, flow, message);

      case 'search_business':
        // User shouldn't message during auto search, but handle gracefully
        return '🔍 Estamos buscando tu negocio, un momento por favor...';

      case 'collect_social':
        return await handleCollectSocial(flowId, flow, message);

      case 'verify_business':
        return await handleVerifyBusiness(flowId, flow, message);

      case 'enrich':
        return '⏳ Estamos recopilando información de tu negocio, un momento...';

      case 'confirm_data':
        return await handleConfirmData(flowId, flow, message, extras);

      case 'generate':
        return '⏳ Tu página web se está generando. Te avisaremos cuando esté lista (~5 minutos).';

      case 'complete':
        return '✅ Tu página web ya está lista. ¿Necesitas algo más?';

      default:
        return 'Lo siento, hubo un problema. Un asesor te contactará pronto.';
    }
  } catch (err) {
    console.error(`Onboarding step "${flow.step}" error for flow ${flowId}:`, err);

    const retryCount = (flow.flow_data?.retryCount || 0) + 1;
    if (retryCount >= 3) {
      await updateFlow(flowId, {
        step: 'error',
        flow_data: { ...flow.flow_data, retryCount, lastError: err.message },
      });
      return 'Hubo un problema técnico. Un asesor se comunicará contigo pronto para ayudarte. 🙏';
    }

    await updateFlow(flowId, {
      flow_data: { ...flow.flow_data, retryCount },
    });
    return 'Disculpa, no pude procesar eso. ¿Podrías intentar de nuevo?';
  }
}


// ── Step handlers ──

/**
 * COLLECT_INFO: Extract contact/business fields progressively from user messages.
 */
async function handleCollectInfo(flowId, flow, message) {
  const collected = flow.flow_data?.collected || {};

  // Use Claude to extract structured data from free-form message
  const extracted = await extractInfoWithClaude(message, collected);

  // Merge extracted fields into collected
  const updated = { ...collected };
  if (extracted.contactName) updated.contactName = extracted.contactName;
  if (extracted.email) updated.email = extracted.email;
  if (extracted.businessName) updated.businessName = extracted.businessName;
  if (extracted.businessCity) updated.businessCity = extracted.businessCity;
  if (extracted.businessAddress) updated.businessAddress = extracted.businessAddress;

  const flowData = { ...flow.flow_data, collected: updated, retryCount: 0 };

  // Check what's still missing
  const missing = getMissingFields(updated);

  if (missing.length === 0) {
    // If we already have a businessId from context, skip search/verify → enrich
    if (flow.business_id || flowData.collected?.businessId) {
      flowData.businessId = flow.business_id || flowData.collected.businessId;
      await updateFlow(flowId, { step: 'enrich', flow_data: flowData });
      return await handleEnrich(flowId, flowData);
    }

    // Otherwise search Google Places
    await updateFlow(flowId, { step: 'search_business', flow_data: flowData });
    return await handleSearchBusiness(flowId, flowData);
  }

  // Still need more info — save progress and ask
  await updateFlow(flowId, { flow_data: flowData });
  return extracted.reply || buildCollectInfoPrompt(missing, updated);
}


/**
 * SEARCH_BUSINESS: Search Google Places for the business.
 * This is called automatically (not triggered by user message).
 */
async function handleSearchBusiness(flowId, flowData) {
  const collected = flowData.collected || {};
  const query = `${collected.businessName} ${collected.businessCity || collected.businessAddress || ''}`.trim();

  try {
    // Use place-lookup with a Google Maps search URL
    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    const resp = await fetch(
      `${API_BASE}/api/search/place-lookup?url=${encodeURIComponent(searchUrl)}`
    );

    if (!resp.ok) {
      throw new Error(`Place lookup failed: ${resp.status}`);
    }

    const result = await resp.json();

    if (!result || !result.name) {
      // No results — ask user to refine
      flowData.retryCount = (flowData.retryCount || 0) + 1;

      if (flowData.retryCount >= 3) {
        await updateFlow(flowId, {
          step: 'collect_social',
          flow_data: { ...flowData, retryCount: 0 },
        });
        return `No pudimos encontrar "${collected.businessName}" en Google Maps. 🤔\n\n` +
          `¿Tu negocio tiene página de *Facebook* o *Instagram*? ` +
          `Compártenos el link o el nombre de usuario para usar esa información. 📱\n\n` +
          `Si no tienes redes sociales, responde *NO TENGO* y crearemos tu página con la información básica.`;
      }

      await updateFlow(flowId, { step: 'collect_info', flow_data: flowData });
      return `No encontramos "${collected.businessName}" en Google Maps. ¿Podrías verificar el nombre exacto y la dirección completa de tu negocio?`;
    }

    // Store search result
    const place = {
      placeId: result.placeId,
      dataId: result.dataId,
      name: result.name,
      address: result.address,
      rating: result.rating,
      reviewCount: result.reviewCount,
      mapsUrl: result.mapsUrl,
    };

    flowData.searchResults = [place];
    flowData.selectedPlace = place;
    flowData.retryCount = 0;

    await updateFlow(flowId, { step: 'verify_business', flow_data: flowData });

    // Format verification message
    let msg = `🔍 Encontramos tu negocio:\n\n`;
    msg += `*${place.name}*\n`;
    if (place.address) msg += `📍 ${place.address}\n`;
    if (place.rating) msg += `⭐ ${place.rating}`;
    if (place.reviewCount) msg += ` (${place.reviewCount} reseñas)`;
    if (place.rating || place.reviewCount) msg += '\n';
    if (place.mapsUrl) msg += `\n📌 Ver en Google Maps: ${place.mapsUrl}\n`;
    msg += `\n¿Es este tu negocio? Responde *SI* o *NO*`;

    return msg;
  } catch (err) {
    console.error('Search business error:', err);
    flowData.retryCount = (flowData.retryCount || 0) + 1;

    if (flowData.retryCount >= 2) {
      await updateFlow(flowId, {
        step: 'collect_social',
        flow_data: { ...flowData, retryCount: 0 },
      });
      return `No pudimos buscar tu negocio en Google Maps en este momento. 🤔\n\n` +
        `¿Tu negocio tiene página de *Facebook* o *Instagram*? ` +
        `Compártenos el link o el nombre de usuario para usar esa información. 📱\n\n` +
        `Si no tienes redes sociales, responde *NO TENGO* y crearemos tu página con la información básica.`;
    }

    await updateFlow(flowId, { step: 'collect_info', flow_data: flowData });
    return `No pudimos buscar tu negocio en este momento. ¿Podrías darme el nombre exacto y la ciudad?`;
  }
}


/**
 * VERIFY_BUSINESS: User confirms or denies the Google Places match.
 */
async function handleVerifyBusiness(flowId, flow, message) {
  const answer = interpretYesNo(message);

  if (answer === 'yes') {
    // Confirmed — move to enrichment
    const flowData = { ...flow.flow_data, retryCount: 0 };
    await updateFlow(flowId, { step: 'enrich', flow_data: flowData });
    return await handleEnrich(flowId, flowData);
  }

  if (answer === 'no') {
    // Wrong business — go back to collect more info
    const flowData = { ...flow.flow_data, retryCount: 0, searchResults: [], selectedPlace: null };
    await updateFlow(flowId, { step: 'collect_info', flow_data: flowData });
    return 'Entendido, ese no es tu negocio. ¿Podrías darme el nombre exacto y la dirección completa para buscarlo de nuevo?';
  }

  // Unclear response
  return 'No entendí tu respuesta. ¿Es este tu negocio? Responde *SI* o *NO*.';
}


/**
 * ENRICH: Save business to DB and trigger enrichment.
 * Auto-advances to confirm_data.
 */
async function handleEnrich(flowId, flowData) {
  const place = flowData.selectedPlace;
  const collected = flowData.collected || {};
  let businessId = flowData.businessId || null;

  try {
    const { createClient } = require('@supabase/supabase-js');
    const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

    if (businessId) {
      // Business already known (matched from DB before onboarding started)
      // Just update contact info
      const updates = {};
      if (collected.contactName) updates.contact_name = collected.contactName;
      if (collected.email) updates.contact_email = collected.email;
      if (flowData.chatId) updates.contact_whatsapp = flowData.chatId.replace(/@c\.us$/, '');

      if (Object.keys(updates).length > 0) {
        await sb.from('businesses').update(updates).eq('id', businessId);
      }
    } else if (place && place.placeId) {
      // Business found via Google Places search — match or create
      const { data: existing } = await sb
        .from('businesses')
        .select('id')
        .eq('place_id', place.placeId)
        .limit(1)
        .single();

      if (existing) {
        businessId = existing.id;
        const updates = {};
        if (collected.contactName) updates.contact_name = collected.contactName;
        if (collected.email) updates.contact_email = collected.email;
        if (flowData.chatId) updates.contact_whatsapp = flowData.chatId.replace(/@c\.us$/, '');

        if (Object.keys(updates).length > 0) {
          await sb.from('businesses').update(updates).eq('id', businessId);
        }
      } else {
        // Create new business
        const insertData = {
          name: place.name,
          place_id: place.placeId,
          address_full: place.address,
          rating: place.rating,
          review_count: place.reviewCount,
          maps_url: place.mapsUrl,
          pipeline_status: 'prospect',
        };

        if (collected.contactName) insertData.contact_name = collected.contactName;
        if (collected.email) insertData.contact_email = collected.email;
        if (flowData.chatId) insertData.contact_whatsapp = flowData.chatId.replace(/@c\.us$/, '');

        if (place.address) {
          const parts = place.address.split(',').map(p => p.trim());
          if (parts.length >= 2) {
            insertData.address_city = parts[parts.length - 2];
          }
        }

        const { data: newBiz, error } = await sb
          .from('businesses')
          .insert(insertData)
          .select('id')
          .single();

        if (error) throw new Error(`Failed to create business: ${error.message}`);
        businessId = newBiz.id;
      }
    } else if (flowData.isFromSocial) {
      // Business found via social media (no Google Places listing)
      const crypto = require('crypto');
      const syntheticPlaceId = 'whatsapp-' + crypto.randomUUID();
      const socialPlace = flowData.selectedPlace || {};
      const fbData = flowData.socialScrapeResults?.facebook;
      const igData = flowData.socialScrapeResults?.instagram;

      const insertData = {
        name: socialPlace.name || collected.businessName,
        place_id: syntheticPlaceId,
        address_full: socialPlace.address || null,
        phone: socialPlace.phone || null,
        rating: socialPlace.rating || null,
        review_count: socialPlace.reviewCount || 0,
        pipeline_status: 'prospect',
        address_city: collected.businessCity || null,
      };

      if (collected.contactName) insertData.contact_name = collected.contactName;
      if (collected.email) insertData.contact_email = collected.email;
      if (flowData.chatId) insertData.contact_whatsapp = flowData.chatId.replace(/@c\.us$/, '');

      // Use description from Facebook about or Instagram bio
      if (fbData?.name) insertData.name = fbData.name;
      if (fbData?.address) insertData.address_full = fbData.address;
      if (fbData?.phone) insertData.phone = fbData.phone;

      const { data: newBiz, error } = await sb
        .from('businesses')
        .insert(insertData)
        .select('id')
        .single();

      if (error) throw new Error(`Failed to create business: ${error.message}`);
      businessId = newBiz.id;

      // Save social profiles and scraped data
      await saveSocialProfiles(sb, businessId, flowData);
      await saveSocialEnrichmentData(sb, businessId, flowData);
    } else {
      await updateFlow(flowId, { step: 'error', flow_data: flowData });
      return 'Hubo un problema al procesar tu negocio. Un asesor te contactará pronto.';
    }

    // Link business to flow
    flowData.businessId = businessId;
    await updateFlow(flowId, { business_id: businessId, flow_data: flowData });

    if (!flowData.isFromSocial) {
      // Trigger Google enrichment for normal flow
      const enrichResp = await fetch(`${API_BASE}/api/enrich/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId }),
      });

      if (!enrichResp.ok) {
        console.warn(`Enrichment trigger returned ${enrichResp.status} — proceeding anyway`);
      } else {
        const enrichResult = await enrichResp.json();
        if (enrichResult.dataId) {
          if (flowData.selectedPlace) {
            flowData.selectedPlace.dataId = enrichResult.dataId;
          }
          flowData.dataId = enrichResult.dataId;
          await updateFlow(flowId, { flow_data: flowData });
        }
      }

      // Wait briefly for enrichment to populate, then fetch summary
      await new Promise(resolve => setTimeout(resolve, 3000));
    } else {
      console.log(`[Onboarding] Skipping Google enrichment for social-only business ${businessId}`);
    }

    return await buildConfirmDataMessage(flowId, flowData, businessId);
  } catch (err) {
    console.error('Enrich step error:', err);
    // Proceed anyway — we can still generate with limited data
    flowData.enrichmentSummary = { photoCount: 0, reviewCount: 0, topReviews: [] };
    await updateFlow(flowId, { step: 'confirm_data', flow_data: flowData });
    return `Recopilamos la información disponible de tu negocio. ¿Procedemos a crear tu página web? Responde *SI* o *NO*.`;
  }
}


/**
 * Build the confirm_data message with enriched data summary.
 */
async function buildConfirmDataMessage(flowId, flowData, businessId) {
  const { createClient } = require('@supabase/supabase-js');
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

  // Fetch enriched reviews
  const { data: reviews } = await sb
    .from('business_reviews')
    .select('review_text, text, rating, author_name, source')
    .eq('business_id', businessId)
    .order('sentiment_score', { ascending: false, nullsFirst: false })
    .limit(10);

  // Fetch photo count
  const { data: photos } = await sb
    .from('business_photos')
    .select('id')
    .eq('business_id', businessId);

  const photoCount = photos?.length || 0;
  const reviewCount = reviews?.length || 0;
  const topReviews = (reviews || []).slice(0, 2).map(r => ({
    text: (r.review_text || r.text || '').substring(0, 120),
    author: r.author_name || 'Anónimo',
  }));

  flowData.enrichmentSummary = { photoCount, reviewCount, topReviews };
  await updateFlow(flowId, { step: 'confirm_data', flow_data: flowData });

  let msg = '📊 Esta es la información que encontramos:\n\n';
  if (photoCount > 0) msg += `📸 ${photoCount} fotos encontradas\n`;
  if (reviewCount > 0) msg += `⭐ ${reviewCount} reseñas\n`;

  if (topReviews.length > 0) {
    msg += '\nMejores reseñas:\n';
    topReviews.forEach(r => {
      msg += `💬 "${r.text}..." - ${r.author}\n`;
    });
  }

  if (photoCount === 0 && reviewCount === 0) {
    msg += 'No encontramos fotos ni reseñas, pero podemos crear una página profesional con la información básica y fotos generadas por IA.\n';
  }

  msg += '\n¿Usamos esta información para crear tu página web? Responde *SI* o *NO*';
  return msg;
}


/**
 * CONFIRM_DATA: User confirms enriched data to proceed with generation.
 */
async function handleConfirmData(flowId, flow, message, extras) {
  const answer = interpretYesNo(message);

  if (answer === 'yes') {
    const flowData = { ...flow.flow_data, retryCount: 0 };
    await updateFlow(flowId, { step: 'generate', flow_data: flowData });

    // Kick off generation pipeline asynchronously
    const { runGenerationPipeline } = require('./generation-pipeline');
    const businessId = flow.business_id || flowData.businessId;
    const chatId = flowData.chatId;
    const phone = flow.phone;

    // Fire-and-forget — pipeline will send completion message directly
    runGenerationPipeline({
      flowId,
      businessId,
      phone,
      chatId,
      client: extras.client || null,
      collected: flowData.collected || {},
    }).catch(err => {
      console.error('Generation pipeline failed:', err);
      updateFlow(flowId, {
        step: 'error',
        flow_data: { ...flowData, lastError: err.message },
      });
    });

    return '🚀 ¡Excelente! Estamos creando tu página web profesional.\n\nEsto toma aproximadamente 5 minutos. Te enviaremos un mensaje cuando esté lista. ⏳';
  }

  if (answer === 'no') {
    // Go back to search
    const flowData = {
      ...flow.flow_data,
      retryCount: 0,
      searchResults: [],
      selectedPlace: null,
      enrichmentSummary: null,
    };
    await updateFlow(flowId, { step: 'collect_info', flow_data: flowData });
    return 'Entendido. ¿Podrías darme el nombre correcto de tu negocio para buscar de nuevo?';
  }

  return 'No entendí tu respuesta. ¿Creamos tu página web con esta información? Responde *SI* o *NO*.';
}


// ── Social media fallback step ──

/**
 * COLLECT_SOCIAL: Ask for Facebook/Instagram when Google search fails.
 */
async function handleCollectSocial(flowId, flow, message) {
  const flowData = flow.flow_data || {};
  const collected = flowData.collected || {};
  const normalized = (message || '').toLowerCase().trim();

  // Check if user says they have no social media
  if (/no tengo|no tiene|sin redes|ninguna|nada/.test(normalized)) {
    // Proceed with minimal data — just name + city
    flowData.isFromSocial = true;
    flowData.selectedPlace = {
      name: collected.businessName,
      address: collected.businessCity || collected.businessAddress || null,
    };
    flowData.socialScrapeResults = {};

    await updateFlow(flowId, { step: 'verify_business', flow_data: flowData });

    let msg = `📋 Crearemos tu página con la información básica:\n\n`;
    msg += `*${collected.businessName}*\n`;
    if (collected.businessCity) msg += `📍 ${collected.businessCity}\n`;
    msg += `\n¿Es correcto? Responde *SI* o *NO*`;
    return msg;
  }

  // Try to extract social URLs from the message
  const extracted = await extractSocialUrlsWithClaude(message);

  if (!extracted.facebookUrl && !extracted.instagramUrl) {
    flowData.retryCount = (flowData.retryCount || 0) + 1;

    if (flowData.retryCount >= 3) {
      // Give up on social — offer to proceed with minimal data
      flowData.isFromSocial = true;
      flowData.selectedPlace = {
        name: collected.businessName,
        address: collected.businessCity || collected.businessAddress || null,
      };
      flowData.socialScrapeResults = {};
      await updateFlow(flowId, { step: 'verify_business', flow_data: flowData });

      return `No pudimos identificar un perfil de redes sociales. No te preocupes, crearemos tu página con la información básica. 👍\n\n` +
        `*${collected.businessName}*` +
        (collected.businessCity ? `\n📍 ${collected.businessCity}` : '') +
        `\n\n¿Procedemos? Responde *SI* o *NO*`;
    }

    await updateFlow(flowId, { flow_data: flowData });
    return extracted.reply || 'No pude identificar un link de Facebook o Instagram. ¿Podrías enviar el link directo o el nombre de usuario? Por ejemplo: *facebook.com/tunegocio* o *@tunegocio*';
  }

  // Scrape the social profiles
  const scrapeResults = await scrapeSocialProfiles(extracted.facebookUrl, extracted.instagramUrl);

  if (!scrapeResults.facebook && !scrapeResults.instagram) {
    flowData.retryCount = (flowData.retryCount || 0) + 1;
    await updateFlow(flowId, { flow_data: flowData });
    return 'No pudimos acceder a ese perfil. ¿Podrías verificar el link o nombre de usuario? También puedes enviar otro perfil o responder *NO TENGO* para continuar sin redes sociales.';
  }

  // Build a selectedPlace-compatible object from social data
  const fb = scrapeResults.facebook;
  const ig = scrapeResults.instagram;

  const socialPlace = {
    name: fb?.name || ig?.name || collected.businessName,
    address: fb?.address || collected.businessCity || null,
    phone: fb?.phone || null,
    rating: fb?.rating || null,
    reviewCount: fb?.reviewsCount || 0,
  };

  flowData.isFromSocial = true;
  flowData.selectedPlace = socialPlace;
  flowData.socialScrapeResults = scrapeResults;
  flowData.retryCount = 0;

  await updateFlow(flowId, { step: 'verify_business', flow_data: flowData });

  // Build verification message with social data
  let msg = `📱 Encontramos tu negocio en redes sociales:\n\n`;
  msg += `*${socialPlace.name}*\n`;
  if (socialPlace.address) msg += `📍 ${socialPlace.address}\n`;
  if (fb?.followers) msg += `👥 ${fb.followers.toLocaleString()} seguidores en Facebook\n`;
  if (ig?.followerCount) msg += `📸 ${ig.followerCount.toLocaleString()} seguidores en Instagram\n`;
  if (socialPlace.rating) msg += `⭐ ${socialPlace.rating} en Facebook\n`;
  if (fb?.link) msg += `\n🔗 Facebook: ${fb.link}\n`;
  if (ig?.username) msg += `📷 Instagram: @${ig.username}\n`;
  msg += `\n¿Es este tu negocio? Responde *SI* o *NO*`;

  return msg;
}


/**
 * Use Claude to extract Facebook/Instagram URLs or usernames from free-form Spanish text.
 */
async function extractSocialUrlsWithClaude(message) {
  const ai = getAnthropic();

  const prompt = `Eres un asistente que extrae links de redes sociales de mensajes de WhatsApp en español.

Del siguiente mensaje, extrae URLs o nombres de usuario de Facebook e Instagram. Responde SOLO con un JSON válido:

{
  "facebookUrl": "URL completa o username de Facebook (null si no hay)",
  "instagramUrl": "URL completa o username de Instagram (null si no hay)",
  "reply": "respuesta amigable si no encuentras ningún link/username (null si encontraste algo)"
}

REGLAS:
- Acepta URLs completas (facebook.com/negocio), URLs cortas (fb.com/negocio), @usernames, o nombres de páginas
- Si el usuario dice algo como "mi facebook es instinto gym", extrae "instinto gym" como facebookUrl
- Si el usuario dice "@instintogym en instagram", extrae "instintogym" como instagramUrl
- Si no encuentras nada, el reply debe pedir el link de forma amable

MENSAJE DEL USUARIO: "${message}"`;

  try {
    const response = await ai.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content.find(b => b.type === 'text')?.text || '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { facebookUrl: null, instagramUrl: null, reply: 'No pude identificar un perfil. ¿Podrías enviar el link directo?' };

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      facebookUrl: parsed.facebookUrl || null,
      instagramUrl: parsed.instagramUrl || null,
      reply: parsed.reply || null,
    };
  } catch (err) {
    console.error('Claude social extraction error:', err);
    return { facebookUrl: null, instagramUrl: null, reply: '¿Podrías enviar el link de tu Facebook o Instagram?' };
  }
}


/**
 * Extract a username from a social media URL or raw input.
 */
function extractUsername(input) {
  if (!input) return null;
  let cleaned = input.trim();
  // Strip protocol and www
  cleaned = cleaned.replace(/^https?:\/\//, '').replace(/^www\./, '');
  // Strip known domain prefixes
  cleaned = cleaned.replace(/^(facebook\.com|fb\.com|instagram\.com|instagr\.am)\/?/, '');
  // Strip trailing slashes and query params
  cleaned = cleaned.replace(/[?#].*$/, '').replace(/\/+$/, '');
  // Strip @ prefix
  cleaned = cleaned.replace(/^@/, '');
  // If it looks like a path with segments, take the first
  if (cleaned.includes('/')) cleaned = cleaned.split('/')[0];
  return cleaned || null;
}


/**
 * Scrape Facebook and/or Instagram profiles using existing API endpoints.
 */
async function scrapeSocialProfiles(facebookUrl, instagramUrl) {
  const results = { facebook: null, instagram: null };

  const fbUsername = extractUsername(facebookUrl);
  const igUsername = extractUsername(instagramUrl);

  const fetches = [];

  if (fbUsername) {
    fetches.push(
      fetch(`${API_BASE}/api/enrich/facebook?username=${encodeURIComponent(fbUsername)}`)
        .then(async r => {
          if (r.ok) {
            results.facebook = await r.json();
          } else {
            console.warn(`Facebook scrape failed for "${fbUsername}": ${r.status}`);
          }
        })
        .catch(err => console.error('Facebook scrape error:', err))
    );
  }

  if (igUsername) {
    fetches.push(
      fetch(`${API_BASE}/api/enrich/instagram?username=${encodeURIComponent(igUsername)}`)
        .then(async r => {
          if (r.ok) {
            results.instagram = await r.json();
          } else {
            console.warn(`Instagram scrape failed for "${igUsername}": ${r.status}`);
          }
        })
        .catch(err => console.error('Instagram scrape error:', err))
    );
  }

  await Promise.all(fetches);
  return results;
}


/**
 * Save social profile links to business_social_profiles table.
 */
async function saveSocialProfiles(sb, businessId, flowData) {
  const scrape = flowData.socialScrapeResults || {};
  const profiles = [];

  if (scrape.facebook) {
    profiles.push({
      business_id: businessId,
      platform: 'facebook',
      url: scrape.facebook.link || null,
      handle: extractUsername(scrape.facebook.link) || null,
      follower_count: scrape.facebook.followers || null,
    });
  }

  if (scrape.instagram) {
    profiles.push({
      business_id: businessId,
      platform: 'instagram',
      url: scrape.instagram.username ? `https://instagram.com/${scrape.instagram.username}` : null,
      handle: scrape.instagram.username || null,
      follower_count: scrape.instagram.followerCount || null,
    });
  }

  if (profiles.length > 0) {
    const { error } = await sb.from('business_social_profiles').insert(profiles);
    if (error) console.warn('Failed to save social profiles:', error.message);
  }
}


/**
 * Save scraped social media data (reviews, photos) to business tables.
 */
async function saveSocialEnrichmentData(sb, businessId, flowData) {
  const scrape = flowData.socialScrapeResults || {};
  const fb = scrape.facebook;
  const ig = scrape.instagram;

  // Save Facebook reviews
  if (fb?.reviews?.length > 0) {
    const reviews = fb.reviews.map(r => ({
      business_id: businessId,
      source: 'facebook',
      author_name: r.authorName || 'Anónimo',
      text: r.text,
      rating: r.rating || null,
      published_at: r.date || null,
    }));

    const { error } = await sb.from('business_reviews').insert(reviews);
    if (error) console.warn('Failed to save FB reviews:', error.message);
  }

  // Save Facebook photos (profile + cover)
  const photos = [];

  if (fb?.profilePhoto) {
    photos.push({
      business_id: businessId,
      source: 'facebook',
      photo_type: 'logo',
      url: fb.profilePhoto,
      is_primary: false,
    });
  }

  if (fb?.coverPhoto) {
    photos.push({
      business_id: businessId,
      source: 'facebook',
      photo_type: 'exterior',
      url: fb.coverPhoto,
      is_primary: true,
    });
  }

  // Save Instagram post images
  if (ig?.posts?.length > 0) {
    ig.posts.forEach((post, i) => {
      if (post.imageUrl) {
        photos.push({
          business_id: businessId,
          source: 'instagram',
          photo_type: 'product',
          url: post.imageUrl,
          is_primary: photos.length === 0 && i === 0,
        });
      }
    });
  }

  if (ig?.avatar) {
    photos.push({
      business_id: businessId,
      source: 'instagram',
      photo_type: 'logo',
      url: ig.avatar,
      is_primary: false,
    });
  }

  if (photos.length > 0) {
    const { error } = await sb.from('business_photos').insert(photos);
    if (error) console.warn('Failed to save social photos:', error.message);
  }

  // Update business record with additional social data
  const updates = {};
  if (fb?.category && Array.isArray(fb.category) && fb.category.length > 0) {
    updates.category = fb.category[0];
  }
  if (ig?.bio) {
    updates.description = ig.bio;
  } else if (fb?.name && !fb?.address) {
    // No extra description to add
  }

  if (Object.keys(updates).length > 0) {
    await sb.from('businesses').update(updates).eq('id', businessId);
  }
}


// ── Claude extraction helper ──

/**
 * Use Claude to extract structured fields from a free-form Spanish message.
 */
async function extractInfoWithClaude(message, alreadyCollected) {
  const ai = getAnthropic();

  const alreadyHave = Object.entries(alreadyCollected)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');

  const stillNeed = getMissingFields(alreadyCollected).join(', ');

  const prompt = `Eres un asistente que extrae información de mensajes de WhatsApp en español.

DATOS QUE YA TENEMOS: ${alreadyHave || 'ninguno'}
DATOS QUE NECESITAMOS: ${stillNeed || 'todos recopilados'}

Del siguiente mensaje, extrae los datos que puedas. Responde SOLO con un JSON válido con estos campos (usa null si no encuentras el dato):

{
  "contactName": "nombre de la persona (no el negocio)",
  "email": "correo electrónico",
  "businessName": "nombre del negocio",
  "businessCity": "ciudad del negocio",
  "businessAddress": "dirección completa si la mencionan",
  "reply": "respuesta amigable en español pidiendo los datos faltantes (2-3 oraciones max, usa emojis con moderación)"
}

REGLAS:
- Si el mensaje contiene un dato que ya teníamos, usa el nuevo valor (el usuario puede estar corrigiendo)
- El campo "reply" debe ser conversacional, amable, y pedir SOLO los datos que faltan
- Si todos los datos están completos, el reply debe confirmar la información
- No inventes datos — solo extrae lo que está explícitamente en el mensaje

MENSAJE DEL USUARIO: "${message}"`;

  try {
    const response = await ai.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content.find(b => b.type === 'text')?.text || '{}';

    // Parse JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { reply: 'No entendí bien. ¿Podrías darme tu nombre, correo electrónico, y el nombre de tu negocio con la ciudad?' };

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      contactName: parsed.contactName || null,
      email: parsed.email || null,
      businessName: parsed.businessName || null,
      businessCity: parsed.businessCity || null,
      businessAddress: parsed.businessAddress || null,
      reply: parsed.reply || null,
    };
  } catch (err) {
    console.error('Claude extraction error:', err);
    return { reply: '¿Podrías darme tu nombre, correo electrónico, y el nombre y ciudad de tu negocio?' };
  }
}


// ── Helpers ──

const REQUIRED_FIELDS = ['contactName', 'email', 'businessName'];

function getMissingFields(collected) {
  if (!collected) return REQUIRED_FIELDS;
  return REQUIRED_FIELDS.filter(f => !collected[f]);
}


function buildCollectInfoPrompt(missing, collected) {
  const name = collected?.contactName || collected?.businessName;
  const greeting = name ? `Gracias ${name}. ` : '';

  const fieldNames = {
    contactName: 'tu nombre',
    email: 'tu correo electrónico',
    businessName: 'el nombre de tu negocio',
  };

  const needed = missing.map(f => fieldNames[f]).filter(Boolean);

  if (needed.length === 0) {
    return `${greeting}¡Tenemos toda la información! Vamos a buscar tu negocio en Google. 🔍`;
  }

  if (needed.length === 1) {
    return `${greeting}Para crear tu página web necesito ${needed[0]}. ¿Me lo puedes compartir?`;
  }

  const last = needed.pop();
  return `${greeting}Para crear tu página web necesito: ${needed.join(', ')} y ${last}. ¿Me los puedes compartir? 😊`;
}


/**
 * Interpret a Spanish yes/no answer.
 * @returns {'yes' | 'no' | null}
 */
function interpretYesNo(message) {
  const normalized = (message || '').toLowerCase().trim();

  // Yes patterns
  if (/^(s[ií]|si+|sí+|yes|yep|claro|correcto|exacto|así es|es[eo]|eso es|afirmativo|dale|va|ok|okay|órale|sale)\b/.test(normalized)) {
    return 'yes';
  }
  // Thumbs up / check emoji
  if (/^[👍✅🤝💪]+$/.test(normalized)) return 'yes';

  // No patterns
  if (/^(no|nop|nope|nel|negativo|para nada|incorrecto|ese no)\b/.test(normalized)) {
    return 'no';
  }
  // Thumbs down / X emoji
  if (/^[👎❌]+$/.test(normalized)) return 'no';

  return null;
}


module.exports = {
  checkOnboardingFlow,
  startOnboardingFlow,
  handleOnboardingMessage,
};
