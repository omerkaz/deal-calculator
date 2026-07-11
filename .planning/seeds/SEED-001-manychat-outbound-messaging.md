---
created: 2026-07-11
planted_during: v1.2 scoping (new-milestone)
trigger_when: scoping a milestone that touches patient communication, reminders, or follow-ups (v1.3 candidate)
---

# SEED-001: ManyChat outbound messaging (WhatsApp/Instagram)

## Idea

Use the ManyChat API to send lifecycle reminders and follow-ups as WhatsApp/Instagram
messages, complementing (or preceding) the email automations shipped in v1.1/v1.2.

## Why This Matters

- Patients live in IG DM / WhatsApp — that's the acquisition channel (Instagram →
  ManyChat → WhatsApp). Open rates there will beat email for this audience.
- We already store `manychat_id` per patient (unique, webhook-upserted), so the
  subscriber linkage exists — no new data model needed.
- API key obtained 2026-07-11, verified against `GET /fb/page/getInfo`:
  account "Huseyin Ajuz", `is_pro: true` (Pro is required for API sends).
  Stored as `MANYCHAT_API_KEY` in `~/.secrets` (never commit).

## Constraints to Research When Surfaced

- Messenger/Instagram 24-hour messaging window rules — sends outside the window
  need message tags or a subscriber-initiated flow.
- WhatsApp may require pre-approved template messages.
- API surface: https://api.manychat.com/swagger (sending: `/fb/sending/sendContent`,
  flows: `/fb/sending/sendFlow`; custom fields, tags).
- Sends would originate from Edge Functions (Deno, fetch-only) or pg_cron via
  net.http_post — same architecture as send-email.
- Opt-in toggles in practitioner_settings, consistent with the 7 email toggles.
