// Vercel serverless function: Suggest available .com domains for a business
// POST { business_name, country_code? }
// Returns { suggestions: [{ domain, price, currency }], recommended: "domain.com" }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.PORKBUN_API_KEY;
  const apiSecret = process.env.PORKBUN_API_SECRET;

  if (!apiKey || !apiSecret) {
    return res.status(503).json({ error: 'Porkbun API not configured' });
  }

  const { business_name, country_code } = req.body || {};

  if (!business_name || typeof business_name !== 'string') {
    return res.status(400).json({ error: 'Missing required field: business_name' });
  }

  // Generate domain candidates from business name
  const candidates = generateCandidates(business_name.trim(), country_code);

  // Check availability via Porkbun, respecting rate limit (10s between checks)
  const suggestions = [];
  const MAX_CHECKS = 5;
  let checked = 0;

  for (const candidate of candidates) {
    if (checked >= MAX_CHECKS) break;

    // Wait 10s between checks (skip for first)
    if (checked > 0) {
      await sleep(10000);
    }

    try {
      const result = await checkDomain(candidate, apiKey, apiSecret);
      checked++;

      if (result.available && parseFloat(result.price) <= 12.00) {
        suggestions.push({
          domain: candidate,
          price: result.price,
          currency: 'USD',
        });
      }
    } catch (err) {
      console.error(`Domain check failed for ${candidate}:`, err.message);
      checked++;
    }
  }

  // Sort: shortest domain first, then lowest price
  suggestions.sort((a, b) => {
    const lenDiff = a.domain.length - b.domain.length;
    if (lenDiff !== 0) return lenDiff;
    return parseFloat(a.price) - parseFloat(b.price);
  });

  return res.status(200).json({
    suggestions,
    recommended: suggestions.length > 0 ? suggestions[0].domain : null,
    candidates_checked: checked,
    total_candidates: candidates.length,
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Normalize name to URL-safe slug (reuses logic from publish.js:generateUniqueSlug)
function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // strip diacritics
    .replace(/[^a-z0-9]+/g, '-')       // non-alphanumeric → hyphens
    .replace(/-+/g, '-')               // collapse multiple hyphens
    .replace(/^-|-$/g, '');            // trim leading/trailing hyphens
}

// Spanish articles and prepositions to strip
const ARTICLES = ['el', 'la', 'los', 'las', 'de', 'del', 'un', 'una'];

function generateCandidates(name, countryCode) {
  const slug = slugify(name);
  if (!slug) return ['negocio.com'];

  const words = slug.split('-').filter(w => w.length > 0);
  const candidates = new Set();

  // 1. Exact slug (with hyphens)
  candidates.add(slug + '.com');

  // 2. No hyphens
  const noHyphens = words.join('');
  if (noHyphens !== slug) {
    candidates.add(noHyphens + '.com');
  }

  // 3. Stripped articles
  const stripped = words.filter(w => !ARTICLES.includes(w));
  if (stripped.length > 0 && stripped.length < words.length) {
    candidates.add(stripped.join('') + '.com');
    if (stripped.length > 1) {
      candidates.add(stripped.join('-') + '.com');
    }
  }

  // 4. "mi" prefix (common in Spanish business domains)
  candidates.add('mi' + noHyphens + '.com');

  // 5. Abbreviated — first word + last word (if 3+ words)
  if (words.length >= 3) {
    candidates.add(words[0] + words[words.length - 1] + '.com');
  }

  // 6. Initials + longest word
  if (words.length >= 2) {
    const longestWord = words.reduce((a, b) => a.length >= b.length ? a : b);
    const initials = words.filter(w => w !== longestWord).map(w => w[0]).join('');
    if (initials.length > 0) {
      candidates.add(initials + longestWord + '.com');
    }
  }

  // 7. First two words only (if 3+ words)
  if (words.length >= 3) {
    candidates.add(words.slice(0, 2).join('') + '.com');
  }

  // 8. With city-style suffix based on country
  const suffix = countryCode === 'CO' ? 'co' : countryCode === 'EC' ? 'ec' : '';
  if (suffix && stripped.length > 0) {
    candidates.add(stripped.join('') + suffix + '.com');
  }

  // Filter: domains must be 3-63 chars (before .com), no leading/trailing hyphens
  const filtered = [];
  for (const domain of candidates) {
    const base = domain.replace('.com', '');
    if (base.length >= 3 && base.length <= 63 && !base.startsWith('-') && !base.endsWith('-')) {
      filtered.push(domain);
    }
  }

  return filtered;
}

async function checkDomain(domain, apiKey, apiSecret) {
  const resp = await fetch(`https://api.porkbun.com/api/json/v3/domain/checkDomain/${domain}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apikey: apiKey, secretapikey: apiSecret }),
  });

  if (!resp.ok) {
    throw new Error(`Porkbun API returned ${resp.status}`);
  }

  const data = await resp.json();

  if (data.status !== 'SUCCESS' || !data.response) {
    throw new Error(`Porkbun API error: ${data.status || 'unknown'}`);
  }

  return {
    available: data.response.avail === 'yes',
    price: data.response.price || '99.99',
  };
}
