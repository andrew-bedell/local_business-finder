import { randomUUID } from 'node:crypto';
import { buildInitialEnrichmentState } from '../_lib/enrichment-runner.js';

function buildInternalUrl(req, path) {
  var host = req.headers.host || process.env.VERCEL_URL || 'localhost:3000';
  var protocol = host.indexOf('localhost') !== -1 ? 'http' : 'https';
  return protocol + '://' + host + path;
}

function simpleHash(source, authorName, text) {
  var raw = source + '|' + (authorName || '') + '|' + String(text || '').slice(0, 200);
  var hash = 0;
  for (var i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
  }
  return 'cust_' + Math.abs(hash).toString(36);
}

async function fetchJson(url, options) {
  var response = await fetch(url, options);
  var payload = await response.json().catch(function () { return {}; });
  return { response: response, payload: payload };
}

async function ensureBusinessContact(supabaseUrl, serviceKey, businessId, body) {
  var hasContact = body.contactName || body.contactEmail || body.contactWhatsapp || body.businessPhone;
  if (!hasContact) return;

  await fetch(supabaseUrl + '/rest/v1/business_contacts', {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': 'Bearer ' + serviceKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      business_id: businessId,
      contact_name: body.contactName || null,
      contact_email: body.contactEmail || null,
      contact_phone: body.businessPhone || null,
      contact_whatsapp: body.contactWhatsapp || null,
      is_primary: true
    })
  }).catch(function (err) {
    console.warn('Failed to insert business contact:', err && err.message || err);
  });
}

async function createOrUpdateBusinessFromGoogleMatch(supabaseUrl, serviceKey, match, body) {
  var headers = {
    'apikey': serviceKey,
    'Authorization': 'Bearer ' + serviceKey,
    'Content-Type': 'application/json'
  };

  var existingResult = await fetchJson(
    supabaseUrl + '/rest/v1/businesses?place_id=eq.' + encodeURIComponent(match.placeId) + '&select=id',
    { headers: headers }
  );

  if (existingResult.response.ok && Array.isArray(existingResult.payload) && existingResult.payload.length) {
    return existingResult.payload[0].id;
  }

  var insertPayload = {
    name: match.name || body.company,
    place_id: match.placeId,
    category: body.businessType || null,
    address_full: body.addressFull || match.address || null,
    address_city: body.city || match.addressCity || null,
    address_state: match.addressState || null,
    address_zip: match.addressZip || null,
    phone: body.businessPhone || match.phone || null,
    whatsapp: body.contactWhatsapp || null,
    email: body.contactEmail || null,
    description: body.aboutBusiness || null,
    maps_url: match.mapsUrl || null,
    types: Array.isArray(match.types) ? match.types : null,
    rating: match.rating || null,
    review_count: match.reviewCount || null,
    latitude: match.latitude || null,
    longitude: match.longitude || null,
    hours: body.hours && Object.keys(body.hours).length ? body.hours : null,
    owner_name: body.founderName || null,
    founder_description: body.founderStory || null,
    lead_source: 'website_form',
    pipeline_status: 'lead',
    contact_name: body.contactName || null,
    contact_email: body.contactEmail || null,
    contact_whatsapp: body.contactWhatsapp || null,
    notes: body.extraNotes || null,
    ...buildInitialEnrichmentState(match.placeId)
  };

  var insertResult = await fetchJson(supabaseUrl + '/rest/v1/businesses', {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': 'Bearer ' + serviceKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(insertPayload)
  });

  if (!insertResult.response.ok || !Array.isArray(insertResult.payload) || !insertResult.payload.length) {
    throw new Error('Failed to create business from Google match');
  }

  return insertResult.payload[0].id;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var supabaseUrl = process.env.SUPABASE_URL;
  var serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(503).json({ error: 'Supabase service key not configured' });
  }

  var body = req.body || {};
  var company = String(body.company || '').trim();
  var contactName = String(body.contactName || '').trim();
  var contactEmail = String(body.contactEmail || '').trim();
  var businessType = String(body.businessType || '').trim();

  if (!company || !contactName || !contactEmail || !businessType) {
    return res.status(400).json({ error: 'company, contactName, contactEmail, and businessType are required' });
  }

  try {
    var selectedGoogleMatch = body.selectedGoogleMatch || null;
    var businessId = null;

    if (selectedGoogleMatch && selectedGoogleMatch.placeId) {
      businessId = await createOrUpdateBusinessFromGoogleMatch(supabaseUrl, serviceKey, selectedGoogleMatch, body);
    } else {
      var builderPlaceId = 'builder-' + randomUUID();
      var insertPayload = {
        name: company,
        place_id: builderPlaceId,
        category: businessType,
        address_full: body.addressFull || null,
        address_city: body.city || null,
        phone: body.businessPhone || null,
        whatsapp: body.contactWhatsapp || null,
        email: contactEmail || null,
        description: body.aboutBusiness || null,
        owner_name: body.founderName || null,
        founder_description: body.founderStory || null,
        hours: body.hours && Object.keys(body.hours).length ? body.hours : null,
        lead_source: 'website_form',
        pipeline_status: 'lead',
        contact_name: contactName || null,
        contact_email: contactEmail || null,
        contact_whatsapp: body.contactWhatsapp || null,
        notes: body.extraNotes || null,
        ...buildInitialEnrichmentState(builderPlaceId)
      };

      var insertResult = await fetchJson(supabaseUrl + '/rest/v1/businesses', {
        method: 'POST',
        headers: {
          'apikey': serviceKey,
          'Authorization': 'Bearer ' + serviceKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(insertPayload)
      });

      if (!insertResult.response.ok || !Array.isArray(insertResult.payload) || !insertResult.payload.length) {
        console.error('Failed to create business:', insertResult.payload);
        return res.status(502).json({ error: 'Failed to create business record' });
      }

      businessId = insertResult.payload[0].id;
    }

    var updatePayload = {
      name: company,
      category: businessType,
      address_full: body.addressFull || null,
      address_city: body.city || null,
      phone: body.businessPhone || null,
      whatsapp: body.contactWhatsapp || null,
      email: contactEmail || null,
      description: body.aboutBusiness || null,
      owner_name: body.founderName || null,
      founder_description: body.founderStory || null,
      hours: body.hours && Object.keys(body.hours).length ? body.hours : null,
      lead_source: 'website_form',
      pipeline_status: 'lead',
      contact_name: contactName || null,
      contact_email: contactEmail || null,
      contact_whatsapp: body.contactWhatsapp || null,
      notes: body.extraNotes || null,
      pipeline_status_changed_at: new Date().toISOString()
    };

    await fetch(supabaseUrl + '/rest/v1/businesses?id=eq.' + encodeURIComponent(businessId), {
      method: 'PATCH',
      headers: {
        'apikey': serviceKey,
        'Authorization': 'Bearer ' + serviceKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(updatePayload)
    });

    await ensureBusinessContact(supabaseUrl, serviceKey, businessId, body);

    var reviews = Array.isArray(body.reviews) ? body.reviews : [];
    if (reviews.length) {
      var reviewRows = reviews.map(function (review) {
        return {
          business_id: businessId,
          source: 'customer',
          author_name: review.author_name || null,
          rating: Math.max(1, Math.min(5, parseInt(review.rating || 5, 10))),
          text: review.text || null,
          sentiment_label: 'very_positive',
          is_curated: true,
          review_hash: simpleHash('customer', review.author_name, review.text)
        };
      }).filter(function (row) {
        return row.author_name && row.text;
      });

      if (reviewRows.length) {
        await fetch(supabaseUrl + '/rest/v1/business_reviews', {
          method: 'POST',
          headers: {
            'apikey': serviceKey,
            'Authorization': 'Bearer ' + serviceKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal,resolution=merge-duplicates'
          },
          body: JSON.stringify(reviewRows)
        });
      }
    }

    var services = Array.isArray(body.services) ? body.services : [];
    if (services.length) {
      var serviceRows = services.map(function (service, index) {
        return {
          business_id: businessId,
          name: service.name || null,
          description: service.description || null,
          price: service.price != null ? service.price : null,
          currency: service.currency || 'MXN',
          sort_order: index
        };
      }).filter(function (row) {
        return row.name;
      });

      if (serviceRows.length) {
        await fetch(supabaseUrl + '/rest/v1/business_services', {
          method: 'POST',
          headers: {
            'apikey': serviceKey,
            'Authorization': 'Bearer ' + serviceKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(serviceRows)
        });
      }
    }

    var photos = Array.isArray(body.photos) ? body.photos : [];
    if (photos.length) {
      var photoRows = photos.map(function (photo, index) {
        return {
          business_id: businessId,
          source: 'customer_upload',
          photo_type: photo.photo_type || 'product',
          storage_path: photo.storage_path || null,
          url: photo.public_url || photo.url || null,
          is_primary: index === 0
        };
      }).filter(function (row) {
        return row.url;
      });

      if (photoRows.length) {
        await fetch(supabaseUrl + '/rest/v1/business_photos', {
          method: 'POST',
          headers: {
            'apikey': serviceKey,
            'Authorization': 'Bearer ' + serviceKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(photoRows)
        });
      }
    }

    var signupUrl = buildInternalUrl(req, '/api/free-signup');
    var signupResponse = await fetch(signupUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessId: businessId,
        businessName: company,
        customerEmail: contactEmail,
        customerName: contactName,
        customerPhone: body.contactWhatsapp || body.businessPhone || null,
        address: body.addressFull || body.city || null
      })
    });

    var signupPayload = await signupResponse.json().catch(function () { return {}; });
    var signupMessage = signupResponse.ok
      ? 'Guardamos tu borrador y enviamos el acceso a tu portal por correo.'
      : 'Guardamos tu borrador. Si el acceso al portal ya existía, puedes entrar directamente con tu correo.';

    if (!signupResponse.ok && signupResponse.status !== 409) {
      console.warn('free-signup failed after builder submit:', signupPayload);
    }

    return res.status(200).json({
      success: true,
      businessId: businessId,
      portalUrl: '/mipagina',
      message: signupMessage
    });
  } catch (err) {
    console.error('public-builder/submit error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
