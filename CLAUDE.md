# CLAUDE.md — Hüseyin Ajuz Patient CRM

## What This Is

Single-user patient management CRM for a trichologist (hair loss consultant) who runs an online practice via Instagram → ManyChat → WhatsApp. Replaces manual Google Drive / DM tracking with structured lifecycle management, payment recording, and automated email workflows.

**User:** Hüseyin Ajuz (sole practitioner). Patient data is sensitive medical information.

---

## Tech Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Framework | React | 19 | Functional components, hooks only |
| Language | TypeScript | ~6.0 | `erasableSyntaxOnly: true` — **no enums** |
| Bundler | Vite | 8 | `@vitejs/plugin-react` + `@tailwindcss/vite` |
| Styling | Tailwind CSS | v4 | `@theme` block in `app.css` — **not** `tailwind.config.js` |
| Backend | Supabase | Hosted | Postgres + Auth + Edge Functions + Storage |
| Routing | react-router | v7 | `createBrowserRouter`, layout routes |
| Icons | lucide-react | latest | |
| Edge Functions | Deno runtime | — | `fetch()` only — no npm SDK imports |
| Tests | node:test | built-in | `--experimental-strip-types` for .ts files |

**No ESLint configured yet** — wiring it is part of M002/S01.

---

## Project Structure

```
src/
├── app.css                    # Tailwind v4 @theme block + global styles (grain, vignette)
├── main.tsx                   # Entry: AuthProvider → grain/vignette → RouterProvider
├── vite-env.d.ts
├── types/
│   └── database.ts            # All domain types, as-const arrays, transition map, prices
├── lib/
│   ├── supabase.ts            # Supabase client singleton (anon key, env-gated)
│   ├── patients.ts            # CRUD + search/filter + transitionState (optimistic concurrency)
│   ├── payments.ts            # CRUD + getPaymentSummary (derived status)
│   ├── notes.ts               # CRUD for patient notes
│   ├── attachments.ts         # Upload/download/delete with Storage + rollback
│   ├── phone.ts               # 30 country codes, validation, formatting
│   └── dashboardMetrics.ts    # computeMetrics() pure function + formatUSD
├── context/
│   └── auth.tsx               # AuthProvider + useAuth() hook, INITIAL_SESSION gate
├── routes/
│   └── index.tsx              # createBrowserRouter with RequireAuth layout guard
├── components/
│   ├── ui/                    # Reusable: Button, Card, Input, Select, Textarea, Badge
│   │   └── index.ts           # Barrel file — import from @/components/ui
│   ├── layout/                # AppShell, RequireAuth, Sidebar, Topbar
│   └── patients/              # Domain: FileUpload, NotesList, PatientFilters,
│                              #   PatientStatusBadge, PaymentsList, StateTransitionButton
├── pages/
│   ├── DashboardPage.tsx      # Active clients, pipeline breakdown, revenue
│   ├── DashboardPage.test.ts  # 12 assertions via node:test for business math
│   ├── LoginPage.tsx          # Email/password login
│   ├── PatientsPage.tsx       # List with search + status/package filters
│   ├── PatientFormPage.tsx    # Create + edit (dual-mode via route param)
│   ├── PatientDetailPage.tsx  # Info grid, state transitions, notes, payments, files
│   ├── PipelinePage.tsx       # Kanban columns for 9 lifecycle stages
│   └── PaymentsPage.tsx       # Filterable payment list
supabase/
├── schema.sql                 # Tables, RLS, indexes, trigger
└── functions/
    └── manychat-webhook/
        └── index.ts           # ManyChat → patient upsert (Deno, service-role key)
```

---

## Key Patterns

### 1. `as-const` + Union Types (No Enums)

`erasableSyntaxOnly` is enabled — TypeScript enums are forbidden. Use `as const` arrays with derived types:

```ts
export const LIFECYCLE_STATES = ["lead", "contacted", ...] as const;
export type LifecycleState = (typeof LIFECYCLE_STATES)[number];
```

All domain constants follow this: `LIFECYCLE_STATES`, `PACKAGE_TYPES`, `PAYMENT_METHODS`, `LANGUAGES`.

### 2. Data-Access Return Pattern

Every function in `src/lib/` returns `{ data, error }` with native `Error` objects. Never throws.

```ts
export async function getPatient(id: string): Promise<{ data: Patient | null; error: Error | null }> {
  // ... wraps Supabase error into new Error()
}
```

- `userId` is an explicit parameter where needed — **not** read from auth context
- Collections return `{ data: T[]; error }` (empty array on error, not null)
- Single items return `{ data: T | null; error }`

### 3. Tailwind v4 @theme Block

Design tokens live in `src/app.css` via `@theme { }`. **No `tailwind.config.js` exists.** Use `@theme` CSS variables:

```css
@theme {
  --color-bg: #FAF6F1;
  --color-surface: #FFFDF9;
  --color-teal: #2A9D8F;
  --color-coral: #E76F51;
  --font-heading: "DM Serif Display", Georgia, serif;
  --font-body: "Inter", -apple-system, system-ui, sans-serif;
  --shadow-warm: 0 2px 20px rgba(45, 42, 38, 0.06);
  --radius-card: 14px;
}
```

Use in classes: `bg-surface`, `text-teal`, `shadow-warm`, `rounded-[14px]`, `font-heading`.

### 4. Supabase Row Level Security (RLS)

All tables have RLS enabled. Policies enforce `auth.uid() = created_by` (or `uploaded_by` for attachments). The browser uses the **anon key** with RLS. Edge Functions use the **service-role key** to bypass RLS.

### 5. Lifecycle State Machine

9 states with constrained transitions defined in `VALID_TRANSITIONS` map. `transitionState()` uses **optimistic concurrency**: it adds `.eq("lifecycle_state", currentState)` to the UPDATE so concurrent changes don't silently overwrite.

```
lead → contacted → awaiting_blood_test → active_treatment → week_6_checkin
                                                                    ↓
                                                             end_review ↔ extended_support → completed
Any state → cold (except completed). cold → lead (re-engage).
```

### 6. Payment Status Derivation

Payment status (`paid` / `partial` / `unpaid`) is **computed at read time** from the sum of payment records vs `PACKAGE_PRICES` — no stored status column. When `package_type` is null, any payment = `paid`, no payment = `unpaid`.

### 7. Auth Flow

`AuthProvider` wraps the entire app. `INITIAL_SESSION` event from `onAuthStateChange` gates the loading state — prevents login page flash on refresh. `RequireAuth` layout route redirects to `/login` when no session.

### 8. Path Alias

`@/` maps to `src/` via both `tsconfig.app.json` paths and Vite resolve alias. Always import as `@/lib/patients`, `@/components/ui`, etc.

### 9. Component Import Convention

UI components are exported from `@/components/ui/index.ts` barrel:
```ts
import { Button, Card, Input, Select, Badge } from "@/components/ui";
```

Domain components import directly: `@/components/patients/StateTransitionButton`.

---

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| Linen | `#FAF6F1` | Page background (`bg-bg`) |
| Cream | `#FFFDF9` | Cards, panels (`bg-surface`) |
| Charcoal | `#2D2A26` | Primary text (`text-text`) |
| Teal | `#2A9D8F` | Primary accent, active nav, CTAs (`bg-teal`, `text-teal`) |
| Coral | `#E76F51` | Alerts, danger, cold state (`bg-coral`, `text-coral`) |
| Text secondary | `#7A756E` | Subtle labels (`text-text-secondary`) |
| Text muted | `#A8A29E` | Timestamps, hints (`text-text-muted`) |
| Heading font | DM Serif Display | h1-h6 |
| Body font | Inter | Everything else |
| Card radius | 14px | `rounded-[14px]` or `rounded-[var(--radius-card)]` |
| Inner radius | 10px | Nested elements |
| Grain overlay | SVG feTurbulence | Fixed full-screen `.grain` div |
| Vignette | Radial gradient | Fixed full-screen `.vignette` div |

**Button variants:** `primary` (teal), `secondary` (teal outline), `danger` (coral). Sizes: `sm`, `md`, `lg`.

**Badge variants:** `teal` (active states), `coral` (cold), `neutral` (completed), `muted` (lead/contacted).

---

## Lifecycle States

| State | Label | Badge | Active? |
|-------|-------|-------|---------|
| `lead` | Lead | muted | No |
| `contacted` | Contacted | muted | No |
| `awaiting_blood_test` | Awaiting Blood Test | teal | No |
| `active_treatment` | Active Treatment | teal | **Yes** |
| `week_6_checkin` | Week 6 Check-in | teal | **Yes** |
| `end_review` | End Review | teal | **Yes** |
| `extended_support` | Extended Support | teal | **Yes** |
| `completed` | Completed | neutral | No |
| `cold` | Cold | coral | No |

"Active clients" on the dashboard = patients in the 4 "Yes" states.

---

## Database Schema

4 tables in `supabase/schema.sql`:

- **patients** — core record with lifecycle_state, package_type, manychat_id (unique), phone validation fields
- **patient_notes** — timestamped text notes, cascade-delete with patient
- **patient_attachments** — metadata rows pointing to Storage files, cascade-delete
- **payments** — amount (numeric 10,2), currency, method, date, reference

All have RLS enabled. `updated_at` trigger auto-fires on patients.

**Indexes:** `lifecycle_state`, `created_by`, `(last_name, first_name)`, FK-based indexes on child tables.

**Storage bucket:** `patient-files` — signed URLs with 1-hour expiry.

---

## Edge Functions (Deno)

### manychat-webhook

- **Path:** `supabase/functions/manychat-webhook/index.ts`
- **Auth:** Bearer token or `?secret=` query param, validated against `WEBHOOK_SECRET` env var
- **Behavior:** Upserts patient by `manychat_id` unique constraint. New patients get `lifecycle_state: 'lead'`.
- **Required env vars:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `WEBHOOK_SECRET`, `PRACTITIONER_USER_ID`

### send-email (M002 — planned)

- Will call Resend API via `fetch()` — no npm SDK (Deno runtime)
- Called by pg_net from pg_cron jobs for scheduled emails

---

## Environment Variables

```env
VITE_SUPABASE_URL=https://hbhepcucokwlagqygwrz.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

Edge Function env vars (set via `supabase secrets set`):
- `WEBHOOK_SECRET` — shared secret for ManyChat auth
- `PRACTITIONER_USER_ID` — Hüseyin's auth.users UUID
- `RESEND_API_KEY` — for M002 email sends

---

## Routes

| Path | Page | Auth |
|------|------|------|
| `/login` | LoginPage | Public |
| `/` | DashboardPage | Protected |
| `/patients` | PatientsPage | Protected |
| `/patients/new` | PatientFormPage (create) | Protected |
| `/patients/:id` | PatientDetailPage | Protected |
| `/patients/:id/edit` | PatientFormPage (edit) | Protected |
| `/pipeline` | PipelinePage | Protected |
| `/payments` | PaymentsPage | Protected |
| `/settings` | SettingsPage (M002) | Protected |

---

## Commands

```bash
# Dev server
npm run dev

# Build (type-check + bundle)
npm run build

# Type-check only
npx tsc -b

# Tests (dashboard metrics)
npm test

# Preview production build
npm run preview
```

---

## Current State

### M001: Core Patient Management CRM — ✅ COMPLETE

All 6 slices delivered. 116 modules, 0 TypeScript errors. 12 node:test assertions pass.

**Known gaps (environment, not code):**
- Live Supabase instance provisioned (`hbhepcucokwlagqygwrz`) but runtime verification pending
- ESLint not yet wired
- Session persistence across refresh untested against real backend

### M002: Automation & Polish — 🔄 IN PROGRESS

5 slices planned:
1. **S01: Polish & Live Deploy** — wire ESLint, deploy manychat-webhook to live Supabase
2. **S02: Resend Setup & CRM Settings** — email provider, SPF/DKIM, settings table + page
3. **S03: Welcome Email** — trigger on patient creation, opt-in toggle
4. **S04: Lifecycle Reminders** — pg_cron + pg_net for blood-test, week-6, end-review emails; `state_changed_at` migration
5. **S05: Lead Follow-up** — Day 3/7/12 outreach, auto-Cold transition

**Key M002 decisions:**
- Email provider: **Resend** (via `fetch()`, no SDK)
- Scheduling: **pg_cron + pg_net** → Edge Function
- Settings: single-row table per practitioner with boolean toggles
- Sender domain: Resend subdomain for M002, custom domain deferred to M003

---

## Architecture Decisions to Honor

| # | Decision | Rationale |
|---|----------|-----------|
| D004 | Manual payment entry (no PayPal API) | Volume too low to justify integration |
| D006 | `as-const` arrays, no enums | `erasableSyntaxOnly` in tsconfig |
| D007 | `{ data, error }` return pattern, explicit userId | Testability, consistency |
| D008 | Null package_type: any payment = paid | No partial without a target price |
| D009 | Fetch all payments once, group client-side | Avoids N+1 queries |
| D010 | Upsert by `manychat_id` for idempotent webhook | ManyChat may re-trigger |
| D012 | Resend via fetch() from Edge Functions | Deno runtime, no npm |
| D013 | pg_cron + pg_net for scheduling | All within Supabase platform |
| D014 | Single-row settings table per practitioner | Simple, RLS-safe, extensible |

---

## Gotchas

1. **No `tailwind.config.js`** — Tailwind v4 uses `@theme` in CSS. Don't create a config file.
2. **No enums** — `erasableSyntaxOnly: true`. Use `as const` + derived types.
3. **Edge Functions are Deno** — import from `https://esm.sh/`, not npm. No `node:` imports.
4. **RLS on everything** — if you add a table, add RLS policies. Browser queries go through anon key + RLS.
5. **`verbatimModuleSyntax: true`** — use `import type { X }` for type-only imports.
6. **Payment status is computed** — no stored column. Change the derivation logic in `getPatientPaymentSummary()`.
7. **Grain + vignette** — rendered as fixed divs in `main.tsx`, not per-page. Don't duplicate them.
8. **Test files excluded from build** — `tsconfig.app.json` excludes `src/**/*.test.ts`. Tests run via `node --experimental-strip-types --test`.
9. **Supabase client uses placeholder URL** when env vars are missing — builds succeed but runtime calls fail silently.
10. **`updated_at` is set both by Postgres trigger AND manually** in `updatePatient()` / `transitionState()`. The trigger will override the manual value — this is harmless but worth knowing.

---

## Future Milestones

- **M003:** Calendar integration (Google Calendar/Calendly), PDF protocol delivery, custom email domain
- **M004:** Landing page redesign (huseyinajuz.com on Netlify)
- **Out of scope:** Mobile app (Phase 3), SaaS multi-tenant (Phase 4)
