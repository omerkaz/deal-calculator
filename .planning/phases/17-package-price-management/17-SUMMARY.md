# Phase 17: Package Price Management — Summary

**Requirement:** PRICE-01
**Status:** Complete
**Executed:** 2026-07-19

## What Was Built

Package prices are now editable data (not hard-coded constants). Each patient
gets a snapshotted `agreed_price` at package assignment, decoupling historical
payment status from future price changes.

## Commits

| Hash | Message |
|------|---------|
| `3b17631` | feat(schema): add agreed_price + price columns for PRICE-01 |
| `d4bc2f6` | feat(payments): derive status from agreed_price with cents comparison |
| `b5ebfb7` | feat(settings): add Package Prices management card |
| `5f22e8c` | feat(patients): snapshot agreed_price on package assignment |
| `280b4d2` | test(payments): add agreed_price derivation assertions |

## Architecture Decisions

- **Prices on `practitioner_settings`** (not a new table) — D014 single-row
  pattern; 3 fixed package types don't warrant a join table
- **`agreed_price` on `patients`** — snapshotted at assignment, editable for
  custom deals; DB CHECK enforces `(package_type IS NULL) = (agreed_price IS NULL)`
- **Cents-based comparison** in derivation — avoids floating-point rounding errors
- **Fresh settings fetch at submit time** — prevents stale-tab price snapshot race

## DB Changes (applied to live)

- `patients.agreed_price numeric(10,2)` + 2 CHECK constraints
- `practitioner_settings.price_standard/premium/vip numeric(10,2)` + 1 CHECK
- Migration: `20260719_add_price_columns.sql` (backfill was no-op: 0 patients)

## Evidence

- Live DB has 0 patients → backfill matched 0 rows → historical statuses trivially unchanged
- `npx tsc -b` → 0 errors
- `npm test` → 26 pass / 0 fail (12 existing + 14 new derivation tests)
- CHECK constraints verified live: `chk_agreed_price_non_negative`, `chk_agreed_price_package_sync`, `chk_prices_positive`

## Files Changed

- `supabase/schema.sql` — agreed_price + price columns + CHECK constraints
- `supabase/migrations/20260719_add_price_columns.sql` — new
- `src/types/database.ts` — removed PACKAGE_PRICES, added getPackagePrice(), agreed_price on Patient, prices on PractitionerSettings
- `src/lib/payments.ts` — agreedPrice param, cents comparison
- `src/lib/payments.test.ts` — new (14 assertions)
- `src/pages/DashboardPage.tsx` — fetches settings for price labels
- `src/pages/DashboardPage.test.ts` — fixture updated
- `src/pages/PatientsPage.tsx` — uses patient.agreed_price
- `src/pages/PatientDetailPage.tsx` — passes agreed_price to summary + PaymentsList
- `src/pages/PatientFormPage.tsx` — snapshot logic, editable field, A2 guard
- `src/pages/SettingsPage.tsx` — Package Prices card
- `src/components/patients/PaymentsList.tsx` — agreedPrice prop
- `package.json` — test script runs both test files
