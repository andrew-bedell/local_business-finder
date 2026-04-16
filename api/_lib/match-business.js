// Shared helper: match incoming signup data to an existing business, or create a new one.
// Used by free-signup.js and stripe/create-subscription.js

import { toE164, normalizePhone, countryFromDialCode } from './phone-utils.js';
import { buildInitialEnrichmentState } from './enrichment-runner.js';
export { normalizePhone };

/**
 * Basic name similarity check — case-insensitive, ignoring accents and punctuation.
 */
function namesMatch(a, b) {
  if (!a || !b) return false;
  const normalize = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, '').trim();
  const na = normalize(a);
  const nb = normalize(b);
  // Exact match or one contains the other
  return na === nb || na.includes(nb) || nb.includes(na);
}

/**
 * Parse address components from a SearchAPI address string.
 * Addresses are inconsistent, so we extract what we can from comma-separated parts.
 * Examples:
 *   "Solares Residencial, 45019" → zip=45019
 *   "Calle 60 #500, Centro, Mérida, Yucatán" → city=Mérida, state=Yucatán
 *   "123 Main St, Austin, TX 78701" → city=Austin, state=TX, zip=78701
 */
function parseAddressComponents(addressStr) {
  if (!addressStr) return {};
  const parts = addressStr.split(',').map(s => s.trim()).filter(Boolean);
  if (parts.length === 0) return {};

  const result = {};

  // Check the last few parts for zip/state/city patterns
  for (let i = parts.length - 1; i >= 0 && i >= parts.length - 3; i--) {
    const part = parts[i];

    // Pure zip code (4-6 digits)
    if (!result.address_zip && /^\d{4,6}$/.test(part)) {
      result.address_zip = part;
      continue;
    }

    // US-style "TX 78701" or "Yucatán 97000"
    const stateZipMatch = part.match(/^([A-Za-zÀ-ÿ.]+)\s+(\d{4,6})$/);
    if (stateZipMatch && !result.address_state) {
      result.address_state = stateZipMatch[1];
      if (!result.address_zip) result.address_zip = stateZipMatch[2];
      continue;
    }

    // Short state abbreviation or state name (no digits, not too long)
    if (!result.address_state && !result.address_city && /^[A-Za-zÀ-ÿ\s.]{2,30}$/.test(part) && !/^\d/.test(part)) {
      // If we haven't assigned state yet, this could be state (last non-zip part) or city
      if (i === parts.length - 1 || (i === parts.length - 2 && result.address_zip)) {
        result.address_state = part;
      }
      continue;
    }
  }

  // City: the part just before state (if state was found)
  if (result.address_state) {
    const stateIdx = parts.findIndex(p => p.trim() === result.address_state);
    if (stateIdx > 0) {
      const candidate = parts[stateIdx - 1];
      // Don't use street-like parts as city (containing #, numbers with letters)
      if (/^[A-Za-zÀ-ÿ\s.'-]{2,40}$/.test(candidate)) {
        result.address_city = candidate;
      }
    }
  }

  // If no state found but we have 3+ parts, try the last non-zip part as city
  if (!result.address_city && !result.address_state && parts.length >= 2) {
    const lastPart = result.address_zip ? parts[parts.length - 2] : parts[parts.length - 1];
    if (lastPart && /^[A-Za-zÀ-ÿ\s.'-]{2,40}$/.test(lastPart)) {
      result.address_city = lastPart;
    }
  }

  return result;
}

/**
 * Search for a business on Google Maps via SearchAPI.io.
 * Returns the top result with place_id, address, phone, rating, etc.
 */
async function searchGoogleMaps({ businessName, address, searchApiKey }) {
  const query = `${businessName}, ${address}`;
  const url = `https://www.searchapi.io/api/v1/search?engine=google_maps&q=${encodeURIComponent(query)}&api_key=${encodeURIComponent(searchApiKey)}`;

  const res = await fetch(url);
  if (!res.ok) {
    console.warn('SearchAPI request failed:', res.status);
    return null;
  }

  const data = await res.json();
  const results = data.local_results || [];
  if (results.length === 0) return null;

  const top = results[0];

  // Basic sanity check: name should roughly match
  if (!namesMatch(top.title, businessName)) {
    console.warn('SearchAPI top result name mismatch:', top.title, 'vs', businessName);
    return null;
  }

  // Parse address components from the address string
  const addrComponents = parseAddressComponents(top.address);

  return {
    place_id: top.place_id || null,
    data_id: top.data_id || null,
    name: top.title || businessName,
    address_full: top.address || null,
    address_city: addrComponents.address_city || null,
    address_state: addrComponents.address_state || null,
    address_zip: addrComponents.address_zip || null,
    phone: top.phone || null,
    rating: top.rating || null,
    review_count: top.reviews || null,
    types: top.type ? [top.type] : null,
    maps_url: top.link || null,
    latitude: top.gps_coordinates?.latitude || null,
    longitude: top.gps_coordinates?.longitude || null,
    hours: top.hours || null,
    thumbnail: top.thumbnail || null,
  };
}

/**
 * Try to match an existing business by Google Places, email, phone, or name.
 * If no match, create a new business (enriched with Google data if available).
 *
 * @param {Object} opts
 * @param {string} opts.businessName - Business name (required)
 * @param {string} [opts.email] - Customer email
 * @param {string} [opts.phone] - Customer phone/WhatsApp
 * @param {string} [opts.contactName] - Person's name from form
 * @param {string} [opts.contactWhatsapp] - Person's WhatsApp from form
 * @param {string} [opts.address] - Business address for Google Places matching
 * @param {string} [opts.countryCode] - Dialing code without + (e.g. "52") for country inference
 * @param {string} opts.supabaseUrl
 * @param {string} opts.supabaseKey
 * @returns {Promise<{ businessId: number, matched: boolean, business: object, googleData: object|null }>}
 */
/**
 * Create a contact in business_contacts if we have any contact info.
 * Checks for duplicates by email or phone before creating.
 */
async function ensureContact({ businessId, contactName, contactEmail, contactPhone, contactWhatsapp, headers, supabaseUrl }) {
  if (!contactName && !contactEmail && !contactPhone && !contactWhatsapp) return;

  // Check if a contact with the same email or phone already exists for this business
  const checks = [];
  if (contactEmail) checks.push(`contact_email.eq.${encodeURIComponent(contactEmail)}`);
  if (contactPhone) checks.push(`contact_phone.eq.${encodeURIComponent(contactPhone)}`);
  if (contactWhatsapp) checks.push(`contact_whatsapp.eq.${encodeURIComponent(contactWhatsapp)}`);

  if (checks.length > 0) {
    const existingRes = await fetch(
      `${supabaseUrl}/rest/v1/business_contacts?business_id=eq.${businessId}&or=(${checks.join(',')})&limit=1`,
      { headers }
    );
    const existing = existingRes.ok ? await existingRes.json() : [];
    if (existing.length > 0) return; // Contact already exists
  }

  // Check if business has any contacts — if not, make this one primary
  const countRes = await fetch(
    `${supabaseUrl}/rest/v1/business_contacts?business_id=eq.${businessId}&select=id&limit=1`,
    { headers }
  );
  const existingContacts = countRes.ok ? await countRes.json() : [];
  const isPrimary = existingContacts.length === 0;

  const contactPayload = {
    business_id: businessId,
    contact_name: contactName || null,
    contact_email: contactEmail || null,
    contact_phone: contactPhone || null,
    contact_whatsapp: contactWhatsapp || null,
    is_primary: isPrimary,
  };

  await fetch(`${supabaseUrl}/rest/v1/business_contacts`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=minimal' },
    body: JSON.stringify(contactPayload),
  });
}

export async function matchOrCreateBusiness({ businessName, email, phone, contactName, contactWhatsapp, address, countryCode, leadSource, supabaseUrl, supabaseKey }) {
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  const normalizedPhone = normalizePhone(phone);

  // ── Step 1: Google Places matching (highest priority) ──
  let googleData = null;
  const searchApiKey = process.env.SEARCHAPI_KEY;

  if (address && searchApiKey) {
    try {
      googleData = await searchGoogleMaps({ businessName, address, searchApiKey });
    } catch (err) {
      console.warn('Google Places search error (non-blocking):', err.message);
    }

    // If we got a place_id, check if it already exists in our DB
    if (googleData?.place_id) {
      const placeRes = await fetch(
        `${supabaseUrl}/rest/v1/businesses?place_id=eq.${encodeURIComponent(googleData.place_id)}&select=id,name,email,contact_email,phone,contact_phone,contact_name,contact_whatsapp,pipeline_status`,
        { headers }
      );
      const placeMatches = placeRes.ok ? await placeRes.json() : [];

      if (placeMatches.length > 0) {
        const match = placeMatches[0];
        // Update empty contact fields from form data (never overwrite business phone/email)
        const updates = {};
        if (contactName && !match.contact_name) updates.contact_name = contactName;
        if (email && !match.contact_email) updates.contact_email = email;
        if (normalizedPhone && !match.contact_phone) updates.contact_phone = normalizedPhone;
        if (contactWhatsapp && !match.contact_whatsapp) updates.contact_whatsapp = normalizePhone(contactWhatsapp);

        if (Object.keys(updates).length > 0) {
          await fetch(
            `${supabaseUrl}/rest/v1/businesses?id=eq.${match.id}`,
            {
              method: 'PATCH',
              headers: { ...headers, 'Prefer': 'return=minimal' },
              body: JSON.stringify(updates),
            }
          );
        }

        // Also create a contact record
        await ensureContact({
          businessId: match.id,
          contactName, contactEmail: email,
          contactPhone: normalizedPhone,
          contactWhatsapp: contactWhatsapp ? normalizePhone(contactWhatsapp) : null,
          headers, supabaseUrl,
        });

        return { businessId: match.id, matched: true, business: match, googleData };
      }
    }
  }

  // ── Step 2: Existing DB match (email/phone/name scoring) ──
  const queries = [];

  if (email) {
    queries.push(
      fetch(
        `${supabaseUrl}/rest/v1/businesses?or=(email.eq.${encodeURIComponent(email)},contact_email.eq.${encodeURIComponent(email)})&select=id,name,email,contact_email,phone,contact_phone,contact_name,contact_whatsapp,pipeline_status`,
        { headers }
      ).then(r => r.ok ? r.json() : []).then(rows => rows.map(r => ({ ...r, _matchType: 'email' })))
    );
  }

  if (normalizedPhone) {
    queries.push(
      fetch(
        `${supabaseUrl}/rest/v1/businesses?or=(phone.eq.${encodeURIComponent(normalizedPhone)},contact_phone.eq.${encodeURIComponent(normalizedPhone)})&select=id,name,email,contact_email,phone,contact_phone,contact_name,contact_whatsapp,pipeline_status`,
        { headers }
      ).then(r => r.ok ? r.json() : []).then(rows => rows.map(r => ({ ...r, _matchType: 'phone' })))
    );
  }

  if (businessName) {
    queries.push(
      fetch(
        `${supabaseUrl}/rest/v1/businesses?name=ilike.${encodeURIComponent(businessName)}&select=id,name,email,contact_email,phone,contact_phone,contact_name,contact_whatsapp,pipeline_status`,
        { headers }
      ).then(r => r.ok ? r.json() : []).then(rows => rows.map(r => ({ ...r, _matchType: 'name' })))
    );
  }

  const results = await Promise.all(queries);
  const allCandidates = results.flat();

  // Score candidates: +3 email, +2 phone, +1 name
  const scoreMap = {};
  for (const candidate of allCandidates) {
    const id = candidate.id;
    if (!scoreMap[id]) {
      scoreMap[id] = { business: candidate, score: 0 };
    }
    if (candidate._matchType === 'email') scoreMap[id].score += 3;
    if (candidate._matchType === 'phone') scoreMap[id].score += 2;
    if (candidate._matchType === 'name') scoreMap[id].score += 1;
  }

  // Pick highest scoring candidate (minimum score 1)
  let bestMatch = null;
  let bestScore = 0;
  for (const entry of Object.values(scoreMap)) {
    if (entry.score > bestScore) {
      bestScore = entry.score;
      bestMatch = entry.business;
    }
  }

  if (bestMatch && bestScore >= 1) {
    // Update empty contact fields on the matched business (don't overwrite existing)
    const updates = {};
    if (contactName && !bestMatch.contact_name) updates.contact_name = contactName;
    if (email && !bestMatch.contact_email) updates.contact_email = email;
    if (normalizedPhone && !bestMatch.contact_phone) updates.contact_phone = normalizedPhone;
    if (contactWhatsapp && !bestMatch.contact_whatsapp) updates.contact_whatsapp = normalizePhone(contactWhatsapp);

    if (Object.keys(updates).length > 0) {
      await fetch(
        `${supabaseUrl}/rest/v1/businesses?id=eq.${bestMatch.id}`,
        {
          method: 'PATCH',
          headers: { ...headers, 'Prefer': 'return=minimal' },
          body: JSON.stringify(updates),
        }
      );
    }

    // Also create a contact record
    await ensureContact({
      businessId: bestMatch.id,
      contactName, contactEmail: email,
      contactPhone: normalizedPhone,
      contactWhatsapp: contactWhatsapp ? normalizePhone(contactWhatsapp) : null,
      headers, supabaseUrl,
    });

    return { businessId: bestMatch.id, matched: true, business: bestMatch, googleData };
  }

  // ── Step 3: No match — create new business ──
  // Resolve country from dial code
  const addressCountry = countryCode ? countryFromDialCode(countryCode) : null;

  let bizPayload;

  if (googleData?.place_id) {
    // Create enriched business from Google data
    bizPayload = {
      place_id: googleData.place_id,
      name: googleData.name || businessName,
      address_full: googleData.address_full || address || null,
      address_city: googleData.address_city || null,
      address_state: googleData.address_state || null,
      address_zip: googleData.address_zip || null,
      address_country: addressCountry || null,
      phone: googleData.phone || null,
      rating: googleData.rating || null,
      review_count: googleData.review_count || null,
      types: googleData.types || null,
      category: googleData.types?.[0] || null,
      maps_url: googleData.maps_url || null,
      latitude: googleData.latitude || null,
      longitude: googleData.longitude || null,
      thumbnail: googleData.thumbnail || null,
      contact_name: contactName || null,
      contact_email: email || null,
      contact_phone: normalizedPhone || null,
      contact_whatsapp: contactWhatsapp ? normalizePhone(contactWhatsapp) : null,
      pipeline_status: 'saved',
      lead_source: leadSource || 'website_form',
      ...buildInitialEnrichmentState(googleData.place_id),
    };
  } else {
    // Synthetic business (no Google data available) — still save form address + country
    const syntheticPlaceId = 'marketing-' + crypto.randomUUID();
    const formAddrComponents = parseAddressComponents(address);
    bizPayload = {
      place_id: syntheticPlaceId,
      name: businessName,
      address_full: address || null,
      address_city: formAddrComponents.address_city || null,
      address_state: formAddrComponents.address_state || null,
      address_zip: formAddrComponents.address_zip || null,
      address_country: addressCountry || null,
      contact_name: contactName || null,
      contact_email: email || null,
      contact_phone: normalizedPhone || null,
      contact_whatsapp: contactWhatsapp ? normalizePhone(contactWhatsapp) : null,
      pipeline_status: 'saved',
      lead_source: leadSource || 'website_form',
      ...buildInitialEnrichmentState(syntheticPlaceId),
    };
  }

  const bizRes = await fetch(`${supabaseUrl}/rest/v1/businesses`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=representation' },
    body: JSON.stringify(bizPayload),
  });

  if (!bizRes.ok) {
    const errText = await bizRes.text().catch(() => '');
    throw new Error('Failed to create business: ' + errText);
  }

  const bizRecords = await bizRes.json();
  const business = bizRecords[0];

  // Create a contact record for the new business
  await ensureContact({
    businessId: business.id,
    contactName, contactEmail: email,
    contactPhone: normalizedPhone,
    contactWhatsapp: contactWhatsapp ? normalizePhone(contactWhatsapp) : null,
    headers, supabaseUrl,
  });

  return { businessId: business.id, matched: false, business, googleData };
}
