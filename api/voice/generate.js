// Vercel serverless function: Generate personalized voice message via ElevenLabs TTS
// Generates audio, uploads to Supabase Storage, stores URL on business record

export const config = { maxDuration: 30 };

// Voice IDs per country — ElevenLabs premade voices with eleven_multilingual_v2
// Each country gets a distinct voice so outreach feels regionally appropriate
const VOICE_MAP = {
  'MX': 'onwK4e9ZLuTAKqWW03F9', // Daniel — friendly, relatable (Mexico)
  'CO': 'JBFqnCBsd6RMkjVDRZzb', // George — warm, conversational (Colombia)
  'EC': 'TX3LPaxmHKxFdv7VOQHJ', // Liam — approachable, casual (Ecuador)
  'PE': 'cjVigY5qzO86Huf0OWal', // Eric — clear, professional (Peru)
  'AR': 'nPczCjzI2devNBz1zQrb', // Brian — confident, warm (Argentina)
  'CL': 'N2lVS1w4EtoT3dr4eOWO', // Callum — calm, trustworthy (Chile)
};
const DEFAULT_VOICE = 'onwK4e9ZLuTAKqWW03F9'; // Daniel — default Latin American

const MESSAGE_TEMPLATE = `Hola, qué tal? Buenas.

Oye, soy Andrés. Te escribí hace rato porque vi tu negocio {businessName} en Google y me llamó la atención que no tienen página web.

Entonces hice una de ejemplo súper rápido para que veas cómo podrían verse online.

La verdad es que mucha gente busca en Google antes de decidir, y cuando no hay página, normalmente se van con otro negocio.

Si te gusta la idea, yo me encargo de todo, dominio, cambios, todo, y no es caro, son doscientos noventa y nueve pesos al mes.

Pero bueno, sin compromiso. Si quieres le damos una ajustada y la dejamos lista.

Ahí me dices qué te parece.`;

function buildMessage(businessName) {
  return MESSAGE_TEMPLATE.replace('{businessName}', businessName || '');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
  if (!elevenLabsKey) {
    return res.status(503).json({ error: 'ElevenLabs API key not configured' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  const { businessId, businessName, country } = req.body || {};
  if (!businessId || !businessName) {
    return res.status(400).json({ error: 'Missing required fields: businessId, businessName' });
  }

  const voiceId = VOICE_MAP[country] || DEFAULT_VOICE;
  const messageText = buildMessage(businessName);

  try {
    // 1. Call ElevenLabs TTS API
    const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': elevenLabsKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text: messageText,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!ttsRes.ok) {
      const errText = await ttsRes.text();
      console.error('ElevenLabs API error:', ttsRes.status, errText);
      return res.status(502).json({ error: 'Voice generation failed', detail: errText.substring(0, 200) });
    }

    const audioBuffer = Buffer.from(await ttsRes.arrayBuffer());

    // 2. Upload to Supabase Storage
    if (!supabaseUrl || !supabaseKey) {
      return res.status(503).json({ error: 'Supabase not configured' });
    }

    const timestamp = Date.now();
    const filePath = `${businessId}/${timestamp}.mp3`;

    const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/voice-messages/${filePath}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'audio/mpeg',
        'x-upsert': 'true',
      },
      body: audioBuffer,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error('Supabase Storage upload failed:', uploadRes.status, errText);
      return res.status(502).json({ error: 'Failed to upload audio file' });
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/voice-messages/${filePath}`;

    // 3. Update business outreach_steps with voice data
    const fetchResp = await fetch(
      `${supabaseUrl}/rest/v1/businesses?id=eq.${businessId}&select=outreach_steps`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
        },
      }
    );
    const rows = await fetchResp.json();
    const currentSteps = (rows && rows[0] && rows[0].outreach_steps) || {};

    currentSteps.voice = {
      url: publicUrl,
      generated_at: new Date().toISOString(),
      voice_id: voiceId,
      country: country || 'default',
    };

    await fetch(
      `${supabaseUrl}/rest/v1/businesses?id=eq.${businessId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ outreach_steps: currentSteps }),
      }
    );

    return res.status(200).json({
      url: publicUrl,
      voice_id: voiceId,
      country: country || 'default',
    });
  } catch (err) {
    console.error('Voice generation error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
