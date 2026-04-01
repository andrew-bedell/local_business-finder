// WhatsApp Auto-Reply Engine — replaces OpenClaw external AI agent
// Identifies contacts, generates contextual responses, sends via Meta Cloud API
//
// Called by webhook.js after logging inbound messages.
// Skips auto-reply if an employee recently replied (avoids interrupting active chats).

/**
 * Main entry point — called from webhook after inbound message is logged.
 *
 * @param {Object} opts
 * @param {string} opts.senderPhone     — Sender's phone (digits only, from Meta webhook)
 * @param {string} opts.messageBody     — Inbound message text
 * @param {string} opts.messageType     — 'text', 'image', etc.
 * @param {string|null} opts.businessId — Matched business ID (if webhook found one)
 * @param {string|null} opts.conversationId — Conversation ID (if exists)
 * @param {string} opts.supabaseUrl
 * @param {string} opts.supabaseKey
 */
export async function handleAutoReply({
  senderPhone,
  messageBody,
  messageType,
  businessId,
  conversationId,
  supabaseUrl,
  supabaseKey,
}) {
  // Only handle text messages for now
  if (messageType !== 'text') return;

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken) {
    console.warn('WhatsApp auto-reply: credentials not configured');
    return;
  }

  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  // Skip auto-reply if disabled for this conversation or any conversation for this business
  if (conversationId) {
    const disabled = await isAutoReplyDisabled(conversationId, supabaseUrl, headers);
    if (disabled) return;
  }
  if (businessId) {
    const disabled = await isAutoReplyDisabledForBusiness(businessId, supabaseUrl, headers);
    if (disabled) return;
  }

  // Skip auto-reply if employee replied recently (within 30 min)
  if (conversationId) {
    const skip = await hasRecentOutbound(conversationId, supabaseUrl, headers);
    if (skip) return;
  }

  // Fetch full business context if we have a match
  let context = null;
  if (businessId) {
    context = await fetchBusinessContext(businessId, supabaseUrl, headers);
  }

  // If no businessId, try matching by phone (covers cases webhook missed)
  if (!context) {
    context = await matchByPhone(senderPhone, supabaseUrl, headers);
  }

  // Generate reply
  const reply = generateReply(context, messageBody);
  if (!reply) return;

  // Send via Meta Cloud API
  const wamid = await sendWhatsAppReply('+' + senderPhone, reply, phoneNumberId, accessToken);

  // Log outbound message
  if (wamid && conversationId) {
    await logOutboundMessage({
      conversationId,
      businessId: context?.businessId || businessId,
      body: reply,
      wamid,
      supabaseUrl,
      headers,
    });
  }
}


// ── Business Context Fetching ──

async function fetchBusinessContext(businessId, supabaseUrl, headers) {
  try {
    // Fetch business details
    const bizRes = await fetch(
      `${supabaseUrl}/rest/v1/businesses?id=eq.${businessId}&select=id,name,pipeline_status,contact_name,contact_email,contact_phone,category,address_city,address_full`,
      { headers }
    );
    const businesses = bizRes.ok ? await bizRes.json() : [];
    if (businesses.length === 0) return null;
    const biz = businesses[0];

    // Fetch website info
    const webRes = await fetch(
      `${supabaseUrl}/rest/v1/generated_websites?business_id=eq.${businessId}&select=id,status,site_status,published_url,slug&order=created_at.desc&limit=1`,
      { headers }
    );
    const websites = webRes.ok ? await webRes.json() : [];
    const website = websites[0] || null;

    // Fetch customer + subscription
    let subscription = null;
    const custRes = await fetch(
      `${supabaseUrl}/rest/v1/customers?business_id=eq.${businessId}&select=id,contact_name,monthly_price,currency&limit=1`,
      { headers }
    );
    const customers = custRes.ok ? await custRes.json() : [];
    if (customers.length > 0) {
      const subRes = await fetch(
        `${supabaseUrl}/rest/v1/subscriptions?customer_id=eq.${customers[0].id}&status=eq.active&select=id,status,current_period_end&limit=1`,
        { headers }
      );
      const subs = subRes.ok ? await subRes.json() : [];
      subscription = subs[0] || null;
    }

    // Classify contact type
    const contactType = classifyContact(biz, website, subscription);

    return {
      contactType,
      businessId: biz.id,
      businessName: biz.name,
      contactName: biz.contact_name || customers[0]?.contact_name || null,
      category: biz.category,
      city: biz.address_city,
      pipelineStatus: biz.pipeline_status,
      websiteUrl: website?.published_url || null,
      websiteSlug: website?.slug || null,
      websiteStatus: website?.site_status || null,
      hasSubscription: !!subscription,
    };
  } catch (err) {
    console.error('fetchBusinessContext error:', err);
    return null;
  }
}

function classifyContact(business, website, subscription) {
  if (business.pipeline_status === 'active_customer' || subscription) return 'active_customer';
  if (business.pipeline_status === 'inactive_customer') return 'inactive_customer';
  if (business.pipeline_status === 'demo') return 'demo';
  if (website && (website.status === 'published' || website.status === 'draft') && !subscription) return 'demo';
  if (business.pipeline_status === 'lead') return 'lead';
  return 'saved_business';
}


// ── Phone Matching (fallback when webhook didn't match) ──

async function matchByPhone(senderPhone, supabaseUrl, headers) {
  const digits = senderPhone.replace(/\D/g, '');
  const lastTen = digits.slice(-10);
  if (lastTen.length < 10) return null;

  try {
    // Search businesses by phone variants (includes whatsapp column for business WhatsApp numbers)
    const bizRes = await fetch(
      `${supabaseUrl}/rest/v1/businesses?or=(phone.ilike.*${lastTen},contact_phone.ilike.*${lastTen},contact_whatsapp.ilike.*${lastTen},whatsapp.ilike.*${lastTen})&select=id&limit=1`,
      { headers }
    );
    if (!bizRes.ok) {
      console.error('matchByPhone business lookup failed:', bizRes.status, await bizRes.text().catch(() => ''));
      return null;
    }
    const businesses = await bizRes.json();
    if (businesses.length > 0) {
      console.log('[responder] matchByPhone: matched via businesses table:', businesses[0].id, '| phone:', senderPhone);
      return await fetchBusinessContext(businesses[0].id, supabaseUrl, headers);
    }

    // Check business_contacts table
    const contactRes = await fetch(
      `${supabaseUrl}/rest/v1/business_contacts?or=(contact_phone.ilike.*${lastTen},contact_whatsapp.ilike.*${lastTen})&select=business_id&limit=1`,
      { headers }
    );
    if (contactRes.ok) {
      const contacts = await contactRes.json();
      if (contacts.length > 0) {
        console.log('[responder] matchByPhone: matched via business_contacts:', contacts[0].business_id, '| phone:', senderPhone);
        return await fetchBusinessContext(contacts[0].business_id, supabaseUrl, headers);
      }
    } else {
      console.error('[responder] matchByPhone: business_contacts lookup failed:', contactRes.status, await contactRes.text().catch(() => ''));
    }

    // Check marketing_leads
    const leadRes = await fetch(
      `${supabaseUrl}/rest/v1/marketing_leads?phone.ilike.*${lastTen}&select=id,business_name,name,city&limit=1`,
      { headers }
    );
    const leads = leadRes.ok ? await leadRes.json() : [];
    if (leads.length > 0) {
      return {
        contactType: 'marketing_lead',
        businessId: null,
        businessName: leads[0].business_name,
        contactName: leads[0].name,
        category: null,
        city: leads[0].city,
        pipelineStatus: null,
        websiteUrl: null,
        websiteSlug: null,
        websiteStatus: null,
        hasSubscription: false,
      };
    }
  } catch (err) {
    console.error('[responder] matchByPhone error:', err);
  }

  console.log('[responder] matchByPhone: no match found for phone:', senderPhone);
  return null;
}


// ── Reply Generation ──

function generateReply(context, inboundMessage) {
  // Unknown contact — ask for identification
  if (!context) {
    return '¡Hola! Gracias por escribirnos a AhoraTengoPagina. 👋\n\n' +
      'Para poder atenderte mejor, ¿podrías decirnos:\n\n' +
      '1️⃣ El nombre de tu negocio\n' +
      '2️⃣ En qué ciudad te encuentras\n\n' +
      '¡Estamos para ayudarte!';
  }

  const name = context.contactName ? ` ${context.contactName}` : '';
  const bizName = context.businessName || 'tu negocio';

  switch (context.contactType) {
    case 'active_customer':
      return `¡Hola${name}! Soy el asistente de AhoraTengoPagina. 😊\n\n` +
        `¿En qué puedo ayudarte con la página web de *${bizName}*?\n\n` +
        'Puedo ayudarte con:\n' +
        '• Cambios en tu página web\n' +
        '• Preguntas sobre tu suscripción\n' +
        '• Soporte técnico';

    case 'inactive_customer':
      return `¡Hola${name}! Vemos que antes tenías una página web con nosotros para *${bizName}*.\n\n` +
        '¿Te gustaría reactivar tu suscripción? Estamos aquí para ayudarte.';

    case 'demo':
      if (context.websiteUrl) {
        return `¡Hola${name}! 👋\n\n` +
          `Creamos una página web de demostración para *${bizName}*. Puedes verla aquí:\n\n` +
          `🔗 ${context.websiteUrl}\n\n` +
          '¿Qué te parece? ¿Te gustaría activarla para que tus clientes la puedan ver?';
      }
      return `¡Hola${name}! Tenemos una demostración lista para *${bizName}*.\n\n` +
        '¿Te gustaría verla? Te la puedo enviar por aquí.';

    case 'lead':
      return `¡Hola${name}! Gracias por tu interés en AhoraTengoPagina. 🙌\n\n` +
        `Estamos listos para crear una página web profesional para *${bizName}*.\n\n` +
        '¿Te gustaría que te mostremos cómo quedaría? Es sin compromiso.';

    case 'marketing_lead':
      return `¡Hola${name}! Gracias por registrarte en AhoraTengoPagina. 🎉\n\n` +
        `Vimos que estás interesado en una página web para *${bizName}*.\n\n` +
        '¿Te gustaría que te mostremos cómo quedaría tu página? Creamos una demostración gratis.';

    case 'saved_business':
      return `¡Hola${name}! Somos AhoraTengoPagina. 👋\n\n` +
        `Tenemos información sobre *${bizName}* y nos encantaría ayudarte a tener presencia en internet.\n\n` +
        '¿Te interesaría ver cómo quedaría una página web para tu negocio? Es completamente gratis la demostración.';

    default:
      return `¡Hola${name}! Gracias por escribirnos a AhoraTengoPagina.\n\n` +
        '¿En qué podemos ayudarte?';
  }
}


// ── Auto-Reply Disabled Check ──

async function isAutoReplyDisabled(conversationId, supabaseUrl, headers) {
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_conversations?id=eq.${conversationId}&select=auto_reply_disabled`,
      { headers }
    );
    const data = res.ok ? await res.json() : [];
    return data.length > 0 && data[0].auto_reply_disabled === true;
  } catch (err) {
    console.error('isAutoReplyDisabled check failed, defaulting to disabled:', err);
    return true;
  }
}


async function isAutoReplyDisabledForBusiness(businessId, supabaseUrl, headers) {
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_conversations?business_id=eq.${businessId}&auto_reply_disabled=eq.true&select=id&limit=1`,
      { headers }
    );
    const data = res.ok ? await res.json() : [];
    return data.length > 0;
  } catch (err) {
    console.error('isAutoReplyDisabledForBusiness check failed, defaulting to disabled:', err);
    return true;
  }
}


// ── Recent Outbound Check ──

async function hasRecentOutbound(conversationId, supabaseUrl, headers) {
  try {
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const res = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_messages?conversation_id=eq.${conversationId}&direction=eq.outbound&created_at=gte.${thirtyMinAgo}&select=id&limit=1`,
      { headers }
    );
    const data = res.ok ? await res.json() : [];
    return data.length > 0;
  } catch {
    return false;
  }
}


// ── Send via Meta Cloud API ──

async function sendWhatsAppReply(phone, message, phoneNumberId, accessToken) {
  try {
    const resp = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: { body: message },
        }),
      }
    );

    const data = await resp.json();
    if (!resp.ok) {
      console.error('Auto-reply Meta API error:', data);
      return null;
    }

    return data.messages?.[0]?.id || null;
  } catch (err) {
    console.error('Auto-reply send error:', err);
    return null;
  }
}


// ── Log Outbound Message ──

async function logOutboundMessage({ conversationId, businessId, body, wamid, supabaseUrl, headers }) {
  try {
    const now = new Date().toISOString();

    // Insert message record
    await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_messages`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          conversation_id: conversationId,
          business_id: businessId,
          direction: 'outbound',
          message_type: 'text',
          body,
          wamid,
          status: 'sent',
          sent_at: now,
        }),
      }
    );

    // Update conversation
    await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_conversations?id=eq.${conversationId}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          last_message_text: body.substring(0, 200),
          last_message_at: now,
        }),
      }
    );
  } catch (err) {
    console.error('logOutboundMessage error:', err);
  }
}
