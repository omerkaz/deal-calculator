---
name: ajuz-crm-board
description: Manage the Hüseyin Ajuz CRM Notion kanban board (this project only) — list cards by column, create cards, move cards between statuses, append notes, archive. Use when asked to update the Notion board, sync planning state to Notion, track milestone/requirement cards, or check what's on the board. Triggers - "notion", "kanban", "board", "move card", "add card".
compatibility: Requires Node 18+ and NOTION_API_KEY (env or ~/.secrets). Project-specific — targets one hardcoded Notion database.
---

# Notion Board (Hüseyin Ajuz CRM)

CLI for the project's Notion kanban board (database `8b4eb459-1241-8394-8bba-81715aee14b6`, workspace **HuseyinAjuz-CRM**, integration **pi-agent**). Plain Notion REST API — no MCP.

**Auth:** reads `NOTION_API_KEY` from env, falls back to `~/.secrets`. No setup needed if the token is saved there.

## Usage

All commands run from the repo root:

```bash
node .pi/skills/ajuz-crm-board/scripts/board.js <command>
```

```bash
# List all cards grouped by column (or one column)
node .pi/skills/ajuz-crm-board/scripts/board.js list
node .pi/skills/ajuz-crm-board/scripts/board.js list --status "Not started"

# Show a card's properties + body (name matched by substring, must be unique)
node .pi/skills/ajuz-crm-board/scripts/board.js show "MAIL-01"

# Create a card
node .pi/skills/ajuz-crm-board/scripts/board.js add "MAIL-03: Bounce handling" \
  --status "Not started" --team Engineering --keywords "v1.2,Email" \
  --body "Handle Resend bounce webhooks."

# Move a card between columns
node .pi/skills/ajuz-crm-board/scripts/board.js move "MAIL-01" --status "In development"

# Append a progress note to a card body
node .pi/skills/ajuz-crm-board/scripts/board.js append "MAIL-01" --body "DNS records added, awaiting verification."

# Archive a card (reversible via Notion Trash)
node .pi/skills/ajuz-crm-board/scripts/board.js archive "Chore: Wire ESLint"
```

## Board schema

| Property | Type | Values |
|---|---|---|
| Status (columns) | status | `Not started`, `In development`, `Testing`, `Reviewing`, `Done` |
| Team | select | `Engineering`, `Design` |
| AI keywords | multi_select | free-form tags: `v1.2`, `v1.3`, `Email`, `Chore`, `Shipped`, … |
| Deadline | date | unused so far |
| Assign | people | unused so far |

## Conventions

- **Card naming:** open work uses requirement IDs (`MAIL-01: …`, `CAL-01: …`); chores use `Chore: …`; shipped milestones are grouped cards (`v1.0 — …`) with requirement checklists in the body.
- **Source of truth:** `.planning/` in-repo remains authoritative; the board mirrors it. When planning docs change milestone/requirement state, update the matching card (`move`, `append`).
- **Name matching:** `show`/`move`/`append`/`archive` match by case-insensitive substring and fail loudly on ambiguity — use a unique fragment like the requirement ID.
- New multi_select keyword values are auto-created by Notion; keep tags consistent with existing ones (run `list` first to see them).
