# Roadmap: Hüseyin Ajuz Patient CRM

**Migrated:** 2026-07-06 from GSD-3 milestone structure (M001/M002 → v1.0/v1.1)
**Current milestone:** v1.2 Deliverability (scoped 2026-07-11)

## Milestones

- ✅ **v1.0 — Core Patient Management CRM** (was M001) — SHIPPED. 6 slices:
  schema+auth, patient CRUD, lifecycle machine, payments, notes/files,
  dashboard+pipeline. Archived: `milestones/v1.0-core-crm.md`
- ✅ **v1.1 — Automation & Polish** (was M002) — SHIPPED + hardened. 5 slices:
  polish/deploy, Resend+settings, welcome email, lifecycle reminders, lead
  follow-up. Post-ship hardening pass (2026-07-06) fixed 6 broken cron
  functions and verified the email chain end-to-end in production.
  Archived: `milestones/v1.1-automation-polish.md`
- 🔄 **v1.2 — Deliverability** — IN PLANNING. Phases 12–14 below.
- 💤 **v1.3 — Patient Communication & Scheduling** (candidates: CAL-01, DOC-01,
  MSG-01/SEED-001, WEB-01, DMARC ride-along)

## v1.2 Phases

### Phase 12: Domain & DNS Verification

**Goal:** `huseyinacuz.com` is a verified Resend sending domain and Hüseyin's
regular Google Workspace mail is SPF-protected.

**Requirements:** MAIL-04 (MAIL-01 groundwork; completes in Phase 13)

**Scope:**
- Add `huseyinacuz.com` as a domain in Resend (region: default)
- Add Resend's records in GoDaddy DNS: `send.` subdomain MX + SPF TXT
  (Return-Path), `resend._domainkey` DKIM TXT
- Add missing Google Workspace SPF: TXT `@` → `v=spf1 include:_spf.google.com ~all`
- Wait for propagation, trigger verification in Resend

**Success criteria:**
1. Resend dashboard shows `huseyinacuz.com` **Verified** (SPF + DKIM green)
2. `dig` confirms all 3 Resend records + the Google SPF record are live
3. Hüseyin's Google mailbox mail flow is undisrupted (MX untouched)

### Phase 13: Verified Sender Identity

**Goal:** Every automation email is sent from
`"Hüseyin Ajuz" <mrhus@huseyinacuz.com>` with a professional, consistent
identity — and lands in the inbox, not spam.

**Requirements:** MAIL-01, MAIL-03

**Scope:**
- `send-email` Edge Function v3: sender switch from `onboarding@resend.dev`,
  from-name "Hüseyin Ajuz", reply-to `mrhus@huseyinacuz.com`
- Consistent footer across all 7 email templates
- End-to-end test of each of the 7 features to a real inbox
- Deploy via deploy-helper; verify toggles still gate sends

**Success criteria:**
1. Each of the 7 email features delivers to a real inbox — headers show
   SPF/DKIM **pass**, message not in spam
2. From-name, reply-to, and footer consistent across all templates
3. Toggle OFF = zero sends (regression check)

### Phase 14: Reliable Reminders

**Goal:** Reminder emails survive missed cron runs — at-least-once delivery
replaces the fragile 24h BETWEEN windows (D017 revisit).

**Requirements:** MAIL-02

**Scope:**
- Schema: track `last_reminder_sent_at` per patient per reminder feature
  (design decision in-phase: columns vs tracking table)
- Rewrite cron functions: "past window AND not yet sent" instead of BETWEEN
- Migration applied to live DB; `schema.sql` kept in exact sync

**Success criteria:**
1. Missed-cron catch-up: an overdue patient with no recorded send receives
   exactly one email on the next run
2. No duplicate reminders on normal consecutive runs
3. `schema.sql` matches live DB after migration

## Requirement Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| MAIL-01 | 13 | Pending |
| MAIL-02 | 14 | Pending |
| MAIL-03 | 13 | Pending |
| MAIL-04 | 12 | Pending |

## Phase Numbering

Phases 1–11 consumed by v1.0 (1–6) and v1.1 (7–11) under the old slice
structure. v1.2 continues at 12–14.

## Context Loss Note

Detailed slice plans and verification records for v1.0/v1.1 lived in `~/.gsd/`
(GSD-3) and were deleted during malware remediation on 2026-07-06. The shipped
code, git history, CLAUDE.md, and `milestones/` archives are the surviving
record. All planning artifacts are now committed in-repo.
