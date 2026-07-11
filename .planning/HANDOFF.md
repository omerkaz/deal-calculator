---
status: v1.2_phase_12_in_progress
last_updated: 2026-07-11
next_action: enter DNS records in GoDaddy (waiting on Hüseyin's credentials); code-only work (Phase 14 / Phase 13 prep) can start in parallel
---

# Session Handoff — Hüseyin Ajuz Patient CRM

Boot order for a fresh session: read `CLAUDE.md` → this file → `.planning/STATE.md` → `.planning/ROADMAP.md`.

<current_state>
Milestone **v1.2 Deliverability** scoped and roadmap approved (2026-07-11).
3 phases: 12 (Domain & DNS Verification — IN PROGRESS), 13 (Verified Sender
Identity), 14 (Reliable Reminders). Requirements MAIL-01..04 committed.
Phase 12 is mid-execution via dev-browser; blocked on GoDaddy credentials
from Hüseyin. Phase 14 and Phase 13 code prep are DNS-independent and can
proceed anytime.
</current_state>

<completed_work>
**v1.2 scoping (2026-07-11)** — GSD new-milestone run inline (pi harness, text
mode, no subagents). Commits: 9949e32 (PROJECT/STATE), 90f412c (REQUIREMENTS),
e79b989 (ROADMAP). Scope: MAIL-01 domain+SPF/DKIM (critical path), MAIL-02
at-least-once reminders, MAIL-03 sender identity, MAIL-04 Google SPF fix.
CAL-01/DOC-01 deferred to v1.3 (no spec / no template). SEED-001 planted:
ManyChat outbound messaging (API key verified, Pro account).

**Phase 12 progress:**
- Resend: domain `huseyinacuz.com` ADDED (region eu-west-1, domain ID
  `07751e08-b1f2-4756-b62b-684565b08eb5`), status pending verification
- All 4 DNS record values captured — see Notion doc "Resend Account & Email
  Sending Setup" (Document Hub) or ROADMAP.md Phase 12
- GoDaddy login page open in dev-browser tab `godaddy`; Resend tab `resend`

**Notion integration (2026-07-11)** — kanban board + Document Hub wired via
REST API (no MCP; pi-native). Project skill `.pi/skills/ajuz-crm-board/`
(list/show/add/move/append/archive; commits 3c62b5f, 05a9bc5). Board fully
mirrors planning state: MAIL cards phase-tagged, Scope card Done, milestone
cards in Done column. Docs live in Document Hub DB (NOT the board):
"Domains, DNS & Email Infrastructure" + "Resend Account & Email Sending Setup".
</completed_work>

<remaining_work>
**Phase 12 (blocked on Hüseyin's GoDaddy creds):**
1. Log into GoDaddy (tab open), add 4 records to `huseyinacuz.com`:
   DKIM TXT `resend._domainkey`, MX `send` (prio 10), SPF TXT `send`,
   Google SPF TXT `@` — exact values in Notion Resend doc / Resend dashboard
2. NEVER add Resend's "Enable Receiving" MX (breaks Google Workspace mail)
3. Verify propagation via dig, click Verify in Resend, wait for green
4. API key ownership check: with Vault RESEND_API_KEY, GET
   https://api.resend.com/domains — if huseyinacuz.com listed, key belongs to
   team "atomicmail" ✓; else create new key in that team + update Vault secret

**Phase 14 (DNS-independent, can start now):** MAIL-02 — design
`last_reminder_sent_at` tracking (columns vs table), rewrite 3 reminder cron
functions from 24h BETWEEN to "past window AND not sent", migration to live DB,
keep schema.sql in exact sync. Use GSD plan-phase or execute inline.

**Phase 13 (code prep now, deploy after Phase 12):** send-email v3 — sender
`"Hüseyin Ajuz" <mrhus@huseyinacuz.com>`, reply-to, consistent footer across
7 templates, end-to-end inbox test for all 7 features, toggle regression.

**Housekeeping:** ESLint still not wired; GitHub remote still misnamed
`deal-calculator`; 3 consistency warnings (phase dirs 12-14 not on disk —
expected until plan-phase runs).
</remaining_work>

<decisions_made>
- v1.2 = lean Deliverability only; CAL/DOC/MSG/WEB → v1.3 "Patient
  Communication & Scheduling"
- Sender: mrhus@huseyinacuz.com — his real Google Workspace mailbox domain
  (NOT the site domain huseyinajuz.com). Both domains GoDaddy-registered.
- Resend region eu-west-1 (closest to TR/EU patients)
- Manual DNS entry over Resend auto-configure (avoids receiving-MX risk)
- MAIL-01 traceability → Phase 13 (validated there; Phase 12 is groundwork)
- Docs → Notion Document Hub; work items → kanban board (don't mix)
</decisions_made>

<operational_notes>
- `~/.secrets` (sourced by .zshrc): NOTION_API_KEY (integration "pi-agent",
  workspace HuseyinAjuz-CRM), MANYCHAT_API_KEY (Pro account). Never commit.
- Notion IDs: board DB `8b4eb459-1241-8394-8bba-81715aee14b6`, Document Hub DB
  `39aeb459-1241-8062-afec-e7c923b5964c`
- Board CLI: `node .pi/skills/ajuz-crm-board/scripts/board.js <cmd>`
- ⚠️ `~/.claude/skills-vault/` is GONE (malware remediation) — the supa.sh
  helper from old notes no longer exists. Supabase access needs `supabase login`
  CLI or the skill at ~/.claude/skills/supabase.
- Resend login: technical.huseyin.acuz@atomicmail.io, team "atomicmail"
- dev-browser: `node ~/.claude/skills/dev-browser/native/cli.cjs` (db not on
  PATH); named tabs `resend`, `godaddy`; resize screenshots before reading
- Auth user: mrhus@huseyinacuz.com / UUID a0e60f0f-77f9-417f-9c74-9aa4c285cf6b
- Supabase project: hbhepcucokwlagqygwrz; schema.sql must match live DB exactly
- GSD tools: `node ~/.claude/gsd-core/bin/gsd-tools.cjs <cmd>`; workflows in
  ~/.claude/gsd-core/workflows/; this harness = text mode, inline (no subagents)
- grep is aliased to rg in this shell — flags differ from GNU grep
</operational_notes>
