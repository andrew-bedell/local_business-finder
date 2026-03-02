# Internationalization (i18n)

## Summary
Full English and Spanish language support for all user-facing text in the application.

## Details
- Two languages supported: English (`en`) and Spanish (`es`)
- All strings go through the `t(key, ...args)` translation function
- HTML elements use `data-i18n` attributes for static text
- Placeholders use `data-i18n-placeholder`, optgroup labels use `data-i18n-label`
- Language preference is saved to localStorage
- Interpolation supported via `{0}`, `{1}` placeholders

## Key Files
- `app.js` — `translations` object (EN/ES), `t()` helper, `applyLanguage()`
- `index.html` — `data-i18n` attributes on all text elements

## Behavior
- Language toggle in the UI switches between EN/ES
- All static text, button labels, placeholders, and toast messages are translated
- Selection persists across page reloads via localStorage
