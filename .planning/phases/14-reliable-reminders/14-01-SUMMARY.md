# Plan 14-01 Summary: Email Send Log Table

**Status:** ✅ Complete
**Commits:** 99da743 (schema), 42cb1ab (migration)

## What was built

- `email_send_log` table added to `supabase/schema.sql` — tracks (patient_id, feature, sent_at)
- FK to patients with CASCADE DELETE, index on (patient_id, feature), RLS with SELECT policy
- Idempotent migration file at `supabase/migrations/20260718_add_email_send_log.sql`

## Design decision

Tracking table over per-feature columns: scales to DRIP (Phase 15) without schema changes, provides audit trail, handles re-engagement via `sent_at >= state_changed_at` comparison.

## Deviations

None.
