# No-Website Filter

## Summary
Automatically filters search results to show only businesses that do not have a website, identifying leads for website generation.

## Details
- After Google Places search returns results, businesses are checked for the presence of a `websiteURI`
- Only businesses without a website pass through to the results table
- This is the core filtering logic that identifies the target audience for the pipeline

## Key Files
- `app.js` — Filter logic in `startSearch()` (filters where `!p.website`)

## Behavior
- Businesses with any website URL are excluded from results
- The count of filtered results is displayed to the user
- Users see only actionable leads (businesses that need a website)
