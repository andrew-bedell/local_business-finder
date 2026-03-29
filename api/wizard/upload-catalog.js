// Vercel serverless function: Upload catalog file (image or PDF)
// POST — raw binary body, returns public URL for parsing
// Accepts image/* and application/pdf

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
    const { businessId } = await resolveCustomerBusiness(req, supabaseUrl, serviceKey);

    const contentType = (req.headers['content-type'] || '').split(';')[0].trim();
    const isImage = contentType.startsWith('image/');
    const isPdf = contentType === 'application/pdf';

    if (!isImage && !isPdf) {
      return res.status(400).json({ error: 'Content-Type must be image/* or application/pdf' });
    }

    // Read raw body
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);

    // Validate size (10MB max for PDFs, 4MB for images)
    const maxSize = isPdf ? 10 * 1024 * 1024 : 4 * 1024 * 1024;
    if (body.length > maxSize) {
      return res.status(413).json({ error: isPdf ? 'PDF too large. Maximum 10MB.' : 'Image too large. Maximum 4MB.' });
    }
    if (body.length === 0) {
      return res.status(400).json({ error: 'Empty body' });
    }

    // Determine file extension
    let ext = 'pdf';
    if (isImage) {
      ext = 'jpg';
      if (contentType.includes('png')) ext = 'png';
      else if (contentType.includes('webp')) ext = 'webp';
      else if (contentType.includes('gif')) ext = 'gif';
    }

    const uuid8 = Math.random().toString(36).substring(2, 10);
    const storagePath = `${businessId}/catalog-${uuid8}.${ext}`;

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
      return res.status(500).json({ error: 'Failed to upload file to storage' });
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/photos/${storagePath}`;

    return res.status(200).json({
      public_url: publicUrl,
      storage_path: storagePath,
      content_type: contentType,
      file_type: isPdf ? 'pdf' : 'image',
    });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || 'Internal error' });
  }
}
