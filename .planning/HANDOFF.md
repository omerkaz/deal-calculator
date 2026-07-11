---
status: between_milestones
last_updated: 2026-07-07
next_action: scope v1.2 via GSD 1.6.1 new-milestone workflow
---

# Session Handoff — Hüseyin Ajuz Patient CRM

Boot order for a fresh session: read `CLAUDE.md` → this file → `.planning/STATE.md`.

<current_state>
v1.0 (Core CRM) and v1.1 (Automation & Polish) shipped, hardened, and verified
live on Supabase `hbhepcucokwlagqygwrz`. No active milestone or phase. Repo
`main` in sync with origin. Dev server: tmux `pit-18:app`, http://localhost:5173.
</current_state>

<completed_work>
**Hardening pass (2026-07-06)** — M002 automation had shipped silently broken;
all fixed and verified end-to-end. Full bug/fix table:
`.planning/milestones/v1.1-automation-polish.md`. Highlights:
- Edge Functions (webhook v5, send-email v2) resolve practitioner from
  `practitioner_settings` row; env var was never set (D015)
- 6 cron functions repaired (net.http_post, payloads, Vault URL, 24h windows,
  toggle guards); migration `fix_cron_email_functions` applied
- auto-cold moved to 10:00 UTC (after day-12 email at 09:00)
- Verified: webhook 201 + RLS attribution; cron → Resend `sent:true`;
  login → dashboard → settings in browser; toggle-off = zero dispatches

**GSD migration (2026-07-06/07)** — GSD-3 (`gsd-pi`) + `~/.gsd/` deleted in
malware remediation, unrecoverable. Now on GSD 1.6.1 (`@opengsd/gsd-core`,
`~/.claude/gsd-core/`, npm-current, guard hooks installed). Planning
reconstructed in-repo at `.planning/`; validated (consistency ✓, health ✓).
Milestones renumbered M001→v1.0, M002→v1.1, M003→v1.2, M004→v1.3.
</completed_work>

<remaining_work>
- **Scope v1.2 — Deliverability & Scheduling** (new-milestone workflow):
  1. Custom email domain + SPF/DKIM on Resend — CRITICAL PATH (sandbox sender
     `onboarding@resend.dev` cannot email real patients; all 7 toggles OFF)
  2. Calendar/appointments (CAL-01, old R013)
  3. PDF protocol export (DOC-01, old R014)
  4. Optional: `last_reminder_sent_at` at-least-once reminders (MAIL-02)
- v1.2 scoping doubles as GSD 1.6.1's first full-workflow shakedown
- ESLint still not wired (only remaining v1.0 gap)
- Housekeeping: GitHub remote misnamed `deal-calculator`
</remaining_work>

<decisions_made>
- **Do NOT use `pith`** (pi + tencent/hy3:free) for GSD work — host GSD in a
  trusted, strong-model session. Free-tier models: no patient data, no creds.
- GSD subagent models via `model_profile: balanced` → planner=opus/xhigh,
  executor=sonnet (`gsd-tools resolve-model <agent>`)
- Consolidate-before-build: hardening preceded v1.2 (paid off — 8 production
  bugs found). Same bar applies going forward.
- D015–D018 recorded in CLAUDE.md + `.planning/PROJECT.md`
</decisions_made>

<operational_notes>
- Supabase via `~/.claude/skills-vault/supabase/scripts/supa.sh` (profile
  `huseyinajuz`); deploys via `deploy-helper.sh <ref> <fn> <dir> false`
- Edge Function secrets need `supabase login` (MCP OAuth token lacks
  `edge_functions_secrets_write`); code no longer depends on the missing env var
- Vault secrets (authoritative): WEBHOOK_SECRET, RESEND_API_KEY,
  SUPABASE_FUNCTIONS_URL, PRACTITIONER_USER_ID (correct UUID)
- Auth user: mrhus@huseyinacuz.com / UUID a0e60f0f-77f9-417f-9c74-9aa4c285cf6b
- `supabase/schema.sql` matches live DB exactly — keep it that way
- GSD tools: `node ~/.claude/gsd-core/bin/gsd-tools.cjs <cmd>` or `npx gsd-core`
- grep is aliased to rg in this shell — flags differ from GNU grep
</operational_notes>
