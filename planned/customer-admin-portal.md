# Customer Admin Portal

## Summary
A separate, authenticated admin page for local business owners (customers) where they can manage their account — edit contact information, change passwords, view billing, request website edits, and cancel their subscription.

## Status
Not Started

## Priority
Medium — Depends on Prospect-to-Customer Pipeline (authentication and customer records must exist).

## Details

### Problem
Once a local business becomes a paying customer, they need self-service access to:
- Update their contact info and business details
- Manage their login credentials
- View billing history and manage payment methods
- Request changes to their website
- Cancel their subscription

Currently there is no authentication system and no customer-facing UI.

### Architecture Decision: Separate HTML Page

The Customer Admin Portal is a **separate HTML page** (`admin.html`), not a section within `index.html`. Reasons:
- Different audience (business owner vs. operator)
- Different authentication context (customer auth vs. operator/no-auth)
- Simpler security model — the operator app and customer portal don't share DOM state
- Can be served on a subdomain or path (e.g., `app.example.com/admin`)

The portal follows the same stack: vanilla HTML/CSS/JS, no framework, reuses `styles.css` design tokens.

### Authentication

**Supabase Auth** handles customer authentication:
- Email + password login (created during prospect-to-customer conversion)
- Password reset via email
- Session management via Supabase Auth SDK (included in Supabase JS v2)

**Auth flow:**
1. Customer receives invite email with temporary password (sent during conversion)
2. Customer visits `admin.html`, enters email + password
3. Supabase Auth verifies credentials, returns session token
4. Portal loads customer data using authenticated Supabase client
5. RLS policies restrict data access to the authenticated customer's own records

**Database changes for auth:**

New `customer_users` table (links Supabase Auth users to customer records):
```sql
CREATE TABLE customer_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'manager')),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_customer_users_auth ON customer_users(auth_user_id);
CREATE INDEX idx_customer_users_customer ON customer_users(customer_id);
```

**RLS policies (replace open "Allow all access"):**
```sql
-- Customer users can only see their own customer record
CREATE POLICY "Customers see own data" ON customers
  FOR SELECT USING (
    id IN (SELECT customer_id FROM customer_users WHERE auth_user_id = auth.uid())
  );

-- Similar policies for businesses, edit_requests, subscriptions, generated_websites
-- scoped to the customer's business_id
```

### Portal Sections

#### 1. Dashboard (Landing)
- Business name and website URL (link to live site)
- Subscription status badge (active, past due)
- Quick stats: days until next billing, open edit requests
- Recent activity feed

#### 2. Contact Information
- Editable fields: phone, email, address, hours
- Changes here update the `businesses` table (within RLS scope)
- Option to "Request Website Update" after saving contact changes — auto-creates an edit request of type `contact_update`
- Save button with confirmation toast

#### 3. Password Management
- Current password + new password + confirm new password
- Uses `supabase.auth.updateUser({ password: newPassword })`
- Password strength indicator
- Success/error toast feedback

#### 4. Billing Information
- Current plan and monthly price
- Next billing date
- Payment method on file (last 4 digits of card, expiry — retrieved from Stripe)
- Invoice history (list of past invoices with dates and amounts)
- "Manage Billing" button → redirects to Stripe Customer Portal (via `api/stripe/customer-portal.js`)
- Billing data is read-only in our UI — all changes happen in Stripe's hosted portal

#### 5. Edit Requests
- Form to submit a new edit request:
  - Request type dropdown (content, photo, contact, hours, menu, design, other)
  - Description textarea
  - Priority selector (low, normal, high)
  - Submit button
- History of past requests with status badges
- Cannot edit or delete submitted requests (operator manages lifecycle)

#### 6. Account Management
- "Cancel Subscription" button with multi-step confirmation:
  1. Click "Cancel" → shows consequences (site will be suspended, data retained for 90 days)
  2. Confirm → sets `cancel_at_period_end = true` on the Stripe subscription
  3. Subscription remains active until end of current billing period
  4. After period ends, Stripe webhook fires → status becomes `cancelled` → site suspended
- Cancel does NOT immediately delete anything — data retention for potential reactivation

### Page Structure (`admin.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Same meta tags, fonts, styles.css as index.html -->
  <link rel="stylesheet" href="styles.css">
  <link rel="stylesheet" href="admin.css"> <!-- Portal-specific styles -->
</head>
<body>
  <header> <!-- Logo, business name, logout button --> </header>
  <main>
    <nav class="admin-nav"> <!-- Sidebar or tab navigation --> </nav>
    <section id="admin-dashboard"> ... </section>
    <section id="admin-contact"> ... </section>
    <section id="admin-password"> ... </section>
    <section id="admin-billing"> ... </section>
    <section id="admin-requests"> ... </section>
    <section id="admin-account"> ... </section>
  </main>
  <footer> ... </footer>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="admin.js"></script>
</body>
</html>
```

### New Files

| File | Purpose |
|---|---|
| `admin.html` | Customer admin portal HTML shell |
| `admin.js` | Portal logic (auth, data loading, form handling) — separate IIFE |
| `admin.css` | Portal-specific styles (nav, sections) — imports/reuses design tokens from `styles.css` |
| `api/stripe/customer-portal.js` | Serverless function to create Stripe Customer Portal session |

### Security Considerations

- **RLS is mandatory** — the customer must only see/edit their own data
- **Supabase Auth session tokens** expire and refresh automatically via the SDK
- **No operator data exposed** — the portal queries only customer-scoped tables
- **Stripe Customer Portal** handles all sensitive billing operations (PCI compliance)
- **Password changes** go through Supabase Auth (not stored in our tables)
- **Rate limiting** on login attempts (Supabase Auth provides this)

## Key Files
- `admin.html` — New file: portal HTML shell
- `admin.js` — New file: portal application logic
- `admin.css` — New file: portal-specific styles
- `styles.css` — Shared design tokens (no changes needed, `admin.css` imports via CSS custom properties)
- `api/stripe/customer-portal.js` — New serverless function (may already exist from Prospect-to-Customer Pipeline)
- `database/schema.sql` — New `customer_users` table, updated RLS policies

## Dependencies
- Prospect-to-Customer Pipeline (customer records, Stripe integration)
- Supabase Auth configured (email provider enabled, invite flow set up)
- Stripe Customer Portal configured in Stripe dashboard
- Website Management (for edit requests to have a destination)

## i18n Keys Needed
- `adminLogin` — "Log in to your account"
- `adminEmail` — "Email"
- `adminPassword` — "Password"
- `adminLoginBtn` — "Log In"
- `adminLogout` — "Log Out"
- `adminDashboard` — "Dashboard"
- `adminContact` — "Contact Info"
- `adminPasswordSection` — "Password"
- `adminBilling` — "Billing"
- `adminRequests` — "Edit Requests"
- `adminAccount` — "Account"
- `adminSaveChanges` — "Save Changes"
- `adminChangesSaved` — "Changes saved successfully"
- `adminPasswordChanged` — "Password updated successfully"
- `adminPasswordMismatch` — "Passwords do not match"
- `adminNewRequest` — "New Edit Request"
- `adminRequestSubmitted` — "Edit request submitted"
- `adminCancelSubscription` — "Cancel Subscription"
- `adminCancelConfirm` — "Are you sure? Your website will be suspended at the end of the billing period."
- `adminCancelSuccess` — "Subscription will cancel at end of billing period"
- `adminManageBilling` — "Manage Billing"
- `adminNextBilling` — "Next billing date: {0}"
