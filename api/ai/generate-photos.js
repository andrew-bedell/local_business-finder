// Vercel serverless function: Generate AI photos via Gemini API
// Takes a prompt from the photoAssetPlan, generates image, uploads to Supabase Storage, returns URL

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    return res.status(503).json({ error: 'Gemini API key not configured' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const { prompt, section, slot } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ error: 'Missing required field: prompt' });
  }

  try {
    // 1. Generate image via Gemini
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${geminiKey}`;
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API error:', geminiRes.status, errText);
      return res.status(502).json({ error: 'Image generation failed' });
    }

    const geminiData = await geminiRes.json();
    const parts = geminiData.candidates?.[0]?.content?.parts || [];

    let imageBase64 = null;
    let mimeType = 'image/png';
    for (const part of parts) {
      if (part.inlineData) {
        imageBase64 = part.inlineData.data;
        mimeType = part.inlineData.mimeType || 'image/png';
        break;
      }
    }

    if (!imageBase64) {
      return res.status(502).json({ error: 'No image data returned from Gemini' });
    }

    // 2. Try to upload to Supabase Storage for a proper URL
    if (supabaseUrl && supabaseKey) {
      const ext = mimeType === 'image/jpeg' ? 'jpg' : 'png';
      const timestamp = Date.now();
      const sanitizedSection = (section || 'photo').replace(/[^a-z0-9-_]/gi, '-').toLowerCase();
      const filePath = `ai-generated/${timestamp}-${sanitizedSection}.${ext}`;

      const imageBuffer = Buffer.from(imageBase64, 'base64');

      const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/photos/${filePath}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': mimeType,
          'x-upsert': 'true',
        },
        body: imageBuffer,
      });

      if (uploadRes.ok) {
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/photos/${filePath}`;
        return res.status(200).json({ url: publicUrl, section, slot, storage: 'supabase' });
      }

      console.warn('Supabase Storage upload failed, falling back to data URI:', uploadRes.status);
    }

    // 3. Fallback: return data URI if Supabase Storage is not configured or upload fails
    const dataUri = `data:${mimeType};base64,${imageBase64}`;
    return res.status(200).json({ url: dataUri, section, slot, storage: 'inline' });
  } catch (err) {
    console.error('Photo generation error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
