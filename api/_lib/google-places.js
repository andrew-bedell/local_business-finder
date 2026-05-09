const SEARCH_TEXT_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.shortFormattedAddress',
  'places.internationalPhoneNumber',
  'places.websiteUri',
  'places.rating',
  'places.userRatingCount',
  'places.businessStatus',
  'places.googleMapsUri',
  'places.types',
  'places.primaryTypeDisplayName',
  'places.location',
  'places.regularOpeningHours',
  'places.addressComponents',
  'places.priceLevel',
].join(',');

const PLACE_DETAILS_FIELD_MASK = [
  'id',
  'displayName',
  'formattedAddress',
  'shortFormattedAddress',
  'internationalPhoneNumber',
  'websiteUri',
  'rating',
  'userRatingCount',
  'businessStatus',
  'googleMapsUri',
  'types',
  'primaryTypeDisplayName',
  'location',
  'regularOpeningHours',
  'addressComponents',
  'editorialSummary',
  'priceLevel',
  'reviews',
  'photos',
  'takeout',
  'delivery',
  'dineIn',
  'curbsidePickup',
  'reservable',
  'servesBreakfast',
  'servesLunch',
  'servesDinner',
  'servesBeer',
  'servesWine',
  'servesBrunch',
  'servesCocktails',
  'servesCoffee',
  'servesDessert',
  'servesVegetarianFood',
  'menuForChildren',
  'outdoorSeating',
  'restroom',
  'goodForChildren',
  'goodForGroups',
  'goodForWatchingSports',
  'liveMusic',
  'allowsDogs',
  'paymentOptions',
  'parkingOptions',
  'accessibilityOptions',
].join(',');

const PLACE_NAME_SUFFIX_MARKERS = [
  ' sede ',
  ' sucursal ',
  ' branch ',
  ' location ',
  ' local ',
  ' mall ',
  ' centro comercial ',
  ' cc ',
];

function normalizePlaceName(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function trimPlaceNameSuffix(value) {
  const normalized = ` ${normalizePlaceName(value)} `;
  let cutIndex = normalized.length;

  for (const marker of PLACE_NAME_SUFFIX_MARKERS) {
    const index = normalized.indexOf(marker);
    if (index > 0 && index < cutIndex) {
      cutIndex = index;
    }
  }

  return normalized.slice(0, cutIndex).trim();
}

function compactPlaceName(value) {
  return normalizePlaceName(value).replace(/\s+/g, '');
}

function levenshteinDistance(left, right) {
  if (left === right) return 0;
  if (!left) return right.length;
  if (!right) return left.length;

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = new Array(right.length + 1);

  for (let i = 1; i <= left.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost
      );
    }
    for (let j = 0; j <= right.length; j += 1) {
      previous[j] = current[j];
    }
  }

  return previous[right.length];
}

function similarityRatio(left, right) {
  if (!left || !right) return 0;
  if (left === right) return 1;
  const maxLength = Math.max(left.length, right.length);
  if (!maxLength) return 1;
  return 1 - (levenshteinDistance(left, right) / maxLength);
}

function tokenSimilarity(left, right) {
  const leftTokens = normalizePlaceName(left).split(' ').filter(Boolean);
  const rightTokens = normalizePlaceName(right).split(' ').filter(Boolean);
  if (!leftTokens.length || !rightTokens.length) return 0;

  const [shorter, longer] = leftTokens.length <= rightTokens.length
    ? [leftTokens, rightTokens]
    : [rightTokens, leftTokens];

  let score = 0;
  for (const token of shorter) {
    let best = 0;
    for (const candidate of longer) {
      if (candidate === token) {
        best = 1;
        break;
      }
      best = Math.max(best, similarityRatio(token, candidate));
    }
    score += best;
  }

  return score / shorter.length;
}

export function nameMatchScore(a, b) {
  if (!a || !b) return 0;

  const variantsLeft = [
    normalizePlaceName(a),
    trimPlaceNameSuffix(a),
    compactPlaceName(a),
    trimPlaceNameSuffix(a).replace(/\s+/g, ''),
  ].filter(Boolean);

  const variantsRight = [
    normalizePlaceName(b),
    trimPlaceNameSuffix(b),
    compactPlaceName(b),
    trimPlaceNameSuffix(b).replace(/\s+/g, ''),
  ].filter(Boolean);

  let best = 0;

  for (const left of variantsLeft) {
    for (const right of variantsRight) {
      if (left === right) return 1;
      if (left.includes(right) || right.includes(left)) {
        best = Math.max(best, Math.min(left.length, right.length) / Math.max(left.length, right.length));
      }
      best = Math.max(best, similarityRatio(left, right));
      if (left.includes(' ') || right.includes(' ')) {
        best = Math.max(best, tokenSimilarity(left, right));
      }
    }
  }

  return best;
}

export function namesMatch(a, b, { threshold = 0.72 } = {}) {
  return nameMatchScore(a, b) >= threshold;
}

export function humanizePlaceType(value) {
  return String(value || '')
    .trim()
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ');
}

export function parseAddressComponents(addressStr) {
  if (!addressStr) return {};
  const parts = String(addressStr).split(',').map((part) => part.trim()).filter(Boolean);
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
    }
  }

  if (result.address_state) {
    const stateIndex = parts.findIndex((part) => part === result.address_state);
    if (stateIndex > 0 && /^[A-Za-zÀ-ÿ\s.'-]{2,40}$/.test(parts[stateIndex - 1])) {
      result.address_city = parts[stateIndex - 1];
    }
  }

  if (!result.address_city && parts.length >= 2) {
    const lastPart = result.address_zip ? parts[parts.length - 2] : parts[parts.length - 1];
    if (lastPart && /^[A-Za-zÀ-ÿ\s.'-]{2,40}$/.test(lastPart)) {
      result.address_city = lastPart;
    }
  }

  return result;
}

export function buildCircularLocationBias({ lat, lng, radiusMeters }) {
  const latitude = Number(lat);
  const longitude = Number(lng);
  const radius = Math.max(500, Math.min(Number(radiusMeters) || 5000, 50000));

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    circle: {
      center: {
        latitude,
        longitude,
      },
      radius,
    },
  };
}

export async function searchGooglePlacesText({
  apiKey,
  textQuery,
  languageCode = 'en',
  regionCode,
  maxResultCount = 20,
  pageToken,
  locationBias,
  includedType,
  fieldMask = SEARCH_TEXT_FIELD_MASK,
}) {
  const query = String(textQuery || '').trim();
  if (!apiKey) throw new Error('GOOGLE_PLACES_API_KEY not configured');
  if (!query && !pageToken) throw new Error('textQuery is required');

  const body = {};
  if (pageToken) {
    body.pageToken = pageToken;
  } else {
    body.textQuery = query;
    body.languageCode = languageCode;
    body.maxResultCount = Math.max(1, Math.min(Number(maxResultCount) || 20, 20));
    if (regionCode) body.regionCode = regionCode;
    if (locationBias) body.locationBias = locationBias;
    if (includedType) body.includedType = includedType;
  }

  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': fieldMask,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Google Places searchText failed (${response.status}): ${truncateErrorText(errorText)}`);
  }

  const payload = await response.json();
  return {
    places: Array.isArray(payload.places) ? payload.places : [],
    nextPageToken: payload.nextPageToken || null,
  };
}

export async function getGooglePlaceDetails({
  apiKey,
  placeId,
  languageCode = 'en',
  regionCode,
  fieldMask = PLACE_DETAILS_FIELD_MASK,
}) {
  const normalizedPlaceId = String(placeId || '').trim();
  if (!apiKey) throw new Error('GOOGLE_PLACES_API_KEY not configured');
  if (!normalizedPlaceId) throw new Error('placeId is required');

  const params = new URLSearchParams();
  if (languageCode) params.set('languageCode', languageCode);
  if (regionCode) params.set('regionCode', regionCode);

  const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(normalizedPlaceId)}?${params.toString()}`, {
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': fieldMask,
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Google Places details failed (${response.status}): ${truncateErrorText(errorText)}`);
  }

  return response.json();
}

export async function getGooglePlacePhotoUri({
  apiKey,
  photoName,
  maxWidthPx = 1600,
  maxHeightPx = 1600,
}) {
  const normalizedPhotoName = String(photoName || '').trim();
  if (!apiKey) throw new Error('GOOGLE_PLACES_API_KEY not configured');
  if (!normalizedPhotoName) return null;

  const params = new URLSearchParams({
    maxWidthPx: String(Math.max(1, Math.min(Number(maxWidthPx) || 1600, 4800))),
    maxHeightPx: String(Math.max(1, Math.min(Number(maxHeightPx) || 1600, 4800))),
    skipHttpRedirect: 'true',
  });

  const response = await fetch(`https://places.googleapis.com/v1/${normalizedPhotoName}/media?${params.toString()}`, {
    headers: {
      'X-Goog-Api-Key': apiKey,
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Google Places photo failed (${response.status}): ${truncateErrorText(errorText)}`);
  }

  const payload = await response.json();
  return payload.photoUri || null;
}

export async function getGooglePlacePhotoSet({
  apiKey,
  photos,
  limit = 10,
  maxWidthPx = 1600,
  maxHeightPx = 1600,
}) {
  const photoList = Array.isArray(photos) ? photos.slice(0, Math.max(0, limit)) : [];
  if (!photoList.length) return [];

  const results = await Promise.allSettled(photoList.map(async (photo) => {
    const url = await getGooglePlacePhotoUri({
      apiKey,
      photoName: photo?.name,
      maxWidthPx,
      maxHeightPx,
    });

    if (!url) return null;

    return {
      url,
      thumbnail: url,
      photoType: null,
      title: '',
    };
  }));

  return results
    .filter((result) => result.status === 'fulfilled' && result.value)
    .map((result) => result.value);
}

export function normalizeGoogleReviews(reviews) {
  if (!Array.isArray(reviews)) return [];

  return reviews.map((review) => ({
    authorName: review?.authorAttribution?.displayName || '',
    authorPhoto: review?.authorAttribution?.photoUri || '',
    rating: review?.rating || 0,
    text: pickText(review?.text),
    date: review?.relativePublishTimeDescription || '',
    isoDate: review?.publishTime || '',
    isLocalGuide: false,
    source: 'google',
  })).filter((review) => review.text || review.rating);
}

export function normalizeGooglePlace(place, { photos = [] } = {}) {
  const attr = parseGooglePlaceAttributes(place);
  const hours = buildOpeningHours(place?.regularOpeningHours);
  const googleAddress = extractGoogleAddress(place);
  const fallbackAddress = parseAddressComponents(place?.formattedAddress || '');
  const priceLevel = mapGooglePriceLevel(place?.priceLevel);
  const normalizedPhotos = Array.isArray(photos) ? photos : [];
  const reviewData = normalizeGoogleReviews(place?.reviews || []);

  const displayName = pickText(place?.displayName);
  const status = mapBusinessStatus(place?.businessStatus);
  const types = Array.isArray(place?.types) && place.types.length
    ? place.types
    : (place?.primaryType ? [place.primaryType] : []);

  return {
    name: displayName || '',
    address: place?.formattedAddress || '',
    shortAddress: place?.shortFormattedAddress || place?.formattedAddress || '',
    phone: place?.internationalPhoneNumber || '',
    website: place?.websiteUri || '',
    rating: place?.rating || 0,
    reviewCount: place?.userRatingCount || 0,
    status,
    mapsUrl: place?.googleMapsUri || '',
    types,
    placeId: place?.id || '',
    dataId: '',
    reviewData,
    photos: normalizedPhotos,
    hours,
    latitude: numberOrNull(place?.location?.latitude),
    longitude: numberOrNull(place?.location?.longitude),
    description: pickText(place?.editorialSummary),
    thumbnail: normalizedPhotos[0]?.thumbnail || '',
    priceLevel,
    priceDescription: priceLevel ? '$'.repeat(priceLevel) : '',
    serviceOptions: attr.serviceOptions,
    amenities: attr.amenities,
    highlights: attr.highlights,
    accessibility: attr.accessibility,
    addressCity: googleAddress.address_city || fallbackAddress.address_city || null,
    addressState: googleAddress.address_state || fallbackAddress.address_state || null,
    addressZip: googleAddress.address_zip || fallbackAddress.address_zip || null,
    source: 'google_places',
  };
}

export function normalizeGooglePlaceForBusinessMatch(place) {
  const normalized = normalizeGooglePlace(place);
  return {
    place_id: normalized.placeId || null,
    data_id: normalized.dataId || null,
    name: normalized.name || null,
    address_full: normalized.address || null,
    address_city: normalized.addressCity || null,
    address_state: normalized.addressState || null,
    address_zip: normalized.addressZip || null,
    phone: normalized.phone || null,
    rating: normalized.rating || null,
    review_count: normalized.reviewCount || null,
    types: normalized.types || null,
    maps_url: normalized.mapsUrl || null,
    latitude: normalized.latitude || null,
    longitude: normalized.longitude || null,
    hours: normalized.hours || null,
    thumbnail: normalized.thumbnail || null,
  };
}

function parseGooglePlaceAttributes(place) {
  const serviceOptions = [];
  const amenities = [];
  const highlights = [];
  const accessibility = [];

  pushIf(serviceOptions, place?.curbsidePickup, 'Curbside pickup');
  pushIf(serviceOptions, place?.delivery, 'Delivery');
  pushIf(serviceOptions, place?.dineIn, 'Dine-in');
  pushIf(serviceOptions, place?.takeout, 'Takeout');
  pushIf(serviceOptions, place?.reservable, 'Reservations');

  pushIf(amenities, place?.outdoorSeating, 'Outdoor seating');
  pushIf(amenities, place?.restroom, 'Restroom');
  pushIf(amenities, place?.allowsDogs, 'Dogs allowed');
  pushIf(amenities, place?.menuForChildren, 'Menu for children');
  pushIf(amenities, place?.servesBreakfast, 'Serves breakfast');
  pushIf(amenities, place?.servesLunch, 'Serves lunch');
  pushIf(amenities, place?.servesDinner, 'Serves dinner');
  pushIf(amenities, place?.servesBrunch, 'Serves brunch');
  pushIf(amenities, place?.servesBeer, 'Serves beer');
  pushIf(amenities, place?.servesWine, 'Serves wine');
  pushIf(amenities, place?.servesCocktails, 'Serves cocktails');
  pushIf(amenities, place?.servesCoffee, 'Serves coffee');
  pushIf(amenities, place?.servesDessert, 'Serves dessert');
  pushIf(amenities, place?.servesVegetarianFood, 'Serves vegetarian food');

  pushIf(highlights, place?.goodForChildren, 'Good for children');
  pushIf(highlights, place?.goodForGroups, 'Good for groups');
  pushIf(highlights, place?.goodForWatchingSports, 'Good for watching sports');
  pushIf(highlights, place?.liveMusic, 'Live music');

  const paymentOptions = place?.paymentOptions || {};
  pushIf(amenities, paymentOptions.acceptsCreditCards, 'Accepts credit cards');
  pushIf(amenities, paymentOptions.acceptsDebitCards, 'Accepts debit cards');
  pushIf(amenities, paymentOptions.acceptsCashOnly, 'Cash only');
  pushIf(amenities, paymentOptions.acceptsNfc, 'Accepts NFC payments');

  const parkingOptions = place?.parkingOptions || {};
  pushIf(amenities, parkingOptions.freeParkingLot, 'Free parking lot');
  pushIf(amenities, parkingOptions.freeStreetParking, 'Free street parking');
  pushIf(amenities, parkingOptions.paidParkingLot, 'Paid parking lot');
  pushIf(amenities, parkingOptions.paidStreetParking, 'Paid street parking');
  pushIf(amenities, parkingOptions.valetParking, 'Valet parking');

  const accessibilityOptions = place?.accessibilityOptions || {};
  pushIf(accessibility, accessibilityOptions.wheelchairAccessibleEntrance, 'Wheelchair accessible entrance');
  pushIf(accessibility, accessibilityOptions.wheelchairAccessibleParkingLot, 'Wheelchair accessible parking lot');
  pushIf(accessibility, accessibilityOptions.wheelchairAccessibleRestroom, 'Wheelchair accessible restroom');
  pushIf(accessibility, accessibilityOptions.wheelchairAccessibleSeating, 'Wheelchair accessible seating');

  return {
    serviceOptions: dedupeStrings(serviceOptions),
    amenities: dedupeStrings(amenities),
    highlights: dedupeStrings(highlights),
    accessibility: dedupeStrings(accessibility),
  };
}

function extractGoogleAddress(place) {
  const components = Array.isArray(place?.addressComponents) ? place.addressComponents : [];
  const city = findAddressComponent(components, ['locality', 'administrative_area_level_2']);
  const state = findAddressComponent(components, ['administrative_area_level_1']);
  const postalCode = findAddressComponent(components, ['postal_code'], 'shortText');

  return {
    address_city: city || null,
    address_state: state || null,
    address_zip: postalCode || null,
  };
}

function findAddressComponent(components, preferredTypes, textField = 'longText') {
  const target = Array.isArray(preferredTypes) ? preferredTypes : [preferredTypes];
  const match = components.find((component) => Array.isArray(component?.types) && component.types.some((type) => target.includes(type)));
  return match?.[textField] || match?.longText || match?.shortText || null;
}

function buildOpeningHours(regularOpeningHours) {
  if (!Array.isArray(regularOpeningHours?.weekdayDescriptions)) return [];
  return regularOpeningHours.weekdayDescriptions.filter(Boolean);
}

function mapBusinessStatus(status) {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'CLOSED_PERMANENTLY') return 'CLOSED_PERMANENTLY';
  if (normalized === 'CLOSED_TEMPORARILY') return 'CLOSED_TEMPORARILY';
  if (normalized === 'OPERATIONAL') return 'OPERATIONAL';
  return 'UNKNOWN';
}

function mapGooglePriceLevel(level) {
  const normalized = String(level || '').toUpperCase();
  if (!normalized) return null;

  const mapping = {
    PRICE_LEVEL_FREE: 0,
    PRICE_LEVEL_INEXPENSIVE: 1,
    PRICE_LEVEL_MODERATE: 2,
    PRICE_LEVEL_EXPENSIVE: 3,
    PRICE_LEVEL_VERY_EXPENSIVE: 4,
  };

  return Object.prototype.hasOwnProperty.call(mapping, normalized) ? mapping[normalized] : null;
}

function dedupeStrings(values) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

function pushIf(list, condition, label) {
  if (condition) list.push(label);
}

function pickText(value) {
  if (typeof value === 'string') return value;
  if (value && typeof value.text === 'string') return value.text;
  return '';
}

function numberOrNull(value) {
  return Number.isFinite(Number(value)) ? Number(value) : null;
}

function truncateErrorText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 300);
}
