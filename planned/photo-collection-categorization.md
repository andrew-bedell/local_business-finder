# Photo Collection & Categorization

**Phase:** Gather / Curate
**Status:** Not Started
**Priority:** High

## Summary
Collect photos from multiple sources and classify them by type for use in generated websites.

## Description
Pull photos from Google Places, Facebook, Instagram, Yelp, and TripAdvisor. Categorize each photo as one of: exterior, interior, menu, product, food, team, logo, or ai_generated. Store photos in Supabase Storage with metadata in the database.

## Requirements
- Collect photos from Google Places API (currently displayed but not persisted)
- Pull photos from linked social media profiles (depends on Social Media Discovery)
- Classify photos by type using AI or heuristic methods
- Persist photos to Supabase Storage with proper paths
- Mark one photo per business as `is_primary` (featured image)
- Track photo source, dimensions, and attribution

## Database Support
- Table `business_photos` is already defined in `database/schema.sql`
- Supports: source, photo_type, url, storage_path, is_primary, width, height, attribution

## Dependencies
- Social Media Discovery (for non-Google photo sources)
- Supabase Storage bucket setup
- Image classification model or API (for auto-categorization)
