# Data Completeness Scoring

**Phase:** Gather
**Status:** Not Started
**Priority:** Medium

## Summary
Calculate a 0-100 score representing how much data has been gathered for each business, guiding prioritization for the Curate and Generate phases.

## Description
After each data gathering step, recalculate a completeness score based on which fields are populated. Businesses with higher scores are more ready for website generation.

## Requirements
- Define weighted scoring criteria (e.g., photos = 20pts, reviews = 20pts, social profiles = 15pts, menu = 15pts, contact info = 15pts, hours = 15pts)
- Recalculate score after each gather/enrich operation
- Store in `data_completeness_score` column on the `businesses` table
- Display score in the UI to help users prioritize which businesses to focus on
- Set thresholds for "ready for website generation" (e.g., score >= 70)

## Database Support
- Column `data_completeness_score` already exists in `database/schema.sql` (DEFAULT 0)

## Dependencies
- Depends on other Gather features being implemented to have data to score
