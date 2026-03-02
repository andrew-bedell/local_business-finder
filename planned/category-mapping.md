# Business Category & Subcategory Mapping

**Phase:** Gather
**Status:** Not Started
**Priority:** Medium

## Summary
Map Google Places `types[]` array to meaningful `category` and `subcategory` values for template selection in the Generate phase.

## Description
Google Places returns a raw `types` array (e.g., `["restaurant", "food", "point_of_interest"]`). This feature maps those types to a human-readable primary category (e.g., "Restaurant") and subcategory (e.g., "Mexican Cuisine") used to select the right website template.

## Requirements
- Define a mapping table from Google Places types to internal categories
- Categories should align with website templates (restaurant, salon, contractor, retail, etc.)
- Subcategories provide specificity (cuisine type, service specialty, etc.)
- Populate `category` and `subcategory` fields in the `businesses` table on save
- Handle businesses with multiple types by selecting the most specific one

## Database Support
- Columns `category` and `subcategory` already exist in `database/schema.sql` (`businesses` table)

## Dependencies
- None (can be implemented independently)
