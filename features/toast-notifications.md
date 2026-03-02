# Toast Notifications

## Summary
Non-blocking notification system for user feedback on actions like saving businesses, export completion, and errors.

## Details
- Displays temporary toast messages at the top of the screen
- Three types: `success` (green), `error` (red), `warning` (amber)
- Messages auto-dismiss after a few seconds
- All toast messages are i18n-compatible

## Key Files
- `app.js` — `showToast(message, type)`
- `styles.css` — Toast styling and animations

## Usage
- Save success/failure feedback
- Export completion confirmation
- Search errors and warnings
- API key validation messages
