// Vercel serverless function: Parse catalog/service list from image or PDF using Claude
// Extracts structured service items (name, description, price, currency) for any business type

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

  const { fileUrl, currency, businessType } = req.body || {};
  if (!fileUrl) {
    return res.status(400).json({ error: 'fileUrl required' });
  }

  try {
    const file = await downloadFile(fileUrl);
    if (!file) {
      return res.status(400).json({ error: 'Failed to download file or unsupported format' });
    }

    const services = await parseCatalogWithClaude(file, anthropicKey, currency, businessType);

    return res.status(200).json({ services });
  } catch (err) {
    console.error('Catalog parse error:', err);
    return res.status(500).json({ error: 'Failed to parse catalog' });
  }
}

async function downloadFile(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    const contentType = (response.headers.get('content-type') || '').split(';')[0].trim();
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > 10 * 1024 * 1024) return null; // 10MB max

    if (contentType === 'application/pdf') {
      return { type: 'pdf', mediaType: 'application/pdf', data: buffer.toString('base64') };
    } else if (contentType.startsWith('image/')) {
      return { type: 'image', mediaType: contentType, data: buffer.toString('base64') };
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function parseCatalogWithClaude(file, apiKey, currency, businessType) {
  const currencyHint = currency
    ? `The currency is ${currency}.`
    : 'Detect the currency from the document (look for symbols like $, MXN, USD, etc.). Default to MXN if unclear.';

  const businessHint = businessType
    ? `This is a ${businessType} business.`
    : '';

  const contentBlock = file.type === 'pdf'
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: file.data } }
    : { type: 'image', source: { type: 'base64', media_type: file.mediaType, data: file.data } };

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'pdfs-2024-09-25',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          contentBlock,
          {
            type: 'text',
            text: `Extract all services or products from this catalog/price list/brochure. ${businessHint} ${currencyHint}

Respond with ONLY valid JSON (no markdown fences, no extra text) matching this schema:
{
  "services": [
    {
      "name": "Service or product name exactly as shown",
      "description": "Brief description if provided, or empty string if none",
      "price": 0.00,
      "currency": "MXN"
    }
  ]
}

Rules:
- Extract EVERY service or product listed in the document
- Keep names in their original language (do not translate)
- If a price is not visible for an item, set price to null
- For price, use the numeric value only (e.g., 150.00 not "$150")
- If there are multiple tiers/sizes/variants, list each as a separate service with the variant in the name
- Include descriptions only when the document provides them — do not invent descriptions
- If the document has categories/sections, incorporate them into the service name if helpful (e.g., "Manicure - Gel" rather than just "Gel")`,
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
    return parsed.services || [];
  } catch {
    const match = jsonStr.match(/\{[\s\S]*\}/);
    if (match) {
      const cleaned = match[0].replace(/,\s*([\]}])/g, '$1');
      const parsed = JSON.parse(cleaned);
      return parsed.services || [];
    }
    return [];
  }
}
