# Phase 13: Verified Sender Identity — Plan

**Created:** 2026-07-19
**Requirements:** MAIL-01, MAIL-03
**Depends on:** Phase 12 (domain verified, API key confirmed)

## Goal

Every automation email sends from `"Hüseyin Ajuz" <mrhus@huseyinacuz.com>` with
`reply_to`, a consistent professional footer, and passes SPF/DKIM. Toggle-OFF
regression still returns `{ skipped: true }`.

## Architecture Decision

**Footer injection at the Edge Function chokepoint** (not in 7 templates):
- The `send-email` function appends a standard footer to `html` before calling
  Resend. This ensures ALL emails — current and future — get the footer
  automatically without touching templates.
- Existing template sign-offs (`Best,<br>Hüseyin Ajuz` / `Warm regards,<br>
  Hüseyin Ajuz`) will be **removed from templates** since the footer provides
  the professional sign-off. This avoids double-signature.

## Tasks

### T1: Update send-email Edge Function (sender + reply-to + footer)

**File:** `supabase/functions/send-email/index.ts`

Changes:
1. Change `from` field from `"Hüseyin Ajuz <onboarding@resend.dev>"` to
   `"Hüseyin Ajuz <mrhus@huseyinacuz.com>"`
2. Add `reply_to: "mrhus@huseyinacuz.com"` to Resend payload
3. Define a `FOOTER_HTML` constant with professional sign-off + branding
4. Append footer to `html` before sending: `html: html.trim() + FOOTER_HTML`

Footer design (simple, professional):
```html
<hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0 16px">
<p style="font-size:13px;color:#7a756e;margin:0">
  Hüseyin Ajuz · Hair Loss Specialist<br>
  <a href="mailto:mrhus@huseyinacuz.com" style="color:#2A9D8F">mrhus@huseyinacuz.com</a>
</p>
```

**Verification:** `npx tsc -b` (not applicable for Deno), manual code review.

### T2: Remove sign-offs from templates (avoid double-signature)

**Files:**
- `src/lib/email.ts` — welcome email + 3 lifecycle templates
- `supabase/schema.sql` — 6 cron function templates

Remove the trailing `<p>Warm regards,<br>Hüseyin Ajuz</p>` and
`<p>Best,<br>Hüseyin Ajuz</p>` from all templates since the Edge Function
footer now handles the sign-off.

**Verification:** `npx tsc -b` for TS files; SQL syntax checked by visual inspection.

### T3: Deploy send-email v3

```bash
supabase functions deploy send-email --project-ref hbhepcucokwlagqygwrz
```

**Verification:** Deployment succeeds (exit 0, no errors).

### T4: Update schema.sql cron functions on live DB

Apply the template changes (sign-off removal) to the live database via SQL
execution, then confirm `schema.sql` matches live.

**Verification:** Functions re-created without errors.

### T5: End-to-end real-inbox test (checkpoint)

For each of the 7 features:
1. Temporarily enable the toggle
2. Trigger a send (browser for welcome; SQL call for cron functions)
3. Verify delivery to real inbox (SPF/DKIM pass, not spam, correct From/Reply-To/footer)
4. Disable the toggle

**⚠️ This task requires human verification of email headers. Checkpoint to
orchestrator before attempting — real inbox checks need a human or dev-browser.**

### T6: Toggle-OFF regression test

With all 7 toggles OFF, invoke send-email for each feature → confirm
`{ skipped: true, reason: "feature disabled" }` response.

**Verification:** 7 curl calls, all return `skipped: true`.

### T7: Commit + STATE.md update

- Atomic commits per logical change
- Update STATE.md: Phase 13 → Done, MAIL-01 + MAIL-03 → Done
- Write SUMMARY.md

## Commit Plan

| Commit | Scope | Description |
|--------|-------|-------------|
| 1 | feat(email) | send-email v3: verified sender, reply-to, footer injection |
| 2 | refactor(email) | remove template sign-offs (footer handles it) |
| 3 | docs(13) | phase 13 plan |

## Risk Assessment

- **Low risk:** Domain already verified, API key confirmed to own the domain.
  This is purely a code change + deploy.
- **Footer injection at Edge Function level:** Future features automatically
  get the footer. No template drift possible.
- **No schema changes** needed — only function body updates in schema.sql.

## Success Criteria (from ROADMAP)

1. ✅ Each of 7 email features delivers to real inbox — SPF/DKIM pass, not spam
2. ✅ From-name, reply-to, and footer consistent across all templates
3. ✅ Toggle OFF = zero sends (regression check)
