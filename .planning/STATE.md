# Project State

**Last updated:** 2026-07-06
**Current milestone:** Between milestones — v1.1 shipped + hardened; v1.2 not yet scoped
**Current phase:** None active

## Current Position

v1.0 (Core CRM) and v1.1 (Automation & Polish) are shipped and live on Supabase
project `hbhepcucokwlagqygwrz`. A production hardening pass on 2026-07-06
verified the full email automation chain end-to-end and fixed critical bugs
that shipped silently broken (see `milestones/v1.1-automation-polish.md`).

**Next action:** Scope v1.2 via the new-milestone workflow. The #1 candidate is
the custom email domain (SPF/DKIM) — without it, automation emails cannot reach
real patients (Resend sandbox sender restriction).

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
