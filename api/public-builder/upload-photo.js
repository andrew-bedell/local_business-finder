export const config = { api: { bodyParser: false } };

import { optimizePhotoForStorage } from '../_lib/photo-optimize.js';

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
  if (contentType.indexOf('image/') !== 0) {
    return res.status(400).json({ error: 'Content-Type must be image/*' });
  }

  var photoType = String(req.query.photo_type || 'product');
  var validTypes = ['exterior', 'interior', 'product', 'food', 'team', 'logo', 'founder', 'service'];
  if (validTypes.indexOf(photoType) === -1) {
    return res.status(400).json({ error: 'Invalid photo_type' });
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
    if (body.length > 4 * 1024 * 1024) {
      return res.status(413).json({ error: 'Image too large. Maximum 4MB.' });
    }

    var optimized = await optimizePhotoForStorage(body, { sourceContentType: contentType });

    var suffix = Math.random().toString(36).slice(2, 10);
    var storagePath = 'public-builder/' + Date.now() + '-' + suffix + '-' + photoType + '.' + optimized.extension;

    var uploadRes = await fetch(supabaseUrl + '/storage/v1/object/photos/' + storagePath, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': 'Bearer ' + serviceKey,
        'Content-Type': optimized.contentType,
        'x-upsert': 'true'
      },
      body: optimized.buffer
    });

    if (!uploadRes.ok) {
      var uploadErr = await uploadRes.text().catch(function () { return ''; });
      console.error('public-builder/upload-photo storage error:', uploadRes.status, uploadErr.substring(0, 300));
      return res.status(500).json({ error: 'Failed to upload photo' });
    }

    var publicUrl = supabaseUrl + '/storage/v1/object/public/photos/' + storagePath;
    return res.status(200).json({
      photo_type: photoType,
      storage_path: storagePath,
      public_url: publicUrl,
      content_type: optimized.contentType,
      original_size_bytes: optimized.originalByteLength,
      size_bytes: optimized.byteLength
    });
  } catch (err) {
    console.error('public-builder/upload-photo error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
