export const config = { maxDuration: 120 };

import { optimizePhotoForStorage } from '../_lib/photo-optimize.js';

function cleanText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function buildLogoPrompt(body) {
  var name = cleanText(body.businessName, 120) || 'Negocio local';
  var category = cleanText(body.businessCategory, 120) || 'negocio local';
  var description = cleanText(body.businessDescription, 500);
  var context = cleanText(body.context, 2500);

  return [
    'Create four distinct professional logo concepts for a Latin American small business.',
    'Output square, centered logo artwork on a clean plain background. No mockups, no business cards, no storefronts, no photos.',
    'Prefer simple vector-like brand marks, readable shapes, strong contrast, and a polished commercial identity.',
    'If using text, keep it short and legible. Avoid tiny slogans and avoid misspelled words.',
    '',
    'Business name: ' + name,
    'Business category: ' + category,
    description ? 'Short description: ' + description : '',
    context ? 'Additional intake context: ' + context : '',
    '',
    'Make the four options visually different: modern minimal, premium/elegant, friendly/organic, and bold badge.'
  ].filter(Boolean).join('\n');
}

async function uploadLogo({ supabaseUrl, serviceKey, buffer, index }) {
  var optimized = await optimizePhotoForStorage(buffer, {
    sourceContentType: 'image/png',
    maxBytes: process.env.LOGO_WEBP_MAX_BYTES || 80 * 1024
  });
  var suffix = Math.random().toString(36).slice(2, 10);
  var storagePath = 'public-builder/generated-logos/logo-' + Date.now() + '-' + index + '-' + suffix + '.' + optimized.extension;
  var uploadRes = await fetch(supabaseUrl + '/storage/v1/object/photos/' + storagePath, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: 'Bearer ' + serviceKey,
      'Content-Type': optimized.contentType,
      'x-upsert': 'true'
    },
    body: optimized.buffer
  });

  if (!uploadRes.ok) {
    var uploadErr = await uploadRes.text().catch(function () { return ''; });
    throw new Error('Failed to upload generated logo: ' + uploadErr.substring(0, 200));
  }

  return {
    public_url: supabaseUrl + '/storage/v1/object/public/photos/' + storagePath,
    storage_path: storagePath,
    content_type: optimized.contentType,
    size_bytes: optimized.byteLength,
    width: optimized.width,
    height: optimized.height
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return res.status(503).json({ error: 'OpenAI API key not configured' });
  }

  var supabaseUrl = process.env.SUPABASE_URL;
  var serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(503).json({ error: 'Supabase service key not configured' });
  }

  var body = req.body || {};
  var prompt = buildLogoPrompt(body);
  var labels = ['Moderno minimal', 'Premium elegante', 'Amigable organico', 'Insignia fuerte'];

  try {
    var imageRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + openaiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_LOGO_IMAGE_MODEL || 'gpt-image-1',
        prompt: prompt,
        size: '1024x1024',
        quality: 'low',
        n: 4
      })
    });

    var imagePayload = await imageRes.json().catch(function () { return {}; });
    if (!imageRes.ok) {
      console.error('generate-logos OpenAI error:', imageRes.status, JSON.stringify(imagePayload).slice(0, 400));
      return res.status(502).json({ error: 'No se pudieron crear los logos.' });
    }

    var images = Array.isArray(imagePayload.data) ? imagePayload.data : [];
    if (!images.length) {
      return res.status(502).json({ error: 'OpenAI no devolvio imagenes.' });
    }

    var logos = [];
    for (var i = 0; i < images.length; i++) {
      var base64 = images[i] && images[i].b64_json;
      if (!base64) continue;
      var uploaded = await uploadLogo({
        supabaseUrl: supabaseUrl,
        serviceKey: serviceKey,
        buffer: Buffer.from(base64, 'base64'),
        index: i + 1
      });
      logos.push({
        id: 'logo-' + (i + 1),
        label: labels[i] || 'Opcion ' + (i + 1),
        source: 'generated',
        ...uploaded
      });
    }

    if (!logos.length) {
      return res.status(502).json({ error: 'No se pudieron guardar los logos generados.' });
    }

    return res.status(200).json({ success: true, logos: logos });
  } catch (err) {
    console.error('public-builder/generate-logos error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
