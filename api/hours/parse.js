// Vercel serverless function: Parse business hours from a photo using Claude vision
// Extracts structured hours per day from an image of a business hours sign

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return res.status(503).json({ error: 'Anthropic API key not configured' });
  }

  const { imageData, mediaType } = req.body || {};
  if (!imageData) {
    return res.status(400).json({ error: 'imageData (base64) required' });
  }

  try {
    const hours = await parseHoursWithClaude(
      { data: imageData, mediaType: mediaType || 'image/jpeg' },
      anthropicKey
    );
    return res.status(200).json({ hours });
  } catch (err) {
    console.error('Hours parse error:', err);
    return res.status(500).json({ error: 'Failed to parse hours from photo' });
  }
}

async function parseHoursWithClaude(img, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: img.mediaType,
              data: img.data,
            },
          },
          {
            type: 'text',
            text: `Extract the business operating hours from this photo of a business hours sign.

Respond with ONLY valid JSON (no markdown fences, no extra text) matching this exact schema:
{
  "lunes": "9:00 - 18:00",
  "martes": "9:00 - 18:00",
  "miercoles": "9:00 - 18:00",
  "jueves": "9:00 - 18:00",
  "viernes": "9:00 - 18:00",
  "sabado": "9:00 - 14:00",
  "domingo": "Cerrado"
}

Rules:
- Use Spanish day names as keys exactly as shown above (lunes, martes, miercoles, jueves, viernes, sabado, domingo)
- Use 24-hour format when possible (e.g., "9:00 - 18:00"), or keep the original format if clearly AM/PM
- If a day is closed, use "Cerrado"
- If the sign shows a range like "Lunes a Viernes: 9-6", apply those hours to each day in the range
- If hours are identical for multiple days, still list each day separately
- If a day is not mentioned on the sign, assume "Cerrado"
- Keep the time format consistent across all days
- Use " - " (space dash space) to separate open and close times`,
          },
        ],
      }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude API error: ${response.status} ${errText.substring(0, 200)}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '{}';

  let jsonStr = text.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  try {
    return JSON.parse(jsonStr);
  } catch {
    const match = jsonStr.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    return {};
  }
}
