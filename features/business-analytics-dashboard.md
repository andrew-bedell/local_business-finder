# Business Analytics Dashboard

## Summary
First-party analytics tracking system embedded in published websites, with a customer-facing dashboard showing visitor stats, action metrics, traffic sources, and device breakdown.

## Details

### Tracking Pipeline
1. **Tracking script** injected by `api/sitio/serve.js` into every published website before `</body>`
2. **Track endpoint** (`api/analytics/track.js`) receives events via `navigator.sendBeacon` / POST
   - Generates `visitor_id` from SHA-256 hash of IP + User-Agent (first 16 chars) — no cookies, no PII
   - Fire-and-forget insert to Supabase `analytics_events`, always returns 204
3. **Daily cron** (`api/analytics/summarize.js`) runs at 3 AM UTC via Vercel Cron
   - Rolls up yesterday's raw events into `analytics_summaries` per business
   - Upserts with conflict resolution on (business_id, date)
4. **Stats endpoint** (`api/analytics/stats.js`) serves the customer dashboard
   - Accepts `?businessId=123&days=30` (max 90 days)
   - Returns totals, daily breakdown (zero-filled), top 10 referrers, device percentages

### Events Tracked
- `page_view` — page URL, referrer domain, device type, visitor_id
- `click_phone` — phone number click/tap
- `click_email` — email link click
- `click_directions` — Google Maps directions click
- `click_social` — social media link click
- `form_submit` — contact form submission

### Customer Dashboard UI
- Date range selector: 7 / 30 / 90 days
- 4 stat cards: Views, Calls, Directions, Contacts
- SVG bar chart: daily page views with grid lines and date labels
- Traffic sources: horizontal bar list of top referrers
- Device breakdown: desktop / mobile / tablet with colored bars
- Dashboard stat card also shows visitor count from analytics

### Privacy
- No cookies, no PII stored
- Visitor uniqueness via hashed IP+UA fingerprint
- Referrer stored as domain only
- Device type inferred from User-Agent category, not raw string

## Key Files
- `api/analytics/track.js` — Event receiver endpoint
- `api/analytics/stats.js` — Stats/aggregation endpoint for dashboard
- `api/analytics/summarize.js` — Daily cron rollup
- `api/sitio/serve.js` — Injects tracking script into published websites
- `customer/index.html` — Analytics section HTML
- `customer/app.js` — Analytics loading, rendering (chart, referrers, devices)
- `customer/styles.css` — Analytics component styles
- `database/schema.sql` — `analytics_events` and `analytics_summaries` tables
- `database/migrations/009-analytics-tables.sql` — Migration to create tables
- `vercel.json` — Cron job config for summarize endpoint

## Dependencies
- Customer Admin Portal
- Website Generation (published sites embed the tracking script)
- Vercel Cron (daily summary rollups)
