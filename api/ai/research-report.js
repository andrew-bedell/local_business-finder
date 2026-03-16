// Vercel serverless function: Claude API research report generation
// Receives compiled business data, returns structured JSON report for website content planning

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

  const { businessData, name, language } = req.body || {};

  if (!businessData || !name) {
    return res.status(400).json({ error: 'Missing required fields: businessData, name' });
  }

  const langName = language === 'es' ? 'Spanish' : 'English';

  const systemPrompt = `You are a web design content strategist specializing in local business websites. Given comprehensive data about a local business (including reviews, social media presence, photos, and operational details), analyze everything and produce a structured JSON report recommending what content should go on the business's website.

Your report should be practical and actionable — focus on what makes this specific business unique based on the actual data provided. Do not give generic advice. Every recommendation should be grounded in the data.

Write ALL text content in ${langName}.

Respond with ONLY valid JSON (no markdown fences, no extra text) matching this exact schema:
{
  "businessSummary": "2-3 sentence overview of what this business is and what makes it special",
  "keySellingPoints": ["4-6 unique selling points derived from the data"],
  "reviewHighlights": {
    "themes": ["recurring positive themes customers mention"],
    "quotableReviews": ["2-3 best review excerpts to feature on the website, verbatim from the data"],
    "areasToAvoid": ["topics that reviews are negative about — do NOT put these on the website"]
  },
  "suggestedSections": [
    { "name": "section name", "description": "what content should go here and why", "priority": "high|medium|low" }
  ],
  "toneRecommendations": {
    "overallTone": "e.g., warm and family-friendly, upscale and refined, casual and fun",
    "writingStyle": "specific guidance on voice, sentence length, formality",
    "wordsToUse": ["brand-aligned vocabulary to use on the site"],
    "wordsToAvoid": ["words or phrases that don't fit this business"]
  },
  "competitivePositioning": "1-2 paragraphs on how this business stands out in its market based on the data",
  "contentGaps": ["what data is missing that would strengthen the website — actionable items"],
  "socialMediaInsights": "what their social media presence reveals about their brand and audience (or null if no social data)",
  "localSeoKeywords": ["8-12 suggested keywords for local SEO based on the business type, location, and services"],
  "photoAssetPlan": [
    {
      "section": "website section name (e.g., Hero, About, Menu, Gallery, Testimonials)",
      "slot": "description of what image is needed for this slot",
      "recommendation": "use_existing OR generate_ai",
      "existingPhotoId": "the photo ID from the inventory (only when recommendation is use_existing)",
      "aiPrompt": "a detailed image generation prompt describing exactly what image to create — include style, composition, lighting, colors, and subject (only when recommendation is generate_ai)",
      "rationale": "why this photo was chosen or why AI generation is needed"
    }
  ]
}

IMPORTANT — Photo Asset Plan instructions:
Examine the PHOTO INVENTORY section in the business data. For each website section that needs an image:
1. If a suitable existing photo exists, set recommendation to "use_existing" and reference it by its ID (e.g., "google_photo_2", "fb_cover", "ig_post_5")
2. If no suitable photo exists, set recommendation to "generate_ai" and write a detailed prompt for AI image generation — be specific about style, composition, lighting, mood, and subject matter
3. Cover at minimum: hero/header image, about section image, and any section-specific images (menu photos for restaurants, service photos for service businesses, etc.)
4. Use Instagram post captions to infer what's in unclassified photos`;

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
        max_tokens: 6144,
        stream: true,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Analyze the following business data and generate the website content report:\n\n${businessData}`,
          },
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

    // Forward the SSE stream to the client to keep the Vercel connection alive
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }

    res.end();
  } catch (err) {
    console.error('Research report error:', err);
    // If headers already sent (streaming started), just end the response
    if (res.headersSent) {
      res.end();
    } else {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
