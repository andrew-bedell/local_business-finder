// Vercel serverless function: Update customer email after account setup
// POST — authenticated customer updates their email in the customers table

import { resolveCustomerBusiness } from '../_lib/resolve-customer-business.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL || 'https://xagfwyknlutmmtfufbfi.supabase.co';
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return res.status(503).json({ error: 'Service role key not configured' });
  }

  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: 'Missing required field: email' });
  }

  try {
    const { customerId } = await resolveCustomerBusiness(req, supabaseUrl, serviceKey);

    // Update customer record email
    const updateRes = await fetch(
      `${supabaseUrl}/rest/v1/customers?id=eq.${encodeURIComponent(customerId)}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ email }),
      }
    );

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      console.error('Customer email update failed:', updateRes.status, errText);
      return res.status(500).json({ error: 'Failed to update email' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || 'Internal error' });
  }
}
