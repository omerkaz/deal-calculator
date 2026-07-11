# Requirements: Hüseyin Ajuz Patient CRM

**Defined:** 2026-07-06 (reconstructed from CLAUDE.md + shipped behavior after GSD-3 state loss)
**Core Value:** Every patient's lifecycle state visible at a glance; no dropped leads or forgotten follow-ups.

## Shipped Requirements (v1.0 + v1.1 — validated in production)

### Patients

- [x] **PAT-01**: Patient CRUD with dual-mode form (create/edit)
- [x] **PAT-02**: Search + status/package filters on patient list
- [x] **PAT-03**: 9-state lifecycle machine with constrained transitions and optimistic concurrency
- [x] **PAT-04**: Kanban pipeline view across all lifecycle stages
- [x] **PAT-05**: Timestamped notes, cascade-delete with patient
- [x] **PAT-06**: File attachments via Supabase Storage (signed URLs, 1h expiry)

### Payments

- [x] **PAY-01**: Manual payment recording (amount, currency, method, date, reference)
- [x] **PAY-02**: Derived paid/partial/unpaid status vs PACKAGE_PRICES (computed at read time)
- [x] **PAY-03**: Filterable payments page + dashboard revenue summary

### Automation

- [x] **AUTO-01**: ManyChat webhook upserts leads (idempotent by manychat_id)
- [x] **AUTO-02**: Welcome email on new patient with email (opt-in toggle)
- [x] **AUTO-03**: Lifecycle reminder emails — blood test (14d), week-6 (42d), end review (7d)
- [x] **AUTO-04**: Lead follow-up emails — Day 3 / 7 / 12
- [x] **AUTO-05**: Auto-cold transition for leads stale >12 days
- [x] **AUTO-06**: Settings page with per-feature opt-in toggles (7 features)

### Auth

- [x] **AUTH-01**: Email/password login, redirect to dashboard on success
- [x] **AUTH-02**: Session persists across refresh (INITIAL_SESSION gate)
- [x] **AUTH-03**: RequireAuth layout guard; RLS on all tables

## v1.2 Requirements — Deliverability (scoped 2026-07-11)

### Email Deliverability (MAIL)

- [ ] **MAIL-01**: Automation emails are sent from `mrhus@huseyinacuz.com` —
      domain `huseyinacuz.com` verified on Resend (SPF/DKIM records in GoDaddy DNS),
      `send-email` sender switched, delivery confirmed to a real inbox (not spam)
- [ ] **MAIL-02**: Reminder emails survive missed cron runs — `last_reminder_sent_at`
      tracked per patient/feature; at-least-once delivery replaces 24h BETWEEN windows (D017 revisit)
- [ ] **MAIL-03**: Patient-facing emails have a professional identity — from-name
      "Hüseyin Ajuz", reply-to `mrhus@huseyinacuz.com`, consistent footer across all 7 templates
- [ ] **MAIL-04**: Hüseyin's regular Google Workspace mail is SPF-protected —
      `v=spf1 include:_spf.google.com ~all` TXT added to `huseyinacuz.com`
      (domain currently has NO SPF record)

### Traceability

| Requirement | Phase |
|-------------|-------|
| MAIL-01 | Phase 13 |
| MAIL-02 | Phase 14 |
| MAIL-03 | Phase 13 |
| MAIL-04 | Phase 12 |

## Future Requirements (deferred to v1.3+)

- **CAL-01**: Appointment scheduling integration (Google Calendar or Calendly) —
      no specification yet; needs discuss session with Hüseyin (old R013)
- **DOC-01**: PDF protocol delivery/export — no protocol template exists;
      blocked on content from Hüseyin (old R014)
- **MSG-01**: ManyChat outbound messaging (WhatsApp/IG) — SEED-001; API key
      verified 2026-07-11, Pro account confirmed
- **WEB-01**: Landing page redesign — huseyinajuz.com on Netlify (R016, old M004)

## Out of Scope

- DMARC policy record — optional hardening, ride-along candidate for v1.3
- PayPal/Stripe integration; mobile app; SaaS multi-tenant

---
*Requirement IDs re-keyed by category during GSD 1.6.1 migration; old R### numbers noted where known.*
