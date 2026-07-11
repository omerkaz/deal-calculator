# Hüseyin Ajuz Patient CRM

> Reconstructed 2026-07-06 after loss of GSD-3 state (`~/.gsd/` deleted during
> malware remediation). Sources: CLAUDE.md, git history, live Supabase project,
> and verified hardening-session evidence. Planning docs now live in-repo.

## What This Is

Single-user patient management CRM for Hüseyin Ajuz, a trichologist (hair loss
consultant) running an online practice via Instagram → ManyChat → WhatsApp.
Replaces manual Google Drive / DM tracking with structured lifecycle
management, payment recording, and automated email workflows.

## Core Value

Hüseyin can see every patient's lifecycle state at a glance and never loses a
lead or forgets a follow-up — the pipeline is the practice.

## Business Context

- **Customer**: Hüseyin Ajuz (sole practitioner); patients are consumers of his programme
- **Revenue model**: Paid consultation packages, manually recorded payments (no PSP integration)
- **Success metric**: Active clients in treatment states; zero dropped leads
- **Strategy notes**: Patient data is sensitive medical information — privacy first

## Current Milestone: v1.2 Deliverability

**Goal:** Automation emails reach real patients from a verified sender identity (`mrhus@huseyinacuz.com` via Resend), reliably.

**Target features:**
- Custom sending domain `huseyinacuz.com` verified on Resend (SPF/DKIM via GoDaddy DNS) + sender switch in `send-email`
- `last_reminder_sent_at` at-least-once reminder delivery (D017 revisit)
- Sender identity polish: from-name, reply-to, email footer
- Bonus: add missing Google Workspace SPF record on `huseyinacuz.com` (regular mail currently unprotected)

**Key context:** Both domains (`huseyinajuz.com` site, `huseyinacuz.com` email) are on GoDaddy DNS — Netlify only serves the site. GoDaddy access confirmed 2026-07-11. `huseyinacuz.com` mail is Google Workspace (`smtp.google.com` MX). CAL-01 and DOC-01 deferred to v1.3 (no spec / no protocol template yet).

## Requirements

### Validated

- ✓ Patient CRUD with search/filter and lifecycle state machine (9 states) — v1.0
- ✓ Kanban pipeline view of all lifecycle stages — v1.0
- ✓ Payment recording with derived paid/partial/unpaid status — v1.0
- ✓ Notes + file attachments (Supabase Storage, signed URLs) — v1.0
- ✓ ManyChat webhook → lead upsert (idempotent by manychat_id) — v1.0
- ✓ Email automation: welcome, lifecycle reminders, lead follow-up Day 3/7/12, auto-cold — v1.1
- ✓ Settings page with 7 opt-in email toggles (practitioner_settings) — v1.1
- ✓ Auth (email/password, session persistence, RequireAuth guard) — v1.0

### Active (v1.2)

- [ ] MAIL-01: Custom email domain + SPF/DKIM (Resend) — **critical path: sandbox sender
      `onboarding@resend.dev` cannot email real patients**
- [ ] MAIL-02: `last_reminder_sent_at` at-least-once reminder delivery (D017 revisit)

### Deferred to v1.3

- R013 / CAL-01: Calendar / appointment integration — no specification yet; needs discuss session with Hüseyin
- R014 / DOC-01: PDF protocol delivery/export — no protocol template exists; blocked on content from Hüseyin

### Out of Scope

- PayPal/Stripe API integration — volume too low to justify (D004)
- Mobile app — Phase 3 territory
- SaaS multi-tenant — Phase 4 territory
- Landing page redesign (R016) — deferred to a later milestone (M004 in old numbering)

## Context

- React 19 + TypeScript ~6.0 (`erasableSyntaxOnly` — no enums) + Vite 8 + Tailwind v4 (`@theme` in app.css, no config file)
- Supabase hosted (`hbhepcucokwlagqygwrz`, ap-south-1): Postgres + Auth + Edge Functions (Deno) + Storage + Vault + pg_cron/pg_net
- 5 tables (patients, patient_notes, patient_attachments, payments, practitioner_settings), all RLS
- 2 Edge Functions live: `manychat-webhook` (v5), `send-email` (v2)
- 7 pg_cron jobs: lifecycle reminders 08:00 UTC, lead follow-ups 09:00 UTC, auto-cold 10:00 UTC
- Full details: CLAUDE.md (project root)

## Constraints

- **Tech stack**: Edge Functions are Deno — `fetch()` only, no npm SDKs (D012)
- **Privacy**: patient data is medical — RLS on every table, no third-party analytics
- **Email**: Resend via fetch; sender is sandbox subdomain until custom domain ships
- **Solo user**: single practitioner — `practitioner_settings` single row is the practitioner registry

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| D004: Manual payment entry (no PayPal API) | Volume too low | ✓ Good |
| D006: `as const` arrays, no enums | `erasableSyntaxOnly` tsconfig | ✓ Good |
| D007: `{ data, error }` returns, explicit userId | Testability, consistency | ✓ Good |
| D008: Null package_type → any payment = paid | No partial without target price | ✓ Good |
| D009: Fetch all payments once, group client-side | Avoids N+1 | ✓ Good |
| D010: Upsert by `manychat_id` (idempotent webhook) | ManyChat may re-trigger | ✓ Good |
| D012: Resend via fetch() from Edge Functions | Deno runtime, no npm | ✓ Good |
| D013: pg_cron + pg_net for scheduling | All within Supabase | ✓ Good |
| D014: Single-row settings table per practitioner | Simple, RLS-safe | ✓ Good |
| D015 (hardening): Edge Functions resolve practitioner from settings row when env unset | Env var was never set; settings row is natural registry | ✓ Good |
| D016 (hardening): Functions URL + secrets read from Vault, never GUCs | GUCs cannot be set on hosted Supabase | ✓ Good |
| D017 (hardening): Reminder crons use 24h BETWEEN windows | One reminder per patient per feature; accepted missed-cron gap | ⚠️ Revisit if volume grows (`last_reminder_sent_at`) |
| D018 (hardening): auto-cold at 10:00, after day-12 email at 09:00 | "Last chance" email must precede cold transition | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-11 — milestone v1.2 Deliverability started*
