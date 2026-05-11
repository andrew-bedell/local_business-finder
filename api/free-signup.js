// Vercel serverless function: Handle PaginaPro free trial signup (no card upfront)
// POST — creates customer + trialing subscription records, invites to auth
// Supports both businessId (employee flow) and businessName (marketing flow with matching)

import { sendEmail } from './_lib/sendgrid.js';
import { getTemplateForTrigger } from './_lib/email-templates.js';
import { matchOrCreateBusiness } from './_lib/match-business.js';
import { runTrackedBusinessEnrichment } from './_lib/enrichment-runner.js';
import {
  buildTrialCustomerFields,
  buildTrialSubscriptionPayload,
  resolvePaginaProTrialProduct,
} from './_lib/trial-plan.js';

function getRequestOrigin(req) {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const forwardedHost = req.headers['x-forwarded-host'];
  const host = forwardedHost || req.headers.host || process.env.VERCEL_URL || 'ahoratengopagina.com';
  const protocol = forwardedProto || (String(host).includes('localhost') ? 'http' : 'https');
  return `${protocol}://${host}`.replace(/\/$/, '');
}

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

    const trialProduct = await resolvePaginaProTrialProduct({
      productId,
      countryCode,
      supabaseUrl,
      supabaseHeaders,
    });
    const trialCustomerFields = buildTrialCustomerFields(trialProduct, 'MXN');

    // 1. Create customer record with the post-trial monthly price
    const customerPayload = {
      business_id: parseInt(businessId, 10),
      stripe_customer_id: null,
      email: customerEmail,
      contact_name: customerName,
      ...trialCustomerFields,
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

    // 2. Create subscription record with status=trialing, no card or Stripe subscription yet
    const subscriptionPayload = buildTrialSubscriptionPayload(customer.id, trialProduct);

    const subRes = await fetch(`${supabaseUrl}/rest/v1/subscriptions`, {
      method: 'POST',
      headers: { ...supabaseHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify(subscriptionPayload),
    });

    const subRecords = subRes.ok ? await subRes.json() : [];

    // 3. Invite customer to Supabase Auth + create customer_users link
    let authUserId = null;
    let inviteActionLink = null;
    let authStatus = 'not_started';
    try {
      const origin = getRequestOrigin(req);
      const portalUrl = origin + '/mipagina';
      const inviteRes = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
        method: 'POST',
        headers: supabaseHeaders,
        body: JSON.stringify({
          type: 'invite',
          email: customerEmail,
          data: { contact_name: customerName },
          redirect_to: portalUrl,
        }),
      });

      if (inviteRes.ok) {
        const inviteData = await inviteRes.json();
        authUserId = inviteData.id || inviteData.user?.id || inviteData.properties?.user?.id || null;
        inviteActionLink = inviteData.action_link || inviteData.properties?.action_link || null;
        authStatus = authUserId && inviteActionLink ? 'invite_sent' : 'invite_failed';
        if (authStatus !== 'invite_sent') {
          console.warn('Invite link response missing required fields:', JSON.stringify(inviteData).slice(0, 500));
        }
      } else if (inviteRes.status === 422) {
        authStatus = 'existing_user';
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
      } else {
        authStatus = 'invite_failed';
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
      authStatus = 'invite_error';
    }

    // 4. Update business pipeline_status to 'lead' (trial signup; paid activation comes later)
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
      runTrackedBusinessEnrichment({
        businessId,
        placeId: googleData.place_id,
        businessName: googleData.name || businessName || null,
        businessAddress: googleData.address_full || googleData.address || address || null,
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

      const origin = getRequestOrigin(req);
      const portalUrl = origin + '/mipagina';

      if (authStatus === 'invite_sent' && inviteActionLink) {
        const inviteContent = await getTemplateForTrigger('customer_portal_invite', {
          contactName: customerName,
          businessName: resolvedBusinessName,
          inviteUrl: inviteActionLink,
          portalUrl,
        });
        const inviteEmailResult = await sendEmail({
          to: customerEmail,
          ...inviteContent,
          from: 'AhoraTengoPagina <andres@ahoratengopagina.com>',
          replyTo: 'andres@ahoratengopagina.com',
        });
        if (!inviteEmailResult.success) {
          console.warn('Portal invite email failed:', inviteEmailResult.error);
          authStatus = 'invite_failed';
        }
      }

      if (authStatus !== 'invite_sent') {
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
      }
    } catch (emailErr) {
      console.warn('Customer onboarding email error (non-blocking):', emailErr);
    }

    return res.status(200).json({
      success: true,
      customer,
      subscription: subRecords[0] || null,
      authStatus,
    });
  } catch (err) {
    console.error('Free signup error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
