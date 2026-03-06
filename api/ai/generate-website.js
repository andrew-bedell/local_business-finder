// Vercel serverless function: Claude API website generation
// Receives research report + business data + photo URLs, returns complete HTML website

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Anthropic API key not configured' });
  }

  const { businessData, researchReport, photoInventory, name, language } = req.body || {};

  if (!businessData || !name || !researchReport) {
    return res.status(400).json({ error: 'Missing required fields: businessData, name, researchReport' });
  }

  const langName = language === 'es' ? 'Spanish' : 'English';

  const systemPrompt = `You are an expert web developer who creates beautiful, modern, single-page business websites. Given a research report and business data, generate a COMPLETE, self-contained HTML file.

Requirements:
- Output a single HTML file starting with <!DOCTYPE html> and ending with </html>
- All CSS must be in a single <style> tag in the <head> — no external stylesheets
- Responsive design with media queries for mobile (max-width: 768px) and tablet
- Modern, clean design that reflects the business personality described in the research report
- Use the photo URLs from the PHOTO INVENTORY — embed them directly as <img> src attributes or CSS background-image
- For the photoAssetPlan items with recommendation "use_existing", use the corresponding URL from the inventory
- For items with recommendation "generate_ai", create a placeholder div with:
  - A CSS gradient background that matches the site color scheme
  - A data-ai-prompt attribute containing the AI prompt from the photoAssetPlan
  - Centered text showing "Image Coming Soon" (or equivalent in ${langName})
- Include ALL real business data: name, address, phone, hours, curated reviews, services
- Follow the research report's tone, suggested sections, and content recommendations
- Include a call-to-action section with clickable phone (tel:) and directions (Google Maps) links
- Use semantic HTML5 elements (header, nav, main, section, footer)
- Include <meta name="viewport" content="width=device-width, initial-scale=1.0">
- Use Google Fonts (Inter or a font that matches the tone) via @import in the style tag
- All text content must be in ${langName}
- Keep the HTML under 15KB — be concise with CSS, avoid repetition

CRITICAL: Output ONLY the complete HTML document. No markdown fences, no explanation text, no comments before or after. Start with <!DOCTYPE html> and end with </html>.`;

  // Build the photo URL lookup for the user message
  const photoLines = (photoInventory || []).map(p =>
    `ID: ${p.id} | Type: ${p.type} | URL: ${p.url}`
  ).join('\n');

  const userMessage = `=== RESEARCH REPORT ===
${JSON.stringify(researchReport, null, 2)}

=== PHOTO INVENTORY WITH URLS ===
${photoLines || 'No photos available'}

=== BUSINESS DATA ===
${businessData}

Generate the website HTML now.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 16384,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);

      if (response.status === 429) {
        return res.status(429).json({ error: 'Rate limit exceeded. Please try again in a moment.' });
      }
      return res.status(502).json({ error: 'Claude API request failed' });
    }

    const data = await response.json();
    const rawText = data.content && data.content[0] ? data.content[0].text : '';

    // Strip markdown code fences if present
    let html = rawText.trim();
    if (html.startsWith('```')) {
      html = html.replace(/^```(?:html)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    // Validate it looks like HTML
    if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
      console.error('Generated content does not appear to be valid HTML:', html.substring(0, 200));
      return res.status(502).json({ error: 'Generated content does not appear to be valid HTML' });
    }

    res.setHeader('Cache-Control', 'private, no-store');
    return res.status(200).json({
      html,
      usage: data.usage || null,
    });
  } catch (err) {
    console.error('Website generation error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
