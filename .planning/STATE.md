---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Deliverability & Landing Page Drip
status: in_progress
last_updated: "2026-07-18T00:00:00.000Z"
last_activity: 2026-07-18
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 2
  completed_plans: 2
  percent: 25
---

# Project State

**Last updated:** 2026-07-18
**Current milestone:** v1.2 Deliverability & Landing Page Drip (in progress)
**Current phase:** Phase 14 executed; Phase 12 in progress (browser agent)

## Current Position

Phase: 14 — Reliable Reminders (EXECUTED — migration applied to live DB)
Plans: 14-01 ✅, 14-02 ✅
Status: All 6 cron functions rewritten for at-least-once delivery; email_send_log table live
Last activity: 2026-07-18 — Phase 14 executed, migration deployed
Next code-ready work: Phase 13 (Verified Sender Identity, after Phase 12 DNS completes)

## Phase Status

| Phase | Name | Status |
|-------|------|--------|
| 12 | Domain & DNS Verification | 🔄 In progress (browser agent) |
| 13 | Verified Sender Identity | ⏳ Pending (depends on Phase 12) |
| 14 | Reliable Reminders | ✅ Executed (migration applied to live DB) |
| 15 | Landing Page Drip Sequence | ⏳ Pending (depends on Phase 13) |

## Verified Production State (2026-07-06)

- Login → dashboard → settings verified in browser against live backend
- Webhook: 201 + correct `created_by` attribution (RLS-visible)
- Email chain: cron fn → toggle gate → Vault → net.http_post → send-email → Resend `sent:true`
- All 7 email toggles OFF (opt-in) — Hüseyin enables via Settings when ready
- Auth user: `mrhus@huseyinacuz.com` (UUID `a0e60f0f-77f9-417f-9c74-9aa4c285cf6b`)
- Repo `main` in sync with origin; build passes

## Accumulated Context

- Edge Function env has NO `PRACTITIONER_USER_ID` — functions resolve the
  practitioner from the `practitioner_settings` row (D015). Setting the env var
  requires `supabase login` (Management API scope `edge_functions_secrets_write`
  is missing from the MCP OAuth token).

- Vault secrets (authoritative): `WEBHOOK_SECRET`, `RESEND_API_KEY`,
  `SUPABASE_FUNCTIONS_URL`, `PRACTITIONER_USER_ID` (correct UUID; `_V2` deleted)

- `supabase/schema.sql` is the single source of truth and matches the live DB
  (migration `fix_cron_email_functions` applied 2026-07-06)

- GitHub remote is misnamed `deal-calculator` — rename someday
- Dev app runs on tmux `pit-18:app` at http://localhost:5174 (5173 occupied)

## Tooling Migration (2026-07-06)

GSD-3 (`gsd-pi` TUI) was removed during malware remediation; `~/.gsd/` state was
lost. Now on **GSD 1.6.1** (`~/.claude/gsd-core/`, workflow-based, `.planning/`
in-repo). Planning docs reconstructed from CLAUDE.md + git history + verified
session evidence. `from-gsd2` auto-migration was impossible (source deleted).
