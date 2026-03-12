// Vercel serverless function: Handle Stripe webhook events
// POST — receives Stripe webhook events and updates database

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
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const updatePayload = {
          status: sub.status === 'active' ? 'active' : sub.status === 'past_due' ? 'past_due' : sub.status === 'canceled' ? 'cancelled' : sub.status,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end || false,
        };
        if (sub.canceled_at) {
          updatePayload.cancelled_at = new Date(sub.canceled_at * 1000).toISOString();
        }

        await fetch(
          `${supabaseUrl}/rest/v1/subscriptions?stripe_subscription_id=eq.${encodeURIComponent(sub.id)}`,
          {
            method: 'PATCH',
            headers: supabaseHeaders,
            body: JSON.stringify(updatePayload),
          }
        );
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

        // Suspend the website
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
