// Google Places matching via SearchAPI.io — CommonJS port
// 3-outcome matching: matched, ambiguous, not_found

/**
 * Basic name similarity check — case-insensitive, ignoring accents and punctuation.
 * Ported from api/_lib/match-business.js
 */
function namesMatch(a, b) {
  if (!a || !b) return false;
  const normalize = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, '').trim();
  const na = normalize(a);
  const nb = normalize(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}

/**
 * Parse address components from a SearchAPI address string.
 * Ported from api/_lib/match-business.js
 */
function parseAddressComponents(addressStr) {
  if (!addressStr) return {};
  const parts = addressStr.split(',').map(s => s.trim()).filter(Boolean);
  if (parts.length === 0) return {};

  const result = {};

  for (let i = parts.length - 1; i >= 0 && i >= parts.length - 3; i--) {
    const part = parts[i];

    if (!result.address_zip && /^\d{4,6}$/.test(part)) {
      result.address_zip = part;
      continue;
    }

    const stateZipMatch = part.match(/^([A-Za-zÀ-ÿ.]+)\s+(\d{4,6})$/);
    if (stateZipMatch && !result.address_state) {
      result.address_state = stateZipMatch[1];
      if (!result.address_zip) result.address_zip = stateZipMatch[2];
      continue;
    }

    if (!result.address_state && !result.address_city && /^[A-Za-zÀ-ÿ\s.]{2,30}$/.test(part) && !/^\d/.test(part)) {
      if (i === parts.length - 1 || (i === parts.length - 2 && result.address_zip)) {
        result.address_state = part;
      }
      continue;
    }
  }

  if (result.address_state) {
    const stateIdx = parts.findIndex(p => p.trim() === result.address_state);
    if (stateIdx > 0) {
      const candidate = parts[stateIdx - 1];
      if (/^[A-Za-zÀ-ÿ\s.'-]{2,40}$/.test(candidate)) {
        result.address_city = candidate;
      }
    }
  }

  if (!result.address_city && !result.address_state && parts.length >= 2) {
    const lastPart = result.address_zip ? parts[parts.length - 2] : parts[parts.length - 1];
    if (lastPart && /^[A-Za-zÀ-ÿ\s.'-]{2,40}$/.test(lastPart)) {
      result.address_city = lastPart;
    }
  }

  return result;
}

/**
 * Search Google Maps via SearchAPI.io and return raw results.
 */
async function searchGoogleMaps(query) {
  const apiKey = process.env.SEARCHAPI_KEY;
  if (!apiKey) return null;

  const url = `https://www.searchapi.io/api/v1/search?engine=google_maps&q=${encodeURIComponent(query)}&api_key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url);
  if (!res.ok) {
    console.warn('SearchAPI request failed:', res.status);
    return null;
  }

  const data = await res.json();
  return data.local_results || [];
}

/**
 * Attempt to match a business on Google Maps.
 *
 * @param {Object} opts
 * @param {string} opts.businessName — Business name (required)
 * @param {string} [opts.address] — Full address
 * @param {string} [opts.city] — City name
 * @returns {{ outcome: 'matched'|'ambiguous'|'not_found', match?: Object, candidates?: Object[] }}
 */
async function attemptGoogleMatch({ businessName, address, city }) {
  if (!process.env.SEARCHAPI_KEY) {
    console.warn('SEARCHAPI_KEY not set — skipping Google match');
    return { outcome: 'not_found', reason: 'no_api_key' };
  }

  const location = address || city || '';
  const query = `${businessName}, ${location}`.trim();

  try {
    const results = await searchGoogleMaps(query);
    if (!results || results.length === 0) {
      return { outcome: 'not_found' };
    }

    // Filter results that match the business name
    const nameMatches = results.filter(r => namesMatch(r.title, businessName));

    if (nameMatches.length === 0) {
      return { outcome: 'not_found' };
    }

    if (nameMatches.length === 1) {
      return {
        outcome: 'matched',
        match: formatGoogleResult(nameMatches[0]),
      };
    }

    // Multiple matches — ambiguous
    return {
      outcome: 'ambiguous',
      candidates: nameMatches.slice(0, 5).map(formatGoogleResult),
    };
  } catch (err) {
    console.error('Google match error:', err);
    return { outcome: 'not_found', reason: 'api_error' };
  }
}

/**
 * Format a SearchAPI result into our internal shape.
 */
function formatGoogleResult(result) {
  const addrComponents = parseAddressComponents(result.address);

  return {
    placeId: result.place_id || null,
    dataId: result.data_id || null,
    name: result.title || '',
    address: result.address || null,
    addressCity: addrComponents.address_city || null,
    addressState: addrComponents.address_state || null,
    addressZip: addrComponents.address_zip || null,
    rating: result.rating || null,
    reviewCount: result.reviews || null,
    mapsUrl: result.link || null,
    phone: result.phone || null,
    types: result.type ? [result.type] : null,
    latitude: result.gps_coordinates?.latitude || null,
    longitude: result.gps_coordinates?.longitude || null,
    hours: result.hours || null,
    thumbnail: result.thumbnail || null,
  };
}

/**
 * Match or create a business from a confirmed Google match.
 * Saves to DB: either links to existing business (by place_id) or creates new.
 *
 * @param {Object} googleMatch — From attemptGoogleMatch().match
 * @param {Object} contactInfo — { contactName, email, phone, chatId }
 * @returns {{ businessId: string|number, isNew: boolean }}
 */
async function matchOrCreateFromGoogle(googleMatch, contactInfo) {
  const { createClient } = require('@supabase/supabase-js');
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

  // Check if business with this place_id already exists
  if (googleMatch.placeId) {
    const { data: existing } = await sb
      .from('businesses')
      .select('id')
      .eq('place_id', googleMatch.placeId)
      .limit(1)
      .single();

    if (existing) {
      // Update contact info on existing business
      const updates = {};
      if (contactInfo.contactName) updates.contact_name = contactInfo.contactName;
      if (contactInfo.email) updates.contact_email = contactInfo.email;
      if (contactInfo.phone) updates.contact_phone = contactInfo.phone;
      if (contactInfo.chatId) updates.contact_whatsapp = contactInfo.chatId.replace(/@c\.us$/, '');

      if (Object.keys(updates).length > 0) {
        await sb.from('businesses').update(updates).eq('id', existing.id);
      }

      return { businessId: existing.id, isNew: false };
    }
  }

  // Create new business from Google data
  const addrParts = (googleMatch.address || '').split(',').map(p => p.trim());
  const insertData = {
    name: googleMatch.name,
    place_id: googleMatch.placeId,
    address_full: googleMatch.address,
    address_city: googleMatch.addressCity,
    address_state: googleMatch.addressState,
    address_zip: googleMatch.addressZip,
    rating: googleMatch.rating,
    review_count: googleMatch.reviewCount,
    maps_url: googleMatch.mapsUrl,
    phone: googleMatch.phone,
    types: googleMatch.types,
    latitude: googleMatch.latitude,
    longitude: googleMatch.longitude,
    pipeline_status: 'prospect',
  };

  if (contactInfo.contactName) insertData.contact_name = contactInfo.contactName;
  if (contactInfo.email) insertData.contact_email = contactInfo.email;
  if (contactInfo.phone) insertData.contact_phone = contactInfo.phone;
  if (contactInfo.chatId) insertData.contact_whatsapp = contactInfo.chatId.replace(/@c\.us$/, '');

  const { data: newBiz, error } = await sb
    .from('businesses')
    .insert(insertData)
    .select('id')
    .single();

  if (error) throw new Error(`Failed to create business: ${error.message}`);

  return { businessId: newBiz.id, isNew: true };
}


module.exports = {
  attemptGoogleMatch,
  matchOrCreateFromGoogle,
  namesMatch,
  parseAddressComponents,
  formatGoogleResult,
};
