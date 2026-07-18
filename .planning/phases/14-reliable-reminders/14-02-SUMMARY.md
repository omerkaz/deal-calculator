# Plan 14-02 Summary: Rewrite Cron Functions

**Status:** ✅ Complete
**Commits:** e84a908 (lifecycle fns), 4d77536 (lead fns), 732e40e (migration file)
**Migration applied:** 2026-07-18 to live project hbhepcucokwlagqygwrz

## What was built

All 6 reminder cron functions rewritten from BETWEEN windows to NOT EXISTS pattern:
- `send_blood_test_reminders()` — ≥14 days, feature `blood_test_reminder`
- `send_week6_checkin_reminders()` — ≥42 days, feature `week_6_checkin`
- `send_end_review_reminders()` — ≥7 days, feature `end_review`
- `notify_lead_day3()` — ≥3 days, feature `lead_day3`
- `notify_lead_day7()` — ≥7 days, feature `lead_day7`
- `notify_lead_day12()` — ≥12 days, feature `lead_day12`

Each function now:
1. Uses `<= now() - INTERVAL 'N days'` instead of BETWEEN (removes upper bound)
2. Adds `AND NOT EXISTS (... email_send_log ... sent_at >= state_changed_at)`
3. INSERTs into `email_send_log` after each `net.http_post` call

`auto_cold_leads()` unchanged — not an email sender.

## Verification

- Live DB: `email_send_log` table exists (4 columns, RLS, index)
- Live functions: confirmed `NOT EXISTS` in `send_blood_test_reminders` prosrc
- All 6 toggles OFF (no sends will fire until Hüseyin enables them)
- `schema.sql` matches live DB
- TypeScript build passes, 12 node:test assertions pass

## Deferred observation

- **Catch-up burst behavior** needs production observation: if cron misses several days, a patient may receive multiple feature emails on the same run. Acceptable at current volume (<50 patients).
- **INSERT-after-send timing** (T-14-04): INSERT fires even if net.http_post silently fails (pg_net is fire-and-forget). At current volume, manual re-send suffices.
