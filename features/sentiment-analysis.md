# Sentiment Analysis (Client-Side)

## Summary
Keyword-based sentiment scoring of business reviews to identify the most positive and useful reviews.

## Details
- Reviews are scored using a keyword-based sentiment analysis algorithm
- Positive and negative keyword lists are checked against review text
- Each review receives a numeric sentiment score
- `getTopReviews()` selects the highest-scored reviews for display
- Currently runs client-side only; scores are not persisted to the database

## Key Files
- `app.js` — Sentiment scoring functions, `getTopReviews()`

## Limitations
- Keyword-based only (no ML/NLP model)
- English-centric keyword lists
- Scores are not saved to the `business_reviews` table
- No `sentiment_label` classification (very_positive, positive, neutral, negative) applied yet
