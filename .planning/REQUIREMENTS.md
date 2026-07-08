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

## Next Milestone Requirements (to be scoped)

### Email Deliverability — critical path

- [ ] **MAIL-01**: Custom sending domain on Resend with SPF/DKIM verified
      (sandbox sender cannot email real patients — blocks all AUTO-02..04 in practice)
- [ ] **MAIL-02**: Optional — `last_reminder_sent_at` for at-least-once reminder delivery

### Calendar (R013 in old numbering)

- [ ] **CAL-01**: Appointment scheduling integration (Google Calendar or Calendly)

### Documents (R014 in old numbering)

- [ ] **DOC-01**: PDF protocol delivery/export for patients

## Deferred (tracked, not scoped)

- **WEB-01**: Landing page redesign — huseyinajuz.com on Netlify (R016, old M004)
- Mobile app; SaaS multi-tenant

---
*Requirement IDs re-keyed by category during GSD 1.6.1 migration; old R### numbers noted where known.*
