# Customer Admin Portal

## Summary
Authenticated admin portal for business owner customers to manage their account — view website, update contact info, manage billing via Stripe, submit edit requests, and manage their account.

## Details

### Architecture
- Separate HTML page served at `/mipagina` and `/mipagina/:nombre`
- Light theme (customer-facing), Spanish-only
- All CSS classes prefixed with `c-` to avoid collisions with employee and marketing styles
- Supabase Auth for authentication (email + password)
- RLS policies scope data per customer via `customer_users` table

### Portal Sections
1. **Dashboard** — Website URL card, subscription status, quick stats, recent edit requests
2. **Mi Negocio** — Editable contact info (phone, email, address) and business hours
3. **Facturación** — Current plan, billing date, Stripe Customer Portal redirect for payment management
4. **Solicitudes** — Submit edit requests (type, description, priority), view request history with status badges
5. **Mi Cuenta** — Change password, cancel subscription (multi-step confirmation via Stripe)

### Auth Flow
1. Customer visits `/mipagina/:nombre`, sees login screen
2. Signs in with Supabase Auth (email + password)
3. App loads customer record via `customer_users` → `customers` → `businesses`
4. RLS restricts queries to the authenticated customer's own data

## Key Files
- `customer/index.html` — Portal HTML shell (login + dashboard sections)
- `customer/app.js` — Portal logic (auth, data loading, rendering, actions) — single IIFE
- `customer/styles.css` — Light theme design system with `c-` prefixed classes
- `api/stripe/customer-portal.js` — Serverless function to create Stripe Customer Portal session
- `database/schema.sql` — `customers`, `subscriptions`, `customer_users`, `edit_requests` tables
- `vercel.json` — Routes `/mipagina` and `/mipagina/:nombre` to customer portal

## Dependencies
- Supabase Auth (email provider enabled)
- Stripe account with Customer Portal configured
- Customer records created during prospect-to-customer conversion
