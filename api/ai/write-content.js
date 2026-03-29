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

  const { researchReport, businessData: rawBusinessData, photoManifest, language, category, subcategory } = req.body || {};

  if (!researchReport || !rawBusinessData) {
    return res.status(400).json({ error: 'Missing required fields: researchReport, businessData' });
  }

  // Strip unpaired Unicode surrogates that break JSON serialization
  const businessData = rawBusinessData.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '');

  const langName = language === 'es' ? 'Spanish' : 'English';
  const cat = (category || '').toLowerCase();

  // Build category-specific schema additions
  let categorySchema = '';
  let categoryInstructions = '';

  if (['restaurant', 'restaurante', 'food', 'comida'].some(k => cat.includes(k))) {
    categorySchema = `,
  "menuHighlights": {
    "heading": "Menu section heading",
    "categories": [{ "name": "Category name (e.g., Entradas, Platos Fuertes)", "items": [{ "name": "Dish name", "description": "Brief description", "price": "Price or price range" }] }]
  },
  "ambiance": {
    "heading": "Ambiance section heading",
    "description": "1-2 paragraphs describing the restaurant atmosphere, decor, and dining experience"
  }`;
    categoryInstructions = `\n- RESTAURANT: Include 2-3 menu categories with 3-4 items each. Use actual menu items if available in the data. Describe the ambiance based on reviews and photos.`;
  } else if (['salon', 'salón', 'beauty', 'belleza', 'spa', 'peluquería'].some(k => cat.includes(k))) {
    categorySchema = `,
  "treatments": {
    "heading": "Treatments section heading",
    "categories": [{ "name": "Category name (e.g., Hair, Nails, Facials)", "items": [{ "name": "Treatment name", "description": "Brief description", "priceRange": "Price range (optional)", "duration": "Duration (optional)" }] }]
  },
  "team": {
    "heading": "Team section heading",
    "members": [{ "name": "Stylist/specialist name", "title": "Role/specialty", "bio": "Short bio (1-2 sentences)" }]
  }`;
    categoryInstructions = `\n- BEAUTY SALON: Include 2-3 treatment categories with 3-4 items each. If staff/team data is available, include team members. Otherwise include 2-3 based on what reviews mention.`;
  } else if (['nail', 'uñas', 'manicur', 'pedicur'].some(k => cat.includes(k))) {
    categorySchema = `,
  "treatments": {
    "heading": "Services & pricing section heading",
    "categories": [{ "name": "Category name (e.g., Manicure, Pedicure, Nail Art)", "items": [{ "name": "Service name", "description": "Brief description", "priceRange": "Price range (optional)", "duration": "Duration (optional)" }] }]
  },
  "designGallery": {
    "heading": "Nail art gallery section heading"
  }`;
    categoryInstructions = `\n- NAIL SALON: Include 2-3 service categories (manicure, pedicure, nail art, etc.) with 3-4 items each. Include pricing if available.`;
  } else if (['doctor', 'médico', 'clinic', 'clínica', 'medical', 'health'].some(k => cat.includes(k))) {
    categorySchema = `,
  "credentials": {
    "heading": "Credentials section heading",
    "items": [{ "name": "Doctor name", "title": "Specialty", "credentials": "Certifications and qualifications" }]
  },
  "insuranceAccepted": {
    "heading": "Insurance section heading",
    "providers": ["Insurance provider names"]
  }`;
    categoryInstructions = `\n- DOCTOR/CLINIC: Include credentials for each doctor mentioned in the data. List accepted insurance providers if available.`;
  } else if (['dentist', 'dental', 'odontol'].some(k => cat.includes(k))) {
    categorySchema = `,
  "dentalServices": {
    "heading": "Dental services section heading",
    "items": [{ "name": "Service name", "description": "Brief description of the procedure" }]
  },
  "insuranceAccepted": {
    "heading": "Insurance section heading",
    "providers": ["Insurance/dental plan names"]
  }`;
    categoryInstructions = `\n- DENTIST: Include 4-6 dental services (cleanings, whitening, implants, etc.). List accepted insurance if available.`;
  } else if (['lawyer', 'abogad', 'legal', 'attorney', 'law firm'].some(k => cat.includes(k))) {
    categorySchema = `,
  "practiceAreas": {
    "heading": "Practice areas section heading",
    "areas": [{ "name": "Practice area name", "description": "Brief description of this legal specialty" }]
  }`;
    categoryInstructions = `\n- LAWYER: Include 3-5 practice areas based on the firm's specialties mentioned in the data.`;
  } else if (['gym', 'gimnasio', 'fitness', 'crossfit', 'workout'].some(k => cat.includes(k))) {
    categorySchema = `,
  "memberships": {
    "heading": "Membership section heading",
    "tiers": [{ "name": "Tier name", "price": "Monthly price", "features": ["Feature 1", "Feature 2"] }]
  },
  "classSchedule": {
    "heading": "Classes section heading",
    "classes": [{ "name": "Class name", "schedule": "When it meets", "description": "Brief description" }]
  }`;
    categoryInstructions = `\n- GYM: Include 2-3 membership tiers with pricing if available. Include popular classes if mentioned in the data.`;
  } else if (['cafe', 'café', 'coffee', 'bakery', 'panadería'].some(k => cat.includes(k))) {
    categorySchema = `,
  "menuHighlights": {
    "heading": "Menu section heading",
    "categories": [{ "name": "Category name (e.g., Bebidas, Pasteles)", "items": [{ "name": "Item name", "description": "Brief description", "price": "Price (optional)" }] }]
  },
  "dailySpecials": {
    "heading": "Daily specials section heading",
    "items": [{ "name": "Special name", "description": "Brief description" }]
  }`;
    categoryInstructions = `\n- CAFE/BAKERY: Include 2-3 menu categories with popular items. Include daily specials if mentioned.`;
  } else if (['auto', 'mechanic', 'mecánic', 'taller', 'car repair'].some(k => cat.includes(k))) {
    categorySchema = `,
  "autoServices": {
    "heading": "Services section heading",
    "items": [{ "name": "Service name", "description": "Brief description" }],
    "certifications": ["Certification or brand names serviced"]
  },
  "estimateCTA": {
    "heading": "Get estimate section heading",
    "description": "Supporting text for estimate request",
    "buttonText": "Button label for estimate"
  }`;
    categoryInstructions = `\n- AUTO REPAIR: Include 4-6 auto services. List certifications and brands serviced if available.`;
  } else if (['plumber', 'plomero', 'electrician', 'electricista', 'contractor', 'contratista', 'painter', 'pintor', 'handyman'].some(k => cat.includes(k))) {
    categorySchema = `,
  "emergencyCTA": {
    "heading": "Emergency section heading",
    "description": "Description of emergency availability",
    "available247": true,
    "buttonText": "Emergency call button text"
  },
  "coverageArea": {
    "heading": "Service area section heading",
    "areas": ["Area/neighborhood names"],
    "description": "Brief description of service coverage"
  }`;
    categoryInstructions = `\n- CONTRACTOR/TRADES: Include emergency availability info if applicable. List service areas/neighborhoods covered.`;
  }

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
  }${categorySchema}
}

IMPORTANT:
- If the business data doesn't include hours, omit the "formatted" array (set to [])
- If there are no reviews, use the quotableReviews from the research report
- Include 3-5 services based on the business category and data
- Include 3-4 whyChooseUs points based on the keySellingPoints
- Include 2-3 testimonials with real review quotes${categoryInstructions}`;

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
        'anthropic-beta': 'prompt-caching-2024-07-31',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        stream: true,
        system: [
          {
            type: 'text',
            text: systemPrompt,
            cache_control: { type: 'ephemeral' },
          },
        ],
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
