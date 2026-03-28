// Vercel serverless function: Delete customer-uploaded photo
// DELETE — removes photo from Storage and business_photos table

import { resolveCustomerBusiness } from '../_lib/resolve-customer-business.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || 'https://xagfwyknlutmmtfufbfi.supabase.co';
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return res.status(503).json({ error: 'Service role key not configured' });
  }

  try {
    const { businessId } = await resolveCustomerBusiness(req, supabaseUrl, serviceKey);

    const photoId = req.query.photoId || (req.body && req.body.photoId);
    if (!photoId) {
      return res.status(400).json({ error: 'photoId is required' });
    }

    const supabaseHeaders = {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    };

    // Fetch photo record — verify ownership and source
    const photoRes = await fetch(
      `${supabaseUrl}/rest/v1/business_photos?id=eq.${photoId}&select=id,business_id,source,storage_path`,
      { headers: supabaseHeaders }
    );
    const photos = await photoRes.json();
    if (!Array.isArray(photos) || photos.length === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const photo = photos[0];
    if (String(photo.business_id) !== String(businessId)) {
      return res.status(403).json({ error: 'Photo does not belong to your business' });
    }
    if (photo.source !== 'customer_upload') {
      return res.status(403).json({ error: 'Can only delete customer-uploaded photos' });
    }

    // Delete from Supabase Storage (if storage_path exists)
    if (photo.storage_path) {
      const delStorageRes = await fetch(`${supabaseUrl}/storage/v1/object/photos/${photo.storage_path}`, {
        method: 'DELETE',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
      });
      if (!delStorageRes.ok) {
        console.warn('Storage delete warning:', delStorageRes.status, await delStorageRes.text().catch(() => ''));
      }
    }

    // Delete DB record
    const delDbRes = await fetch(
      `${supabaseUrl}/rest/v1/business_photos?id=eq.${photoId}`,
      {
        method: 'DELETE',
        headers: {
          ...supabaseHeaders,
          'Prefer': 'return=minimal',
        },
      }
    );

    if (!delDbRes.ok) {
      const errText = await delDbRes.text();
      console.error('DB delete failed:', delDbRes.status, errText.substring(0, 300));
      return res.status(500).json({ error: 'Failed to delete photo record' });
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || 'Internal error' });
  }
}
