// Vercel serverless function: scan photos for text overlays using Claude vision
// Marks business_photos.has_text_overlay so text-heavy images are excluded from websites

export const config = { maxDuration: 120 };

const BATCH_SIZE = 5;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }
  if (!anthropicKey) {
    return res.status(503).json({ error: 'Anthropic API key not configured' });
  }

  const { businessId } = req.body || {};
  if (!businessId) {
    return res.status(400).json({ error: 'businessId required' });
  }

  try {
    // Fetch photos that haven't been scanned yet and have accessible URLs
    // Either persisted (storage_path set) or from sources with stable URLs (google, ai_generated)
    const queryRes = await fetch(
      `${supabaseUrl}/rest/v1/business_photos?business_id=eq.${businessId}&has_text_overlay=is.null&or=(storage_path.not.is.null,source.in.(google,ai_generated))&select=id,source,photo_type,url,storage_path&limit=120`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
        },
      }
    );

    if (!queryRes.ok) {
      const errText = await queryRes.text();
      return res.status(500).json({ error: 'Failed to query photos', detail: errText.substring(0, 200) });
    }

    const photos = await queryRes.json();
    if (photos.length === 0) {
      return res.status(200).json({ scanned: 0, flagged: 0 });
    }

    // Build accessible URLs for each photo
    const photosWithUrls = photos.map(p => ({
      id: p.id,
      url: p.storage_path
        ? `${supabaseUrl}/storage/v1/object/public/photos/${p.storage_path}`
        : p.url,
    })).filter(p => p.url);

    let scanned = 0;
    let flagged = 0;
    const errors = [];

    // Process in batches
    for (let i = 0; i < photosWithUrls.length; i += BATCH_SIZE) {
      const batch = photosWithUrls.slice(i, i + BATCH_SIZE);

      try {
        const results = await scanBatch(batch, anthropicKey);

        // Update each photo in the database
        await Promise.all(results.map(async (result) => {
          try {
            const patchRes = await fetch(
              `${supabaseUrl}/rest/v1/business_photos?id=eq.${result.id}`,
              {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${supabaseKey}`,
                  'apikey': supabaseKey,
                  'Content-Type': 'application/json',
                  'Prefer': 'return=minimal',
                },
                body: JSON.stringify({ has_text_overlay: result.hasText }),
              }
            );
            if (patchRes.ok) {
              scanned++;
              if (result.hasText) flagged++;
            }
          } catch (err) {
            errors.push({ id: result.id, error: err.message });
          }
        }));
      } catch (err) {
        console.warn(`Batch scan error (batch starting at ${i}):`, err.message);
        // Mark batch as scanned with false to avoid re-scanning on retry
        await Promise.all(batch.map(async (photo) => {
          try {
            await fetch(`${supabaseUrl}/rest/v1/business_photos?id=eq.${photo.id}`, {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal',
              },
              body: JSON.stringify({ has_text_overlay: false }),
            });
            scanned++;
          } catch {}
        }));
      }
    }

    console.log(`Photo text scan: ${scanned} scanned, ${flagged} flagged for business ${businessId}`);
    if (errors.length > 0) console.warn('Scan errors:', errors);

    return res.status(200).json({ scanned, flagged });
  } catch (err) {
    console.error('Photo text scan error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Download an image and return as base64 for Claude vision API.
 */
async function downloadAsBase64(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > 5 * 1024 * 1024) return null; // Skip >5MB
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

/**
 * Scan a batch of photos with Claude Haiku vision to detect text overlays.
 * Returns array of { id, hasText } for each photo in the batch.
 */
async function scanBatch(photos, apiKey) {
  // Download all images in parallel
  const downloads = await Promise.all(
    photos.map(async (photo) => {
      const img = await downloadAsBase64(photo.url);
      return { ...photo, img };
    })
  );

  // Filter out failed downloads
  const valid = downloads.filter(d => d.img);
  if (valid.length === 0) {
    return photos.map(p => ({ id: p.id, hasText: false }));
  }

  // Build Claude message content
  const content = [];
  valid.forEach((photo, i) => {
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: photo.img.mediaType,
        data: photo.img.data,
      },
    });
    content.push({
      type: 'text',
      text: `Image ${i + 1} (ID: ${photo.id})`,
    });
  });

  content.push({
    type: 'text',
    text: `For each image above, determine if it has significant text overlays — promotional text, sale/discount announcements, event dates, decorative large text, price tags, menus overlaid on the image, hashtags, or any added text that covers a meaningful portion of the image and could interfere with website text placement or contain outdated information.

Things that do NOT count as text overlays: business name signs naturally visible in the scene, small subtle watermarks, text on products (like labels), or street signs.

Respond with ONLY a JSON array, no other text: [{"id": "the_photo_id", "has_text": true}] — include only photos that HAVE text overlays. Omit photos that are clean.`,
  });

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude API error: ${response.status} ${errText.substring(0, 200)}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '[]';

  // Parse JSON from response
  const match = text.match(/\[[\s\S]*\]/);
  const flaggedIds = new Set();

  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      for (const item of parsed) {
        if (item.has_text === true) flaggedIds.add(item.id);
      }
    } catch {
      // If parsing fails, assume no text overlays
    }
  }

  // Build results: flagged photos get true, all others get false
  return photos.map(p => ({
    id: p.id,
    hasText: flaggedIds.has(p.id),
  }));
}
