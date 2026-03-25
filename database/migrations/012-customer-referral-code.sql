-- Migration 012: Add referral_code column to customers table
-- Permanent referral attribution — stored at signup time so we never lose
-- who referred this customer, even if they clear localStorage/cookies.

ALTER TABLE customers ADD COLUMN IF NOT EXISTS referral_code TEXT;
