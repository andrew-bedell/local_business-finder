# Website Generation

**Phase:** Generate
**Status:** Not Started
**Priority:** High (final pipeline stage)

## Summary
One-click website generation for businesses using curated data, category-specific templates, and AI-generated images to fill visual gaps.

## Description
Select a template based on business category, populate it with all gathered and curated data (contact info, services, reviews, photos, menus), generate AI images for missing visuals, and publish the result.

## Requirements
- Template library organized by business category (restaurant, salon, contractor, retail, etc.)
- Template population engine that fills in: contact info, address/map, hours, services, curated reviews, categorized photos, structured menus
- AI image generation via NanoBanana API for visual gaps (e.g., no exterior photo available)
- Color scheme extraction from logo or brand assets, with fallback to category defaults
- Generation status tracking: draft, published, archived
- Published URL tracking for live sites
- Configuration stored as JSON blob for reproducibility

## Database Support
- Table `generated_websites` is already defined in `database/schema.sql`
- Supports: template_name, primary_color, secondary_color, status, published_url, config

## Dependencies
- All Gather features (social profiles, photos, reviews, menus)
- All Curate features (sentiment scoring, photo categorization, menu extraction)
- Category Mapping (for template selection)
- Data Completeness Scoring (to know when a business is ready)
- NanoBanana API integration (for AI image generation)
- Hosting/deployment pipeline for published sites
