# Roadmap: Hüseyin Ajuz Patient CRM

**Migrated:** 2026-07-06 from GSD-3 milestone structure (M001/M002 → v1.0/v1.1)
**Current milestone:** v1.2 Deliverability & Landing Page Drip (scoped 2026-07-11, DRIP added 2026-07-15)

## Milestones

- ✅ **v1.0 — Core Patient Management CRM** (was M001) — SHIPPED. 6 slices:
  schema+auth, patient CRUD, lifecycle machine, payments, notes/files,
  dashboard+pipeline. Archived: `milestones/v1.0-core-crm.md`
- ✅ **v1.1 — Automation & Polish** (was M002) — SHIPPED + hardened. 5 slices:
  polish/deploy, Resend+settings, welcome email, lifecycle reminders, lead
  follow-up. Post-ship hardening pass (2026-07-06) fixed 6 broken cron
  functions and verified the email chain end-to-end in production.
  Archived: `milestones/v1.1-automation-polish.md`
- 🔄 **v1.2 — Deliverability & Landing Page Drip** — IN PROGRESS. Phases 12–15 below.
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

### Phase 15: Landing Page Drip Sequence

**Goal:** Landing page form submissions automatically enter the CRM as leads
and receive a 4-step email drip (Day 3 / 7 / 11 / 20) with a discount offer
on the final step — stopping when the lead advances past `lead` state.

**Requirements:** DRIP-01, DRIP-02, DRIP-03, DRIP-04, DRIP-05

**Dependencies:** Phase 13 (MAIL-01 — can't email from sandbox), existing
pg_cron infrastructure (AUTO-04)

**Scope:**
- Edge Function: Netlify form webhook → patient upsert with `source: 'landing_page'`
  (idempotent by email, analogous to manychat-webhook)
- 4 email templates: Day 3, Day 7, Day 11, Day 20 (discount/urgency CTA)
- pg_cron function(s): timing from `created_at`, skip if `lifecycle_state != 'lead'`
- Schema: `source` column on patients (or equivalent), `drip_day*_enabled`
  toggles on `practitioner_settings`
- Settings page: 4 new toggles for drip steps (all OFF by default)

**Open questions (need Hüseyin's input):**
- Day 20 discount details (percentage, fixed amount, or promo code)
- Email copy/tone for each step — draft for approval?
- Should ManyChat leads also get this drip, or landing page only?

**Success criteria:**
1. Netlify form → Edge Function → patient created with `source: 'landing_page'`
2. Each drip step fires on schedule for `lead`-state landing page patients
3. Drip stops when lead transitions to `contacted` or later
4. Per-step toggles in Settings; all OFF by default
5. Day 20 email has distinct discount/urgency design

### Phase 16: Email Design System

**Goal:** Emails look professionally designed and on-brand — not bare
paragraphs — while staying deliverability-safe across major clients.

**Requirements:** MAIL-05

**Dependencies:** Phase 13 (v3 chokepoint footer is the injection point)

**Scope:**
- Branded HTML wrapper template: header (name/wordmark), content slot, footer
  — injected at the send-email chokepoint (extends the v3 footer pattern)
- Design-token alignment with CRM design system (linen bg, cream surface,
  teal accents, charcoal text) using email-safe approximations; font stacks
  for email clients (DM Serif/Inter won’t load — define safe fallbacks)
- Email-client compatibility: table-based layout for Outlook, dark-mode
  meta/media queries, mobile responsiveness (max-width pattern)
- Plain-text parity maintained (text footer already handled by v3)
- Spam-safety: text/image ratio, no heavy images, keep SPF/DKIM-clean sending
- Applies to existing 7 templates + sets pattern for Phase 15 drip templates

**Positioning:** Unblocked now. Phase 15 drip templates (esp. DRIP-05
“distinct discount/urgency design”) should adopt the Phase 16 design system.

**Success criteria:**
1. All 7 existing emails render with branded wrapper (header + styled footer)
2. Renders correctly in Gmail, Apple Mail, Outlook (table-based fallback)
3. Dark-mode doesn’t break readability
4. SPF/DKIM still pass; spam score unchanged or improved
5. Design tokens documented for Phase 15 drip template authors

## Requirement Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| MAIL-01 | 13 | Done |
| MAIL-02 | 14 | Done |
| MAIL-03 | 13 | Done |
| MAIL-04 | 12 | Done |
| MAIL-05 | 16 | Pending |
| DRIP-01 | 15 | Pending |
| DRIP-02 | 15 | Pending |
| DRIP-03 | 15 | Pending |
| DRIP-04 | 15 | Pending |
| DRIP-05 | 15 | Pending |

## Phase Numbering

Phases 1–11 consumed by v1.0 (1–6) and v1.1 (7–11) under the old slice
structure. v1.2 continues at 12–16.

## Context Loss Note

Detailed slice plans and verification records for v1.0/v1.1 lived in `~/.gsd/`
(GSD-3) and were deleted during malware remediation on 2026-07-06. The shipped
code, git history, CLAUDE.md, and `milestones/` archives are the surviving
record. All planning artifacts are now committed in-repo.
