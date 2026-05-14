// Vercel serverless function: Generate AI photos via Imagen 4 API
// Takes a prompt from the photoAssetPlan, generates image, uploads to Supabase Storage, returns URL

export const config = { maxDuration: 30 };

import { ensureEmployeeSession } from '../_lib/employee-session.js';
import { optimizePhotoForStorage } from '../_lib/photo-optimize.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    return res.status(503).json({ error: 'Gemini API key not configured' });
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
    // 1. Generate image via Imagen 4
    const imagenUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${geminiKey}`;
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
      console.error('Imagen API error:', imagenRes.status, errText);
      return res.status(502).json({ error: 'Image generation failed', detail: errText.substring(0, 200) });
    }

    const imagenData = await imagenRes.json();
    const prediction = imagenData.predictions?.[0];

    if (!prediction || !prediction.bytesBase64Encoded) {
      console.error('No image data in response:', JSON.stringify(imagenData).substring(0, 500));
      return res.status(502).json({ error: 'No image data returned from Imagen' });
    }

    const imageBase64 = prediction.bytesBase64Encoded;
    const mimeType = prediction.mimeType || 'image/png';

    if (!supabaseUrl || !supabaseKey) {
      return res.status(503).json({ error: 'Supabase storage not configured for generated images' });
    }

    // 2. Normalize to storage-ready WebP and require a durable URL.
    const timestamp = Date.now();
    const sanitizedSection = (section || 'photo').replace(/[^a-z0-9-_]/gi, '-').toLowerCase();

    const imageBuffer = Buffer.from(imageBase64, 'base64');
    const optimized = await optimizePhotoForStorage(imageBuffer, { sourceContentType: mimeType });
    const filePath = `ai-generated/${timestamp}-${sanitizedSection}.${optimized.extension}`;

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
      storage: 'supabase',
      storagePath: filePath,
      contentType: optimized.contentType,
      sizeBytes: optimized.byteLength,
    });
  } catch (err) {
    console.error('Photo generation error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
