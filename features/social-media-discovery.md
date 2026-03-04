# Social Media Discovery

**Phase:** Gather

## Summary
Discover and link social media profiles for each business across 14 supported platforms — both automatic (Yelp API) and manual (detail modal).

## Details
Two complementary approaches work together:

### Automatic Discovery (Yelp API)
After a search completes, results are enriched with social media profiles in the background via a Vercel serverless proxy (`api/social/discover.js`):
- **Yelp Fusion API** — phone number match (most precise) then name/location fuzzy match
- **Facebook/Instagram** — stubs ready for when Meta app approval is granted
- Social icons appear in a new **Social** column in the results table
- Discovered profiles are saved to Supabase when the business is saved
- Yelp, Facebook, and Instagram URLs are included in CSV export

### Manual Management (Detail Modal)
The detail modal for each business includes a **Social Profiles** section that allows the operator to:

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
- `app.js` — Auto-discovery (`discoverYelp`, `enrichWithSocialProfiles`, `buildSocialIconsHtml`), manual management (`initSocialProfilesSection`, `renderSocialProfiles`, `buildSearchLinksHtml`), platform config (`SOCIAL_PLATFORMS`, `SOCIAL_ICONS`, `SOCIAL_COLORS`)
- `api/social/discover.js` — Vercel serverless function proxying Yelp Fusion API (phone match + name/location search)
- `styles.css` — Social icon styles (`.social-icon-link`, `.col-social`), modal profile styles (`.social-profile-item`, `.social-add-form`, `.social-search-grid`)
- `index.html` — Social column header in results table
- `database/schema.sql` — `business_social_profiles` table (pre-existing)

## Dependencies
- Yelp Fusion API key (`YELP_API_KEY` environment variable in Vercel)
- Facebook Graph API access token (future — `FACEBOOK_ACCESS_TOKEN`)
- Supabase JS SDK (already loaded)
- `business_social_profiles` table in Supabase database
- Business must be saved to `businesses` table before manually adding profiles
