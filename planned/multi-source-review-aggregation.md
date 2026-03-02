# Multi-Source Review Aggregation

**Phase:** Gather / Curate
**Status:** Not Started (sentiment analysis exists client-side only)
**Priority:** High

## Summary
Collect reviews from Google, Facebook, Yelp, and TripAdvisor, then score and curate the best ones for website generation.

## Description
Aggregate reviews from all available platforms for each business. Run sentiment analysis on each review to assign a score and label. Flag the top reviews as "curated" for use on generated websites.

## Requirements
- Collect reviews from Google Places (currently displayed but not saved to `business_reviews` table)
- Collect reviews from Facebook, Yelp, and TripAdvisor via their APIs
- Run sentiment analysis and assign `sentiment_score` (decimal) and `sentiment_label` (very_positive, positive, neutral, negative)
- Flag top reviews as `is_curated` for website use
- Persist all review data to `business_reviews` table
- Deduplicate cross-platform reviews from the same author

## Current State
- Client-side keyword-based sentiment analysis exists in `app.js` but scores are never saved
- Reviews are displayed in the detail modal but not persisted individually

## Database Support
- Table `business_reviews` is already defined in `database/schema.sql`
- Supports: source, author_name, author_url, rating, text, sentiment_score, sentiment_label, is_curated, review_date

## Dependencies
- Social Media Discovery (for Yelp/TripAdvisor/Facebook review access)
- Improved sentiment analysis (upgrade from keyword-based to ML/NLP model)
