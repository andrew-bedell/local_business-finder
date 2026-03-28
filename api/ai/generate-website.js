// Vercel serverless function: Website generation
// V2: Deterministic template assembly via Design Engine (no AI call)
// V1 fallback: Claude Haiku streaming (legacy, behind useV1 flag)

import { assembleWebsite } from '../_lib/design-engine/index.js';

export const config = { maxDuration: 300 }; // Keep 300 for V1 fallback; V2 completes in <5s

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

  const {
    // V2 fields
    websiteContent,
    designPalette,
    photoManifest,
    category,
    subcategory,
    phone,
    whatsapp,
    address,
    mapsUrl,
    socialProfiles,
    menuItems,
    staffMembers,
    services,
    founderName,
    founderDescription,
    // Legacy format fields
    businessData: rawBusinessData,
    researchReport,
    photoInventory,
    // Shared
    name,
    language,
    // Flags
    useV1,
  } = req.body || {};

  const isNewFormat = !!websiteContent;

  // ── V1 Legacy fallback (Claude Haiku) ──
  if (useV1 || (!isNewFormat && rawBusinessData)) {
    return handleV1(req, res, {
      websiteContent, designPalette, photoManifest,
      rawBusinessData, researchReport, photoInventory,
      name, language, isNewFormat,
    });
  }

  // ── V2: Deterministic template assembly ──
  if (!websiteContent || !name) {
    return res.status(400).json({ error: 'Missing required fields: websiteContent, name' });
  }

  try {
    const html = assembleWebsite({
      content: websiteContent,
      researchReport: { designPalette: designPalette || {}, toneRecommendations: researchReport?.toneRecommendations },
      photoManifest: (photoManifest || []).map(p => ({ section: p.section, slot: p.slot, url: p.url })),
      business: {
        name,
        category: category || '',
        subcategory: subcategory || '',
        phone: phone || '',
        whatsapp: whatsapp || '',
        address: address || '',
        mapsUrl: mapsUrl || '',
        socialProfiles: socialProfiles || [],
        language: language || 'es',
        menuItems: menuItems || [],
        staffMembers: staffMembers || [],
        services: services || [],
        founderName: founderName || '',
        founderDescription: founderDescription || '',
      },
    });

    res.setHeader('Cache-Control', 'private, no-store');
    return res.status(200).json({ html, engine: 'v2', variation: html.match(/class="(\w+)"/)?.[1] || 'unknown' });
  } catch (err) {
    console.error('V2 website assembly error:', err);
    return res.status(500).json({ error: 'Website assembly failed: ' + err.message });
  }
}

// ── V1 Legacy handler (Claude Haiku streaming) ──
async function handleV1(req, res, { websiteContent, designPalette, photoManifest, rawBusinessData, researchReport, photoInventory, name, language, isNewFormat }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Anthropic API key not configured' });
  }

  if (isNewFormat) {
    if (!websiteContent || !name) {
      return res.status(400).json({ error: 'Missing required fields: websiteContent, name' });
    }
  } else {
    if (!rawBusinessData || !name || !researchReport) {
      return res.status(400).json({ error: 'Missing required fields: businessData, name, researchReport' });
    }
  }

  const langName = language === 'es' ? 'Spanish' : 'English';
  let systemPrompt, userMessage;

  if (isNewFormat) {
    systemPrompt = `You are an expert web developer who creates beautiful, modern, single-page business websites. You are given PRE-WRITTEN website content, a design palette, and a photo manifest. Your job is to ASSEMBLE these into a complete, beautiful HTML/CSS page.

DESIGN REQUIREMENTS:
- Output a single HTML file starting with <!DOCTYPE html> and ending with </html>
- All CSS must be in a single <style> tag in the <head> — no external stylesheets
- Responsive design with media queries for mobile (max-width: 768px) and tablet
- Use semantic HTML5 elements (header, nav, main, section, footer)
- Include <meta name="viewport" content="width=device-width, initial-scale=1.0">
- Use Google Fonts (Inter or a font that matches the tone) via @import in the style tag
- All text content must be in ${langName}
- Keep the HTML under 15KB — be concise with CSS, avoid repetition

COLOR & VISUAL DESIGN:
- Use the provided design palette colors for all styling
- Define CSS custom properties: --primary, --secondary, --accent, --bg-alt, --bg-dark
- NEVER make the entire page white — alternate section backgrounds between white, a tinted version of the secondary color, and optionally a dark section
- Cards and feature boxes should have subtle background fills
- The testimonials section should have a colored/dark background to stand out
- The footer should be dark (dark gray or dark version of primary color)

LOGO & HEADER:
- Use a text-based logo: the business name in a distinctive, well-styled font
- Header: text logo on the left, simple navigation links on the right
- Hero section: full-width background image with a dark overlay and headline text on top

MOBILE NAVIGATION — CRITICAL:
- On screens ≤ 768px, HIDE the desktop nav links and show a hamburger menu button (☰) in the header
- Hamburger button: three horizontal lines (span elements), positioned top-right of header
- On click, toggle a mobile menu that slides down from below the header
- Mobile menu: full-width, vertical stack of nav links, styled with the site's color palette
- Include this inline JavaScript (no external dependencies):
  * Toggle a class (e.g., "nav-open") on the hamburger button and mobile menu on click
  * Close the menu when any nav link is clicked (smooth scroll to section)
  * Animate the hamburger icon to an X shape when open (CSS transforms on the spans)
- CSS requirements:
  * Desktop (> 768px): hamburger hidden, nav links displayed inline
  * Mobile (≤ 768px): nav links hidden, hamburger visible, mobile menu initially hidden
  * Mobile menu background should use the site's palette (e.g., white or dark depending on header style)
  * Menu items should have generous padding (14-16px) for touch targets
  * Add a smooth transition on the menu (max-height or transform)
- NEVER let nav links wrap to multiple lines on mobile — the hamburger replaces them entirely

PHOTO USAGE — CRITICAL:
- Each line in the photo manifest is section|slot|url — use the exact URL for each section
- Embed photos as <img> src attributes or CSS background-image url()
- NEVER use solid color blocks, CSS gradients, or colored rectangles as image placeholders
- Every <img> tag must use object-fit: cover and have proper aspect ratios
- Include a photo gallery section with a CSS grid

CONTENT — CRITICAL:
- Use the pre-written content EXACTLY as provided — do not rewrite or paraphrase it
- Place each content section in the corresponding HTML section
- Include clickable phone (tel:) and directions (Google Maps) links
- Include the meta title and description in the <head>

CRITICAL: Output ONLY the complete HTML document. No markdown fences, no explanation text. Start with <!DOCTYPE html> and end with </html>.`;

    const photoLines = (photoManifest || []).map(p => `${p.section}|${p.slot}|${p.url}`).join('\n');
    userMessage = `=== WEBSITE CONTENT (pre-written, use exactly as provided) ===\n${JSON.stringify(websiteContent)}\n\n=== DESIGN PALETTE ===\n${JSON.stringify(designPalette || {})}\n\n=== PHOTO MANIFEST (section|slot|url — use these exact URLs) ===\n${photoLines || 'No photos available'}\n\nGenerate the website HTML now.`;
  } else {
    const businessData = rawBusinessData.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '');
    systemPrompt = `You are an expert web developer who creates beautiful, modern, single-page business websites. Given a research report and business data, generate a COMPLETE, self-contained HTML file.

DESIGN REQUIREMENTS:
- Output a single HTML file starting with <!DOCTYPE html> and ending with </html>
- All CSS must be in a single <style> tag in the <head> — no external stylesheets
- Responsive design with media queries for mobile (max-width: 768px) and tablet
- Modern, clean design that reflects the business personality described in the research report
- Use semantic HTML5 elements (header, nav, main, section, footer)
- Include <meta name="viewport" content="width=device-width, initial-scale=1.0">
- Use Google Fonts (Inter or a font that matches the tone) via @import in the style tag
- All text content must be in ${langName}
- Keep the HTML under 15KB — be concise with CSS, avoid repetition

COLOR & VISUAL DESIGN — CRITICAL:
- The research report includes a "designPalette" with primaryColor, secondaryColor, accentColor, and sectionStyle — USE THESE COLORS
- NEVER make the entire page white — alternate section backgrounds
- Cards and feature boxes should have subtle background fills
- The testimonials section should have a colored/dark background
- The footer should be dark
- Use CSS custom properties for colors: --primary, --secondary, --accent, --bg-alt, --bg-dark

LOGO & HEADER:
- Use a text-based logo
- The header should have: text logo on the left, simple navigation links on the right
- Hero section below the header: full-width background image with a dark overlay

MOBILE NAVIGATION — CRITICAL:
- On screens ≤ 768px, HIDE the desktop nav links and show a hamburger menu button
- Include inline JavaScript for hamburger toggle
- NEVER let nav links wrap to multiple lines on mobile

PHOTO USAGE — CRITICAL:
- Use the photo URLs from the PHOTO INVENTORY
- NEVER use solid color blocks or CSS gradients as image placeholders
- Every <img> tag must use object-fit: cover

CONTENT:
- Include ALL real business data
- Feature 2-3 customer reviews with star ratings in a testimonials section

CRITICAL: Output ONLY the complete HTML document. No markdown fences, no explanation text. Start with <!DOCTYPE html> and end with </html>.`;

    const photoLines = (photoInventory || []).map(p => `${p.id}|${p.type}|${p.url}`).join('\n');
    userMessage = `=== RESEARCH REPORT ===\n${JSON.stringify(researchReport)}\n\n=== PHOTO INVENTORY (id|type|url) ===\n${photoLines || 'No photos available'}\n\n=== BUSINESS DATA ===\n${businessData}\n\nGenerate the website HTML now.`;
  }

  try {
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
        messages: [{ role: 'user', content: userMessage }],
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
        } catch (e) { /* skip */ }
      }
    }

    let html = fullText.trim();
    if (html.startsWith('```')) {
      html = html.replace(/^```(?:html)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
      console.error('Generated content does not appear to be valid HTML:', html.substring(0, 200));
      return res.status(502).json({ error: 'Generated content does not appear to be valid HTML' });
    }

    res.setHeader('Cache-Control', 'private, no-store');
    return res.status(200).json({ html, engine: 'v1' });
  } catch (err) {
    console.error('V1 website generation error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
