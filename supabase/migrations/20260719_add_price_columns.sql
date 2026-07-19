-- Migration: PRICE-01 — Package Price Management
-- Adds agreed_price to patients + price columns to practitioner_settings
-- Single transaction: DDL → backfill → CHECK constraints

BEGIN;

-- 1. Add agreed_price column to patients (nullable, no constraint yet)
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS agreed_price numeric(10,2) DEFAULT NULL;

-- 2. Add price columns to practitioner_settings
ALTER TABLE practitioner_settings
  ADD COLUMN IF NOT EXISTS price_standard numeric(10,2) NOT NULL DEFAULT 297,
  ADD COLUMN IF NOT EXISTS price_premium  numeric(10,2) NOT NULL DEFAULT 497,
  ADD COLUMN IF NOT EXISTS price_vip      numeric(10,2) NOT NULL DEFAULT 797;

-- 3. Backfill agreed_price from OLD prices for existing patients with packages
-- (idempotent: only touches rows where agreed_price IS NULL)
UPDATE patients
SET agreed_price = CASE package_type
  WHEN 'standard' THEN 197
  WHEN 'premium'  THEN 297
  WHEN 'vip'      THEN 497
END
WHERE package_type IS NOT NULL
  AND agreed_price IS NULL;

-- 4. Add CHECK constraints (AFTER backfill so existing data passes)
ALTER TABLE patients
  ADD CONSTRAINT chk_agreed_price_non_negative CHECK (agreed_price >= 0);

ALTER TABLE patients
  ADD CONSTRAINT chk_agreed_price_package_sync CHECK ((package_type IS NULL) = (agreed_price IS NULL));

ALTER TABLE practitioner_settings
  ADD CONSTRAINT chk_prices_positive CHECK (price_standard > 0 AND price_premium > 0 AND price_vip > 0);

-- 5. Update existing practitioner_settings row with new default prices
-- (if row exists and still has old defaults, set to new; otherwise leave as-is)
UPDATE practitioner_settings
SET price_standard = 297, price_premium = 497, price_vip = 797
WHERE price_standard = 297 AND price_premium = 497 AND price_vip = 797;
-- Note: this is a no-op since defaults are already 297/497/797

COMMIT;
