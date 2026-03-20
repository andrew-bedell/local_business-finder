// Vercel serverless function: Identify a WhatsApp contact by phone number
// POST { phone, message } — matches against businesses, marketing_leads, and whatsapp_conversations
// Returns contact type, business info, and context for AI agent (OpenClaw) routing
// Also logs the inbound message to whatsapp_conversations + whatsapp_messages
//
// Contact types returned:
//   "active_customer"    — has a paid subscription and active website
//   "demo"               — has a generated demo website (not yet paying)
//   "lead"               — in pipeline as a lead (saved or from marketing)
//   "saved_business"     — saved in pipeline but no further engagement yet
//   "marketing_lead"     — submitted info via the marketing website
//   "unknown"            — no match found anywhere

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const endpointSecret = process.env.OPENCLAW_TOOL_SECRET;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  // Optional: verify OpenClaw is the caller via a shared secret
  if (endpointSecret) {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${endpointSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const { phone, message } = req.body || {};
  if (!phone) {
    return res.status(400).json({ error: 'phone is required' });
  }

  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  try {
    // ── Step 1: Normalize the phone number ──
    // WhatsApp sends Mexican numbers with an extra "1" after country code:
    //   WhatsApp: 5216242356580  →  DB: +526242356580
    // We generate multiple search variants to handle this mismatch.
    const variants = buildPhoneVariants(phone);
    const digits = extractDigits(phone);
    const lastTen = digits.slice(-10);

    // Canonical phone for storing in conversations (E.164, strip MX extra "1")
    const canonicalPhone = getCanonicalPhone(digits);

    // We'll build the result object, then log the conversation, then return
    let result = null;
    let matchedBusinessId = null;

    // ── Step 2: Search businesses table ──
    const bizOrConditions = [];
    for (const v of variants) {
      bizOrConditions.push(`phone.eq.${encodeURIComponent(v)}`);
      bizOrConditions.push(`contact_phone.eq.${encodeURIComponent(v)}`);
      bizOrConditions.push(`contact_whatsapp.eq.${encodeURIComponent(v)}`);
    }
    if (lastTen.length === 10) {
      bizOrConditions.push(`phone.ilike.*${lastTen}`);
      bizOrConditions.push(`contact_phone.ilike.*${lastTen}`);
      bizOrConditions.push(`contact_whatsapp.ilike.*${lastTen}`);
    }

    const bizRes = await fetch(
      `${supabaseUrl}/rest/v1/businesses?or=(${bizOrConditions.join(',')})&select=id,name,pipeline_status,contact_name,contact_email,contact_phone,contact_whatsapp,phone,address_full,address_city,category&limit=5`,
      { headers }
    );
    const businesses = bizRes.ok ? await bizRes.json() : [];

    // ── Step 3: If business found, enrich with website info ──
    if (businesses.length > 0) {
      const biz = businesses[0];
      matchedBusinessId = biz.id;

      const webRes = await fetch(
        `${supabaseUrl}/rest/v1/generated_websites?business_id=eq.${biz.id}&select=id,status,site_status,published_url,slug&order=created_at.desc&limit=1`,
        { headers }
      );
      const websites = webRes.ok ? await webRes.json() : [];
      const website = websites[0] || null;

      let subscription = null;
      const custRes = await fetch(
        `${supabaseUrl}/rest/v1/customers?business_id=eq.${biz.id}&select=id,email,contact_name,monthly_price,currency&limit=1`,
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

      const contactType = classifyBusiness(biz, website, subscription);

      result = {
        contact_type: contactType,
        matched: true,
        match_source: 'businesses',
        business: {
          id: biz.id,
          name: biz.name,
          category: biz.category || null,
          city: biz.address_city || null,
          address: biz.address_full || null,
          pipeline_status: biz.pipeline_status,
          contact_name: biz.contact_name || null,
          contact_email: biz.contact_email || null,
        },
        website: website ? {
          published_url: website.published_url || null,
          slug: website.slug || null,
          status: website.status,
          site_status: website.site_status,
        } : null,
        subscription: subscription ? {
          status: subscription.status,
          current_period_end: subscription.current_period_end,
        } : null,
        customer_portal_url: customers.length > 0 ? 'https://ahoratengopagina.com/mipagina' : null,
      };
    }

    // ── Step 4: Search marketing_leads table ──
    if (!result) {
      const leadOrConditions = [];
      for (const v of variants) {
        leadOrConditions.push(`phone.eq.${encodeURIComponent(v)}`);
      }
      if (lastTen.length === 10) {
        leadOrConditions.push(`phone.ilike.*${lastTen}`);
      }

      const leadRes = await fetch(
        `${supabaseUrl}/rest/v1/marketing_leads?or=(${leadOrConditions.join(',')})&select=id,business_name,name,phone,email,city,status,source&order=created_at.desc&limit=1`,
        { headers }
      );
      const leads = leadRes.ok ? await leadRes.json() : [];

      if (leads.length > 0) {
        const lead = leads[0];
        result = {
          contact_type: 'marketing_lead',
          matched: true,
          match_source: 'marketing_leads',
          business: {
            name: lead.business_name,
            contact_name: lead.name || null,
            contact_email: lead.email || null,
            city: lead.city || null,
          },
          lead: {
            id: lead.id,
            status: lead.status,
            source: lead.source,
          },
          website: null,
          subscription: null,
          customer_portal_url: null,
        };
      }
    }

    // ── Step 5: Check whatsapp_conversations for prior contact ──
    if (!result) {
      const convOrConditions = [];
      for (const v of variants) {
        convOrConditions.push(`recipient_phone.eq.${encodeURIComponent(v)}`);
      }
      if (lastTen.length === 10) {
        convOrConditions.push(`recipient_phone.ilike.*${lastTen}`);
      }

      const convRes = await fetch(
        `${supabaseUrl}/rest/v1/whatsapp_conversations?or=(${convOrConditions.join(',')})&select=id,business_id,last_message_at&limit=1`,
        { headers }
      );
      const conversations = convRes.ok ? await convRes.json() : [];

      if (conversations.length > 0 && conversations[0].business_id) {
        matchedBusinessId = conversations[0].business_id;
        const convBizRes = await fetch(
          `${supabaseUrl}/rest/v1/businesses?id=eq.${conversations[0].business_id}&select=id,name,pipeline_status,contact_name,contact_email,category,address_city`,
          { headers }
        );
        const convBiz = convBizRes.ok ? await convBizRes.json() : [];

        if (convBiz.length > 0) {
          const biz = convBiz[0];
          result = {
            contact_type: classifyBusiness(biz, null, null),
            matched: true,
            match_source: 'whatsapp_conversations',
            business: {
              id: biz.id,
              name: biz.name,
              category: biz.category || null,
              city: biz.address_city || null,
              pipeline_status: biz.pipeline_status,
              contact_name: biz.contact_name || null,
              contact_email: biz.contact_email || null,
            },
            website: null,
            subscription: null,
            customer_portal_url: null,
          };
        }
      }
    }

    // ── Step 6: Default to unknown ──
    if (!result) {
      result = {
        contact_type: 'unknown',
        matched: false,
        match_source: null,
        business: null,
        website: null,
        subscription: null,
        customer_portal_url: null,
      };
    }

    // ── Step 7: Log conversation + inbound message (non-blocking) ──
    logConversation({
      supabaseUrl,
      headers,
      canonicalPhone,
      businessId: matchedBusinessId,
      messageText: message || '',
    }).catch(err => console.warn('Conversation logging error (non-blocking):', err.message));

    return res.status(200).json(result);

  } catch (err) {
    console.error('Identify contact error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


// ── Phone number normalization ──

/**
 * Extract only digits from a phone string.
 */
function extractDigits(phone) {
  return (phone || '').replace(/\D/g, '');
}

/**
 * Build multiple phone format variants for fuzzy matching.
 *
 * WhatsApp Mexican numbers include an extra "1" after country code 52:
 *   WhatsApp sends: 5216242356580 (521 + 10 digits)
 *   DB stores:      +526242356580 (+52 + 10 digits)
 *
 * We generate both forms so the query matches regardless of which format is stored.
 */
function buildPhoneVariants(rawPhone) {
  const digits = extractDigits(rawPhone);
  if (!digits || digits.length < 10) return [];

  const variants = new Set();

  // Add as-is with + prefix
  variants.add('+' + digits);

  // If raw input already had +, add that too
  if (rawPhone.startsWith('+')) {
    variants.add(rawPhone.replace(/[^\d+]/g, ''));
  }

  // Mexico: handle the WhatsApp "1" insertion
  // WhatsApp format: 521XXXXXXXXXX (13 digits) → DB format: +52XXXXXXXXXX (12 digits)
  if (digits.startsWith('521') && digits.length === 13) {
    // Strip the "1" → +52 + last 10 digits
    variants.add('+52' + digits.slice(3));
  }
  // Reverse: if DB has +52XXXXXXXXXX and WhatsApp sends 521XXXXXXXXXX
  if (digits.startsWith('52') && digits.length === 12 && !digits.startsWith('521')) {
    // Add with "1" inserted → +521 + last 10 digits
    variants.add('+521' + digits.slice(2));
  }

  // Colombia: similar pattern possible (57 + 1 + number)
  if (digits.startsWith('571') && digits.length === 13) {
    variants.add('+57' + digits.slice(3));
  }
  if (digits.startsWith('57') && digits.length === 12 && !digits.startsWith('571')) {
    variants.add('+571' + digits.slice(2));
  }

  // Always include last 10 digits as local number with common prefixes
  const lastTen = digits.slice(-10);
  if (lastTen.length === 10) {
    variants.add('+52' + lastTen);   // Mexico
    variants.add('+521' + lastTen);  // Mexico WhatsApp
  }

  return [...variants];
}


/**
 * Get a canonical E.164 phone for storing in the DB.
 * Strips the WhatsApp Mexico extra "1" so we store +52XXXXXXXXXX consistently.
 */
function getCanonicalPhone(digits) {
  // Mexico: 521XXXXXXXXXX → +52XXXXXXXXXX
  if (digits.startsWith('521') && digits.length === 13) {
    return '+52' + digits.slice(3);
  }
  // Colombia: 571XXXXXXXXXX → +57XXXXXXXXXX
  if (digits.startsWith('571') && digits.length === 13) {
    return '+57' + digits.slice(3);
  }
  return '+' + digits;
}


// ── Conversation logging ──

/**
 * Upsert a whatsapp_conversations record and log the inbound message.
 * Non-blocking — errors are caught and logged, never returned to the caller.
 *
 * Note: whatsapp_conversations and whatsapp_messages both require business_id (NOT NULL).
 * For unknown contacts (no business match), we skip logging — the conversation will be
 * created once the contact is matched to a business (e.g. via OpenClaw collecting info).
 */
async function logConversation({ supabaseUrl, headers, canonicalPhone, businessId, messageText }) {
  if (!businessId) {
    // Can't log without a business_id (schema constraint). Unknown contacts
    // will get a conversation record once they're matched to a business.
    return;
  }

  const now = new Date().toISOString();
  const messagePreview = (messageText || '').substring(0, 200);

  // Step 1: Find existing conversation by recipient_phone or business_id
  const convLookupRes = await fetch(
    `${supabaseUrl}/rest/v1/whatsapp_conversations?or=(recipient_phone.eq.${encodeURIComponent(canonicalPhone)},business_id.eq.${businessId})&select=id,unread_count&limit=1`,
    { headers }
  );
  const convLookup = convLookupRes.ok ? await convLookupRes.json() : [];

  let conversationId;

  if (convLookup.length > 0) {
    // Update existing conversation
    conversationId = convLookup[0].id;
    await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_conversations?id=eq.${conversationId}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          last_inbound_at: now,
          last_message_text: messagePreview,
          last_message_at: now,
          unread_count: (convLookup[0].unread_count || 0) + 1,
        }),
      }
    );
  } else {
    // Create new conversation
    const createRes = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_conversations`,
      {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify({
          business_id: businessId,
          recipient_phone: canonicalPhone,
          status: 'active',
          last_inbound_at: now,
          last_message_text: messagePreview,
          last_message_at: now,
          unread_count: 1,
        }),
      }
    );
    const created = createRes.ok ? await createRes.json() : [];
    conversationId = created[0]?.id;
  }

  if (!conversationId) return;

  // Step 2: Log the inbound message
  await fetch(
    `${supabaseUrl}/rest/v1/whatsapp_messages`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        conversation_id: conversationId,
        business_id: businessId,
        direction: 'inbound',
        message_type: 'text',
        body: messageText || '',
        status: 'received',
        created_at: now,
      }),
    }
  );
}


// ── Business classification ──

/**
 * Determine the contact type based on business pipeline_status, website, and subscription.
 * Priority: active_customer > demo > lead > saved_business
 */
function classifyBusiness(business, website, subscription) {
  // Active paying customer
  if (business.pipeline_status === 'active_customer' || subscription) {
    return 'active_customer';
  }

  // Inactive/churned customer
  if (business.pipeline_status === 'inactive_customer') {
    return 'inactive_customer';
  }

  // Has a demo website generated
  if (business.pipeline_status === 'demo') {
    return 'demo';
  }
  if (website && (website.status === 'published' || website.status === 'draft') && !subscription) {
    return 'demo';
  }

  // Lead status
  if (business.pipeline_status === 'lead') {
    return 'lead';
  }

  // Saved business (default pipeline status)
  return 'saved_business';
}
