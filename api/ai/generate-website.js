// Vercel serverless function: Claude API website generation (streaming)
// Receives research report + business data + photo URLs, streams HTML response to avoid timeout

export const config = { maxDuration: 300 };

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

  const { businessData: rawBusinessData, researchReport, photoInventory, name, language } = req.body || {};

  if (!rawBusinessData || !name || !researchReport) {
    return res.status(400).json({ error: 'Missing required fields: businessData, name, researchReport' });
  }

  // Strip unpaired Unicode surrogates that break JSON serialization
  const businessData = rawBusinessData.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '');

  const langName = language === 'es' ? 'Spanish' : 'English';

  const systemPrompt = `You are an expert web developer who creates beautiful, modern, single-page business websites. Given a research report and business data, generate a COMPLETE, self-contained HTML file.

Requirements:
- Output a single HTML file starting with <!DOCTYPE html> and ending with </html>
- All CSS must be in a single <style> tag in the <head> — no external stylesheets
- Responsive design with media queries for mobile (max-width: 768px) and tablet
- Modern, clean design that reflects the business personality described in the research report
- Use the photo URLs from the PHOTO INVENTORY — embed them directly as <img> src attributes or CSS background-image
- The inventory includes both original photos (google, facebook, instagram) AND AI-generated photos (source: ai_generated)
- For the photoAssetPlan items with recommendation "use_existing", use the corresponding URL from the inventory
- For items with recommendation "generate_ai", look for matching AI-generated photos in the inventory (IDs starting with "ai_") and use their URLs
- If an AI-generated photo URL is not available for a slot, use a CSS gradient background placeholder
- Include ALL real business data: name, address, phone, hours, curated reviews, services
- Follow the research report's tone, suggested sections, and content recommendations
- Include a call-to-action section with clickable phone (tel:) and directions (Google Maps) links
- Use semantic HTML5 elements (header, nav, main, section, footer)
- Include <meta name="viewport" content="width=device-width, initial-scale=1.0">
- Use Google Fonts (Inter or a font that matches the tone) via @import in the style tag
- All text content must be in ${langName}
- Keep the HTML under 15KB — be concise with CSS, avoid repetition

CRITICAL: Output ONLY the complete HTML document. No markdown fences, no explanation text, no comments before or after. Start with <!DOCTYPE html> and end with </html>.`;

  // Build the photo URL lookup — compact format
  const photoLines = (photoInventory || []).map(p =>
    `${p.id}|${p.type}|${p.url}`
  ).join('\n');

  // Compact the research report (no pretty-printing)
  const userMessage = `=== RESEARCH REPORT ===
${JSON.stringify(researchReport)}

=== PHOTO INVENTORY (id|type|url) ===
${photoLines || 'No photos available'}

=== BUSINESS DATA ===
${businessData}

Generate the website HTML now.`;

  try {
    // Use streaming to keep the connection alive and avoid Vercel gateway timeout
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 12000,
        stream: true,
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

    // Collect streamed text chunks into full HTML
    let fullText = '';
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const jsonStr = line.slice(6);
        if (jsonStr === '[DONE]') continue;

        try {
          const event = JSON.parse(jsonStr);
          if (event.type === 'content_block_delta' && event.delta?.text) {
            fullText += event.delta.text;
          }
        } catch (e) {
          // Skip non-JSON lines
        }
      }
    }

    // Strip markdown code fences if present
    let html = fullText.trim();
    if (html.startsWith('```')) {
      html = html.replace(/^```(?:html)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    // Validate it looks like HTML
    if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
      console.error('Generated content does not appear to be valid HTML:', html.substring(0, 200));
      return res.status(502).json({ error: 'Generated content does not appear to be valid HTML' });
    }

    res.setHeader('Cache-Control', 'private, no-store');
    return res.status(200).json({ html });
  } catch (err) {
    console.error('Website generation error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
