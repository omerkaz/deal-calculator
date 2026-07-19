---
status: v1.2_phase_16_next
last_updated: 2026-07-19
next_action: Discuss/plan Phase 16 (Email Design System — unblocked). Phase 15 still blocked on Hüseyin's input. PRICE-01 is DONE.
---

# Session Handoff — Hüseyin Ajuz Patient CRM

Boot order for a fresh session: read `CLAUDE.md` → this file → `.planning/STATE.md` → `.planning/ROADMAP.md`.

<current_state>
Milestone **v1.2 Deliverability & Landing Page Drip** — 4 of 6 phases shipped
(2026-07-19). Phase 12 (Domain & DNS) DONE. Phase 13 (Verified Sender
Identity) DONE. Phase 14 (Reliable Reminders) DONE. Phase 17 (Package Price
Management) DONE: prices editable in Settings, agreed_price snapshot on
package assignment, cents-based derivation, 26 tests pass, migration live.
Phase 15 (Landing Page Drip) blocked on Hüseyin's input.
Phase 16 (Email Design System) UNBLOCKED — next-eligible.
MAIL-01 ✓ MAIL-02 ✓ MAIL-03 ✓ MAIL-04 ✓ PRICE-01 ✓; MAIL-05 lands in Phase 16.
Repo not yet pushed (8 commits ahead of origin).
</current_state>

<completed_work>
**2026-07-19 session — Phase 17 execution (PRICE-01, single worker agent):**

- **Phase 17 EXECUTED + CLOSED** (plan+execute `3b17631..280b4d2`, PRICE-01 ✓).
  Package prices moved from hard-coded `PACKAGE_PRICES` constant to editable
  `practitioner_settings` columns (D014). `patients.agreed_price` snapshotted
  at package assignment; derivation uses cents-based integer comparison.
  Settings page: Package Prices card (3 inputs + Save). PatientFormPage:
  fresh-fetch at submit time (A2), editable for custom deals, disabled when
  settings unavailable. DB CHECKs enforce invariants (package↔price sync,
  prices > 0). Migration applied to live DB (0 patients → no backfill needed).
  14 new test assertions + 12 existing = 26 pass. tsc clean.

**2026-07-19 session — Phase 13 execution (single worker agent + orchestrator):**

- **Phase 13 EXECUTED + CLOSED** (plan `f2e75b1`; feat `75ee9bc`; docs
  `ffc61df`, MAIL-01 ✓ MAIL-03 ✓). send-email Edge Function v3: sender
  `"Hüseyin Ajuz" <mrhus@huseyinacuz.com>`, `reply_to`, HTML+text footer
  injection at chokepoint (before `</body>` or appended). Removed inline
  sign-offs from all 7 templates (4 in `src/lib/email.ts`, 6 in
  `schema.sql`). Deployed v3 + applied 6 cron function updates to live DB.
  Toggle-OFF regression: 7/7 `skipped:true`. Real-inbox: 7/7 sent to
  `omerkazfd@gmail.com` (Gmail) — human confirmed all delivered, not spam.
  Eligible-patient count verified 0 before any toggle flip (blast-safe).
- **Phase 16 added** (Email Design System, MAIL-05): branded HTML wrapper,
  design-token alignment, email-client compat, dark-mode. Unblocked now;
  Phase 15 drip templates depend on it.

**2026-07-18 session — parallel tmux orchestration (2 opus-4.6 agents +
orchestrator):**

- **Phase 12 EXECUTED + CLOSED** (closeout `5320f6b`, MAIL-04 ✓). Browser
  agent added 4 DNS records in GoDaddy: DKIM TXT `resend._domainkey`, MX
  `send` → `feedback-smtp.eu-west-1.amazonses.com` prio 10, TXT `send` SPF
  (amazonses), TXT `@` Google SPF. Add-only (zone 12→16 records), Google MX
  `1 smtp.google.com` untouched, no receiving-MX. `huseyinacuz.com` VERIFIED
  in Resend (green, "ready to send emails"). dig-verified at authoritative NS
  by orchestrator. API key ownership check PASSED: Vault `RESEND_API_KEY` →
  GET /domains lists huseyinacuz.com verified. GoDaddy prompted SMS 2FA on
  EVERY save (Hüseyin's phone ***11); Hüseyin entered codes directly in the
  browser — 3 codes total (last 2 records batched into one save).
- **Phase 14 PLANNED + EXECUTED** (plans `af74367`; execution
  `99da743..f3b9074`, MAIL-02 ✓). `email_send_log` table (RLS, cascade,
  `(patient_id, feature)` index) + all 6 cron functions rewritten from 24h
  BETWEEN windows to `NOT EXISTS` + post-send `INSERT`. Re-engagement guard:
  `sent_at >= COALESCE(state_changed_at, created_at)`. Migration
  `20260718_add_email_send_log.sql` applied to live DB; schema.sql ≡ live DB;
  all 7 toggles still OFF. D017 fragility eliminated. Verified: tsc clean,
  12/12 tests, live DB inspected.
- **DRIP reconcile** (`39379dc`): DRIP-01..05 integrated into ROADMAP as
  Phase 15; milestone renamed "Deliverability & Landing Page Drip".
- **Pushed** `5c489df..5320f6b` → origin/main.
- **Notion board synced:** MAIL-04 + MAIL-02 → Done (with evidence notes),
  MAIL-01 → In development (domain done; sender switch remains), 5 DRIP cards
  created (Phase 15 tagged), Scope card annotated. NEW **Project** select
  property (`CRM` / `Landing Page`) added to the board DB via direct Notion
  API; 20/22 cards assigned (WEB-01, survey-redirect, price-list → Landing
  Page; rest → CRM).

**Earlier (2026-07-11):** v1.2 scoping (`9949e32`, `90f412c`, `e79b989`);
SEED-001 planted (ManyChat outbound, API key verified, Pro); Notion board +
Document Hub wired, project skill `.pi/skills/ajuz-crm-board/`.
</completed_work>

<remaining_work>
**Phase 16 (next, unblocked):** Email Design System (MAIL-05). Branded HTML
wrapper template injected at the send-email chokepoint (extends v3 footer).
Design-token alignment with CRM palette, email-client compat (Outlook
table-based), dark-mode, mobile responsive. Discuss-phase 16 → plan → execute.
Phase 15 drip templates should adopt this design.

**Phase 15 (blocked):** Landing Page Drip — still awaiting Hüseyin's answers:
Day-20 discount (amount/code), email copy approval flow, whether ManyChat
leads get the drip. Then discuss-phase 15 → plan → execute.

**Landing page repo (2026-07-19):** landing lives in a DISTINCT repo —
`github.com/omerkaz/huseyinajuz-landing` (private). Adopted the live
single-file Netlify site as source (`index.html`, pre-processing version
with `data-netlify="true"`); README documents the booking-form fields —
the DRIP-01 webhook contract (name, email, phone, country,
package/selected_package, subject, notes/booking_details, honeypot
bot-field). Netlify continuous deploy LIVE (linked by user 2026-07-19,
verified: 200, byte-identical, booking form processed — submissions
intact). All landing edits now go repo → push main → auto-deploy; no env
vars needed (static, Netlify Forms zero-config, GA ID public). CORRECTION
2026-07-19: transformation-*.jpg / your-photo.jpg refs are commented-out
author placeholders; real images are inlined base64 — nothing broken. Board card: "Chore: Landing page repo + Netlify git
wiring" (In development).

**Board follow-ups (synced 2026-07-19, all 23 cards have Project):**
- RESOLVED: "Country code will be mandatory" + "All clients mails should be
  separated" → both Landing Page (user confirmed; changes already made on
  the landing page externally). Useful DRIP-01 spec input: landing form now
  has mandatory country code and per-client emails.
- **PRICE-01 DONE** (Phase 17 shipped 2026-07-19): prices editable in
  Settings, agreed_price snapshot on package assignment, historical statuses
  protected by per-patient price, cents-based derivation, 26 tests pass.
- "Landing page's form should redirect to a survey" — needs spec; design
  together with DRIP-01 webhook so redirect + lead capture don't conflict.

**Housekeeping:** ESLint not wired; GitHub remote misnamed `deal-calculator`;
optional `_dmarc` TXT deferred to v1.3; `src/lib/email.ts` welcome template
text fix rides next frontend deploy.
</remaining_work>

<decisions_made>
- `email_send_log` tracking TABLE over per-feature columns — scales to DRIP
  (Phase 15) without schema changes, audit trail, natural re-engagement
  handling (2026-07-18)
- DMARC record: not added; deferred to v1.3 ride-along
- Notion Project property: DRIP-01 classified CRM (implementation is
  Supabase-side even though trigger is the landing form)
- Sender: mrhus@huseyinacuz.com — real Google Workspace mailbox domain (NOT
  site domain huseyinajuz.com). Both GoDaddy-registered.
- Resend region eu-west-1; manual DNS entry over auto-configure (receiving-MX
  risk); MAIL-01 validated in Phase 13 (Phase 12 was groundwork)
- Docs → Notion Document Hub; work items → kanban board (don't mix)
- v1.3 candidates unchanged: CAL-01, DOC-01, MSG-01/SEED-001, WEB-01, DMARC
- Footer injection at Edge Function chokepoint (not in 7 templates) —
  guarantees all current + future emails get consistent branding (2026-07-19)
- Phase 16 (Email Design System) positioned before Phase 15 — drip templates
  adopt the design system rather than shipping unstyled then retrofitting
- Prices on practitioner_settings (not a new table) — D014 single-row pattern;
  3 fixed PACKAGE_TYPES don’t warrant a join table (2026-07-19)
- agreed_price snapshotted at assignment, not derived at read time — decouples
  historical status from future price changes (2026-07-19)
- Cents-based integer comparison in payment derivation — avoids floating-point
  rounding errors on split payments (2026-07-19)
</decisions_made>

<operational_notes>
- `~/.secrets` (sourced by .zshrc): NOTION_API_KEY (integration "pi-agent",
  workspace HuseyinAjuz-CRM), MANYCHAT_API_KEY (Pro). Never commit.
- Notion IDs: board DB `8b4eb459-1241-8394-8bba-81715aee14b6`, Document Hub
  DB `39aeb459-1241-8062-afec-e7c923b5964c`
- Board CLI: `node .pi/skills/ajuz-crm-board/scripts/board.js <cmd>` — does
  NOT manage the Project property (set via direct API; pattern in this
  session's `/tmp/set-project.mjs`, ephemeral). Consider extending board.js.
- GoDaddy DNS: SMS 2FA fires on EVERY record save (Hüseyin's phone ***11);
  batching multiple records into one save reduces code count. Add-only rule
  stands: never touch Google MX, never add Resend receiving-MX.
- Resend login: technical.huseyin.acuz@atomicmail.io, team "atomicmail";
  domain ID `07751e08-b1f2-4756-b62b-684565b08eb5` (eu-west-1)
- dev-browser: `node ~/.claude/skills/dev-browser/native/cli.cjs` (`db` not
  on PATH); resize screenshots before reading
- Auth user: mrhus@huseyinacuz.com / UUID a0e60f0f-77f9-417f-9c74-9aa4c285cf6b
- Supabase project: hbhepcucokwlagqygwrz; schema.sql must match live DB
  exactly; supabase access via `supabase login` CLI or
  ~/.claude/skills/supabase (⚠️ old skills-vault supa.sh is GONE)
- GSD tools: `node ~/.claude/gsd-core/bin/gsd-tools.cjs <cmd>`; workflows in
  ~/.claude/gsd-core/workflows/. tmux-agent orchestration (briefs in /tmp,
  tmux-bridge read-act-read, single `.planning/` writer) worked well this
  session — reusable pattern.
- grep is aliased to rg in this shell — flags differ from GNU grep
</operational_notes>
