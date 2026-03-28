// Lead resolver — resolves inbound phone number against ALL DB tables
// Returns a merged ResolvedLeadContext for the orchestrator

const { createClient } = require('@supabase/supabase-js');
const { buildPhoneVariants, getCanonicalPhone, extractDigits, fetchBusinessContext, classifyContact } = require('./match-contact');
const { findActiveFlow } = require('./db');

let supabase = null;
function getClient() {
  if (!supabase) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
  }
  return supabase;
}


/**
 * Resolve a phone number against all relevant DB tables.
 * Searches all tables, merges results — does NOT early-return.
 *
 * @param {string} canonicalPhone — E.164 phone (e.g., +526241234567)
 * @param {string[]} phoneVariants — All phone format variants
 * @returns {Object} ResolvedLeadContext
 */
async function resolveLeadByPhone(canonicalPhone, phoneVariants) {
  const sb = getClient();
  const digits = extractDigits(canonicalPhone);
  const lastTen = digits.slice(-10);

  // Initialize context with defaults
  const ctx = {
    phone: canonicalPhone,
    sources: [],
    contactName: null,
    email: null,
    businessId: null,
    businessName: null,
    businessAddress: null,
    businessCity: null,
    businessState: null,
    placeId: null,
    contactType: 'unknown',
    marketingLeadId: null,
    websiteUrl: null,
    websiteStatus: null,
    hasSubscription: false,
    activeFlowId: null,
    activeFlowStep: null,
    conversationId: null,
    existingConversation: null,
    hasEnoughForGoogleMatch: false,
    shouldStartOnboarding: false,
  };

  // Run all lookups in parallel
  const [marketingLead, businessMatch, contactMatch, activeFlow, conversationMatch] = await Promise.allSettled([
    findMarketingLead(sb, phoneVariants, lastTen),
    findBusinessByPhone(sb, phoneVariants, lastTen),
    findBusinessContact(sb, phoneVariants, lastTen),
    findActiveFlow(canonicalPhone),
    findConversation(sb, phoneVariants, lastTen),
  ]);

  // 1. Marketing leads
  if (marketingLead.status === 'fulfilled' && marketingLead.value) {
    const lead = marketingLead.value;
    ctx.sources.push('marketing_leads');
    ctx.marketingLeadId = lead.id;
    if (lead.business_name && !ctx.businessName) ctx.businessName = lead.business_name;
    if (lead.name && !ctx.contactName) ctx.contactName = lead.name;
    if (lead.email && !ctx.email) ctx.email = lead.email;
    if (lead.city && !ctx.businessCity) ctx.businessCity = lead.city;
    if (lead.address && !ctx.businessAddress) ctx.businessAddress = lead.address;
  }

  // 2. Businesses table (direct phone match)
  if (businessMatch.status === 'fulfilled' && businessMatch.value) {
    const biz = businessMatch.value;
    ctx.sources.push('businesses');
    ctx.businessId = biz.id;
    if (biz.name) ctx.businessName = biz.name;
    if (biz.contact_name) ctx.contactName = biz.contact_name;
    if (biz.contact_email) ctx.email = biz.contact_email;
    if (biz.address_full) ctx.businessAddress = biz.address_full;
    if (biz.address_city) ctx.businessCity = biz.address_city;
    if (biz.address_state) ctx.businessState = biz.address_state;
    if (biz.place_id) ctx.placeId = biz.place_id;
  }

  // 3. Business contacts (indirect → business)
  if (contactMatch.status === 'fulfilled' && contactMatch.value) {
    const contact = contactMatch.value;
    ctx.sources.push('business_contacts');
    if (!ctx.businessId && contact.business_id) {
      ctx.businessId = contact.business_id;
    }
    if (contact.contact_name && !ctx.contactName) ctx.contactName = contact.contact_name;
    if (contact.contact_email && !ctx.email) ctx.email = contact.contact_email;
  }

  // 4. Active onboarding flow
  if (activeFlow.status === 'fulfilled' && activeFlow.value) {
    const flow = activeFlow.value;
    ctx.activeFlowId = flow.id;
    ctx.activeFlowStep = flow.step;
    if (flow.business_id && !ctx.businessId) ctx.businessId = flow.business_id;
  }

  // 5. Conversations
  if (conversationMatch.status === 'fulfilled' && conversationMatch.value) {
    const conv = conversationMatch.value;
    ctx.sources.push('whatsapp_conversations');
    ctx.conversationId = conv.id;
    ctx.existingConversation = conv;
    if (conv.business_id && !ctx.businessId) ctx.businessId = conv.business_id;
  }

  // If we have a businessId but haven't enriched context yet, fetch full business context
  if (ctx.businessId && !ctx.sources.includes('businesses')) {
    try {
      const bizCtx = await fetchBusinessContext(ctx.businessId);
      if (bizCtx) {
        ctx.contactType = bizCtx.contactType;
        if (bizCtx.businessName) ctx.businessName = bizCtx.businessName;
        if (bizCtx.contactName && !ctx.contactName) ctx.contactName = bizCtx.contactName;
        if (bizCtx.city && !ctx.businessCity) ctx.businessCity = bizCtx.city;
        ctx.websiteUrl = bizCtx.websiteUrl;
        ctx.websiteStatus = bizCtx.websiteStatus;
        ctx.hasSubscription = bizCtx.hasSubscription;
        ctx.placeId = bizCtx.placeId || ctx.placeId;
      }
    } catch (err) {
      console.warn('Failed to fetch business context:', err.message);
    }
  } else if (ctx.businessId && ctx.sources.includes('businesses')) {
    // We have the raw business row — get full context for contactType classification
    try {
      const bizCtx = await fetchBusinessContext(ctx.businessId);
      if (bizCtx) {
        ctx.contactType = bizCtx.contactType;
        ctx.websiteUrl = bizCtx.websiteUrl;
        ctx.websiteStatus = bizCtx.websiteStatus;
        ctx.hasSubscription = bizCtx.hasSubscription;
      }
    } catch (err) {
      console.warn('Failed to classify contact:', err.message);
    }
  }

  // If only from marketing_leads and no business match
  if (ctx.marketingLeadId && !ctx.businessId) {
    ctx.contactType = 'marketing_lead';
  }

  // Computed fields
  ctx.hasEnoughForGoogleMatch = !!(ctx.businessName && (ctx.businessAddress || ctx.businessCity));

  // Should start onboarding: is a lead/unknown without a website, no active flow, no subscription
  const onboardingEligibleTypes = ['lead', 'saved_business', 'marketing_lead', 'unknown'];
  ctx.shouldStartOnboarding = (
    onboardingEligibleTypes.includes(ctx.contactType) &&
    !ctx.websiteUrl &&
    !ctx.activeFlowId &&
    !ctx.hasSubscription
  );

  return ctx;
}


// ── Table search helpers ──

async function findMarketingLead(sb, phoneVariants, lastTen) {
  const filters = phoneVariants.map(v => `phone.eq.${v}`).join(',');
  let orFilter = filters;
  if (lastTen.length === 10) {
    orFilter += `,phone.ilike.%${lastTen}`;
  }

  const { data, error } = await sb
    .from('marketing_leads')
    .select('id, business_name, name, phone, email, city, address, status, source')
    .or(orFilter)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.warn('findMarketingLead error:', error.message);
  }

  return data || null;
}


async function findBusinessByPhone(sb, phoneVariants, lastTen) {
  const phoneFilters = phoneVariants.map(v => `phone.eq.${v},contact_phone.eq.${v},contact_whatsapp.eq.${v}`).join(',');
  let orFilter = phoneFilters;
  if (lastTen.length === 10) {
    orFilter += `,phone.ilike.%${lastTen},contact_phone.ilike.%${lastTen},contact_whatsapp.ilike.%${lastTen}`;
  }

  const { data, error } = await sb
    .from('businesses')
    .select('id, name, pipeline_status, contact_name, contact_email, contact_phone, contact_whatsapp, phone, address_full, address_city, address_state, place_id, category')
    .or(orFilter)
    .limit(1);

  if (error) {
    console.warn('findBusinessByPhone error:', error.message);
    return null;
  }

  return data?.[0] || null;
}


async function findBusinessContact(sb, phoneVariants, lastTen) {
  const contactFilters = phoneVariants.map(v => `contact_phone.eq.${v},contact_whatsapp.eq.${v}`).join(',');
  let contactOrFilter = contactFilters;
  if (lastTen.length === 10) {
    contactOrFilter += `,contact_phone.ilike.%${lastTen},contact_whatsapp.ilike.%${lastTen}`;
  }

  const { data, error } = await sb
    .from('business_contacts')
    .select('business_id, contact_name, contact_email, contact_phone, contact_whatsapp')
    .or(contactOrFilter)
    .limit(1);

  if (error) {
    console.warn('findBusinessContact error:', error.message);
    return null;
  }

  return data?.[0] || null;
}


async function findConversation(sb, phoneVariants, lastTen) {
  const convFilters = phoneVariants.map(v => `recipient_phone.eq.${v}`).join(',');
  let convOrFilter = convFilters;
  if (lastTen.length === 10) {
    convOrFilter += `,recipient_phone.ilike.%${lastTen}`;
  }

  const { data, error } = await sb
    .from('whatsapp_conversations')
    .select('id, business_id, recipient_phone, unread_count')
    .or(convOrFilter)
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.warn('findConversation error:', error.message);
  }

  return data || null;
}


module.exports = {
  resolveLeadByPhone,
};
