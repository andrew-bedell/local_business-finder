import { resolveCustomerBusiness } from '../_lib/resolve-customer-business.js';

// Vercel serverless function: Create Stripe Customer Portal session
// POST — creates a portal session so the customer can manage billing

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!stripeSecretKey) {
    return res.status(503).json({ error: 'Stripe not configured' });
  }

  const { return_url } = req.body || {};

  try {
    if (!supabaseUrl || !supabaseKey) {
      return res.status(503).json({ error: 'Supabase not configured' });
    }

    const resolved = await resolveCustomerBusiness(req, supabaseUrl, supabaseKey);
    const customerRes = await fetch(
      `${supabaseUrl}/rest/v1/customers?id=eq.${encodeURIComponent(resolved.customerId)}&select=stripe_customer_id`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const customers = customerRes.ok ? await customerRes.json() : [];
    const customer_id = customers && customers[0] ? customers[0].stripe_customer_id : null;
    if (!customer_id) {
      return res.status(404).json({ error: 'Stripe customer not found' });
    }

    // Create a Stripe Customer Portal session via the API directly
    const params = new URLSearchParams();
    params.append('customer', customer_id);
    if (return_url) {
      params.append('return_url', return_url);
    }

    const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Stripe portal error:', data);
      return res.status(502).json({
        error: 'Failed to create portal session',
        detail: data.error?.message || 'Unknown error',
      });
    }

    return res.status(200).json({ url: data.url });
  } catch (err) {
    console.error('Stripe customer portal error:', err);
    return res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  }
}
