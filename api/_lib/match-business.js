// Shared helper: match incoming signup data to an existing business, or create a new one.
// Used by free-signup.js and stripe/create-subscription.js

/**
 * Normalize a phone number by stripping spaces, dashes, parens, dots.
 * Keeps leading + if present.
 */
export function normalizePhone(phone) {
  if (!phone) return null;
  return phone.replace(/[\s\-().]/g, '').trim() || null;
}

/**
 * Try to match an existing business by email, phone, or name.
 * If no match, create a new synthetic business.
 *
 * @param {Object} opts
 * @param {string} opts.businessName - Business name (required)
 * @param {string} [opts.email] - Customer email
 * @param {string} [opts.phone] - Customer phone
 * @param {string} opts.supabaseUrl
 * @param {string} opts.supabaseKey
 * @returns {Promise<{ businessId: number, matched: boolean, business: object }>}
 */
export async function matchOrCreateBusiness({ businessName, email, phone, supabaseUrl, supabaseKey }) {
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  const normalizedPhone = normalizePhone(phone);

  // Run matching queries in parallel
  const queries = [];

  if (email) {
    queries.push(
      fetch(
        `${supabaseUrl}/rest/v1/businesses?or=(email.eq.${encodeURIComponent(email)},contact_email.eq.${encodeURIComponent(email)})&select=id,name,email,contact_email,phone,contact_phone,pipeline_status`,
        { headers }
      ).then(r => r.ok ? r.json() : []).then(rows => rows.map(r => ({ ...r, _matchType: 'email' })))
    );
  }

  if (normalizedPhone) {
    // Try matching with the normalized phone
    queries.push(
      fetch(
        `${supabaseUrl}/rest/v1/businesses?or=(phone.eq.${encodeURIComponent(normalizedPhone)},contact_phone.eq.${encodeURIComponent(normalizedPhone)})&select=id,name,email,contact_email,phone,contact_phone,pipeline_status`,
        { headers }
      ).then(r => r.ok ? r.json() : []).then(rows => rows.map(r => ({ ...r, _matchType: 'phone' })))
    );
  }

  if (businessName) {
    queries.push(
      fetch(
        `${supabaseUrl}/rest/v1/businesses?name=ilike.${encodeURIComponent(businessName)}&select=id,name,email,contact_email,phone,contact_phone,pipeline_status`,
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
    if (email && !bestMatch.email && !bestMatch.contact_email) {
      updates.contact_email = email;
    }
    if (normalizedPhone && !bestMatch.phone && !bestMatch.contact_phone) {
      updates.contact_phone = normalizedPhone;
    }

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

    return { businessId: bestMatch.id, matched: true, business: bestMatch };
  }

  // No match — create new synthetic business
  const syntheticPlaceId = 'marketing-' + crypto.randomUUID();
  const bizPayload = {
    place_id: syntheticPlaceId,
    name: businessName,
    phone: normalizedPhone || null,
    email: email || null,
    pipeline_status: 'saved',
  };

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

  return { businessId: business.id, matched: false, business };
}
