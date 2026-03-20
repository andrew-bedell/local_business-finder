// Vercel serverless function: Create Stripe customer + subscription (Payment Element flow)
// POST — receives customer info, creates incomplete subscription, returns clientSecret

import { matchOrCreateBusiness } from '../_lib/match-business.js';

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
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecretKey) {
    return res.status(503).json({ error: 'Stripe not configured' });
  }
  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }

  const { productId, customerName, customerEmail, customerPhone, businessName, websiteId } = req.body || {};

  if (!productId || !customerEmail || !customerName) {
    return res.status(400).json({ error: 'Missing required fields: productId, customerEmail, customerName' });
  }

  const supabaseHeaders = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  try {
    // 1. Fetch the product to get stripe_price_id and price info
    const productRes = await fetch(
      `${supabaseUrl}/rest/v1/products?id=eq.${encodeURIComponent(productId)}&is_active=eq.true`,
      { headers: supabaseHeaders }
    );
    const products = await productRes.json();
    if (!products || products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const product = products[0];

    if (!product.stripe_price_id) {
      return res.status(422).json({ error: 'Product has no Stripe price configured' });
    }

    // 2. Resolve business_id — look up existing website or create new business
    let businessId = null;

    if (websiteId) {
      // Employee flow: look up business from website
      const websiteRes = await fetch(
        `${supabaseUrl}/rest/v1/generated_websites?id=eq.${encodeURIComponent(websiteId)}`,
        { headers: supabaseHeaders }
      );
      const websites = await websiteRes.json();
      if (websites && websites.length > 0) {
        businessId = websites[0].business_id;
      }
    }

    if (!businessId && businessName) {
      // Marketing flow: match existing business or create new one
      try {
        const matchResult = await matchOrCreateBusiness({
          businessName,
          email: customerEmail,
          phone: customerPhone,
          supabaseUrl,
          supabaseKey,
        });
        businessId = matchResult.businessId;
      } catch (matchErr) {
        console.error('Business match/create error:', matchErr);
      }
    }

    // 3. Create Stripe Customer (no payment method attached — Payment Element handles it)
    const customerParams = new URLSearchParams();
    customerParams.append('email', customerEmail);
    if (customerName) customerParams.append('name', customerName);
    if (customerPhone) customerParams.append('phone', customerPhone);

    const stripeCustomerRes = await fetch('https://api.stripe.com/v1/customers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: customerParams.toString(),
    });

    const stripeCustomer = await stripeCustomerRes.json();
    if (!stripeCustomerRes.ok) {
      console.error('Stripe customer creation error:', stripeCustomer);
      return res.status(502).json({ error: 'Failed to create Stripe customer', detail: stripeCustomer.error?.message });
    }

    // 4. Create Stripe Subscription (incomplete — Payment Element will confirm payment)
    const subParams = new URLSearchParams();
    subParams.append('customer', stripeCustomer.id);
    subParams.append('items[0][price]', product.stripe_price_id);
    subParams.append('payment_behavior', 'default_incomplete');
    subParams.append('payment_settings[save_default_payment_method]', 'on_subscription');
    subParams.append('expand[]', 'latest_invoice.payment_intent');

    // Enable card and Link payments
    subParams.append('payment_settings[payment_method_types][]', 'card');
    subParams.append('payment_settings[payment_method_types][]', 'link');

    const stripeSubRes = await fetch('https://api.stripe.com/v1/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: subParams.toString(),
    });

    const stripeSub = await stripeSubRes.json();
    if (!stripeSubRes.ok) {
      console.error('Stripe subscription creation error:', stripeSub);
      return res.status(502).json({ error: 'Failed to create subscription', detail: stripeSub.error?.message });
    }

    // 5. Save customer record to Supabase
    if (businessId) {
      const customerPayload = {
        business_id: businessId,
        stripe_customer_id: stripeCustomer.id,
        email: customerEmail,
        contact_name: customerName || null,
        monthly_price: product.price,
        currency: product.currency,
      };

      const custRes = await fetch(`${supabaseUrl}/rest/v1/customers`, {
        method: 'POST',
        headers: { ...supabaseHeaders, 'Prefer': 'return=representation' },
        body: JSON.stringify(customerPayload),
      });

      // 6. Save subscription record (as incomplete — webhook will update to active)
      if (!custRes.ok) {
        console.error('Customer insert error:', await custRes.text().catch(() => ''));
      }
      if (custRes.ok) {
        const custRecords = await custRes.json();
        if (custRecords && custRecords.length > 0) {
          const subscriptionPayload = {
            customer_id: custRecords[0].id,
            stripe_subscription_id: stripeSub.id,
            stripe_price_id: product.stripe_price_id,
            status: 'incomplete',
            current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
          };

          const subInsertRes = await fetch(`${supabaseUrl}/rest/v1/subscriptions`, {
            method: 'POST',
            headers: { ...supabaseHeaders, 'Prefer': 'return=minimal' },
            body: JSON.stringify(subscriptionPayload),
          });
          if (!subInsertRes.ok) {
            console.error('Subscription insert error:', await subInsertRes.text().catch(() => ''));
          }
        }
      }
    }

    // 7. If websiteId provided and subscription is already active, publish the website
    if (websiteId && stripeSub.status === 'active' && businessId) {
      const bizLookupRes = await fetch(
        `${supabaseUrl}/rest/v1/businesses?id=eq.${businessId}&select=id,name,slug`,
        { headers: supabaseHeaders }
      );
      const bizRecords = await bizLookupRes.json();
      let slug = bizRecords && bizRecords[0] ? bizRecords[0].slug : null;

      if (!slug && bizRecords && bizRecords[0]) {
        slug = bizRecords[0].name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '') || 'negocio';

        let candidate = slug;
        let suffix = 1;
        while (true) {
          const checkRes = await fetch(
            `${supabaseUrl}/rest/v1/businesses?slug=eq.${encodeURIComponent(candidate)}&id=neq.${businessId}&select=id`,
            { headers: supabaseHeaders }
          );
          const existing = await checkRes.json();
          if (!existing || existing.length === 0) break;
          suffix++;
          candidate = `${slug}-${suffix}`;
        }
        slug = candidate;

        await fetch(
          `${supabaseUrl}/rest/v1/businesses?id=eq.${businessId}`,
          {
            method: 'PATCH',
            headers: { ...supabaseHeaders, 'Prefer': 'return=minimal' },
            body: JSON.stringify({ slug }),
          }
        );
      }

      const publishedUrl = slug ? `https://ahoratengopagina.com/sitio/${slug}` : null;
      await fetch(
        `${supabaseUrl}/rest/v1/generated_websites?id=eq.${encodeURIComponent(websiteId)}`,
        {
          method: 'PATCH',
          headers: { ...supabaseHeaders, 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            status: 'published',
            site_status: 'active',
            published_url: publishedUrl,
            published_at: new Date().toISOString(),
            version: 1,
          }),
        }
      );

      await fetch(
        `${supabaseUrl}/rest/v1/businesses?id=eq.${businessId}`,
        {
          method: 'PATCH',
          headers: { ...supabaseHeaders, 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            pipeline_status: 'active_customer',
            pipeline_status_changed_at: new Date().toISOString(),
          }),
        }
      );
    }

    // 8. Update pipeline status to active_customer (if not already done by websiteId flow above)
    if (businessId && !(websiteId && stripeSub.status === 'active')) {
      await fetch(
        `${supabaseUrl}/rest/v1/businesses?id=eq.${businessId}`,
        {
          method: 'PATCH',
          headers: { ...supabaseHeaders, 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            pipeline_status: 'active_customer',
            pipeline_status_changed_at: new Date().toISOString(),
          }),
        }
      );
    }

    // Return clientSecret for Payment Element confirmation
    const clientSecret = stripeSub.latest_invoice?.payment_intent?.client_secret;

    if (!clientSecret) {
      return res.status(500).json({ error: 'Failed to get payment intent client secret' });
    }

    return res.status(200).json({
      clientSecret,
      subscriptionId: stripeSub.id,
      status: stripeSub.status,
    });
  } catch (err) {
    console.error('Create subscription error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
