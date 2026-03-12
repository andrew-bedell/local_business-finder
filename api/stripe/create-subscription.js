// Vercel serverless function: Create Stripe customer + subscription
// POST — receives customer info + payment method, creates subscription

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
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecretKey) {
    return res.status(503).json({ error: 'Stripe not configured' });
  }
  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }

  const { websiteId, productId, customerName, customerEmail, customerPhone, paymentMethodId } = req.body || {};

  if (!websiteId || !productId || !customerEmail || !paymentMethodId) {
    return res.status(400).json({ error: 'Missing required fields: websiteId, productId, customerEmail, paymentMethodId' });
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

    // 2. Fetch the website to get business_id
    const websiteRes = await fetch(
      `${supabaseUrl}/rest/v1/generated_websites?id=eq.${encodeURIComponent(websiteId)}`,
      { headers: supabaseHeaders }
    );
    const websites = await websiteRes.json();
    if (!websites || websites.length === 0) {
      return res.status(404).json({ error: 'Website not found' });
    }
    const website = websites[0];
    const businessId = website.business_id;

    // 3. Create Stripe Customer
    const customerParams = new URLSearchParams();
    customerParams.append('email', customerEmail);
    if (customerName) customerParams.append('name', customerName);
    if (customerPhone) customerParams.append('phone', customerPhone);
    customerParams.append('payment_method', paymentMethodId);
    customerParams.append('invoice_settings[default_payment_method]', paymentMethodId);

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

    // 4. Create Stripe Subscription
    const subParams = new URLSearchParams();
    subParams.append('customer', stripeCustomer.id);
    subParams.append('items[0][price]', product.stripe_price_id);
    subParams.append('payment_settings[payment_method_types][]', 'card');
    subParams.append('expand[]', 'latest_invoice.payment_intent');

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

    // 5. Write customer record to Supabase
    const customerPayload = {
      business_id: businessId,
      stripe_customer_id: stripeCustomer.id,
      email: customerEmail,
      contact_name: customerName || null,
      monthly_price: product.price,
      currency: product.currency,
    };

    await fetch(`${supabaseUrl}/rest/v1/customers`, {
      method: 'POST',
      headers: { ...supabaseHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify(customerPayload),
    });

    // 6. Write subscription record
    const subscriptionPayload = {
      customer_id: null, // will be set after getting the customer ID
      stripe_subscription_id: stripeSub.id,
      stripe_price_id: product.stripe_price_id,
      status: stripeSub.status === 'active' ? 'active' : 'incomplete',
      current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
    };

    // Get the customer record we just created
    const custLookupRes = await fetch(
      `${supabaseUrl}/rest/v1/customers?stripe_customer_id=eq.${encodeURIComponent(stripeCustomer.id)}`,
      { headers: supabaseHeaders }
    );
    const custRecords = await custLookupRes.json();
    if (custRecords && custRecords.length > 0) {
      subscriptionPayload.customer_id = custRecords[0].id;

      await fetch(`${supabaseUrl}/rest/v1/subscriptions`, {
        method: 'POST',
        headers: { ...supabaseHeaders, 'Prefer': 'return=minimal' },
        body: JSON.stringify(subscriptionPayload),
      });
    }

    // 7. Update business pipeline_status to 'customer'
    await fetch(
      `${supabaseUrl}/rest/v1/businesses?id=eq.${businessId}`,
      {
        method: 'PATCH',
        headers: { ...supabaseHeaders, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ pipeline_status: 'customer' }),
      }
    );

    // 8. Generate slug for the business if it doesn't have one
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

      // Check uniqueness
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

      // Save slug to business
      await fetch(
        `${supabaseUrl}/rest/v1/businesses?id=eq.${businessId}`,
        {
          method: 'PATCH',
          headers: { ...supabaseHeaders, 'Prefer': 'return=minimal' },
          body: JSON.stringify({ slug }),
        }
      );
    }

    // 9. Update generated_websites status to 'published' with real URL
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

    // Check if 3D Secure is required
    const paymentIntent = stripeSub.latest_invoice?.payment_intent;
    const requiresAction = paymentIntent?.status === 'requires_action';

    return res.status(200).json({
      success: true,
      subscriptionId: stripeSub.id,
      status: stripeSub.status,
      requiresAction,
      clientSecret: requiresAction ? paymentIntent.client_secret : null,
    });
  } catch (err) {
    console.error('Create subscription error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
