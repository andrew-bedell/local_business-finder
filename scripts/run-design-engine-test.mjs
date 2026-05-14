#!/usr/bin/env node

import fs from 'node:fs';

let buildCircularLocationBias;
let normalizeGooglePlace;
let parseAddressComponents;
let searchGooglePlacesText;
let buildInitialEnrichmentState;
let insertBusinessWithSchemaFallback;
let runTrackedBusinessEnrichment;
let fetchEnrichedData;
let generateWebsiteForBusiness;
let googlePlacesSearchDisabledReason = '';

async function loadModules() {
  const googlePlaces = await import('../api/_lib/google-places.js');
  const enrichmentRunner = await import('../api/_lib/enrichment-runner.js');
  const websitePipeline = await import('../api/_lib/website-pipeline.js');

  ({
    buildCircularLocationBias,
    normalizeGooglePlace,
    parseAddressComponents,
    searchGooglePlacesText,
  } = googlePlaces);

  ({
    buildInitialEnrichmentState,
    insertBusinessWithSchemaFallback,
    runTrackedBusinessEnrichment,
  } = enrichmentRunner);

  ({
    fetchEnrichedData,
    generateWebsiteForBusiness,
  } = websitePipeline);
}

const DEFAULT_LOCATION = {
  label: 'Ibague, Tolima, Colombia',
  city: 'Ibague',
  displayCity: 'Ibagué',
  state: 'Tolima',
  country: 'CO',
  countryName: 'Colombia',
  latitude: 4.4389,
  longitude: -75.2322,
  radiusMeters: 14000,
};

const DEFAULT_SCENARIOS = [
  {
    key: 'lawyer',
    label: 'Lawyer',
    query: 'abogado en Ibague Tolima',
    includedType: 'lawyer',
    category: 'lawyer',
    subcategory: 'Abogado',
  },
  {
    key: 'plumber',
    label: 'Plumber',
    query: 'plomero en Ibague Tolima',
    includedType: 'plumber',
    category: 'plumber',
    subcategory: 'Plomeria',
  },
  {
    key: 'florist',
    label: 'Florist',
    query: 'floristeria en Ibague Tolima',
    includedType: 'florist',
    category: 'florist',
    subcategory: 'Floristeria',
  },
  {
    key: 'restaurant',
    label: 'Restaurant',
    query: 'restaurante en Ibague Tolima',
    includedType: 'restaurant',
    category: 'restaurant',
    subcategory: 'Restaurante',
  },
  {
    key: 'nail_salon',
    label: 'Nail Salon',
    query: 'salon de unas en Ibague Tolima',
    includedType: 'nail_salon',
    category: 'beauty',
    subcategory: 'Salon de unas',
  },
];

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function parseArgs(argv) {
  const args = {
    keepExisting: false,
    skipGeneration: false,
    location: DEFAULT_LOCATION,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--keep-existing') args.keepExisting = true;
    if (arg === '--skip-generation') args.skipGeneration = true;
    if (arg === '--help') {
      printHelp();
      process.exit(0);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Usage: node scripts/run-design-engine-test.mjs [options]

Creates five Google-sourced test businesses, enriches them, and generates
published websites for visual regression checks against the design engine.

Options:
  --keep-existing    Allow reusing an existing Google place_id if already present.
  --skip-generation  Search, insert, and enrich only.
  --help             Show this message.
`);
}

function buildHeaders(serviceKey) {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  };
}

function normalizeForSlug(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function hasLocationSignal(place, location) {
  const haystack = normalizeForSlug([
    place.address,
    place.shortAddress,
    place.addressCity,
    place.addressState,
  ].filter(Boolean).join(' '));

  return haystack.includes(normalizeForSlug(location.city))
    || haystack.includes(normalizeForSlug(location.displayCity))
    || haystack.includes(normalizeForSlug(location.state));
}

function candidateScore(place, scenario, location, existingPlaceIds) {
  if (!place.placeId) return -1000;
  if (existingPlaceIds.has(place.placeId)) return -500;
  if (place.status === 'CLOSED_PERMANENTLY') return -250;
  if (place.status === 'CLOSED_TEMPORARILY') return -150;

  let score = 0;
  if (place.status === 'OPERATIONAL') score += 30;
  if (hasLocationSignal(place, location)) score += 25;
  if (place.phone) score += 16;
  if (place.website) score += 4;
  if (Array.isArray(place.hours) && place.hours.length) score += 10;
  if (Number(place.rating) >= 4.2) score += 8;
  score += Math.min(Number(place.reviewCount || 0), 120) / 6;
  if ((place.types || []).includes(scenario.includedType)) score += 12;
  if (place.addressCity && normalizeForSlug(place.addressCity).includes(normalizeForSlug(location.city))) score += 10;
  return score;
}

async function restJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${url} failed ${response.status}: ${text.slice(0, 300)}`);
  }
  return payload;
}

async function fetchAllRows({ supabaseUrl, headers, table, query }) {
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const join = query.includes('?') ? '&' : '?';
    const url = `${supabaseUrl}/rest/v1/${table}${query}${join}limit=1000&offset=${offset}`;
    const chunk = await restJson(url, { headers });
    rows.push(...(chunk || []));
    if (!chunk || chunk.length < 1000) break;
  }
  return rows;
}

async function fetchExistingPlaceIds({ supabaseUrl, headers }) {
  const rows = await fetchAllRows({
    supabaseUrl,
    headers,
    table: 'businesses',
    query: '?select=place_id',
  });
  return new Set(rows.map((row) => row.place_id).filter(Boolean));
}

async function searchScenario({ scenario, location, googlePlacesApiKey, existingPlaceIds, keepExisting }) {
  const normalized = await findPlacesForScenario({ scenario, location, googlePlacesApiKey });
  const ranked = normalized
    .filter((place) => keepExisting || !existingPlaceIds.has(place.placeId))
    .sort((left, right) => (
      candidateScore(right, scenario, location, existingPlaceIds)
      - candidateScore(left, scenario, location, existingPlaceIds)
    ));

  if (!ranked.length) {
    throw new Error(`No usable Google Places result for ${scenario.label}`);
  }

  return ranked[0];
}

async function findPlacesForScenario({ scenario, location, googlePlacesApiKey }) {
  if (googlePlacesApiKey && !googlePlacesSearchDisabledReason) {
    try {
      const result = await searchGooglePlacesText({
        apiKey: googlePlacesApiKey,
        textQuery: scenario.query,
        languageCode: 'es',
        regionCode: 'CO',
        maxResultCount: 20,
        includedType: scenario.includedType,
        locationBias: buildCircularLocationBias({
          lat: location.latitude,
          lng: location.longitude,
          radiusMeters: location.radiusMeters,
        }),
      });
      return result.places.map((place) => normalizeGooglePlace(place));
    } catch (err) {
      if (String(err.message || '').toLowerCase().includes('api_key_invalid')) {
        googlePlacesSearchDisabledReason = err.message;
      }
      console.warn(`Google Places search failed for ${scenario.label}; falling back to SearchAPI: ${err.message}`);
    }
  } else if (googlePlacesSearchDisabledReason) {
    console.warn(`Skipping Google Places for ${scenario.label}; previous failure indicated the key is unavailable.`);
  }

  const searchApiKey = process.env.SEARCHAPI_KEY || '';
  if (!searchApiKey) throw new Error('Missing SEARCHAPI_KEY for search fallback');
  return searchViaSearchApi({ scenario, location, searchApiKey });
}

async function searchViaSearchApi({ scenario, location, searchApiKey }) {
  const params = new URLSearchParams({
    engine: 'google_maps',
    q: scenario.query,
    ll: `@${location.latitude},${location.longitude},13z`,
    hl: 'es',
    api_key: searchApiKey,
  });

  const response = await fetch(`https://www.searchapi.io/api/v1/search?${params.toString()}`);
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`SearchAPI search failed (${response.status}): ${text.slice(0, 300)}`);
  }

  const data = await response.json();
  return (data.local_results || []).map(normalizeSearchApiPlace).filter((place) => place.placeId);
}

function normalizeSearchApiPlace(place) {
  const address = place.address || '';
  const parsedAddress = parseAddressComponents(address);
  const hours = [];
  if (place.open_hours && typeof place.open_hours === 'object') {
    for (const [day, value] of Object.entries(place.open_hours)) {
      if (value) hours.push(`${day}: ${value}`);
    }
  }

  return {
    name: place.title || '',
    address,
    shortAddress: address,
    phone: place.phone || '',
    website: place.website || '',
    rating: place.rating || 0,
    reviewCount: place.reviews || 0,
    status: place.open_state === 'Closed permanently' ? 'CLOSED_PERMANENTLY'
      : place.open_state === 'Temporarily closed' ? 'CLOSED_TEMPORARILY'
      : 'OPERATIONAL',
    mapsUrl: place.link || '',
    types: place.types || (place.type ? [place.type] : []),
    placeId: place.place_id || '',
    dataId: place.data_id || '',
    hours,
    latitude: place.gps_coordinates?.latitude || null,
    longitude: place.gps_coordinates?.longitude || null,
    description: place.description || '',
    thumbnail: place.thumbnail || '',
    priceLevel: null,
    priceDescription: place.price || place.price_description || '',
    serviceOptions: [],
    amenities: [],
    highlights: [],
    accessibility: [],
    addressCity: parsedAddress.address_city || null,
    addressState: parsedAddress.address_state || null,
    addressZip: parsedAddress.address_zip || null,
    source: 'searchapi',
  };
}

function buildBusinessPayload({ scenario, place, location, runId }) {
  return {
    name: place.name,
    place_id: place.placeId,
    category: scenario.category,
    subcategory: scenario.subcategory,
    address_full: place.address || null,
    address_city: place.addressCity || location.displayCity,
    address_state: place.addressState || location.state,
    address_zip: place.addressZip || null,
    address_country: location.country,
    latitude: place.latitude || null,
    longitude: place.longitude || null,
    phone: place.phone || null,
    whatsapp: place.phone || null,
    website: place.website || null,
    maps_url: place.mapsUrl || null,
    types: Array.isArray(place.types) ? place.types : null,
    rating: place.rating || null,
    review_count: place.reviewCount || 0,
    business_status: place.status || 'UNKNOWN',
    hours: Array.isArray(place.hours) && place.hours.length ? place.hours : null,
    thumbnail: place.thumbnail || null,
    service_options: place.serviceOptions || null,
    amenities: place.amenities || null,
    highlights: place.highlights || null,
    search_location: location.label,
    search_type: `design_engine_test:${scenario.key}`,
    lead_source: 'manual',
    pipeline_status: 'lead',
    notes: [
      `DESIGN_ENGINE_TEST ${runId}`,
      'Automatically created for internal design engine regression testing only.',
      'Do not sell to, outreach, or use as a customer demo.',
    ].join('\n'),
    ...buildInitialEnrichmentState(place.placeId),
  };
}

async function createBusiness({ supabaseUrl, headers, scenario, place, location, runId }) {
  const existing = await restJson(
    `${supabaseUrl}/rest/v1/businesses?place_id=eq.${encodeURIComponent(place.placeId)}&select=id,name`,
    { headers }
  );

  if (Array.isArray(existing) && existing.length) {
    return {
      id: existing[0].id,
      name: existing[0].name,
      reused: true,
    };
  }

  const insertResponse = await insertBusinessWithSchemaFallback({
    supabaseUrl,
    headers,
    payload: buildBusinessPayload({ scenario, place, location, runId }),
  });
  const rows = await insertResponse.json();
  if (!Array.isArray(rows) || !rows.length) throw new Error(`Insert returned no business for ${scenario.label}`);
  return {
    id: rows[0].id,
    name: rows[0].name,
    reused: false,
  };
}

async function fetchBusiness({ supabaseUrl, headers, businessId }) {
  const rows = await restJson(
    `${supabaseUrl}/rest/v1/businesses?id=eq.${encodeURIComponent(businessId)}&select=*`,
    { headers }
  );
  if (!Array.isArray(rows) || !rows.length) throw new Error(`Business ${businessId} not found`);
  return rows[0];
}

function calculateCompleteness(business, enriched) {
  let score = 0;
  if (business.name && business.address_full) score += 10;
  if (business.phone) score += 10;
  if (Array.isArray(business.hours) && business.hours.length > 0) score += 10;
  if (business.category || (Array.isArray(business.types) && business.types.length > 0)) score += 5;
  if (enriched.reviews.length >= 3) score += 15;
  if (enriched.reviews.length >= 5) score += 10;
  if (enriched.photos.length >= 3) score += 15;
  if (enriched.photos.length >= 5) score += 10;
  if (enriched.socialProfiles.length > 0) score += 5;
  if (business.description || (Array.isArray(business.highlights) && business.highlights.length > 0)) score += 10;
  return Math.min(score, 100);
}

async function updateBusinessCompleteness({ supabaseUrl, headers, businessId, completeness }) {
  await restJson(`${supabaseUrl}/rest/v1/businesses?id=eq.${encodeURIComponent(businessId)}`, {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify({ data_completeness_score: completeness }),
  });
}

async function run() {
  loadEnv('.env.local');
  loadEnv('.env');
  if (!process.env.API_BASE_URL) process.env.API_BASE_URL = 'https://www.ahoratengopagina.com';
  await loadModules();

  const args = parseArgs(process.argv.slice(2));
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY || '';
  const searchApiKey = process.env.SEARCHAPI_KEY || '';

  if (!supabaseUrl || !serviceKey) throw new Error('Missing SUPABASE_URL or service-role key');
  if (!googlePlacesApiKey && !searchApiKey) throw new Error('Missing GOOGLE_PLACES_API_KEY or SEARCHAPI_KEY');

  const headers = buildHeaders(serviceKey);
  const runId = `DET-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  const existingPlaceIds = await fetchExistingPlaceIds({ supabaseUrl, headers });
  const results = [];

  console.log(`Design Engine Test ${runId}`);
  console.log(`Location: ${args.location.label}`);

  for (const scenario of DEFAULT_SCENARIOS) {
    console.log(`\n=== ${scenario.label} ===`);
    const place = await searchScenario({
      scenario,
      location: args.location,
      googlePlacesApiKey,
      existingPlaceIds,
      keepExisting: args.keepExisting,
    });
    console.log(`Selected: ${place.name} (${place.rating || 'no rating'}, ${place.reviewCount || 0} reviews)`);

    const created = await createBusiness({
      supabaseUrl,
      headers,
      scenario,
      place,
      location: args.location,
      runId,
    });
    existingPlaceIds.add(place.placeId);
    console.log(`${created.reused ? 'Reused' : 'Created'} business_id=${created.id}`);

    const enrichment = await runTrackedBusinessEnrichment({
      businessId: created.id,
      placeId: place.placeId,
      businessName: created.name,
      businessAddress: place.address,
      supabaseUrl,
      supabaseKey: serviceKey,
      triggerSource: 'manual',
    });
    console.log(`Enrichment: ${enrichment.status || (enrichment.success ? 'completed' : 'failed')}`);

    const enrichedBusiness = await fetchBusiness({ supabaseUrl, headers, businessId: created.id });
    const enriched = await fetchEnrichedData(created.id, supabaseUrl, headers);
    const completeness = calculateCompleteness(enrichedBusiness, enriched);
    await updateBusinessCompleteness({ supabaseUrl, headers, businessId: created.id, completeness });
    console.log(`Completeness: ${completeness}; photos=${enriched.photos.length}; reviews=${enriched.reviews.length}; websitePhotos=${enriched.websitePhotos.length}`);

    let website = null;
    if (!args.skipGeneration) {
      website = await generateWebsiteForBusiness(enrichedBusiness, supabaseUrl, headers, { autoGenerated: true });
      console.log(`Website: ${website.publishedUrl || website.websiteId}`);
    }

    results.push({
      scenario: scenario.label,
      businessId: created.id,
      businessName: created.name,
      placeId: place.placeId,
      completeness,
      websiteId: website?.websiteId || null,
      websiteUrl: website?.publishedUrl || null,
    });
  }

  console.log('\n=== Design Engine Test Results ===');
  console.log(JSON.stringify({ runId, results }, null, 2));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
