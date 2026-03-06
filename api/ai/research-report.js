// Vercel serverless function: Claude API research report generation
// Receives compiled business data, returns structured JSON report for website content planning

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
  "localSeoKeywords": ["8-12 suggested keywords for local SEO based on the business type, location, and services"]
}`;

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
      return res.status(502).json({ error: 'Claude API request failed' });
    }

    const data = await response.json();
    const rawText = data.content && data.content[0] ? data.content[0].text : '';

    // Strip markdown code fences if present
    let jsonText = rawText.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    let report;
    try {
      report = JSON.parse(jsonText);
    } catch (parseErr) {
      console.warn('JSON parse failed, returning raw text:', parseErr.message);
      report = { rawText: rawText, parseError: true };
    }

    res.setHeader('Cache-Control', 'private, no-store');
    return res.status(200).json({
      report,
      usage: data.usage || null,
    });
  } catch (err) {
    console.error('Research report error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
