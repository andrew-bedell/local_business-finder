// Vercel serverless function: Create Stripe Customer Portal session
// POST — creates a portal session so the customer can manage billing

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

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return res.status(503).json({ error: 'Stripe not configured' });
  }

  const { customer_id, return_url } = req.body || {};

  if (!customer_id) {
    return res.status(400).json({ error: 'Missing required field: customer_id' });
  }

  try {
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
    return res.status(500).json({ error: 'Internal server error' });
  }
}
