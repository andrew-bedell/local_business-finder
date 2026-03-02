# Menu Extraction from Photos

**Phase:** Curate
**Status:** Not Started
**Priority:** Medium

## Summary
Extract structured menu data from menu photos using OCR and AI, primarily for restaurant businesses.

## Description
When menu photos are identified (via Photo Categorization), use OCR/AI to extract individual menu items with names, descriptions, prices, and categories. Store as structured data for website generation.

## Requirements
- Identify menu photos from the `business_photos` table (where `photo_type = 'menu'`)
- Run OCR on menu images to extract raw text
- Use AI to parse raw text into structured menu items (category, name, description, price)
- Support multiple currencies (USD, MXN, COP, etc.)
- Link each extracted item back to its source photo via `source_photo_id`
- Handle multi-page menus and varied menu formats

## Database Support
- Table `business_menus` is already defined in `database/schema.sql`
- Supports: source_photo_id, menu_category, item_name, item_description, price, currency

## Dependencies
- Photo Collection & Categorization (to identify menu photos)
- OCR service (Google Cloud Vision, Tesseract, or similar)
- AI model for text-to-structure parsing
