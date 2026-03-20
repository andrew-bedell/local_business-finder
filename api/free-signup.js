// Vercel serverless function: Handle free Pagina Basica signup (no Stripe)
// POST — creates customer + subscription records with price=0, invites to auth
// Supports both businessId (employee flow) and businessName (marketing flow with matching)

import { sendEmail } from './_lib/sendgrid.js';
import { getTemplateForTrigger } from './_lib/email-templates.js';
import { matchOrCreateBusiness } from './_lib/match-business.js';
import { enrichBusiness } from './_lib/enrich-business.js';

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

  const { businessId: providedBusinessId, businessName, customerEmail, customerName, customerPhone, address, countryCode, productId } = req.body || {};

  // Require either businessId (employee flow) or businessName (marketing flow)
  if (!providedBusinessId && !businessName) {
    return res.status(400).json({ error: 'Missing required field: businessId or businessName' });
  }
  if (!customerEmail || !customerName) {
    return res.status(400).json({ error: 'Missing required fields: customerEmail, customerName' });
  }

  const supabaseHeaders = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  try {
    // Resolve businessId — use provided ID or match/create from businessName
    let businessId = providedBusinessId;
    let googleData = null;

    if (!businessId && businessName) {
      const matchResult = await matchOrCreateBusiness({
        businessName,
        email: customerEmail,
        phone: customerPhone,
        contactName: customerName,
        contactWhatsapp: customerPhone,
        address: address || null,
        countryCode: countryCode || null,
        supabaseUrl,
        supabaseKey,
      });
      businessId = matchResult.businessId;
      googleData = matchResult.googleData;
    }

    // Duplicate customer guard: check if customer already exists for this business + email
    const dupCheckRes = await fetch(
      `${supabaseUrl}/rest/v1/customers?business_id=eq.${encodeURIComponent(businessId)}&email=eq.${encodeURIComponent(customerEmail)}&select=id`,
      { headers: supabaseHeaders }
    );
    const dupRecords = dupCheckRes.ok ? await dupCheckRes.json() : [];
    if (dupRecords && dupRecords.length > 0) {
      return res.status(409).json({ error: 'Customer already exists for this business', alreadyExists: true });
    }

    // Determine currency from product if provided, else default MXN
    let currency = 'MXN';
    if (productId) {
      const productRes = await fetch(
        `${supabaseUrl}/rest/v1/products?id=eq.${encodeURIComponent(productId)}&select=currency`,
        { headers: supabaseHeaders }
      );
      const products = await productRes.json();
      if (products && products.length > 0 && products[0].currency) {
        currency = products[0].currency;
      }
    }

    // 1. Create customer record with price=0
    const customerPayload = {
      business_id: parseInt(businessId, 10),
      stripe_customer_id: null,
      email: customerEmail,
      contact_name: customerName,
      monthly_price: 0,
      currency,
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

    // 2. Create subscription record with status=active, no Stripe IDs
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

    const subRecords = subRes.ok ? await subRes.json() : [];

    // 3. Invite customer to Supabase Auth + create customer_users link
    let authUserId = null;
    try {
      const inviteRes = await fetch(`${supabaseUrl}/auth/v1/invite`, {
        method: 'POST',
        headers: supabaseHeaders,
        body: JSON.stringify({
          email: customerEmail,
          data: { contact_name: customerName },
        }),
      });

      if (inviteRes.ok) {
        const inviteData = await inviteRes.json();
        authUserId = inviteData.id;
      } else if (inviteRes.status === 422) {
        // User already exists — look up
        const lookupRes = await fetch(
          `${supabaseUrl}/auth/v1/admin/users?filter=${encodeURIComponent(customerEmail)}`,
          { headers: supabaseHeaders }
        );
        if (lookupRes.ok) {
          const lookupData = await lookupRes.json();
          const users = lookupData.users || lookupData || [];
          const matched = Array.isArray(users) ? users.find(u => u.email === customerEmail) : null;
          if (matched) authUserId = matched.id;
        }
      }

      if (authUserId) {
        // Check if link already exists
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
    } catch (authErr) {
      console.warn('Auth invite error (non-blocking):', authErr);
    }

    // 4. Update business pipeline_status to 'lead' (free signup, demo comes after we send preview)
    await fetch(
      `${supabaseUrl}/rest/v1/businesses?id=eq.${encodeURIComponent(businessId)}`,
      {
        method: 'PATCH',
        headers: { ...supabaseHeaders, 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          pipeline_status: 'lead',
          pipeline_status_changed_at: new Date().toISOString(),
        }),
      }
    );

    // 5. Trigger enrichment if we have a real place_id (non-blocking, fire-and-forget)
    if (googleData?.place_id && !googleData.place_id.startsWith('marketing-')) {
      enrichBusiness({
        businessId,
        placeId: googleData.place_id,
        dataId: googleData.data_id || null,
        businessName: googleData.name || businessName || null,
        businessAddress: googleData.address || address || null,
        supabaseUrl,
        supabaseKey,
      }).catch(err => console.warn('Enrichment error (non-blocking):', err.message));
    }

    // 6. Send welcome email (non-blocking)
    try {
      // Look up business name (use provided or fetch from DB)
      let resolvedBusinessName = businessName;
      if (!resolvedBusinessName) {
        const bizRes = await fetch(
          `${supabaseUrl}/rest/v1/businesses?id=eq.${encodeURIComponent(businessId)}&select=name`,
          { headers: supabaseHeaders }
        );
        const bizRecords = await bizRes.json();
        resolvedBusinessName = bizRecords?.[0]?.name || '';
      }

      const origin = 'https://ahoratengopagina.com';
      const portalUrl = origin + '/mipagina';

      const welcomeContent = await getTemplateForTrigger('customer_welcome', {
        contactName: customerName,
        businessName: resolvedBusinessName,
        loginUrl: portalUrl,
      });
      await sendEmail({
        to: customerEmail,
        ...welcomeContent,
        from: 'AhoraTengoPagina <andres@ahoratengopagina.com>',
        replyTo: 'andres@ahoratengopagina.com',
      });
    } catch (emailErr) {
      console.warn('Welcome email error (non-blocking):', emailErr);
    }

    return res.status(200).json({
      success: true,
      customer,
      subscription: subRecords[0] || null,
    });
  } catch (err) {
    console.error('Free signup error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
