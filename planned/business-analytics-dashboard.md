# Business Analytics Dashboard

## Summary
An analytics section within the Customer Admin Portal that gives local business owners actionable insights about their website performance and online presence, helping them optimize their business.

## Status
Not Started

## Priority
Low — Enhancement to the Customer Admin Portal. Build after the core portal, billing, and website management are stable.

## Details

### Problem
Local business owners who are paying for a website want to know if it's working — are people visiting? Are they calling? What's performing well? Without analytics, the website feels like a static brochure with no measurable value.

### Solution
Add an "Analytics" section to the Customer Admin Portal that surfaces key metrics in a simple, non-technical dashboard. The goal is actionable insights, not raw data.

### Data Sources

Analytics data comes from multiple sources:

| Source | Data | Collection Method |
|---|---|---|
| Website traffic | Page views, unique visitors, referral sources, device types | Lightweight tracking script embedded in generated websites |
| Contact actions | Click-to-call taps, email clicks, directions clicks, form submissions | Event tracking via the same embedded script |
| Google Business Profile | Search impressions, map views, direction requests | Google Business Profile API (future) |
| Review trends | New review count over time, average rating trend | Periodic re-gather from `business_reviews` |

### Tracking Implementation

**Embedded tracking script:**
- A small, first-party JavaScript snippet injected into every generated website
- Sends events to a Vercel serverless function (`api/analytics/track.js`)
- Serverless function writes to Supabase `analytics_events` table
- No third-party analytics (Google Analytics, etc.) — keeps it simple, privacy-friendly, and first-party

**Events tracked:**
- `page_view` — page URL, referrer, device type, timestamp
- `click_phone` — phone number click/tap
- `click_email` — email link click
- `click_directions` — Google Maps directions link click
- `click_social` — social media link click (with platform)
- `form_submit` — contact form submission (if template includes one)

### Database Changes

**New `analytics_events` table:**
```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  website_id UUID REFERENCES generated_websites(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL
    CHECK (event_type IN ('page_view', 'click_phone', 'click_email', 'click_directions', 'click_social', 'form_submit')),
  page_url TEXT,
  referrer TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_analytics_business ON analytics_events(business_id);
CREATE INDEX idx_analytics_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created ON analytics_events(created_at);
```

**New `analytics_summaries` table (daily rollups for fast dashboard queries):**
```sql
CREATE TABLE analytics_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  phone_clicks INTEGER DEFAULT 0,
  email_clicks INTEGER DEFAULT 0,
  direction_clicks INTEGER DEFAULT 0,
  social_clicks INTEGER DEFAULT 0,
  form_submissions INTEGER DEFAULT 0,
  top_referrers JSONB,
  device_breakdown JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX idx_analytics_summary_unique ON analytics_summaries(business_id, date);
```

### Dashboard UI (in Customer Admin Portal)

#### Date Range Selector
- Preset buttons: Last 7 days | Last 30 days | Last 90 days | Custom range
- Default: Last 30 days

#### Key Metrics Cards (top row)
Four cards showing current period vs. previous period with trend indicator:
- **Total Visits** — page views with % change arrow
- **Phone Calls** — click-to-call events
- **Direction Requests** — Maps clicks
- **Contact Actions** — email + form submissions combined

#### Visitors Over Time (chart)
- Simple line chart showing daily page views over the selected period
- Implemented with CSS/SVG (no chart library to keep it lightweight) or a single lightweight chart library if CSS is insufficient
- Tooltip on hover showing exact count per day

#### Traffic Sources (breakdown)
- Simple bar chart or list:
  - Direct (no referrer)
  - Google Search
  - Social Media (broken down by platform)
  - Other

#### Device Breakdown
- Simple pie/donut chart or horizontal bars:
  - Desktop %
  - Mobile %
  - Tablet %

#### Review Summary
- Current average rating with trend
- Total review count with new reviews this period
- Sentiment distribution (from curated reviews)

### Serverless Functions

| Endpoint | Purpose |
|---|---|
| `api/analytics/track.js` | Receive tracking events from generated websites, write to `analytics_events` |
| `api/analytics/summarize.js` | Cron job (Vercel Cron) to roll up raw events into `analytics_summaries` daily |

**`api/analytics/track.js`:**
- Accepts POST with `{ business_id, event_type, page_url, referrer, device_type, metadata }`
- Validates business_id exists
- Writes to `analytics_events`
- Returns 204 (no content)
- Rate-limited to prevent abuse (e.g., max 1000 events per business per hour)

**`api/analytics/summarize.js`:**
- Runs daily via Vercel Cron
- Aggregates yesterday's raw events per business into `analytics_summaries`
- Calculates unique visitors (approximated via fingerprinting or IP, stored in metadata)

### Privacy Considerations

- No cookies — tracking uses no persistent identifiers
- No PII collected — no names, emails, or IP addresses stored in analytics
- Device type inferred from User-Agent (stored as category, not raw UA string)
- Referrer stored as domain only, not full URL
- Compliant with basic privacy expectations (no GDPR consent banner needed for first-party, non-PII analytics)

### Implementation Phases

This feature is large enough to warrant phased delivery:

**Phase 1: Basic tracking + page views**
- Embed tracking script in generated websites
- `api/analytics/track.js` for `page_view` events
- Dashboard shows total visits over time
- Device breakdown

**Phase 2: Action tracking**
- Track `click_phone`, `click_email`, `click_directions`, `click_social`, `form_submit`
- Dashboard shows action metrics cards
- Traffic source breakdown

**Phase 3: Daily summaries + trends**
- `api/analytics/summarize.js` cron job
- Period-over-period comparison (% change arrows)
- Historical data beyond 90 days via summaries (raw events can be purged)

**Phase 4: Review analytics**
- Periodic re-gather of reviews
- Review trend charts in dashboard
- Sentiment analysis trends

## Key Files
- `admin.html` — New analytics section
- `admin.js` — Analytics data loading, chart rendering, date range handling
- `admin.css` — Chart styles, metric card styles
- `api/analytics/track.js` — New serverless function: event receiver
- `api/analytics/summarize.js` — New serverless function: daily rollup cron
- `database/schema.sql` — New tables: `analytics_events`, `analytics_summaries`
- Generated website templates — Embed tracking script snippet

## Dependencies
- Customer Admin Portal (the analytics section lives inside it)
- Website Generation (generated websites must embed the tracking script)
- Vercel Cron (for daily summary rollups)

## i18n Keys Needed
- `analyticsTitle` — "Analytics"
- `analyticsVisits` — "Total Visits"
- `analyticsPhoneCalls` — "Phone Calls"
- `analyticsDirections` — "Direction Requests"
- `analyticsContacts` — "Contact Actions"
- `analyticsLast7` — "Last 7 days"
- `analyticsLast30` — "Last 30 days"
- `analyticsLast90` — "Last 90 days"
- `analyticsCustom` — "Custom Range"
- `analyticsVisitors` — "Visitors Over Time"
- `analyticsSources` — "Traffic Sources"
- `analyticsDevices` — "Devices"
- `analyticsReviews` — "Review Trends"
- `analyticsNoData` — "No analytics data yet. Data will appear once your website receives visitors."
- `analyticsTrendUp` — "{0}% increase from previous period"
- `analyticsTrendDown` — "{0}% decrease from previous period"
