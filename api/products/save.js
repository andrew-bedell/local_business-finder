// Vercel serverless function: Create or update a product
// POST — upsert product record, auto-creates Stripe Product + Price if not provided

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

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }

  const { id, name, description, price, currency, billing_interval, features, stripe_product_id, stripe_price_id, is_active, sort_order, country_code } = req.body || {};

  if (!name || price == null) {
    return res.status(400).json({ error: 'Missing required fields: name, price' });
  }

  let finalStripeProductId = stripe_product_id || null;
  let finalStripePriceId = stripe_price_id || null;

  try {
    // When updating an existing product, check if price/currency changed
    // Stripe Prices are immutable — a new Price must be created for any amount change
    let needsNewStripePrice = false;
    if (id && stripeSecretKey && finalStripePriceId) {
      const existingRes = await fetch(
        `${supabaseUrl}/rest/v1/products?id=eq.${encodeURIComponent(id)}&select=price,currency`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        }
      );
      const existing = await existingRes.json();
      if (existing && existing.length > 0) {
        const oldPrice = parseFloat(existing[0].price);
        const oldCurrency = (existing[0].currency || 'MXN').toLowerCase();
        const newPrice = parseFloat(price);
        const newCurrency = (currency || 'MXN').toLowerCase();
        if (oldPrice !== newPrice || oldCurrency !== newCurrency) {
          needsNewStripePrice = true;
          finalStripePriceId = null; // Force new Stripe Price creation
        }
      }
    }

    // Auto-create in Stripe if no Stripe IDs provided and Stripe is configured
    if (stripeSecretKey && !finalStripePriceId) {
      // Create or reuse Stripe Product
      if (!finalStripeProductId) {
        const productParams = new URLSearchParams();
        productParams.append('name', name);
        if (description) productParams.append('description', description);

        const stripeProductRes = await fetch('https://api.stripe.com/v1/products', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: productParams.toString(),
        });

        const stripeProduct = await stripeProductRes.json();
        if (!stripeProductRes.ok) {
          console.error('Stripe product creation error:', stripeProduct);
          return res.status(502).json({ error: 'Failed to create Stripe product', detail: stripeProduct.error?.message });
        }
        finalStripeProductId = stripeProduct.id;
      }

      // Create Stripe Price
      const priceParams = new URLSearchParams();
      priceParams.append('product', finalStripeProductId);
      priceParams.append('unit_amount', Math.round(parseFloat(price) * 100)); // cents
      priceParams.append('currency', (currency || 'MXN').toLowerCase());

      if (billing_interval && billing_interval !== 'one_time') {
        priceParams.append('recurring[interval]', billing_interval === 'yearly' ? 'year' : 'month');
      }

      const stripePriceRes = await fetch('https://api.stripe.com/v1/prices', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: priceParams.toString(),
      });

      const stripePrice = await stripePriceRes.json();
      if (!stripePriceRes.ok) {
        console.error('Stripe price creation error:', stripePrice);
        return res.status(502).json({ error: 'Failed to create Stripe price', detail: stripePrice.error?.message });
      }
      finalStripePriceId = stripePrice.id;

      // Archive the old Stripe Price if we created a replacement
      if (needsNewStripePrice && stripe_price_id) {
        await fetch(`https://api.stripe.com/v1/prices/${stripe_price_id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'active=false',
        }).catch(err => console.warn('Failed to archive old Stripe price:', err));
      }
    }

    const payload = {
      name,
      description: description || null,
      price: parseFloat(price),
      currency: currency || 'MXN',
      billing_interval: billing_interval || 'monthly',
      features: features || [],
      stripe_product_id: finalStripeProductId,
      stripe_price_id: finalStripePriceId,
      is_active: is_active !== false,
      sort_order: sort_order || 0,
      country_code: country_code || null,
    };

    let url = `${supabaseUrl}/rest/v1/products`;
    let method = 'POST';
    const headers = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    };

    if (id) {
      url += `?id=eq.${id}`;
      method = 'PATCH';
    }

    const response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Product save error:', response.status, err);
      return res.status(502).json({ error: 'Failed to save product', detail: err.message || err.msg || JSON.stringify(err) });
    }

    const data = await response.json();
    return res.status(200).json({ product: data[0] || data });
  } catch (err) {
    console.error('Product save error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
