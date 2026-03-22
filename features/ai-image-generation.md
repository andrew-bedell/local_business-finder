# AI Image Generation (NanoBanana)

**Phase:** Generate
**Status:** Not Started
**Priority:** Medium

## Summary
Generate AI images via the NanoBanana API to fill visual gaps when real photos are unavailable for a business.

## Description
When a business lacks certain photo types needed for website generation (e.g., no exterior photo, no team photo), use AI image generation to create appropriate visuals based on the business type, name, and location context.

## Requirements
- Detect which photo types are missing for each business (compare available `business_photos` against template requirements)
- Generate contextually appropriate images using NanoBanana API
- Tag generated images with `source = 'ai_generated'` and `photo_type = 'ai_generated'` in `business_photos`
- Store generated images in Supabase Storage
- Allow manual approval/rejection of AI-generated images before publishing
- Support generation of: exterior facades, interior ambiance, food/product shots, team/staff photos, logos

## Database Support
- `business_photos` table supports `source = 'ai_generated'` and `photo_type = 'ai_generated'`

## Dependencies
- NanoBanana API access and integration
- Photo Collection & Categorization (to know what's missing)
- Website Generation (consumer of generated images)
