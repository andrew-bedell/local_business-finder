// Vercel serverless function: Sonnet content writing for website generation
// Receives research report + business data + photo manifest, returns structured JSON with all website copy

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

  const { researchReport, businessData: rawBusinessData, photoManifest, language } = req.body || {};

  if (!researchReport || !rawBusinessData) {
    return res.status(400).json({ error: 'Missing required fields: researchReport, businessData' });
  }

  // Strip unpaired Unicode surrogates that break JSON serialization
  const businessData = rawBusinessData.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '');

  const langName = language === 'es' ? 'Spanish' : 'English';

  const systemPrompt = `You are an expert copywriter specializing in local business websites. Given a research report and business data, write ALL the text content for a business website.

CRITICAL RULES:
- Write ALL text in ${langName}
- Use the tone and vocabulary from the research report's toneRecommendations
- Feature the keySellingPoints and quotableReviews from the report
- Write persuasive, specific copy grounded in actual business data — no generic filler
- Follow the suggestedSections list from the report for structure
- Every piece of copy should reference something specific about THIS business (a review quote, a service, a detail from the data)
- Keep headlines punchy (under 10 words), subheadlines under 20 words
- Paragraphs should be 2-3 sentences max
- For the testimonials section, use REAL review quotes from the data — do not fabricate reviews

Respond with ONLY valid JSON (no markdown fences, no extra text) matching this schema:
{
  "meta": {
    "title": "Page title for browser tab (business name + location)",
    "description": "Meta description for SEO (under 160 chars)",
    "keywords": "Comma-separated SEO keywords"
  },
  "hero": {
    "headline": "Bold, attention-grabbing headline",
    "subheadline": "Supporting text that expands on the headline"
  },
  "about": {
    "heading": "Section heading",
    "paragraphs": ["First paragraph about the business", "Second paragraph with more detail"]
  },
  "services": {
    "heading": "Section heading",
    "items": [{ "name": "Service name", "description": "Brief description" }]
  },
  "whyChooseUs": {
    "heading": "Section heading",
    "points": [{ "title": "Point title", "description": "Why this matters" }]
  },
  "testimonials": {
    "heading": "Section heading",
    "reviews": [{ "quote": "Exact review quote from the data", "author": "Reviewer name", "stars": 5 }]
  },
  "gallery": {
    "heading": "Section heading"
  },
  "cta": {
    "heading": "Call to action heading",
    "buttonText": "Button label",
    "supportingText": "Text below the CTA button"
  },
  "hours": {
    "heading": "Section heading",
    "formatted": ["Monday: 9:00 AM - 6:00 PM", "..."]
  },
  "contact": {
    "heading": "Section heading",
    "phone": "Business phone number",
    "address": "Full business address",
    "directionsText": "Text for the directions link"
  },
  "footer": {
    "tagline": "Short brand tagline",
    "copyright": "Copyright line"
  }
}

IMPORTANT:
- If the business data doesn't include hours, omit the "formatted" array (set to [])
- If there are no reviews, use the quotableReviews from the research report
- Include 3-5 services based on the business category and data
- Include 3-4 whyChooseUs points based on the keySellingPoints
- Include 2-3 testimonials with real review quotes`;

  const userMessage = `=== RESEARCH REPORT ===
${JSON.stringify(researchReport)}

=== BUSINESS DATA ===
${businessData}

=== PHOTO MANIFEST (sections that will have images) ===
${(photoManifest || []).map(p => p.section).join(', ') || 'No photos planned'}

Write all the website content now.`;

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
        max_tokens: 4096,
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
      if (response.status === 529) {
        return res.status(529).json({ error: 'Claude API is temporarily overloaded. Please try again in a moment.' });
      }
      let detail = '';
      try { detail = JSON.parse(errorText).error?.message || errorText.substring(0, 200); } catch (e) { detail = errorText.substring(0, 200); }
      return res.status(502).json({ error: 'Claude API request failed: ' + detail });
    }

    // Collect streamed text chunks into full response
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
    let jsonText = fullText.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    // Clean up common JSON issues: trailing commas before ] or }
    jsonText = jsonText.replace(/,\s*([\]}])/g, '$1');

    try {
      const content = JSON.parse(jsonText);
      res.setHeader('Cache-Control', 'private, no-store');
      return res.status(200).json(content);
    } catch (parseErr) {
      console.error('Content writing JSON parse error:', parseErr.message, 'Raw text:', jsonText.substring(0, 500));

      // Try to recover by finding the outermost JSON object
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const cleaned = jsonMatch[0].replace(/,\s*([\]}])/g, '$1');
        try {
          const content = JSON.parse(cleaned);
          res.setHeader('Cache-Control', 'private, no-store');
          return res.status(200).json(content);
        } catch (e) {
          // Fall through to error
        }
      }

      return res.status(502).json({ error: 'Failed to parse content writing response as JSON' });
    }
  } catch (err) {
    console.error('Content writing error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
