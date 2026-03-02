# Social Media Discovery

**Phase:** Gather
**Status:** Not Started
**Priority:** High

## Summary
Automatically discover and link social media profiles for each business across 14 supported platforms.

## Description
For each business found in the Find phase, search for and verify social media presence on Facebook, Instagram, WhatsApp, Twitter/X, TikTok, LinkedIn, YouTube, Yelp, TripAdvisor, OpenTable, Resy, DoorDash, Uber Eats, and Grubhub.

## Requirements
- Search each platform for matching business profiles using name + location
- Verify profile ownership (match address, phone, or name)
- Store profile URLs, usernames, follower counts, and verification status
- Track when each profile was last checked
- Handle rate limiting across multiple platform APIs

## Database Support
- Table `business_social_profiles` is already defined in `database/schema.sql`
- Supports: platform, profile_url, username, follower_count, is_verified, last_checked_at

## Dependencies
- Platform-specific APIs or scraping strategies for each of the 14 platforms
- Rate limiting and retry logic
