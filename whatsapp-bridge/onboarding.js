// WhatsApp self-service onboarding flow — resolver + orchestrator + state machine
// Resolves every inbound message against DB, merges known data, never re-asks known fields
// Handles: website form leads (Case A) and direct WhatsApp contacts (Case B)

const Anthropic = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');
const { findActiveFlow, createFlow, updateFlow, getFlow, updateMarketingLeadStatus } = require('./db');
const { attemptGoogleMatch, matchOrCreateFromGoogle } = require('./google-matcher');

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
 * Now accepts a ResolvedLeadContext (or legacy preCollected object for backward compat).
 *
 * @param {string} conversationId — Existing conversation UUID
 * @param {string} phone — Canonical phone
 * @param {string} chatId — WhatsApp chat ID for sending messages later
 * @param {Object} resolvedContext — ResolvedLeadContext from lead-resolver (or legacy preCollected)
 * @returns {string|null} Welcome message to send, or null on failure
 */
async function startOnboardingFlow(conversationId, phone, chatId, resolvedContext = {}) {
  // Backward compat: detect legacy preCollected shape (has businessId but no sources array)
  const isLegacy = !resolvedContext.sources;
  const ctx = isLegacy ? convertLegacyPreCollected(resolvedContext) : resolvedContext;

  // Build initial collected data from resolved context
  const collected = {};
  if (ctx.contactName) collected.contactName = ctx.contactName;
  if (ctx.email) collected.email = ctx.email;
  if (ctx.businessName) collected.businessName = ctx.businessName;
  if (ctx.businessCity) collected.businessCity = ctx.businessCity;
  if (ctx.businessAddress) collected.businessAddress = ctx.businessAddress;
  if (ctx.businessState) collected.businessState = ctx.businessState;
  if (ctx.placeId) collected.placeId = ctx.placeId;

  const flowData = {
    collected,
    searchResults: [],
    selectedPlace: null,
    enrichmentSummary: null,
    chatId,
    retryCount: 0,
    resolvedContext: {
      sources: ctx.sources || [],
      contactType: ctx.contactType || 'unknown',
      marketingLeadId: ctx.marketingLeadId || null,
      hasEnoughForGoogleMatch: ctx.hasEnoughForGoogleMatch || false,
    },
  };

  // Determine starting step
  let startStep = 'new_inbound';
  let businessId = ctx.businessId || null;

  const flowId = await createFlow({
    conversationId,
    phone,
    chatId,
    initialData: flowData,
  });

  if (!flowId) return null;

  // Link business if known
  if (businessId) {
    await updateFlow(flowId, { business_id: businessId });
  }

  // Update marketing lead status if applicable
  if (ctx.marketingLeadId) {
    await updateMarketingLeadStatus(ctx.marketingLeadId, 'contacted');
  }

  // Determine first action based on resolved context
  const flow = await getFlow(flowId);
  if (!flow) return null;

  return await advanceFlow(flowId, flow, null);
}


/**
 * Handle an inbound message for an active onboarding flow.
 *
 * @param {string} flowId — Flow UUID
 * @param {string} message — User's message text
 * @param {string} conversationId — For context
 * @param {string} phone — Canonical phone
 * @param {Object} [extras={}] — Extra context: { client, msgType, mediaData }
 * @returns {string|null} Reply to send, or null if handled asynchronously
 */
async function handleOnboardingMessage(flowId, message, conversationId, phone, extras = {}) {
  const flow = await getFlow(flowId);
  if (!flow) return 'Lo siento, hubo un problema. Un asesor te contactará pronto.';

  // Update activity timestamp
  await updateFlow(flowId, { flow_data: flow.flow_data });

  try {
    // Handle photo uploads during awaiting_photos
    if (extras.msgType === 'image' && flow.step === 'awaiting_photos') {
      return await handlePhotoUpload(flowId, flow, extras.mediaData, flow.business_id);
    }

    // Route to step handler
    switch (flow.step) {
      // ── Entry states ──
      case 'new_inbound':
      case 'resolving_lead':
        return await advanceFlow(flowId, flow, message);

      // ── Google match phase ──
      case 'awaiting_business_name_for_match':
        return await handleAwaitingBusinessName(flowId, flow, message);

      case 'awaiting_location_for_match':
        return await handleAwaitingLocation(flowId, flow, message);

      case 'attempting_google_match':
        return '🔍 Buscando tu negocio, un momento...';

      case 'awaiting_google_match_selection':
        return await handleGoogleMatchSelection(flowId, flow, message);

      // ── Confirmation ──
      case 'confirmed_known_fields':
        return await handleConfirmedKnownFields(flowId, flow, message);

      // ── Identity fill ──
      case 'awaiting_contact_name':
        return await handleFieldInput(flowId, flow, message, 'contactName');

      case 'awaiting_email':
        return await handleFieldInput(flowId, flow, message, 'email');

      case 'awaiting_phone':
        return await handleFieldInput(flowId, flow, message, 'phone');

      case 'awaiting_business_name':
        return await handleFieldInput(flowId, flow, message, 'businessName');

      case 'awaiting_address':
        return await handleFieldInput(flowId, flow, message, 'businessAddress');

      // ── Enrichment collection ──
      case 'awaiting_photos':
        return await handleSkippableField(flowId, flow, message, 'photos');

      case 'awaiting_hours':
        return await handleEnrichmentInput(flowId, flow, message, 'hours');

      case 'awaiting_about_us':
        return await handleEnrichmentInput(flowId, flow, message, 'aboutUs');

      case 'awaiting_founder_story':
        return await handleEnrichmentInput(flowId, flow, message, 'founderStory');

      // ── Services loop ──
      case 'awaiting_service_name':
        return await handleServiceName(flowId, flow, message);

      case 'awaiting_service_description':
        return await handleServiceDescription(flowId, flow, message);

      case 'awaiting_service_price':
        return await handleServicePrice(flowId, flow, message);

      case 'awaiting_more_services':
        return await handleMoreServices(flowId, flow, message);

      // ── Final ──
      case 'awaiting_extra_notes':
        return await handleExtraNotes(flowId, flow, message);

      case 'awaiting_final_confirmation':
        return await handleFinalConfirmation(flowId, flow, message, extras);

      // ── Terminal / async states ──
      case 'enrich':
        return '⏳ Estamos recopilando información de tu negocio, un momento...';

      case 'generate':
        return '⏳ Tu página web se está generando. Te avisaremos cuando esté lista (~5 minutos).';

      case 'complete':
        return '✅ Tu página web ya está lista. ¿Necesitas algo más?';

      case 'human_review':
        return 'Tu caso está siendo revisado por un asesor. Te contactarán pronto. 🙏';

      // ── Legacy states (backward compat) ──
      case 'collect_info':
        return await handleLegacyCollectInfo(flowId, flow, message);

      case 'search_business':
        return '🔍 Estamos buscando tu negocio, un momento por favor...';

      case 'verify_business':
        return await handleLegacyVerifyBusiness(flowId, flow, message);

      case 'confirm_data':
        return await handleLegacyConfirmData(flowId, flow, message, extras);

      default:
        return 'Lo siento, hubo un problema. Un asesor te contactará pronto.';
    }
  } catch (err) {
    console.error(`Onboarding step "${flow.step}" error for flow ${flowId}:`, err);

    const retryCount = (flow.flow_data?.retryCount || 0) + 1;
    if (retryCount >= 3) {
      await updateFlow(flowId, {
        step: 'human_review',
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


// ── Flow advancement (the "brain") ──

/**
 * Determine next state and message based on what's collected.
 * Called after startOnboardingFlow and after each field is filled.
 */
async function advanceFlow(flowId, flow, userMessage) {
  const flowData = flow.flow_data || {};
  const collected = flowData.collected || {};
  const resolvedCtx = flowData.resolvedContext || {};

  // Priority 1: Need business name for Google match
  if (!collected.businessName) {
    await updateFlow(flowId, { step: 'awaiting_business_name_for_match', flow_data: flowData });
    return buildWelcomeMessage(collected, resolvedCtx);
  }

  // Priority 2: Need location for Google match
  if (!collected.businessAddress && !collected.businessCity) {
    await updateFlow(flowId, { step: 'awaiting_location_for_match', flow_data: flowData });

    if (collected.contactName) {
      return `Gracias ${collected.contactName}. ¿En qué ciudad o dirección se encuentra *${collected.businessName}*?`;
    }
    return `¿En qué ciudad o dirección se encuentra *${collected.businessName}*?`;
  }

  // Priority 3: Google match attempt (if not yet tried)
  if (!flowData._googleMatchAttempted && !collected.placeId) {
    await updateFlow(flowId, { step: 'attempting_google_match', flow_data: flowData });
    return await performGoogleMatch(flowId, flowData);
  }

  // Priority 4: Confirmation of known fields (if we have data from marketing_leads or DB)
  if (resolvedCtx.sources?.length > 0 && !flowData._knownFieldsConfirmed) {
    const knownSummary = buildKnownFieldsSummary(collected);
    if (knownSummary) {
      flowData._knownFieldsConfirmed = true;
      await updateFlow(flowId, { step: 'confirmed_known_fields', flow_data: flowData });
      return `Ya tengo estos datos de tu negocio:\n\n${knownSummary}\n\n¿Todo está correcto? Si algo está mal, dime qué corregir. Si todo está bien, responde *SI* para continuar.`;
    }
    flowData._knownFieldsConfirmed = true;
  }

  // Priority 5: Missing identity fields
  if (!collected.contactName) {
    await updateFlow(flowId, { step: 'awaiting_contact_name', flow_data: flowData });
    return '¿Cuál es tu nombre?';
  }

  if (!collected.email) {
    await updateFlow(flowId, { step: 'awaiting_email', flow_data: flowData });
    return `${collected.contactName}, ¿cuál es tu correo electrónico? Lo necesitamos para enviarte los datos de acceso a tu portal.`;
  }

  // Priority 6: Enrichment fields (all skippable)
  if (!flowData._enrichmentDone) {
    return await advanceToNextEnrichment(flowId, flowData, collected);
  }

  // Priority 7: Extra notes → final confirmation
  if (!flowData._extraNotesDone) {
    flowData._extraNotesDone = true;
    await updateFlow(flowId, { step: 'awaiting_extra_notes', flow_data: flowData });
    return '¿Hay algo más que quieras agregar a tu página web? Cualquier detalle especial, promoción, o información que no hayamos cubierto. Si no, responde *no*.';
  }

  // Final confirmation
  await updateFlow(flowId, { step: 'awaiting_final_confirmation', flow_data: flowData });
  return buildFinalConfirmationMessage(collected, flowData);
}


/**
 * Advance to the next unanswered enrichment field.
 */
async function advanceToNextEnrichment(flowId, flowData, collected) {
  // Photos
  if (collected.photos === undefined) {
    await updateFlow(flowId, { step: 'awaiting_photos', flow_data: flowData });
    return '📸 ¿Tienes fotos de tu negocio que quieras incluir en tu página web? Puedes enviarlas aquí. Si no tienes, responde *no* y usaremos fotos profesionales generadas.';
  }

  // Hours
  if (collected.hours === undefined) {
    await updateFlow(flowId, { step: 'awaiting_hours', flow_data: flowData });
    return '🕐 ¿Cuál es tu horario de atención? Por ejemplo: "Lunes a viernes 9am-6pm, sábados 9am-2pm". Si no quieres incluirlo, responde *no*.';
  }

  // About us
  if (collected.aboutUs === undefined) {
    await updateFlow(flowId, { step: 'awaiting_about_us', flow_data: flowData });
    return '📝 Cuéntame un poco sobre tu negocio. ¿Qué los hace especiales? ¿Cuánto tiempo llevan? Si prefieres saltar esto, responde *no*.';
  }

  // Founder story
  if (collected.founderStory === undefined) {
    await updateFlow(flowId, { step: 'awaiting_founder_story', flow_data: flowData });
    return '👤 ¿Te gustaría incluir la historia del fundador? Algo como: "Mi papá empezó este negocio hace 20 años..." Si no, responde *no*.';
  }

  // Services
  if (collected.services === undefined) {
    collected.services = [];
    await updateFlow(flowId, { step: 'awaiting_service_name', flow_data: flowData });
    return '🛠️ ¿Qué servicios o productos principales ofreces? Dime el nombre del primero. Si no quieres agregar servicios, responde *no*.';
  }

  // All enrichment done
  flowData._enrichmentDone = true;
  await updateFlow(flowId, { flow_data: flowData });
  return await advanceFlow(flowId, { ...{ flow_data: flowData, business_id: null }, step: flowData._lastStep || 'new_inbound' }, null);
}


// ── Step handlers ──

async function handleAwaitingBusinessName(flowId, flow, message) {
  const flowData = { ...flow.flow_data };
  const collected = flowData.collected || {};

  // Use Claude to extract business name and any other data from message
  const extracted = await extractInfoWithClaude(message, collected);

  if (extracted.businessName) {
    collected.businessName = extracted.businessName;
  }
  if (extracted.contactName && !collected.contactName) collected.contactName = extracted.contactName;
  if (extracted.email && !collected.email) collected.email = extracted.email;
  if (extracted.businessCity && !collected.businessCity) collected.businessCity = extracted.businessCity;
  if (extracted.businessAddress && !collected.businessAddress) collected.businessAddress = extracted.businessAddress;

  flowData.collected = collected;
  flowData.retryCount = 0;

  if (!collected.businessName) {
    await updateFlow(flowId, { flow_data: flowData });
    return extracted.reply || '¿Cuál es el nombre de tu negocio?';
  }

  await updateFlow(flowId, { flow_data: flowData });
  return await advanceFlow(flowId, { ...flow, flow_data: flowData }, message);
}


async function handleAwaitingLocation(flowId, flow, message) {
  const flowData = { ...flow.flow_data };
  const collected = flowData.collected || {};

  const extracted = await extractInfoWithClaude(message, collected);

  if (extracted.businessCity) collected.businessCity = extracted.businessCity;
  if (extracted.businessAddress) collected.businessAddress = extracted.businessAddress;
  if (extracted.contactName && !collected.contactName) collected.contactName = extracted.contactName;
  if (extracted.email && !collected.email) collected.email = extracted.email;

  flowData.collected = collected;
  flowData.retryCount = 0;

  if (!collected.businessCity && !collected.businessAddress) {
    await updateFlow(flowId, { flow_data: flowData });
    return extracted.reply || '¿En qué ciudad se encuentra tu negocio?';
  }

  await updateFlow(flowId, { flow_data: flowData });
  return await advanceFlow(flowId, { ...flow, flow_data: flowData }, message);
}


/**
 * Perform Google Places match and handle the 3 outcomes.
 */
async function performGoogleMatch(flowId, flowData) {
  const collected = flowData.collected || {};

  flowData._googleMatchAttempted = true;

  try {
    const result = await attemptGoogleMatch({
      businessName: collected.businessName,
      address: collected.businessAddress,
      city: collected.businessCity,
    });

    if (result.outcome === 'matched') {
      // Single match — confirm
      flowData.selectedPlace = result.match;
      collected.placeId = result.match.placeId;

      // Merge Google data into collected
      if (result.match.address && !collected.businessAddress) collected.businessAddress = result.match.address;
      if (result.match.addressCity && !collected.businessCity) collected.businessCity = result.match.addressCity;
      if (result.match.phone && !collected.businessPhone) collected.businessPhone = result.match.phone;

      flowData.collected = collected;
      await updateFlow(flowId, { step: 'confirmed_known_fields', flow_data: flowData });

      let msg = `✅ Encontré tu negocio en Google:\n\n`;
      msg += `*${result.match.name}*\n`;
      if (result.match.address) msg += `📍 ${result.match.address}\n`;
      if (result.match.rating) msg += `⭐ ${result.match.rating}`;
      if (result.match.reviewCount) msg += ` (${result.match.reviewCount} reseñas)`;
      if (result.match.rating || result.match.reviewCount) msg += '\n';
      msg += `\nSi todo está bien, seguimos desde aquí. ¿Correcto? Responde *SI* o *NO*.`;
      return msg;
    }

    if (result.outcome === 'ambiguous') {
      // Multiple matches — disambiguation
      flowData.searchResults = result.candidates;
      flowData.collected = collected;
      await updateFlow(flowId, { step: 'awaiting_google_match_selection', flow_data: flowData });

      let msg = `Encontré varios negocios similares:\n\n`;
      result.candidates.forEach((c, i) => {
        msg += `*${i + 1}.* ${c.name}`;
        if (c.address) msg += ` — ${c.address}`;
        msg += '\n';
      });
      msg += `*${result.candidates.length + 1}.* No aparece mi negocio\n`;
      msg += `\n¿Cuál es el tuyo? Responde con el número.`;
      return msg;
    }

    // not_found — proceed without Google data
    flowData.collected = collected;
    await updateFlow(flowId, { flow_data: flowData });

    // Skip to next step
    const flow = await getFlow(flowId);
    return await advanceFlow(flowId, flow, null);
  } catch (err) {
    console.error('Google match failed:', err);
    flowData.collected = collected;
    await updateFlow(flowId, { flow_data: flowData });
    const flow = await getFlow(flowId);
    return await advanceFlow(flowId, flow, null);
  }
}


async function handleGoogleMatchSelection(flowId, flow, message) {
  const flowData = { ...flow.flow_data };
  const candidates = flowData.searchResults || [];
  const collected = flowData.collected || {};

  const trimmed = (message || '').trim();
  const num = parseInt(trimmed, 10);

  if (isNaN(num) || num < 1 || num > candidates.length + 1) {
    return `Responde con un número del 1 al ${candidates.length + 1}.`;
  }

  if (num === candidates.length + 1) {
    // Not in list — proceed without Google data
    flowData.searchResults = [];
    flowData.selectedPlace = null;
    await updateFlow(flowId, { flow_data: flowData });
    return await advanceFlow(flowId, { ...flow, flow_data: flowData }, null);
  }

  // Selected a candidate
  const selected = candidates[num - 1];
  flowData.selectedPlace = selected;
  collected.placeId = selected.placeId;

  if (selected.address && !collected.businessAddress) collected.businessAddress = selected.address;
  if (selected.addressCity && !collected.businessCity) collected.businessCity = selected.addressCity;
  if (selected.phone && !collected.businessPhone) collected.businessPhone = selected.phone;

  flowData.collected = collected;
  flowData._knownFieldsConfirmed = true; // They just confirmed by selecting
  await updateFlow(flowId, { flow_data: flowData });

  return await advanceFlow(flowId, { ...flow, flow_data: flowData }, null);
}


async function handleConfirmedKnownFields(flowId, flow, message) {
  const answer = interpretYesNo(message);
  const flowData = { ...flow.flow_data };

  if (answer === 'yes') {
    flowData._knownFieldsConfirmed = true;
    await updateFlow(flowId, { flow_data: flowData });
    return await advanceFlow(flowId, { ...flow, flow_data: flowData }, null);
  }

  if (answer === 'no') {
    // Let them correct — use Claude to extract corrections
    flowData._knownFieldsConfirmed = true;
    await updateFlow(flowId, { flow_data: flowData });
    return '¿Qué datos necesitas corregir? Dime y lo actualizo.';
  }

  // They might be providing corrections inline
  const collected = flowData.collected || {};
  const extracted = await extractInfoWithClaude(message, collected);

  let updated = false;
  if (extracted.contactName) { collected.contactName = extracted.contactName; updated = true; }
  if (extracted.email) { collected.email = extracted.email; updated = true; }
  if (extracted.businessName) { collected.businessName = extracted.businessName; updated = true; }
  if (extracted.businessCity) { collected.businessCity = extracted.businessCity; updated = true; }
  if (extracted.businessAddress) { collected.businessAddress = extracted.businessAddress; updated = true; }

  if (updated) {
    flowData.collected = collected;
    flowData._knownFieldsConfirmed = true;
    await updateFlow(flowId, { flow_data: flowData });
    return await advanceFlow(flowId, { ...flow, flow_data: flowData }, null);
  }

  return 'No entendí. ¿Los datos están correctos? Responde *SI* o dime qué corregir.';
}


async function handleFieldInput(flowId, flow, message, fieldName) {
  const flowData = { ...flow.flow_data };
  const collected = flowData.collected || {};

  // Use Claude for extraction (handles natural language)
  const extracted = await extractInfoWithClaude(message, collected);

  // Map field names
  const fieldMap = {
    contactName: 'contactName',
    email: 'email',
    phone: 'businessPhone',
    businessName: 'businessName',
    businessAddress: 'businessAddress',
  };

  const extractedField = fieldMap[fieldName];
  if (extracted[extractedField] || extracted[fieldName]) {
    collected[fieldName] = extracted[extractedField] || extracted[fieldName];
  } else {
    // Direct assignment for simple inputs
    if (fieldName === 'email' && message.includes('@')) {
      collected.email = message.trim();
    } else if (fieldName === 'contactName') {
      collected.contactName = message.trim();
    } else {
      collected[fieldName] = message.trim();
    }
  }

  // Also pick up any bonus fields Claude found
  if (extracted.contactName && !collected.contactName) collected.contactName = extracted.contactName;
  if (extracted.email && !collected.email) collected.email = extracted.email;
  if (extracted.businessName && !collected.businessName) collected.businessName = extracted.businessName;
  if (extracted.businessCity && !collected.businessCity) collected.businessCity = extracted.businessCity;
  if (extracted.businessAddress && !collected.businessAddress) collected.businessAddress = extracted.businessAddress;

  flowData.collected = collected;
  flowData.retryCount = 0;
  await updateFlow(flowId, { flow_data: flowData });

  return await advanceFlow(flowId, { ...flow, flow_data: flowData }, null);
}


async function handleSkippableField(flowId, flow, message, fieldName) {
  const flowData = { ...flow.flow_data };
  const collected = flowData.collected || {};

  if (interpretSkip(message)) {
    collected[fieldName] = null; // explicitly set to null = skipped
    flowData.collected = collected;
    await updateFlow(flowId, { flow_data: flowData });
    return await advanceToNextEnrichment(flowId, flowData, collected);
  }

  // For photos, they should send images (handled by msgType check above)
  // Text response during awaiting_photos that isn't a skip — treat as "no photos"
  if (fieldName === 'photos') {
    collected.photos = null;
    flowData.collected = collected;
    await updateFlow(flowId, { flow_data: flowData });
    return await advanceToNextEnrichment(flowId, flowData, collected);
  }

  return null;
}


async function handleEnrichmentInput(flowId, flow, message, fieldName) {
  const flowData = { ...flow.flow_data };
  const collected = flowData.collected || {};

  if (interpretSkip(message)) {
    collected[fieldName] = null;
    flowData.collected = collected;
    await updateFlow(flowId, { flow_data: flowData });
    return await advanceToNextEnrichment(flowId, flowData, collected);
  }

  // Extract enrichment data with Claude
  const extracted = await extractEnrichmentWithClaude(message, fieldName);
  collected[fieldName] = extracted || message.trim();

  flowData.collected = collected;
  await updateFlow(flowId, { flow_data: flowData });
  return await advanceToNextEnrichment(flowId, flowData, collected);
}


async function handlePhotoUpload(flowId, flow, mediaData, businessId) {
  const flowData = { ...flow.flow_data };
  const collected = flowData.collected || {};

  try {
    if (mediaData && mediaData.data) {
      const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

      // Upload to Supabase Storage
      const filename = `onboarding/${businessId || flowId}/${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await sb.storage
        .from('business-photos')
        .upload(filename, Buffer.from(mediaData.data, 'base64'), {
          contentType: mediaData.mimetype || 'image/jpeg',
        });

      if (uploadError) {
        console.warn('Photo upload failed:', uploadError.message);
      } else {
        // Get public URL
        const { data: urlData } = sb.storage.from('business-photos').getPublicUrl(filename);
        const photoUrl = urlData?.publicUrl;

        if (photoUrl) {
          if (!collected.photoUrls) collected.photoUrls = [];
          collected.photoUrls.push(photoUrl);

          // Save to business_photos if we have a businessId
          if (businessId) {
            await sb.from('business_photos').insert({
              business_id: businessId,
              source: 'owner_upload',
              photo_type: 'general',
              url: photoUrl,
              storage_path: filename,
            }).catch(err => console.warn('Failed to save photo record:', err.message));
          }
        }
      }
    }

    collected.photos = collected.photoUrls || [];
    flowData.collected = collected;
    await updateFlow(flowId, { flow_data: flowData });

    const count = (collected.photoUrls || []).length;
    return `📸 ¡Foto recibida! (${count} en total). Envía más fotos o responde *listo* cuando termines.`;
  } catch (err) {
    console.error('Photo upload error:', err);
    return 'No pude procesar la foto. Intenta enviarla de nuevo o responde *listo* para continuar.';
  }
}


// ── Services loop ──

async function handleServiceName(flowId, flow, message) {
  const flowData = { ...flow.flow_data };
  const collected = flowData.collected || {};

  if (interpretSkip(message)) {
    if (!collected.services) collected.services = [];
    flowData.collected = collected;
    flowData._enrichmentDone = true;
    await updateFlow(flowId, { flow_data: flowData });
    return await advanceFlow(flowId, { ...flow, flow_data: flowData }, null);
  }

  // Handle "listo" during photos step leaking into services
  if (message.trim().toLowerCase() === 'listo' && flow.step === 'awaiting_service_name') {
    flowData._enrichmentDone = true;
    flowData.collected = collected;
    await updateFlow(flowId, { flow_data: flowData });
    return await advanceFlow(flowId, { ...flow, flow_data: flowData }, null);
  }

  flowData._tempService = { name: message.trim() };
  flowData.collected = collected;
  await updateFlow(flowId, { step: 'awaiting_service_description', flow_data: flowData });
  return `¿Una breve descripción de "${message.trim()}"? Si no tienes, responde *no*.`;
}


async function handleServiceDescription(flowId, flow, message) {
  const flowData = { ...flow.flow_data };

  if (interpretSkip(message)) {
    flowData._tempService.description = null;
  } else {
    flowData._tempService.description = message.trim();
  }

  await updateFlow(flowId, { step: 'awaiting_service_price', flow_data: flowData });
  return `¿Cuál es el precio de "${flowData._tempService.name}"? Si no quieres incluir precio, responde *no*.`;
}


async function handleServicePrice(flowId, flow, message) {
  const flowData = { ...flow.flow_data };
  const collected = flowData.collected || {};

  if (interpretSkip(message)) {
    flowData._tempService.price = null;
  } else {
    flowData._tempService.price = message.trim();
  }

  // Save completed service
  if (!collected.services) collected.services = [];
  collected.services.push({ ...flowData._tempService });
  delete flowData._tempService;

  flowData.collected = collected;
  await updateFlow(flowId, { step: 'awaiting_more_services', flow_data: flowData });

  const count = collected.services.length;
  return `✅ Servicio #${count} guardado. ¿Quieres agregar otro servicio? Responde *SI* o *NO*.`;
}


async function handleMoreServices(flowId, flow, message) {
  const answer = interpretYesNo(message);
  const flowData = { ...flow.flow_data };

  if (answer === 'yes') {
    await updateFlow(flowId, { step: 'awaiting_service_name', flow_data: flowData });
    return '¿Cómo se llama el siguiente servicio o producto?';
  }

  // No more services — mark enrichment done
  flowData._enrichmentDone = true;
  await updateFlow(flowId, { flow_data: flowData });
  return await advanceFlow(flowId, { ...flow, flow_data: flowData }, null);
}


// ── Final steps ──

async function handleExtraNotes(flowId, flow, message) {
  const flowData = { ...flow.flow_data };
  const collected = flowData.collected || {};

  if (!interpretSkip(message)) {
    collected.extraNotes = message.trim();
  }

  flowData.collected = collected;
  flowData._extraNotesDone = true;
  await updateFlow(flowId, { flow_data: flowData });

  await updateFlow(flowId, { step: 'awaiting_final_confirmation', flow_data: flowData });
  return buildFinalConfirmationMessage(collected, flowData);
}


async function handleFinalConfirmation(flowId, flow, message, extras) {
  const answer = interpretYesNo(message);

  if (answer === 'yes') {
    const flowData = { ...flow.flow_data, retryCount: 0 };
    await updateFlow(flowId, { step: 'enrich', flow_data: flowData });
    return await handleEnrich(flowId, flowData, extras);
  }

  if (answer === 'no') {
    // Ask what to change
    return '¿Qué te gustaría cambiar? Dime y lo corrijo antes de crear tu página.';
  }

  return 'No entendí. ¿Creamos tu página web con esta información? Responde *SI* o *NO*.';
}


/**
 * ENRICH: Save/update business in DB and trigger enrichment.
 * Auto-advances to generation.
 */
async function handleEnrich(flowId, flowData, extras = {}) {
  const place = flowData.selectedPlace;
  const collected = flowData.collected || {};
  let businessId = flowData.businessId || null;

  try {
    const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

    if (businessId) {
      // Business already known — update contact info
      const updates = {};
      if (collected.contactName) updates.contact_name = collected.contactName;
      if (collected.email) updates.contact_email = collected.email;
      if (flowData.chatId) updates.contact_whatsapp = flowData.chatId.replace(/@c\.us$/, '');

      if (Object.keys(updates).length > 0) {
        await sb.from('businesses').update(updates).eq('id', businessId);
      }
    } else if (place && place.placeId) {
      // Match or create from Google data
      const result = await matchOrCreateFromGoogle(place, {
        contactName: collected.contactName,
        email: collected.email,
        phone: collected.businessPhone,
        chatId: flowData.chatId,
      });
      businessId = result.businessId;
    } else {
      // No Google data — create minimal business
      const insertData = {
        name: collected.businessName || 'Sin nombre',
        place_id: 'onboarding-' + require('crypto').randomUUID(),
        address_full: collected.businessAddress || null,
        address_city: collected.businessCity || null,
        address_state: collected.businessState || null,
        pipeline_status: 'prospect',
        enrichment_status: 'skipped',
        enrichment_attempts: 0,
        enrichment_last_finished_at: new Date().toISOString(),
      };

      if (collected.contactName) insertData.contact_name = collected.contactName;
      if (collected.email) insertData.contact_email = collected.email;
      if (flowData.chatId) insertData.contact_whatsapp = flowData.chatId.replace(/@c\.us$/, '');

      const { data: newBiz, error } = await sb
        .from('businesses')
        .insert(insertData)
        .select('id')
        .single();

      if (error) throw new Error(`Failed to create business: ${error.message}`);
      businessId = newBiz.id;
    }

    // Save enrichment data (hours, aboutUs, etc.) to business
    const enrichUpdates = {};
    if (collected.hours) enrichUpdates.hours_text = collected.hours;
    if (collected.aboutUs) enrichUpdates.description = collected.aboutUs;

    if (Object.keys(enrichUpdates).length > 0) {
      await sb.from('businesses').update(enrichUpdates).eq('id', businessId).catch(err =>
        console.warn('Failed to save enrichment data:', err.message)
      );
    }

    // Link business to flow
    flowData.businessId = businessId;
    await updateFlow(flowId, { business_id: businessId, flow_data: flowData });

    // Trigger API enrichment
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
        flowData.dataId = enrichResult.dataId;
        if (flowData.selectedPlace) flowData.selectedPlace.dataId = enrichResult.dataId;
        await updateFlow(flowId, { flow_data: flowData });
      }
    }

    // Wait briefly for enrichment to populate
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Now kick off generation
    await updateFlow(flowId, { step: 'generate', flow_data: flowData });

    const { runGenerationPipeline } = require('./generation-pipeline');

    // Fire-and-forget
    runGenerationPipeline({
      flowId,
      businessId,
      phone: null, // flow has phone
      chatId: flowData.chatId,
      client: extras.client || null,
      collected,
    }).catch(err => {
      console.error('Generation pipeline failed:', err);
      updateFlow(flowId, {
        step: 'error',
        flow_data: { ...flowData, lastError: err.message },
      });
    });

    return '🚀 ¡Excelente! Estamos creando tu página web profesional.\n\nEsto toma aproximadamente 5 minutos. Te enviaremos un mensaje cuando esté lista. ⏳';
  } catch (err) {
    console.error('Enrich step error:', err);
    await updateFlow(flowId, { step: 'error', flow_data: flowData });
    return 'Hubo un problema al procesar tu negocio. Un asesor te contactará pronto. 🙏';
  }
}


// ── Legacy step handlers (backward compat for in-flight flows) ──

async function handleLegacyCollectInfo(flowId, flow, message) {
  const collected = flow.flow_data?.collected || {};
  const extracted = await extractInfoWithClaude(message, collected);

  const updated = { ...collected };
  if (extracted.contactName) updated.contactName = extracted.contactName;
  if (extracted.email) updated.email = extracted.email;
  if (extracted.businessName) updated.businessName = extracted.businessName;
  if (extracted.businessCity) updated.businessCity = extracted.businessCity;
  if (extracted.businessAddress) updated.businessAddress = extracted.businessAddress;

  const flowData = { ...flow.flow_data, collected: updated, retryCount: 0 };

  const missing = getLegacyMissingFields(updated);

  if (missing.length === 0) {
    if (flow.business_id || flowData.collected?.businessId) {
      flowData.businessId = flow.business_id || flowData.collected.businessId;
      await updateFlow(flowId, { step: 'enrich', flow_data: flowData });
      return await handleEnrich(flowId, flowData);
    }

    // Transition to new flow: try Google match
    flowData._googleMatchAttempted = false;
    await updateFlow(flowId, { flow_data: flowData });
    return await advanceFlow(flowId, { ...flow, flow_data: flowData }, message);
  }

  await updateFlow(flowId, { flow_data: flowData });
  return extracted.reply || buildLegacyCollectInfoPrompt(missing, updated);
}


async function handleLegacyVerifyBusiness(flowId, flow, message) {
  const answer = interpretYesNo(message);

  if (answer === 'yes') {
    const flowData = { ...flow.flow_data, retryCount: 0 };
    await updateFlow(flowId, { step: 'enrich', flow_data: flowData });
    return await handleEnrich(flowId, flowData);
  }

  if (answer === 'no') {
    const flowData = { ...flow.flow_data, retryCount: 0, searchResults: [], selectedPlace: null };
    await updateFlow(flowId, { step: 'collect_info', flow_data: flowData });
    return 'Entendido, ese no es tu negocio. ¿Podrías darme el nombre exacto y la dirección completa para buscarlo de nuevo?';
  }

  return 'No entendí tu respuesta. ¿Es este tu negocio? Responde *SI* o *NO*.';
}


async function handleLegacyConfirmData(flowId, flow, message, extras) {
  const answer = interpretYesNo(message);

  if (answer === 'yes') {
    const flowData = { ...flow.flow_data, retryCount: 0 };
    await updateFlow(flowId, { step: 'generate', flow_data: flowData });

    const { runGenerationPipeline } = require('./generation-pipeline');
    const businessId = flow.business_id || flowData.businessId;
    const chatId = flowData.chatId;

    runGenerationPipeline({
      flowId,
      businessId,
      phone: flow.phone,
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


// ── Claude extraction helpers ──

/**
 * Use Claude to extract structured fields from a free-form Spanish message.
 */
async function extractInfoWithClaude(message, alreadyCollected) {
  const ai = getAnthropic();

  const alreadyHave = Object.entries(alreadyCollected || {})
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');

  const stillNeed = [];
  if (!alreadyCollected?.contactName) stillNeed.push('contactName');
  if (!alreadyCollected?.email) stillNeed.push('email');
  if (!alreadyCollected?.businessName) stillNeed.push('businessName');
  if (!alreadyCollected?.businessCity) stillNeed.push('businessCity');
  if (!alreadyCollected?.businessAddress) stillNeed.push('businessAddress');

  const prompt = `Eres un asistente que extrae información de mensajes de WhatsApp en español.

DATOS QUE YA TENEMOS: ${alreadyHave || 'ninguno'}
DATOS QUE NECESITAMOS: ${stillNeed.join(', ') || 'todos recopilados'}

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


/**
 * Use Claude to extract enrichment data (hours, about us, founder story).
 */
async function extractEnrichmentWithClaude(message, fieldName) {
  const ai = getAnthropic();

  const fieldDescriptions = {
    hours: 'horario de atención del negocio. Formatea como texto legible.',
    aboutUs: 'descripción o información sobre el negocio. Resume en 2-3 oraciones.',
    founderStory: 'historia del fundador o del negocio. Resume en 2-3 oraciones.',
  };

  const prompt = `Extrae la siguiente información del mensaje del usuario: ${fieldDescriptions[fieldName] || fieldName}

Responde SOLO con el texto extraído y limpio (no JSON, no explicaciones). Si no hay información relevante, responde exactamente "null".

MENSAJE: "${message}"`;

  try {
    const response = await ai.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (response.content.find(b => b.type === 'text')?.text || '').trim();
    return text === 'null' ? null : text;
  } catch (err) {
    console.error('Claude enrichment extraction error:', err);
    return message.trim();
  }
}


// ── Helpers ──

/**
 * Interpret a Spanish yes/no answer.
 * @returns {'yes' | 'no' | null}
 */
function interpretYesNo(message) {
  const normalized = (message || '').toLowerCase().trim();

  if (/^(s[ií]|si+|sí+|yes|yep|claro|correcto|exacto|así es|es[eo]|eso es|afirmativo|dale|va|ok|okay|órale|sale|listo)\b/.test(normalized)) {
    return 'yes';
  }
  if (/^[👍✅🤝💪]+$/.test(normalized)) return 'yes';

  if (/^(no|nop|nope|nel|negativo|para nada|incorrecto|ese no)\b/.test(normalized)) {
    return 'no';
  }
  if (/^[👎❌]+$/.test(normalized)) return 'no';

  return null;
}


/**
 * Interpret skip/pass signals in Spanish.
 * @returns {boolean}
 */
function interpretSkip(message) {
  const normalized = (message || '').toLowerCase().trim();
  return /^(no|no tengo|después|despues|skip|siguiente|no por ahora|saltar|pasar|nop|nope|nel|no gracias)\b/.test(normalized)
    || /^[👎❌]+$/.test(normalized);
}


/**
 * Build welcome message based on what we know.
 */
function buildWelcomeMessage(collected, resolvedCtx) {
  if (resolvedCtx.sources?.length > 0 && collected.contactName) {
    return `Hola ${collected.contactName} 👋 Soy de AhoraTengoPagina. Vamos a crear tu página web. ¿Cuál es el nombre de tu negocio?`;
  }
  if (collected.contactName) {
    return `Hola ${collected.contactName} 👋 ¡Vamos a crear tu página web! ¿Cuál es el nombre de tu negocio?`;
  }
  return 'Hola 👋 ¡Vamos a crear tu página web profesional! Para empezar, ¿cuál es el nombre de tu negocio?';
}


/**
 * Build a summary of known fields for confirmation.
 */
function buildKnownFieldsSummary(collected) {
  const lines = [];
  if (collected.businessName) lines.push(`🏪 Negocio: *${collected.businessName}*`);
  if (collected.contactName) lines.push(`👤 Nombre: ${collected.contactName}`);
  if (collected.email) lines.push(`📧 Email: ${collected.email}`);
  if (collected.businessAddress) lines.push(`📍 Dirección: ${collected.businessAddress}`);
  else if (collected.businessCity) lines.push(`📍 Ciudad: ${collected.businessCity}`);
  if (collected.businessPhone) lines.push(`📞 Teléfono: ${collected.businessPhone}`);

  return lines.length >= 2 ? lines.join('\n') : null;
}


/**
 * Build the final confirmation message with all collected data.
 */
function buildFinalConfirmationMessage(collected, flowData) {
  let msg = '📋 Este es el resumen de tu información:\n\n';

  if (collected.businessName) msg += `🏪 *${collected.businessName}*\n`;
  if (collected.contactName) msg += `👤 ${collected.contactName}\n`;
  if (collected.email) msg += `📧 ${collected.email}\n`;
  if (collected.businessAddress) msg += `📍 ${collected.businessAddress}\n`;
  else if (collected.businessCity) msg += `📍 ${collected.businessCity}\n`;
  if (collected.businessPhone) msg += `📞 ${collected.businessPhone}\n`;
  if (collected.hours) msg += `🕐 ${collected.hours}\n`;

  if (collected.aboutUs) msg += `\n📝 Sobre el negocio: ${collected.aboutUs.substring(0, 100)}${collected.aboutUs.length > 100 ? '...' : ''}\n`;
  if (collected.founderStory) msg += `👤 Historia: ${collected.founderStory.substring(0, 100)}${collected.founderStory.length > 100 ? '...' : ''}\n`;

  if (collected.services && collected.services.length > 0) {
    msg += `\n🛠️ Servicios (${collected.services.length}):\n`;
    collected.services.forEach((s, i) => {
      msg += `  ${i + 1}. ${s.name}`;
      if (s.price) msg += ` — ${s.price}`;
      msg += '\n';
    });
  }

  if (collected.photoUrls && collected.photoUrls.length > 0) {
    msg += `\n📸 ${collected.photoUrls.length} foto(s) enviadas\n`;
  }

  if (collected.extraNotes) {
    msg += `\n📌 Notas: ${collected.extraNotes.substring(0, 100)}${collected.extraNotes.length > 100 ? '...' : ''}\n`;
  }

  if (flowData.selectedPlace) {
    const place = flowData.selectedPlace;
    if (place.rating) msg += `\n⭐ Google: ${place.rating}`;
    if (place.reviewCount) msg += ` (${place.reviewCount} reseñas)`;
    if (place.rating || place.reviewCount) msg += '\n';
  }

  msg += '\n¿Todo correcto? Responde *SI* para crear tu página web o *NO* para hacer cambios.';
  return msg;
}


/**
 * Convert legacy preCollected format to ResolvedLeadContext shape.
 */
function convertLegacyPreCollected(preCollected) {
  return {
    sources: preCollected.businessId ? ['businesses'] : [],
    contactType: 'unknown',
    contactName: preCollected.contactName || null,
    email: preCollected.email || null,
    businessId: preCollected.businessId || null,
    businessName: preCollected.businessName || null,
    businessCity: preCollected.businessCity || null,
    businessAddress: preCollected.businessAddress || null,
    businessState: null,
    placeId: null,
    marketingLeadId: null,
    websiteUrl: null,
    websiteStatus: null,
    hasSubscription: false,
    hasEnoughForGoogleMatch: !!(preCollected.businessName && (preCollected.businessAddress || preCollected.businessCity)),
    shouldStartOnboarding: true,
  };
}


// Legacy helpers for backward compat
const LEGACY_REQUIRED_FIELDS = ['contactName', 'email', 'businessName'];

function getLegacyMissingFields(collected) {
  if (!collected) return LEGACY_REQUIRED_FIELDS;
  return LEGACY_REQUIRED_FIELDS.filter(f => !collected[f]);
}

function buildLegacyCollectInfoPrompt(missing, collected) {
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


module.exports = {
  checkOnboardingFlow,
  startOnboardingFlow,
  handleOnboardingMessage,
};
