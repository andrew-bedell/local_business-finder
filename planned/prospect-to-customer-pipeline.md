# Prospect-to-Customer Pipeline

## Summary
Track the lifecycle of a business from discovery (prospect) through sale (customer), with Stripe integration for recurring monthly billing when a prospect converts.

## Status
Not Started

## Priority
High — Core monetization feature. Required before Website Management and Customer Admin Portal.

## Details

### Problem
Currently all saved businesses are undifferentiated — there's no concept of a business being a "prospect" vs. a paying "customer." The app needs a way to:
1. Track where each business is in the sales pipeline
2. Convert a prospect to a customer (i.e., they agreed to buy a website)
3. Charge them monthly via Stripe
4. Handle billing lifecycle (active, past due, cancelled)

### Pipeline Stages

| Stage | Meaning | Trigger |
|---|---|---|
| `prospect` | Business saved, potential lead | Default when saved via search |
| `contacted` | Outreach has been made | Manual status change by operator |
| `interested` | Business expressed interest | Manual status change by operator |
| `customer` | Paying customer with active subscription | Stripe checkout completed |
| `churned` | Cancelled subscription, no longer paying | Subscription cancelled or expired |

### Database Changes

**New column on `businesses` table:**
```sql
ALTER TABLE businesses ADD COLUMN pipeline_status TEXT DEFAULT 'prospect'
  CHECK (pipeline_status IN ('prospect', 'contacted', 'interested', 'customer', 'churned'));
ALTER TABLE businesses ADD COLUMN pipeline_status_changed_at TIMESTAMPTZ;
```

**New `customers` table:**
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  email TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  monthly_price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_customers_business ON customers(business_id);
CREATE INDEX idx_customers_stripe ON customers(stripe_customer_id);
```

**New `subscriptions` table:**
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'past_due', 'cancelled', 'incomplete', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_subscriptions_customer ON subscriptions(customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

### Stripe Integration

**Setup:**
- Stripe account required (operator's account)
- Stripe publishable key stored in localStorage (like Google API key) or served via Vercel proxy
- Stripe secret key stored as Vercel environment variable (never in client code)

**New Vercel serverless functions:**

| Endpoint | Purpose |
|---|---|
| `api/stripe/create-checkout-session.js` | Create Stripe Checkout Session for a new customer |
| `api/stripe/webhook.js` | Handle Stripe webhook events (payment success, failure, cancellation) |
| `api/stripe/customer-portal.js` | Create Stripe Customer Portal session for billing management |

**Checkout Flow:**
1. Operator clicks "Convert to Customer" on a prospect in the Saved Entries view
2. Modal appears with fields: customer email, contact name, monthly price
3. On submit, client calls `api/stripe/create-checkout-session.js` with business ID and price
4. Serverless function creates Stripe Customer + Checkout Session
5. Redirect to Stripe Checkout (hosted by Stripe — no payment form in our app)
6. After payment, Stripe webhook fires → `api/stripe/webhook.js` handles:
   - Creates `customers` row with `stripe_customer_id`
   - Creates `subscriptions` row with `stripe_subscription_id`
   - Updates `businesses.pipeline_status` to `'customer'`
7. Operator sees updated status in Saved Entries view

**Webhook Events to Handle:**
- `checkout.session.completed` → Create customer + subscription records, set pipeline status to `customer`
- `invoice.payment_succeeded` → Update subscription period dates
- `invoice.payment_failed` → Update subscription status to `past_due`
- `customer.subscription.deleted` → Update subscription status to `cancelled`, set pipeline status to `churned`
- `customer.subscription.updated` → Sync subscription status and period

**Stripe Customer Portal:**
- For billing management (update payment method, view invoices, cancel)
- Accessed from the Customer Admin Portal (separate feature)
- Created via `api/stripe/customer-portal.js` which returns a portal URL

### UI Changes

**Saved Entries View Additions:**
- Pipeline status badge on each row (color-coded):
  - `prospect` — muted/default
  - `contacted` — blue
  - `interested` — amber
  - `customer` — green
  - `churned` — red
- Pipeline status filter in the filter bar
- "Convert to Customer" button (visible for prospects/contacted/interested)
- Status change dropdown for manual pipeline progression (prospect → contacted → interested)

**Convert to Customer Modal:**
- Customer email (required)
- Contact name
- Monthly price (required, with currency selector)
- Notes field
- "Start Subscription" button → triggers Stripe Checkout

### Environment Variables (Vercel)

| Variable | Purpose |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe API secret key (server-side only) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (can be served to client) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret for verification |
| `STRIPE_PRICE_ID` | Default Stripe Price ID (or allow custom pricing per customer) |

## Key Files
- `index.html` — Convert-to-customer modal HTML
- `app.js` — Pipeline status management, convert flow, Stripe Checkout redirect
- `styles.css` — Pipeline status badges, convert modal
- `api/stripe/create-checkout-session.js` — New serverless function
- `api/stripe/webhook.js` — New serverless function
- `api/stripe/customer-portal.js` — New serverless function
- `database/schema.sql` — New tables: `customers`, `subscriptions`; new column on `businesses`

## Dependencies
- Saved Entries Viewer (need to see saved businesses to manage pipeline)
- Stripe account and API keys
- Vercel environment variables configured
- Supabase service role key for webhook writes (webhooks can't use anon key with proper RLS)

## i18n Keys Needed
- `pipelineProspect` — "Prospect"
- `pipelineContacted` — "Contacted"
- `pipelineInterested` — "Interested"
- `pipelineCustomer` — "Customer"
- `pipelineChurned` — "Churned"
- `convertToCustomer` — "Convert to Customer"
- `customerEmail` — "Customer Email"
- `customerName` — "Contact Name"
- `monthlyPrice` — "Monthly Price"
- `startSubscription` — "Start Subscription"
- `convertSuccess` — "Customer created. Redirecting to Stripe checkout..."
- `convertError` — "Failed to create checkout session"
- `pipelineStatusUpdated` — "Status updated to {0}"
