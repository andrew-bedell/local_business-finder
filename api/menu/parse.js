// Vercel serverless function: Parse menu photo using Claude vision
// Extracts structured menu items (category, name, description, price) from a menu image

export const config = { maxDuration: 60 };

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

  const { photoUrl, currency } = req.body || {};
  if (!photoUrl) {
    return res.status(400).json({ error: 'photoUrl required' });
  }

  try {
    const img = await downloadAsBase64(photoUrl);
    if (!img) {
      return res.status(400).json({ error: 'Failed to download image or invalid image format' });
    }

    const items = await parseMenuWithClaude(img, anthropicKey, currency);

    return res.status(200).json({ items });
  } catch (err) {
    console.error('Menu parse error:', err);
    return res.status(500).json({ error: 'Failed to parse menu photo' });
  }
}

async function downloadAsBase64(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > 5 * 1024 * 1024) return null;
    return {
      mediaType: contentType.split(';')[0],
      data: buffer.toString('base64'),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function parseMenuWithClaude(img, apiKey, currency) {
  const currencyHint = currency
    ? `The currency is ${currency}.`
    : 'Detect the currency from the menu (look for symbols like $, MXN, USD, etc.). Default to MXN if unclear.';

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
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
            text: `Extract all menu items from this menu photo. ${currencyHint}

Respond with ONLY valid JSON (no markdown fences, no extra text) matching this schema:
{
  "items": [
    {
      "menu_category": "Category name (e.g., Entradas, Platos Fuertes, Bebidas, Postres)",
      "item_name": "Item name exactly as shown on menu",
      "item_description": "Brief description if shown on menu, or empty string if none",
      "price": 0.00,
      "currency": "MXN"
    }
  ]
}

Rules:
- Extract EVERY item visible on the menu
- Keep item names in their original language (do not translate)
- If a price is not visible for an item, set price to null
- Group items by their menu category/section as shown on the menu
- If the menu has no clear categories, use general ones like "Platillos" or "Bebidas"
- For price, use the numeric value only (e.g., 150.00 not "$150")
- If there are multiple sizes/variants, list them as separate items with the size in the name`,
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
  jsonStr = jsonStr.replace(/,\s*([\]}])/g, '$1');

  try {
    const parsed = JSON.parse(jsonStr);
    return parsed.items || [];
  } catch {
    const match = jsonStr.match(/\{[\s\S]*\}/);
    if (match) {
      const cleaned = match[0].replace(/,\s*([\]}])/g, '$1');
      const parsed = JSON.parse(cleaned);
      return parsed.items || [];
    }
    return [];
  }
}
