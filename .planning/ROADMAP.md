# Roadmap: Hüseyin Ajuz Patient CRM

**Migrated:** 2026-07-06 from GSD-3 milestone structure (M001/M002 → v1.0/v1.1)

## Milestones

- ✅ **v1.0 — Core Patient Management CRM** (was M001) — SHIPPED. 6 slices: schema+auth, patient CRUD, lifecycle machine, payments, notes/files, dashboard+pipeline. Archived: `milestones/v1.0-core-crm.md`
- ✅ **v1.1 — Automation & Polish** (was M002) — SHIPPED + hardened. 5 slices: polish/deploy, Resend+settings, welcome email, lifecycle reminders, lead follow-up. Post-ship hardening pass (2026-07-06) fixed 6 broken cron functions, missing env config, and verified the email chain end-to-end in production. Archived: `milestones/v1.1-automation-polish.md`
- 🔜 **v1.2 — Deliverability & Scheduling** (was M003, unscoped) — NOT STARTED. Candidate scope, in priority order:
  1. Custom email domain + SPF/DKIM on Resend (**critical path** — sandbox sender blocks real patient emails)
  2. Calendar/appointment integration (CAL-01)
  3. PDF protocol export (DOC-01)
  4. Optional: `last_reminder_sent_at` at-least-once reminders (MAIL-02)
- 💤 **v1.3 — Web Presence** (was M004) — landing page redesign (WEB-01)

## Phase Numbering

Phases 1–11 are considered consumed by v1.0 (phases 1–6) and v1.1 (phases 7–11)
under the old slice structure. The next planned phase starts at 12 when v1.2 is
scoped via the new-milestone workflow.

## Context Loss Note

Detailed slice plans, research docs, and verification records for v1.0/v1.1
lived in `~/.gsd/` (GSD-3) and were deleted during malware remediation on
2026-07-06. The shipped code, git history, CLAUDE.md, and the archive summaries
in `milestones/` are the surviving record. All planning artifacts are now
committed in-repo to prevent recurrence.
