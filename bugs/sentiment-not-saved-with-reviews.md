# Bug: Sentiment Score Not Persisted When Reviews Are Saved

**Severity:** Medium
**File:** `app.js` (saveBusiness review mapping), `database/schema.sql` (business_reviews columns)

## Description
When reviews are saved to the `business_reviews` table, the `sentiment_score` and `sentiment_label` columns are never populated. The `analyzeSentiment()` function exists in the codebase but is only called during modal display (`getTopReviews()`), not during the save flow.

## Details
The review save mapping in `saveBusiness()`:
```javascript
const reviewRows = place.reviewData.map((r) => ({
  business_id: businessId,
  source: 'google',
  author_name: ...,
  author_photo_url: ...,
  rating: ...,
  text: ...,
  published_at: ...,
  // MISSING: sentiment_score, sentiment_label
}));
```

The schema defines both columns:
- `sentiment_score DECIMAL(5, 4)` — raw score from analysis
- `sentiment_label TEXT CHECK (sentiment_label IN ('very_positive', 'positive', 'neutral', 'negative'))` — category label

The `analyzeSentiment()` function already returns `{ score, label }` and could be called during save.

## Expected Behavior
Run `analyzeSentiment()` on each review during save and include the results:
```javascript
const sentiment = analyzeSentiment(r);
// sentiment_score: sentiment.score,
// sentiment_label: mapToDbLabel(sentiment.label),  // 'very positive' → 'very_positive'
```

Note: the `analyzeSentiment()` function returns labels like `'very positive'` (with space) but the schema CHECK constraint expects `'very_positive'` (with underscore). This mapping must also be handled.

## Impact
- Sentiment data is computed but never persisted — wasted computation on every modal open
- The Curate pipeline phase depends on persisted sentiment scores for review selection
- `is_curated` flag can never be meaningfully set without saved sentiment data
