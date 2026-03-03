# Social Media Discovery

**Phase:** Gather

## Summary
Discover and link social media profiles for each business across 14 supported platforms via the detail modal.

## Details
The detail modal for each business now includes a **Social Profiles** section that allows the operator to:

1. **View linked profiles** — See all saved social profiles with platform icons, URLs, and extracted handles
2. **Add new profiles** — Select a platform from a dropdown and paste the profile URL; handles are auto-extracted from the URL
3. **Remove profiles** — Delete linked profiles that are no longer relevant
4. **Search for profiles** — Click platform search links that open pre-filled searches on each platform (or via Google site-search) using the business name and location

### Supported Platforms (14)
Facebook, Instagram, WhatsApp, Twitter/X, TikTok, LinkedIn, YouTube, Yelp, TripAdvisor, OpenTable, Resy, DoorDash, Uber Eats, Grubhub

### Workflow
- Business must be saved to the database before profiles can be linked (the section shows a "Save to Database" button if not yet saved)
- Profiles are persisted to the `business_social_profiles` table via Supabase upsert (one profile per platform per business)
- Search links construct platform-specific search URLs or Google `site:` searches with the business name and city pre-filled
- Handle/username is automatically extracted from profile URLs for applicable platforms

### i18n
Full English and Spanish translations for all social profile UI strings.

## Key Files
- `app.js` — Social discovery logic: platform config (`SOCIAL_PLATFORMS`), search URL builder (`buildSearchUrl`), handle extraction (`extractHandleFromUrl`), Supabase operations (`getBusinessId`, `loadSocialProfiles`, `saveSocialProfile`, `deleteSocialProfile`), modal rendering (`initSocialProfilesSection`, `renderSocialProfiles`, `buildSearchLinksHtml`)
- `styles.css` — Social profile styles: `.social-profile-item`, `.social-add-form`, `.social-search-grid`, `.social-search-link`, responsive breakpoints
- `database/schema.sql` — `business_social_profiles` table (pre-existing)

## Dependencies
- Supabase JS SDK (already loaded)
- `business_social_profiles` table in Supabase database
- Business must be saved to `businesses` table before adding profiles
