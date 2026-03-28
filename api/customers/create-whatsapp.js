// Vercel serverless function: Create business + customer from WhatsApp number
// POST — for businesses that can't be matched to a Google listing
// Operator provides name + WhatsApp, system creates all records + magic login link

import crypto from 'crypto';

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

  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }

  const { businessName, whatsapp, category, address, contactName } = req.body || {};

  if (!businessName || !whatsapp) {
    return res.status(400).json({ error: 'Missing required fields: businessName, whatsapp' });
  }

  const supabaseHeaders = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  try {
    // 1. Create business record with synthetic place_id
    const businessPayload = {
      place_id: 'manual-' + crypto.randomUUID(),
      name: businessName,
      whatsapp: whatsapp,
      category: category || null,
      address_full: address || null,
      owner_name: contactName || null,
      pipeline_status: 'lead',
      pipeline_status_changed_at: new Date().toISOString(),
      data_completeness_score: 0,
    };

    const bizRes = await fetch(`${supabaseUrl}/rest/v1/businesses`, {
      method: 'POST',
      headers: { ...supabaseHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify(businessPayload),
    });

    if (!bizRes.ok) {
      const errText = await bizRes.text().catch(() => '');
      console.error('Business creation error:', errText);
      return res.status(502).json({ error: 'Failed to create business record', detail: errText });
    }

    const bizRecords = await bizRes.json();
    const business = bizRecords[0];
    const businessId = business.id;

    // 2. Create customer record with synthetic email
    const syntheticEmail = 'wa-' + whatsapp.replace(/[^\d]/g, '') + '@temp.ahoratengopagina.com';

    const customerPayload = {
      business_id: businessId,
      email: syntheticEmail,
      contact_name: contactName || businessName,
      monthly_price: 0,
      currency: 'MXN',
    };

    const custRes = await fetch(`${supabaseUrl}/rest/v1/customers`, {
      method: 'POST',
      headers: { ...supabaseHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify(customerPayload),
    });

    if (!custRes.ok) {
      const errText = await custRes.text().catch(() => '');
      console.error('Customer creation error:', errText);
      return res.status(502).json({ error: 'Failed to create customer record', detail: errText });
    }

    const custRecords = await custRes.json();
    const customer = custRecords[0];

    // 3. Create subscription record with status=active, no Stripe IDs
    const subscriptionPayload = {
      customer_id: customer.id,
      stripe_subscription_id: null,
      stripe_price_id: null,
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: null,
    };

    const subRes = await fetch(`${supabaseUrl}/rest/v1/subscriptions`, {
      method: 'POST',
      headers: { ...supabaseHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify(subscriptionPayload),
    });

    if (!subRes.ok) {
      const errText = await subRes.text().catch(() => '');
      console.error('Subscription creation error:', errText);
      // Non-fatal — continue, but log it
    }

    // 4. Create Supabase Auth user via admin API
    let authUserId = null;

    const createUserRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: supabaseHeaders,
      body: JSON.stringify({
        email: syntheticEmail,
        password: crypto.randomUUID(),
        email_confirm: true,
        user_metadata: { contact_name: contactName || businessName },
      }),
    });

    if (createUserRes.ok) {
      const userData = await createUserRes.json();
      authUserId = userData.id;
    } else {
      const errText = await createUserRes.text().catch(() => '');
      console.warn('Auth user creation failed:', errText);

      // User might already exist — look up
      if (createUserRes.status === 422) {
        const lookupRes = await fetch(
          `${supabaseUrl}/auth/v1/admin/users?filter=${encodeURIComponent(syntheticEmail)}`,
          { headers: supabaseHeaders }
        );
        if (lookupRes.ok) {
          const lookupData = await lookupRes.json();
          const users = lookupData.users || lookupData || [];
          const matched = Array.isArray(users) ? users.find(u => u.email === syntheticEmail) : null;
          if (matched) authUserId = matched.id;
        }
      }
    }

    // 5. Create customer_users link
    if (authUserId) {
      const checkRes = await fetch(
        `${supabaseUrl}/rest/v1/customer_users?auth_user_id=eq.${encodeURIComponent(authUserId)}&customer_id=eq.${encodeURIComponent(customer.id)}&select=id`,
        { headers: supabaseHeaders }
      );
      const existing = await checkRes.json();
      if (!existing || existing.length === 0) {
        await fetch(`${supabaseUrl}/rest/v1/customer_users`, {
          method: 'POST',
          headers: { ...supabaseHeaders, 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            auth_user_id: authUserId,
            customer_id: customer.id,
            role: 'owner',
          }),
        });
      }
    }

    // 6. Generate magic link for login
    let loginLink = null;

    if (authUserId) {
      const magicLinkRes = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
        method: 'POST',
        headers: supabaseHeaders,
        body: JSON.stringify({
          type: 'magiclink',
          email: syntheticEmail,
          redirect_to: 'https://ahoratengopagina.com/mipagina',
        }),
      });

      if (magicLinkRes.ok) {
        const magicLinkData = await magicLinkRes.json();
        loginLink = magicLinkData.properties?.action_link || magicLinkData.action_link || null;
      } else {
        const errText = await magicLinkRes.text().catch(() => '');
        console.warn('Magic link generation failed:', errText);
      }
    }

    return res.status(200).json({
      success: true,
      businessId,
      customerId: customer.id,
      loginLink,
      whatsapp,
    });
  } catch (err) {
    console.error('Create WhatsApp customer error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
