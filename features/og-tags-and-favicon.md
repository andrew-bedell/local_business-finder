# Open Graph Tags & Favicon

## Summary
Proper Open Graph meta tags, Twitter Card tags, and multi-format favicon support for social sharing and browser compatibility.

## Details
- OG image served as PNG (1200x630) instead of SVG — social platforms (Facebook, Twitter/X, LinkedIn, WhatsApp, Slack, Discord) reject SVG format
- All OG image and URL tags use absolute URLs pointing to the Vercel deployment (`https://local-business-finder-kegt.vercel.app/`)
- `og:image:type` set to `image/png` for explicit format declaration
- `og:url` and `og:locale` tags added for complete OG compliance
- Twitter Card with `summary_large_image` format for large preview images
- Multi-format favicon stack: SVG (modern browsers), PNG 32x32 + 16x16 (fallback), ICO (legacy), apple-touch-icon 180x180 (iOS)
- `theme-color` meta tag set to `#0f1117` (matches `--bg` design token)

## Key Files
- `index.html` — meta tags in `<head>`
- `og-image.svg` (source) → `og-image.png` (1200x630, derived)
- `favicon.svg` (source) → `favicon-32x32.png`, `favicon-16x16.png`, `favicon.ico`, `apple-touch-icon.png` (derived)

## Dependencies
- PNG files are one-time conversions from SVG sources (no build-time dependency)
- If the production domain changes, update `og:image` and `og:url` absolute URLs in `index.html`
