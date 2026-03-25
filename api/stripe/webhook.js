// Vercel serverless function: Handle Stripe webhook events
// POST — receives Stripe webhook events and updates database

import { sendEmail } from '../_lib/sendgrid.js';
import { getTemplateForTrigger } from '../_lib/email-templates.js';

// Disable body parsing so we can verify the raw signature
export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function verifyStripeSignature(rawBody, signature, secret) {
  // Stripe webhook signature verification using Web Crypto
  const crypto = await import('crypto');
  const elements = signature.split(',');
  const timestamp = elements.find(e => e.startsWith('t='))?.split('=')[1];
  const v1Signatures = elements.filter(e => e.startsWith('v1=')).map(e => e.split('=')[1]);

  if (!timestamp || v1Signatures.length === 0) {
    throw new Error('Invalid signature format');
  }

  const payload = `${timestamp}.${rawBody.toString()}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  const isValid = v1Signatures.some(sig => {
    return crypto.timingSafeEqual(
      Buffer.from(sig, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  });

  if (!isValid) {
    throw new Error('Signature verification failed');
  }

  // Check timestamp tolerance (5 minutes)
  const tolerance = 300;
  const now = Math.floor(Date.now() / 1000);
  if (now - parseInt(timestamp) > tolerance) {
    throw new Error('Timestamp outside tolerance');
  }

  return JSON.parse(rawBody.toString());
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeWebhookSecret || !supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Webhook not configured' });
  }

  const supabaseHeaders = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal',
  };

  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    const event = await verifyStripeSignature(rawBody, signature, stripeWebhookSecret);

    switch (event.type) {
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        if (subscriptionId) {
          // Update subscription status
          await fetch(
            `${supabaseUrl}/rest/v1/subscriptions?stripe_subscription_id=eq.${encodeURIComponent(subscriptionId)}`,
            {
              method: 'PATCH',
              headers: supabaseHeaders,
              body: JSON.stringify({ status: 'active' }),
            }
          );

          // Reactivate website if it was suspended (e.g. after past_due recovery)
          const businessId = await getBusinessIdFromSubscription(subscriptionId, supabaseUrl, supabaseHeaders);
          if (businessId) {
            await fetch(
              `${supabaseUrl}/rest/v1/generated_websites?business_id=eq.${businessId}&status=eq.published&site_status=eq.suspended`,
              {
                method: 'PATCH',
                headers: supabaseHeaders,
                body: JSON.stringify({ site_status: 'active' }),
              }
            );

            // Update pipeline status to active_customer
            await fetch(
              `${supabaseUrl}/rest/v1/businesses?id=eq.${businessId}`,
              {
                method: 'PATCH',
                headers: supabaseHeaders,
                body: JSON.stringify({
                  pipeline_status: 'active_customer',
                  pipeline_status_changed_at: new Date().toISOString(),
                }),
              }
            );
          }

          // Create customer auth user and send welcome email (non-blocking)
          try {
            const customer = await getCustomerFromSubscription(subscriptionId, supabaseUrl, supabaseHeaders);
            if (customer) {
              await createCustomerAuthUser(customer, supabaseUrl, supabaseKey);

              const businessName = await getBusinessNameFromCustomer(customer, supabaseUrl, supabaseHeaders);
              const origin = 'https://ahoratengopagina.com';
              const portalUrl = origin + '/mipagina';
              const emailFrom = 'AhoraTengoPagina <andres@ahoratengopagina.com>';
              const emailReplyTo = 'andres@ahoratengopagina.com';

              // Send branded welcome email (first payment only — check if auth user was just created)
              try {
                const welcomeContent = await getTemplateForTrigger('customer_welcome', {
                  contactName: customer.contact_name || '',
                  businessName: businessName || '',
                  loginUrl: portalUrl,
                });
                await sendEmail({ to: customer.email, ...welcomeContent, from: emailFrom, replyTo: emailReplyTo });
              } catch (emailErr) {
                console.warn('Welcome email error (non-blocking):', emailErr);
              }

              // Send payment confirmation email (every successful invoice)
              try {
                const paymentContent = await getTemplateForTrigger('payment_confirmed', {
                  contactName: customer.contact_name || '',
                  businessName: businessName || '',
                  amount: invoice.amount_paid,
                  currency: invoice.currency,
                  periodEnd: invoice.lines?.data?.[0]?.period?.end,
                });
                await sendEmail({ to: customer.email, ...paymentContent, from: emailFrom, replyTo: emailReplyTo });
              } catch (emailErr) {
                console.warn('Payment confirmation email error (non-blocking):', emailErr);
              }
            }
          } catch (authErr) {
            console.error('Customer auth/email error (non-blocking):', authErr);
          }

          // Check for pending referral and trigger conversion (non-blocking)
          try {
            const customer = await getCustomerFromSubscription(subscriptionId, supabaseUrl, supabaseHeaders);
            if (customer) {
              // Find pending referral matching this customer's email
              let refQuery = `${supabaseUrl}/rest/v1/referrals?status=in.(pending,contacted,converted)&referrer_reward_status=eq.pending&select=id&or=(referred_email.eq.${encodeURIComponent(customer.email)}`;
              if (customer.contact_phone) {
                refQuery += `,referred_phone.eq.${encodeURIComponent(customer.contact_phone)}`;
              }
              refQuery += ')&limit=1';

              const pendingRefRes = await fetch(refQuery, { headers: supabaseHeaders });
              if (pendingRefRes.ok) {
                const pendingRefs = await pendingRefRes.json();
                if (pendingRefs && pendingRefs.length > 0) {
                  // Link referred customer and business to the referral
                  await fetch(
                    `${supabaseUrl}/rest/v1/referrals?id=eq.${encodeURIComponent(pendingRefs[0].id)}`,
                    {
                      method: 'PATCH',
                      headers: { ...supabaseHeaders, 'Prefer': 'return=minimal' },
                      body: JSON.stringify({
                        referred_customer_id: customer.id,
                        referred_business_id: customer.business_id || null,
                        status: 'converted',
                        converted_at: new Date().toISOString(),
                        last_updated_at: new Date().toISOString(),
                      }),
                    }
                  );

                  // Fire-and-forget: trigger reward application
                  const convertUrl = `https://${req.headers?.host || 'ahoratengopagina.com'}/api/referrals/convert`;
                  fetch(convertUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ referralId: pendingRefs[0].id }),
                  }).catch(err => console.warn('Referral convert trigger error:', err.message));
                }
              }
            }
          } catch (refErr) {
            console.warn('Referral conversion check error (non-blocking):', refErr.message);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        if (subscriptionId) {
          await fetch(
            `${supabaseUrl}/rest/v1/subscriptions?stripe_subscription_id=eq.${encodeURIComponent(subscriptionId)}`,
            {
              method: 'PATCH',
              headers: supabaseHeaders,
              body: JSON.stringify({ status: 'past_due' }),
            }
          );

          // Send payment failed email (non-blocking)
          try {
            const customer = await getCustomerFromSubscription(subscriptionId, supabaseUrl, supabaseHeaders);
            if (customer?.email) {
              const businessName = await getBusinessNameFromCustomer(customer, supabaseUrl, supabaseHeaders);
              const portalUrl = 'https://ahoratengopagina.com/mipagina';
              const failedContent = await getTemplateForTrigger('payment_failed', {
                contactName: customer.contact_name || '',
                businessName: businessName || '',
                amount: invoice.amount_due,
                currency: invoice.currency,
                portalUrl,
              });
              await sendEmail({
                to: customer.email,
                ...failedContent,
                from: 'AhoraTengoPagina <andres@ahoratengopagina.com>',
                replyTo: 'andres@ahoratengopagina.com',
              });
            }
          } catch (emailErr) {
            console.warn('Payment failed email error (non-blocking):', emailErr);
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const previousAttributes = event.data.previous_attributes || {};
        const updatePayload = {
          status: sub.status === 'active' ? 'active' : sub.status === 'past_due' ? 'past_due' : sub.status === 'canceled' ? 'cancelled' : sub.status,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end || false,
        };
        if (sub.canceled_at) {
          updatePayload.cancelled_at = new Date(sub.canceled_at * 1000).toISOString();
        }

        // Update stripe_price_id if price changed
        const currentPriceId = sub.items?.data?.[0]?.price?.id;
        if (currentPriceId) {
          updatePayload.stripe_price_id = currentPriceId;
        }

        await fetch(
          `${supabaseUrl}/rest/v1/subscriptions?stripe_subscription_id=eq.${encodeURIComponent(sub.id)}`,
          {
            method: 'PATCH',
            headers: supabaseHeaders,
            body: JSON.stringify(updatePayload),
          }
        );

        // Send plan change email if price changed (non-blocking)
        if (previousAttributes.items || previousAttributes.plan) {
          try {
            const customer = await getCustomerFromSubscription(sub.id, supabaseUrl, supabaseHeaders);
            if (customer?.email) {
              const businessName = await getBusinessNameFromCustomer(customer, supabaseUrl, supabaseHeaders);
              const currentPrice = sub.items?.data?.[0]?.price;
              const portalUrl = 'https://ahoratengopagina.com/mipagina';
              const changeContent = await getTemplateForTrigger('plan_changed', {
                contactName: customer.contact_name || '',
                businessName: businessName || '',
                oldPlan: null,
                newPlan: currentPrice?.nickname || null,
                newAmount: currentPrice?.unit_amount,
                currency: currentPrice?.currency,
                portalUrl,
              });
              await sendEmail({
                to: customer.email,
                ...changeContent,
                from: 'AhoraTengoPagina <andres@ahoratengopagina.com>',
                replyTo: 'andres@ahoratengopagina.com',
              });
            }
          } catch (emailErr) {
            console.warn('Plan change email error (non-blocking):', emailErr);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        // Update subscription status
        await fetch(
          `${supabaseUrl}/rest/v1/subscriptions?stripe_subscription_id=eq.${encodeURIComponent(sub.id)}`,
          {
            method: 'PATCH',
            headers: supabaseHeaders,
            body: JSON.stringify({
              status: 'cancelled',
              cancelled_at: new Date().toISOString(),
            }),
          }
        );

        // Suspend the website and set pipeline to inactive_customer
        const businessId = await getBusinessIdFromSubscription(sub.id, supabaseUrl, supabaseHeaders);
        if (businessId) {
          await fetch(
            `${supabaseUrl}/rest/v1/generated_websites?business_id=eq.${businessId}&status=eq.published`,
            {
              method: 'PATCH',
              headers: supabaseHeaders,
              body: JSON.stringify({ site_status: 'suspended' }),
            }
          );

          // Update pipeline status to inactive_customer
          await fetch(
            `${supabaseUrl}/rest/v1/businesses?id=eq.${businessId}`,
            {
              method: 'PATCH',
              headers: supabaseHeaders,
              body: JSON.stringify({
                pipeline_status: 'inactive_customer',
                pipeline_status_changed_at: new Date().toISOString(),
              }),
            }
          );
        }

        // Send subscription cancelled email (non-blocking)
        try {
          const customer = await getCustomerFromSubscription(sub.id, supabaseUrl, supabaseHeaders);
          if (customer?.email) {
            const businessName = await getBusinessNameFromCustomer(customer, supabaseUrl, supabaseHeaders);
            const portalUrl = 'https://ahoratengopagina.com/mipagina';
            const cancelContent = await getTemplateForTrigger('subscription_cancelled', {
              contactName: customer.contact_name || '',
              businessName: businessName || '',
              portalUrl,
            });
            await sendEmail({
              to: customer.email,
              ...cancelContent,
              from: 'AhoraTengoPagina <andres@ahoratengopagina.com>',
              replyTo: 'andres@ahoratengopagina.com',
            });
          }
        } catch (emailErr) {
          console.warn('Subscription cancelled email error (non-blocking):', emailErr);
        }
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(400).json({ error: 'Webhook processing failed', detail: err.message });
  }
}

// Helper: look up customer record from a Stripe subscription ID
async function getCustomerFromSubscription(stripeSubscriptionId, supabaseUrl, supabaseHeaders) {
  try {
    const subRes = await fetch(
      `${supabaseUrl}/rest/v1/subscriptions?stripe_subscription_id=eq.${encodeURIComponent(stripeSubscriptionId)}&select=customer_id`,
      { headers: supabaseHeaders }
    );
    const subs = await subRes.json();
    if (!subs || subs.length === 0) return null;

    const custRes = await fetch(
      `${supabaseUrl}/rest/v1/customers?id=eq.${encodeURIComponent(subs[0].customer_id)}&select=id,email,contact_name,business_id`,
      { headers: supabaseHeaders }
    );
    const custs = await custRes.json();
    if (!custs || custs.length === 0) return null;

    return custs[0];
  } catch (err) {
    console.error('getCustomerFromSubscription error:', err);
    return null;
  }
}

// Helper: invite customer via Supabase Auth and create customer_users link
async function createCustomerAuthUser(customer, supabaseUrl, supabaseKey) {
  if (!customer.email) return;

  const supabaseHeaders = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  // Check if customer_users link already exists for this customer
  const existingLinkRes = await fetch(
    `${supabaseUrl}/rest/v1/customer_users?customer_id=eq.${encodeURIComponent(customer.id)}&select=id`,
    { headers: supabaseHeaders }
  );
  const existingLinks = await existingLinkRes.json();
  if (existingLinks && existingLinks.length > 0) {
    console.log('Customer already has auth user link, skipping:', customer.id);
    return;
  }

  // Try to invite the user via Supabase Admin API
  let authUserId = null;

  const inviteRes = await fetch(`${supabaseUrl}/auth/v1/invite`, {
    method: 'POST',
    headers: supabaseHeaders,
    body: JSON.stringify({
      email: customer.email,
      data: { contact_name: customer.contact_name || '' },
    }),
  });

  if (inviteRes.ok) {
    const inviteData = await inviteRes.json();
    authUserId = inviteData.id;
  } else if (inviteRes.status === 422) {
    // Email already has a Supabase Auth account — look up existing user
    console.log('User already exists in auth, looking up:', customer.email);
    const lookupRes = await fetch(
      `${supabaseUrl}/auth/v1/admin/users?filter=${encodeURIComponent(customer.email)}`,
      { headers: supabaseHeaders }
    );
    if (lookupRes.ok) {
      const lookupData = await lookupRes.json();
      const users = lookupData.users || lookupData || [];
      const matchedUser = Array.isArray(users)
        ? users.find(u => u.email === customer.email)
        : null;
      if (matchedUser) {
        authUserId = matchedUser.id;
      }
    }
  } else {
    const errText = await inviteRes.text().catch(() => '');
    console.error('Supabase invite error:', inviteRes.status, errText);
    return;
  }

  if (!authUserId) {
    console.error('Could not resolve auth user ID for customer:', customer.id);
    return;
  }

  // Create customer_users link
  await linkCustomerUser(authUserId, customer.id, supabaseUrl, supabaseKey);
}

// Helper: insert customer_users record with idempotency check
async function linkCustomerUser(authUserId, customerId, supabaseUrl, supabaseKey) {
  const supabaseHeaders = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal',
  };

  // Check if link already exists
  const checkRes = await fetch(
    `${supabaseUrl}/rest/v1/customer_users?auth_user_id=eq.${encodeURIComponent(authUserId)}&customer_id=eq.${encodeURIComponent(customerId)}&select=id`,
    { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
  );
  const existing = await checkRes.json();
  if (existing && existing.length > 0) {
    console.log('customer_users link already exists, skipping');
    return;
  }

  const linkRes = await fetch(`${supabaseUrl}/rest/v1/customer_users`, {
    method: 'POST',
    headers: supabaseHeaders,
    body: JSON.stringify({
      auth_user_id: authUserId,
      customer_id: customerId,
      role: 'owner',
    }),
  });

  if (!linkRes.ok) {
    const errText = await linkRes.text().catch(() => '');
    console.error('Failed to create customer_users link:', linkRes.status, errText);
  } else {
    console.log('Created customer_users link:', authUserId, customerId);
  }
}

// Helper: look up business name from a customer record
async function getBusinessNameFromCustomer(customer, supabaseUrl, supabaseHeaders) {
  try {
    if (!customer.business_id) {
      // Need to look up the full customer record to get business_id
      const custRes = await fetch(
        `${supabaseUrl}/rest/v1/customers?id=eq.${encodeURIComponent(customer.id)}&select=business_id`,
        { headers: supabaseHeaders }
      );
      const custs = await custRes.json();
      if (!custs || custs.length === 0) return null;
      customer.business_id = custs[0].business_id;
    }

    const bizRes = await fetch(
      `${supabaseUrl}/rest/v1/businesses?id=eq.${customer.business_id}&select=name`,
      { headers: supabaseHeaders }
    );
    const biz = await bizRes.json();
    if (!biz || biz.length === 0) return null;

    return biz[0].name;
  } catch (err) {
    console.error('getBusinessNameFromCustomer error:', err);
    return null;
  }
}

// Helper: look up business_id from a Stripe subscription ID
async function getBusinessIdFromSubscription(stripeSubscriptionId, supabaseUrl, supabaseHeaders) {
  try {
    // subscriptions -> customers -> business_id
    const subRes = await fetch(
      `${supabaseUrl}/rest/v1/subscriptions?stripe_subscription_id=eq.${encodeURIComponent(stripeSubscriptionId)}&select=customer_id`,
      { headers: supabaseHeaders }
    );
    const subs = await subRes.json();
    if (!subs || subs.length === 0) return null;

    const custRes = await fetch(
      `${supabaseUrl}/rest/v1/customers?id=eq.${encodeURIComponent(subs[0].customer_id)}&select=business_id`,
      { headers: supabaseHeaders }
    );
    const custs = await custRes.json();
    if (!custs || custs.length === 0) return null;

    return custs[0].business_id;
  } catch (err) {
    console.error('getBusinessIdFromSubscription error:', err);
    return null;
  }
}
