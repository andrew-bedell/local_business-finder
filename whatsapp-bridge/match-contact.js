// Phone matching and business context fetching
// Ported from api/whatsapp/identify-contact.js patterns

const { createClient } = require('@supabase/supabase-js');

let supabase = null;

function getClient() {
  if (!supabase) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
  }
  return supabase;
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
  if (digits.startsWith('521') && digits.length === 13) {
    variants.add('+52' + digits.slice(3));
  }
  if (digits.startsWith('52') && digits.length === 12 && !digits.startsWith('521')) {
    variants.add('+521' + digits.slice(2));
  }

  // Colombia: similar pattern
  if (digits.startsWith('571') && digits.length === 13) {
    variants.add('+57' + digits.slice(3));
  }
  if (digits.startsWith('57') && digits.length === 12 && !digits.startsWith('571')) {
    variants.add('+571' + digits.slice(2));
  }

  // Always include last 10 digits with common prefixes
  const lastTen = digits.slice(-10);
  if (lastTen.length === 10) {
    variants.add('+52' + lastTen);
    variants.add('+521' + lastTen);
  }

  return [...variants];
}

/**
 * Get a canonical E.164 phone for storing in the DB.
 * Strips the WhatsApp Mexico extra "1" so we store +52XXXXXXXXXX consistently.
 */
function getCanonicalPhone(digits) {
  if (digits.startsWith('521') && digits.length === 13) {
    return '+52' + digits.slice(3);
  }
  if (digits.startsWith('571') && digits.length === 13) {
    return '+57' + digits.slice(3);
  }
  return '+' + digits;
}


// ── Contact classification ──

/**
 * Determine the contact type based on business pipeline_status, website, and subscription.
 */
function classifyContact(business, website, subscription) {
  if (business.pipeline_status === 'active_customer' || subscription) return 'active_customer';
  if (business.pipeline_status === 'inactive_customer') return 'inactive_customer';
  if (business.pipeline_status === 'demo') return 'demo';
  if (website && (website.status === 'published' || website.status === 'draft') && !subscription) return 'demo';
  if (business.pipeline_status === 'lead') return 'lead';
  return 'saved_business';
}


// ── Business context fetching ──

/**
 * Fetch full business context: business details, website, customer, subscription.
 */
async function fetchBusinessContext(businessId) {
  const sb = getClient();

  // Fetch business details
  const { data: businesses } = await sb
    .from('businesses')
    .select('id, name, pipeline_status, contact_name, contact_email, contact_phone, category, address_city, address_full')
    .eq('id', businessId)
    .limit(1);

  if (!businesses || businesses.length === 0) return null;
  const biz = businesses[0];

  // Fetch website info
  const { data: websites } = await sb
    .from('generated_websites')
    .select('id, status, site_status, published_url, slug')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(1);
  const website = websites?.[0] || null;

  // Fetch customer + subscription
  let subscription = null;
  const { data: customers } = await sb
    .from('customers')
    .select('id, contact_name, monthly_price, currency')
    .eq('business_id', businessId)
    .limit(1);

  if (customers && customers.length > 0) {
    const { data: subs } = await sb
      .from('subscriptions')
      .select('id, status, current_period_end')
      .eq('customer_id', customers[0].id)
      .eq('status', 'active')
      .limit(1);
    subscription = subs?.[0] || null;
  }

  const contactType = classifyContact(biz, website, subscription);

  return {
    contactType,
    businessId: biz.id,
    businessName: biz.name,
    contactName: biz.contact_name || customers?.[0]?.contact_name || null,
    category: biz.category,
    city: biz.address_city,
    pipelineStatus: biz.pipeline_status,
    websiteUrl: website?.published_url || null,
    websiteSlug: website?.slug || null,
    websiteStatus: website?.site_status || null,
    hasSubscription: !!subscription,
  };
}


// ── Main matching function ──

/**
 * Match a phone number to a business, marketing lead, or existing conversation.
 * Returns context object or null for unknown contacts.
 *
 * @param {string} rawPhone — Phone from WhatsApp (digits, possibly with @c.us stripped)
 * @returns {Object|null} context with contactType, businessId, businessName, etc.
 */
async function matchContact(rawPhone) {
  const sb = getClient();
  const variants = buildPhoneVariants(rawPhone);
  const digits = extractDigits(rawPhone);
  const lastTen = digits.slice(-10);

  if (variants.length === 0) return null;

  try {
    // Step 1: Search businesses table
    const phoneFilters = variants.map(v => `phone.eq.${v},contact_phone.eq.${v},contact_whatsapp.eq.${v}`).join(',');
    let orFilter = phoneFilters;
    if (lastTen.length === 10) {
      orFilter += `,phone.ilike.%${lastTen},contact_phone.ilike.%${lastTen},contact_whatsapp.ilike.%${lastTen}`;
    }

    const { data: businesses } = await sb
      .from('businesses')
      .select('id, name, pipeline_status, contact_name, contact_email, contact_phone, contact_whatsapp, phone, address_full, address_city, category')
      .or(orFilter)
      .limit(5);

    if (businesses && businesses.length > 0) {
      return await fetchBusinessContext(businesses[0].id);
    }

    // Step 2: Search marketing_leads table
    const leadFilters = variants.map(v => `phone.eq.${v}`).join(',');
    let leadOrFilter = leadFilters;
    if (lastTen.length === 10) {
      leadOrFilter += `,phone.ilike.%${lastTen}`;
    }

    const { data: leads } = await sb
      .from('marketing_leads')
      .select('id, business_name, name, phone, email, city, status, source')
      .or(leadOrFilter)
      .order('created_at', { ascending: false })
      .limit(1);

    if (leads && leads.length > 0) {
      const lead = leads[0];
      return {
        contactType: 'marketing_lead',
        businessId: null,
        businessName: lead.business_name,
        contactName: lead.name || null,
        category: null,
        city: lead.city || null,
        pipelineStatus: null,
        websiteUrl: null,
        websiteSlug: null,
        websiteStatus: null,
        hasSubscription: false,
      };
    }

    // Step 3: Check whatsapp_conversations for prior contact
    const convFilters = variants.map(v => `recipient_phone.eq.${v}`).join(',');
    let convOrFilter = convFilters;
    if (lastTen.length === 10) {
      convOrFilter += `,recipient_phone.ilike.%${lastTen}`;
    }

    const { data: conversations } = await sb
      .from('whatsapp_conversations')
      .select('id, business_id, last_message_at')
      .or(convOrFilter)
      .limit(1);

    if (conversations && conversations.length > 0 && conversations[0].business_id) {
      return await fetchBusinessContext(conversations[0].business_id);
    }
  } catch (err) {
    console.error('matchContact error:', err);
  }

  return null;
}


module.exports = {
  matchContact,
  fetchBusinessContext,
  buildPhoneVariants,
  getCanonicalPhone,
  extractDigits,
  classifyContact,
};
