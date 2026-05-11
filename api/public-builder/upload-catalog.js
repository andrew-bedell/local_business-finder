export const config = { api: { bodyParser: false } };

function cleanBusinessId(value) {
  var raw = String(value || '').trim();
  return /^\d+$/.test(raw) ? raw : 'unassigned';
}

function extensionFor(contentType) {
  if (contentType === 'application/pdf') return 'pdf';
  if (contentType.indexOf('png') !== -1) return 'png';
  if (contentType.indexOf('webp') !== -1) return 'webp';
  if (contentType.indexOf('gif') !== -1) return 'gif';
  if (contentType.indexOf('svg+xml') !== -1) return 'svg';
  return 'jpg';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var supabaseUrl = process.env.SUPABASE_URL;
  var serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(503).json({ error: 'Supabase service key not configured' });
  }

  var contentType = String(req.headers['content-type'] || '').split(';')[0].trim();
  var isImage = contentType.indexOf('image/') === 0;
  var isPdf = contentType === 'application/pdf';

  if (!isImage && !isPdf) {
    return res.status(400).json({ error: 'Content-Type must be image/* or application/pdf' });
  }

  try {
    var chunks = [];
    for await (var chunk of req) {
      chunks.push(chunk);
    }
    var body = Buffer.concat(chunks);
    if (!body.length) {
      return res.status(400).json({ error: 'Empty body' });
    }

    var maxSize = isPdf ? 10 * 1024 * 1024 : 4 * 1024 * 1024;
    if (body.length > maxSize) {
      return res.status(413).json({ error: isPdf ? 'PDF too large. Maximum 10MB.' : 'Image too large. Maximum 4MB.' });
    }

    var businessId = cleanBusinessId(req.query.business_id || req.query.businessId);
    var ext = extensionFor(contentType);
    var suffix = Math.random().toString(36).slice(2, 10);
    var storagePath = 'public-builder/' + businessId + '/catalog-' + Date.now() + '-' + suffix + '.' + ext;

    var uploadRes = await fetch(supabaseUrl + '/storage/v1/object/photos/' + storagePath, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': 'Bearer ' + serviceKey,
        'Content-Type': contentType,
        'x-upsert': 'true'
      },
      body: body
    });

    if (!uploadRes.ok) {
      var uploadErr = await uploadRes.text().catch(function () { return ''; });
      console.error('public-builder/upload-catalog storage error:', uploadRes.status, uploadErr.substring(0, 300));
      return res.status(500).json({ error: 'Failed to upload catalog file' });
    }

    var publicUrl = supabaseUrl + '/storage/v1/object/public/photos/' + storagePath;
    return res.status(200).json({
      public_url: publicUrl,
      storage_path: storagePath,
      content_type: contentType,
      file_type: isPdf ? 'pdf' : 'image'
    });
  } catch (err) {
    console.error('public-builder/upload-catalog error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
