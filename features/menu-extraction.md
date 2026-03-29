# Menu Extraction from Photos

**Phase:** Curate
**Status:** Implemented

## Summary
Extract structured menu data from menu photos using Claude vision AI. Supports auto-extraction during website generation and customer-uploaded menu photos via the Mi Pagina portal.

## How It Works

### Auto-Extraction (Pipeline)
During website generation (`api/_lib/website-pipeline.js`), if a business has menu photos (`photo_type = 'menu'`) but no existing menu items in `business_menus`, the most recent menu photo is automatically sent to Claude Sonnet vision for parsing. Extracted items are saved to the database and included in the website content.

### Customer Upload (Mi Pagina)
Business owners can upload menu photos in the Wizard section of the customer portal. After upload:
1. Photo is saved with `photo_type: 'menu'` via existing upload endpoint
2. Photo is sent to `/api/menu/parse` for AI extraction
3. Extracted items (category, name, description, price, currency) are displayed for review
4. Items are saved to `business_menus` table
5. Manual add/delete of individual menu items is also supported

### Menu Parse API
`POST /api/menu/parse` — Takes a `photoUrl`, downloads the image, sends to Claude Sonnet vision, returns structured JSON array of menu items.

## Key Files
- `api/menu/parse.js` — Claude vision menu parsing endpoint
- `api/_lib/website-pipeline.js` — Auto-parse integration in generation pipeline
- `customer/index.html` — Menu wizard card HTML
- `customer/app.js` — Menu upload, parse, CRUD logic
- `customer/styles.css` — Menu card styles

## Database Support
- Table `business_menus` (pre-existing in `database/schema.sql`)
- Fields: `source_photo_id`, `menu_category`, `item_name`, `item_description`, `price`, `currency`
- Linked to source photo via `source_photo_id` FK

## Dependencies
- Claude Sonnet vision API (via Anthropic API)
- Existing photo upload infrastructure (`api/wizard/upload-photo.js`)
- `business_menus` and `business_photos` tables
