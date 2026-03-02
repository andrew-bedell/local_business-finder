# Website Management

## Summary
A management layer for generated and published websites, enabling the operator to handle content edits requested by local business owners and manage the lifecycle of hosted sites.

## Status
Not Started

## Priority
Medium — Depends on Website Generation and Prospect-to-Customer Pipeline being implemented first.

## Details

### Problem
Once a website is generated and sold to a local business, the business owner will want changes — updated hours, new photos, corrected phone numbers, seasonal promotions, etc. There needs to be a system to:
1. Receive and track edit requests from business owners
2. Make edits to the generated website
3. Re-publish updated sites
4. Manage site lifecycle (active, suspended for non-payment, archived)

### Edit Request System

Business owners submit edit requests through their Customer Admin Portal (separate feature). The operator sees and manages these requests from the main app.

**Edit Request Lifecycle:**
```
submitted → in_review → in_progress → completed
                                    → rejected (with reason)
```

### Database Changes

**New `edit_requests` table:**
```sql
CREATE TABLE edit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  website_id UUID REFERENCES generated_websites(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL
    CHECK (request_type IN ('content_update', 'photo_update', 'contact_update', 'hours_update', 'menu_update', 'design_change', 'other')),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'in_review', 'in_progress', 'completed', 'rejected')),
  priority TEXT DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_edit_requests_business ON edit_requests(business_id);
CREATE INDEX idx_edit_requests_status ON edit_requests(status);
```

**New columns on `generated_websites` table:**
```sql
ALTER TABLE generated_websites ADD COLUMN site_status TEXT DEFAULT 'active'
  CHECK (site_status IN ('active', 'suspended', 'archived'));
ALTER TABLE generated_websites ADD COLUMN last_edited_at TIMESTAMPTZ;
ALTER TABLE generated_websites ADD COLUMN version INTEGER DEFAULT 1;
```

### UI: Operator Website Management View

Accessible from the Saved Entries view when a business has `pipeline_status = 'customer'` and a generated website.

**Website Dashboard (per customer):**
- Website status badge (active / suspended / archived)
- Published URL (clickable link)
- Last edited date, version number
- "Edit Website" button → opens website editor
- "Re-publish" button → re-deploys to Vercel
- "Suspend Site" / "Reactivate" toggle (for non-payment)

**Edit Requests Queue:**
- Card in the main Saved Entries view or a dedicated tab: "Edit Requests"
- Table showing all pending requests across all customers
- Columns: Business Name, Request Type, Description, Priority, Submitted Date, Status, Actions
- Filters: Status (submitted, in_review, in_progress), Priority, Business
- Actions: Review, Start Work, Complete, Reject (with reason)

**Website Editor:**
- Not a full CMS — the operator edits data in Supabase and re-generates
- Edit flow: update business record / photos / reviews → re-run Generate → re-publish
- For simple updates (contact info, hours): direct edit on the business record
- For content updates: modify curated review selection, photo selection, menu items
- Each edit bumps the `version` counter on `generated_websites`

### Site Lifecycle Management

| Event | Action |
|---|---|
| Subscription active | `site_status = 'active'` — site accessible |
| Payment past due (grace period) | Site remains active; operator notified |
| Subscription cancelled | `site_status = 'suspended'` — site shows "temporarily unavailable" page |
| Subscription reactivated | `site_status = 'active'` — site restored |
| Business deleted | `site_status = 'archived'` — site taken down, data retained |

Site status changes can be automated via Stripe webhooks (subscription status changes trigger site status updates).

## Key Files
- `index.html` — Edit requests queue section, website management panel within detail view
- `app.js` — Edit request management functions, site status management, re-publish flow
- `styles.css` — Edit request badges, website management panel styles
- `api/stripe/webhook.js` — Extended to handle site suspension on payment failure
- `database/schema.sql` — New `edit_requests` table, new columns on `generated_websites`

## Dependencies
- Website Generation (must have generated websites to manage)
- Prospect-to-Customer Pipeline (customers and subscriptions must exist)
- Customer Admin Portal (where business owners submit edit requests)

## i18n Keys Needed
- `editRequests` — "Edit Requests"
- `editRequestSubmitted` — "Submitted"
- `editRequestInReview` — "In Review"
- `editRequestInProgress` — "In Progress"
- `editRequestCompleted` — "Completed"
- `editRequestRejected` — "Rejected"
- `editRequestTypes.content_update` — "Content Update"
- `editRequestTypes.photo_update` — "Photo Update"
- `editRequestTypes.contact_update` — "Contact Update"
- `editRequestTypes.hours_update` — "Hours Update"
- `editRequestTypes.menu_update` — "Menu Update"
- `editRequestTypes.design_change` — "Design Change"
- `editRequestTypes.other` — "Other"
- `siteActive` — "Active"
- `siteSuspended` — "Suspended"
- `siteArchived` — "Archived"
- `republishSite` — "Re-publish"
- `republishSuccess` — "Website re-published successfully"
- `suspendSite` — "Suspend Site"
- `reactivateSite` — "Reactivate Site"
