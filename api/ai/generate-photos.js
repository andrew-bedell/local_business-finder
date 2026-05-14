// Vercel serverless function: Generate AI photos for website sections
// Takes a prompt from the photoAssetPlan, generates image, uploads to Supabase Storage, returns URL

export const config = { maxDuration: 30 };

import { ensureEmployeeSession } from '../_lib/employee-session.js';
import { optimizePhotoForStorage } from '../_lib/photo-optimize.js';

const DEFAULT_OPENAI_IMAGE_MODEL = 'gpt-image-2';
const DEFAULT_OPENAI_IMAGE_SIZE = '1536x1024';
const DEFAULT_OPENAI_IMAGE_QUALITY = 'low';

function sanitizeFileSegment(value, fallback = 'photo') {
  return String(value || fallback).replace(/[^a-z0-9-_]/gi, '-').toLowerCase();
}

function buildGeneratedPhotoPrompt(prompt, section, slot) {
  return [
    prompt,
    '',
    'Website image requirements:',
    '- Photorealistic editorial commercial photography for a modern local business website.',
    '- No readable text, no signs with text, no labels, no logos, no watermarks, no UI screenshots.',
    '- Compose for both a 1440x720 desktop hero crop and a narrow mobile crop.',
    '- Keep the main subject visually clear with clean negative space for overlaid website copy.',
    '- Natural lighting, premium but realistic styling, local Latin American small-business context when relevant.',
    section ? `- Intended section: ${section}.` : '',
    slot ? `- Intended slot: ${slot}.` : '',
  ].filter(Boolean).join('\n');
}

async function generateWithOpenAI({ prompt, section, slot, openaiKey }) {
  const model = process.env.OPENAI_PHOTO_IMAGE_MODEL
    || process.env.OPENAI_IMAGE_MODEL
    || DEFAULT_OPENAI_IMAGE_MODEL;
  const size = process.env.OPENAI_PHOTO_IMAGE_SIZE || DEFAULT_OPENAI_IMAGE_SIZE;
  const quality = process.env.OPENAI_PHOTO_IMAGE_QUALITY || DEFAULT_OPENAI_IMAGE_QUALITY;

  const imageRes = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt: buildGeneratedPhotoPrompt(prompt, section, slot),
      size,
      quality,
      n: 1,
    }),
  });

  const imagePayload = await imageRes.json().catch(() => ({}));
  if (!imageRes.ok) {
    const detail = JSON.stringify(imagePayload).slice(0, 400);
    throw new Error(`OpenAI image generation failed (${imageRes.status}): ${detail}`);
  }

  const image = Array.isArray(imagePayload.data) ? imagePayload.data[0] : null;
  if (image?.b64_json) {
    return {
      buffer: Buffer.from(image.b64_json, 'base64'),
      mimeType: 'image/png',
      provider: 'openai',
      model,
    };
  }

  if (image?.url) {
    const urlRes = await fetch(image.url);
    if (!urlRes.ok) {
      throw new Error(`OpenAI generated URL download failed (${urlRes.status})`);
    }
    return {
      buffer: Buffer.from(await urlRes.arrayBuffer()),
      mimeType: urlRes.headers.get('content-type') || 'image/png',
      provider: 'openai',
      model,
    };
  }

  throw new Error(`OpenAI returned no image data: ${JSON.stringify(imagePayload).slice(0, 400)}`);
}

async function generateWithImagen({ prompt, geminiKey }) {
  const model = process.env.GEMINI_IMAGE_MODEL || 'imagen-4.0-generate-001';
  const imagenUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${geminiKey}`;
  const imagenRes = await fetch(imagenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: { sampleCount: 1 },
    }),
  });

  if (!imagenRes.ok) {
    const errText = await imagenRes.text();
    throw new Error(`Imagen API failed (${imagenRes.status}): ${errText.substring(0, 400)}`);
  }

  const imagenData = await imagenRes.json();
  const prediction = imagenData.predictions?.[0];
  if (!prediction?.bytesBase64Encoded) {
    throw new Error(`Imagen returned no image data: ${JSON.stringify(imagenData).substring(0, 400)}`);
  }

  return {
    buffer: Buffer.from(prediction.bytesBase64Encoded, 'base64'),
    mimeType: prediction.mimeType || 'image/png',
    provider: 'gemini',
    model,
  };
}

async function generateImage({ prompt, section, slot, openaiKey, geminiKey }) {
  const preferredProvider = String(process.env.AI_PHOTO_PROVIDER || 'openai').trim().toLowerCase();
  const providers = preferredProvider === 'gemini'
    ? ['gemini', 'openai']
    : ['openai', 'gemini'];
  const errors = [];

  for (const provider of providers) {
    try {
      if (provider === 'openai') {
        if (!openaiKey) {
          errors.push('OpenAI API key not configured');
          continue;
        }
        return await generateWithOpenAI({ prompt, section, slot, openaiKey });
      }

      if (provider === 'gemini') {
        if (!geminiKey) {
          errors.push('Gemini API key not configured');
          continue;
        }
        return await generateWithImagen({ prompt, geminiKey });
      }
    } catch (err) {
      console.warn(`[generate-photos] ${provider} failed:`, err.message);
      errors.push(err.message);
    }
  }

  throw new Error(errors.join(' | ') || 'No image generation provider configured');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!openaiKey && !geminiKey) {
    return res.status(503).json({ error: 'No image generation provider configured' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  const { prompt, section, slot } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ error: 'Missing required field: prompt' });
  }

  const session = await ensureEmployeeSession(req, res, {
    supabaseUrl,
    serviceKey: supabaseKey,
  });
  if (!session) return;

  try {
    // 1. Generate image with OpenAI first by default, with Imagen fallback.
    const generated = await generateImage({ prompt, section, slot, openaiKey, geminiKey });

    if (!supabaseUrl || !supabaseKey) {
      return res.status(503).json({ error: 'Supabase storage not configured for generated images' });
    }

    // 2. Normalize to storage-ready WebP and require a durable URL.
    const timestamp = Date.now();
    const sanitizedSection = sanitizeFileSegment(section);
    const providerSegment = sanitizeFileSegment(generated.provider, 'ai');

    const optimized = await optimizePhotoForStorage(generated.buffer, { sourceContentType: generated.mimeType });
    const filePath = `ai-generated/${providerSegment}/${timestamp}-${sanitizedSection}.${optimized.extension}`;

    const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/photos/${filePath}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': optimized.contentType,
        'x-upsert': 'true',
      },
      body: optimized.buffer,
    });

    if (!uploadRes.ok) {
      const uploadErr = await uploadRes.text().catch(() => '');
      console.error('Supabase Storage upload failed for AI image:', uploadRes.status, uploadErr.substring(0, 200));
      return res.status(502).json({ error: 'Failed to persist generated image' });
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/photos/${filePath}`;
    return res.status(200).json({
      url: publicUrl,
      section,
      slot,
      provider: generated.provider,
      model: generated.model,
      storage: 'supabase',
      storagePath: filePath,
      contentType: optimized.contentType,
      sizeBytes: optimized.byteLength,
      width: optimized.width,
      height: optimized.height,
    });
  } catch (err) {
    console.error('Photo generation error:', err);
    return res.status(502).json({
      error: 'Image generation failed',
      detail: String(err.message || err).substring(0, 300),
    });
  }
}
