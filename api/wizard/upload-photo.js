// Vercel serverless function: Upload customer photo
// POST — raw binary body with photo_type in query params
// Config disables bodyParser for raw binary upload

export const config = { api: { bodyParser: false } };

import { resolveCustomerBusiness } from '../_lib/resolve-customer-business.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || 'https://xagfwyknlutmmtfufbfi.supabase.co';
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return res.status(503).json({ error: 'Service role key not configured' });
  }

  try {
    // Auth: JWT → business_id
    const { businessId } = await resolveCustomerBusiness(req, supabaseUrl, serviceKey);

    // Validate content type
    const contentType = (req.headers['content-type'] || '').split(';')[0].trim();
    if (!contentType.startsWith('image/')) {
      return res.status(400).json({ error: 'Content-Type must be image/*' });
    }

    // Validate photo_type
    const photoType = req.query.photo_type || 'product';
    const validTypes = ['exterior', 'interior', 'product', 'food', 'team', 'logo', 'menu'];
    if (!validTypes.includes(photoType)) {
      return res.status(400).json({ error: 'Invalid photo_type. Must be one of: ' + validTypes.join(', ') });
    }

    // Read raw body
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);

    // Validate size (4MB max)
    if (body.length > 4 * 1024 * 1024) {
      return res.status(413).json({ error: 'Image too large. Maximum 4MB.' });
    }
    if (body.length === 0) {
      return res.status(400).json({ error: 'Empty body' });
    }

    // Determine file extension
    let ext = 'jpg';
    if (contentType.includes('png')) ext = 'png';
    else if (contentType.includes('webp')) ext = 'webp';
    else if (contentType.includes('gif')) ext = 'gif';

    // Generate unique ID for the photo
    const uuid8 = Math.random().toString(36).substring(2, 10);
    const storagePath = `${businessId}/customer_upload-${photoType}-${uuid8}.${ext}`;

    const supabaseHeaders = {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
    };

    // Upload to Supabase Storage
    const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/photos/${storagePath}`, {
      method: 'POST',
      headers: {
        ...supabaseHeaders,
        'Content-Type': contentType,
        'x-upsert': 'true',
      },
      body,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error('Storage upload failed:', uploadRes.status, errText.substring(0, 300));
      return res.status(500).json({ error: 'Failed to upload photo to storage' });
    }

    // Build public URL
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/photos/${storagePath}`;

    // Insert business_photos record
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/business_photos`, {
      method: 'POST',
      headers: {
        ...supabaseHeaders,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        business_id: businessId,
        source: 'customer_upload',
        photo_type: photoType,
        storage_path: storagePath,
        url: publicUrl,
        is_primary: false,
      }),
    });

    if (!insertRes.ok) {
      const errText = await insertRes.text();
      console.error('DB insert failed:', insertRes.status, errText.substring(0, 300));
      return res.status(500).json({ error: 'Failed to save photo record' });
    }

    const rows = await insertRes.json();
    const photo = rows[0] || {};

    return res.status(200).json({
      id: photo.id,
      photo_type: photoType,
      public_url: publicUrl,
      storage_path: storagePath,
    });

  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || 'Internal error' });
  }
}
