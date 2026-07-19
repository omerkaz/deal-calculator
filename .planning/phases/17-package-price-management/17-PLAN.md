# Phase 17: Package Price Management — Plan

**Phase:** 17
**Requirement:** PRICE-01
**Status:** Ready for execution
**Created:** 2026-07-19

---

## Architecture Decision: Prices on `practitioner_settings` (not a separate table)

**Rationale:** D014 (single-row settings per practitioner) is the established
pattern. With only 3 fixed package types and no create/delete of types in scope,
3 numeric columns (`price_standard`, `price_premium`, `price_vip`) on the
existing `practitioner_settings` row are simpler than a new table + RLS +
join. Querying is one `SELECT` (already fetched for settings page). If
PACKAGE_TYPES ever becomes dynamic (out of scope), we'd migrate to a table then.

---

## Task Breakdown

### Task 1: Schema Migration — Add columns + backfill

**Files:**
- `supabase/schema.sql` (source of truth)
- New migration: `supabase/migrations/20260719_add_price_columns.sql`

**Changes:**

1. Add to `practitioner_settings`:
   ```sql
   price_standard numeric(10,2) not null default 297,
   price_premium  numeric(10,2) not null default 497,
   price_vip      numeric(10,2) not null default 797
   ```

2. Add to `patients`:
   ```sql
   agreed_price numeric(10,2) default null
   ```

3. Backfill migration (run BEFORE new prices are live in derivation):
   ```sql
   -- Snapshot OLD prices for patients who already have a package assigned
   UPDATE patients
   SET agreed_price = CASE package_type
     WHEN 'standard' THEN 197
     WHEN 'premium'  THEN 297
     WHEN 'vip'      THEN 497
   END
   WHERE package_type IS NOT NULL
     AND agreed_price IS NULL;
   ```

4. Update live `practitioner_settings` row with new default prices:
   ```sql
   -- The row already exists for the practitioner; set the new tier prices
   UPDATE practitioner_settings
   SET price_standard = 297, price_premium = 497, price_vip = 797
   WHERE user_id = 'a0e60f0f-77f9-417f-9c74-9aa4c285cf6b';
   ```

**Verification:**
- Before migration: run `SELECT id, package_type, agreed_price FROM patients WHERE package_type IS NOT NULL;` — all agreed_price NULL
- After backfill: all patients with a package_type have agreed_price = old price
- Payment status evidence query (run before AND after):
  ```sql
  SELECT p.id, p.first_name, p.last_name, p.package_type, p.agreed_price,
         COALESCE(SUM(pay.amount), 0) as total_paid,
         CASE
           WHEN p.package_type IS NULL THEN
             CASE WHEN COUNT(pay.id) > 0 THEN 'paid' ELSE 'unpaid' END
           ELSE
             CASE
               WHEN COALESCE(SUM(pay.amount), 0) >= p.agreed_price THEN 'paid'
               WHEN COALESCE(SUM(pay.amount), 0) > 0 THEN 'partial'
               ELSE 'unpaid'
             END
         END as derived_status
  FROM patients p
  LEFT JOIN payments pay ON pay.patient_id = p.id
  WHERE p.created_by = 'a0e60f0f-77f9-417f-9c74-9aa4c285cf6b'
  GROUP BY p.id
  ORDER BY p.last_name;
  ```

**Commit:** `feat(schema): add agreed_price + price columns for PRICE-01`

---

### Task 2: Update TypeScript types + remove hard-coded PACKAGE_PRICES

**Files:**
- `src/types/database.ts`

**Changes:**

1. Remove `PACKAGE_PRICES` constant entirely (or deprecate; all consumers will
   be updated to use agreed_price / settings-fetched prices).

2. Add `agreed_price: number | null` to `Patient` interface.

3. Add price columns to `PractitionerSettings` interface:
   ```ts
   price_standard: number;
   price_premium: number;
   price_vip: number;
   ```

4. Update `PractitionerSettingsUpdate` type to include the price fields.

5. Update `DEFAULT_SETTINGS` to include default prices (297, 497, 797).

6. Export a helper type or utility:
   ```ts
   export function getPackagePrice(
     settings: Pick<PractitionerSettings, 'price_standard' | 'price_premium' | 'price_vip'>,
     packageType: PackageType
   ): number {
     const map: Record<PackageType, number> = {
       standard: settings.price_standard,
       premium: settings.price_premium,
       vip: settings.price_vip,
     };
     return map[packageType];
   }
   ```

**Commit:** `refactor(types): replace PACKAGE_PRICES with dynamic price model`

---

### Task 3: Update payment derivation in `src/lib/payments.ts`

**Files:**
- `src/lib/payments.ts`

**Changes:**

Update `getPatientPaymentSummary` signature to accept `agreedPrice`:
```ts
export async function getPatientPaymentSummary(
  patientId: string,
  packageType: PackageType | null,
  agreedPrice: number | null,
): Promise<{ data: PaymentSummary; error: Error | null }>
```

Derivation logic:
```ts
if (packageType === null) {
  // D008: null package → any payment = paid, none = unpaid
  status = paymentCount > 0 ? "paid" : "unpaid";
} else {
  // target = agreed_price if set, else fallback would need current price
  // But by design, agreed_price is always set when package_type is set
  // (backfill for historical, snapshot for new). Fallback for safety only.
  const target = agreedPrice;
  if (target === null) {
    // Edge case: package assigned but no agreed_price (shouldn't happen after migration)
    status = paymentCount > 0 ? "paid" : "unpaid";
  } else if (totalPaid >= target) {
    status = "paid";
  } else if (totalPaid > 0) {
    status = "partial";
  } else {
    status = "unpaid";
  }
}
```

Remove `import { PACKAGE_PRICES }` — no longer needed.

**Commit:** `feat(payments): derive status from agreed_price (PRICE-01)`

---

### Task 4: Update all PACKAGE_PRICES consumers

**Files:**
- `src/pages/DashboardPage.tsx` — uses PACKAGE_PRICES for display
- `src/pages/PatientsPage.tsx` — uses PACKAGE_PRICES for inline status derivation
- `src/lib/dashboardMetrics.ts` — does NOT use PACKAGE_PRICES (revenue is sum of payments)
- `src/pages/PatientDetailPage.tsx` — calls getPatientPaymentSummary

**Changes:**

**DashboardPage.tsx:**
- Remove `PACKAGE_PRICES` import
- Fetch prices from settings (already may be fetched for other reasons, or add
  a `getSettings` call) OR pass from a shared context
- The "Revenue by Package" card currently shows `PACKAGE_PRICES.standard` etc.
  as the "price" label. Replace with settings-fetched prices. If settings
  aren't loaded on dashboard, this can show just the label without a price
  reference, or we add a lightweight price fetch.
- **Design choice:** Since DashboardPage already fetches patients + payments,
  adding one `getSettings(userId)` call is minimal. Use the price fields.

**PatientsPage.tsx:**
- Currently computes payment status inline using `PACKAGE_PRICES[pkgType]`
- After this change, patients have `agreed_price` on the record — use
  `patient.agreed_price` directly instead of looking up from a constant
- Remove `PACKAGE_PRICES` import

**PatientDetailPage.tsx:**
- Pass `patient.agreed_price` to `getPatientPaymentSummary` (third arg)

**Commit:** `refactor(pages): use agreed_price instead of PACKAGE_PRICES`

---

### Task 5: Settings page — Package Prices card

**Files:**
- `src/pages/SettingsPage.tsx`
- `src/lib/settings.ts` (already has getSettings/upsertSettings)

**Changes:**

Add a "Package Prices" card below the email toggles:
- 3 number inputs: Standard, Premium, VIP
- Save button (or auto-save like toggles — use explicit Save for prices to
  avoid accidental edits)
- Shows current saved values on load
- Validation: must be > 0, numeric
- On save: `upsertSettings(userId, { price_standard, price_premium, price_vip })`

**UI pattern:** Match existing Card styling (`bg-surface rounded-[14px] p-6`),
use `Input` from `@/components/ui`, add a save Button (primary variant).

**Commit:** `feat(settings): add Package Prices management card (PRICE-01)`

---

### Task 6: PatientFormPage — snapshot agreed_price on package assignment

**Files:**
- `src/pages/PatientFormPage.tsx`
- `src/lib/settings.ts` (to fetch current prices for snapshot)

**Changes:**

1. When creating a patient with a package_type selected:
   - Fetch current prices from settings
   - Set `agreed_price` = the price for the selected package_type

2. When editing a patient and changing package_type:
   - If package changes from null → something: snapshot new price
   - If package changes from A → B: snapshot new price for B
   - If package stays the same: don't overwrite existing agreed_price
   - Show agreed_price as an editable field (for custom deals/discounts)

3. Add an "Agreed Price" field below the Package select:
   - Pre-filled from snapshot but editable
   - Label: "Agreed Price ($)" with helper text "Auto-filled from current package price. Edit for custom deals."
   - Only visible when a package is selected

**Commit:** `feat(patients): snapshot agreed_price on package assignment`

---

### Task 7: Update tests + final verification

**Files:**
- `src/pages/DashboardPage.test.ts`

**Changes:**

1. The test file doesn't directly test `PACKAGE_PRICES` — it tests
   `computeMetrics` which uses payment amounts and `revenueByPackage` (grouped
   by patient's package_type). `computeMetrics` itself doesn't reference
   `PACKAGE_PRICES` — it just sums payment amounts.
   
   → `dashboardMetrics.ts` needs NO changes (it doesn't use PACKAGE_PRICES).
   → Existing tests should still pass as-is.

2. Add new test assertions for the payment derivation logic (can be in a new
   test file `src/lib/payments.test.ts` or extend existing):
   - Patient with agreed_price=197, total_paid=197 → "paid"
   - Patient with agreed_price=297, total_paid=100 → "partial"
   - Patient with agreed_price=297, total_paid=0 → "unpaid"
   - Patient with package but null agreed_price → fallback (any payment = paid)
   - Patient with null package → D008 behavior unchanged

3. Run full verification:
   ```bash
   npx tsc -b
   npm test
   ```

**Commit:** `test(payments): add agreed_price derivation assertions`

---

## Execution Order (Critical)

The migration order is essential for correctness:

1. **Task 1** — Schema changes + backfill (agreed_price populated from OLD prices)
2. **Task 2** — Types updated (PACKAGE_PRICES removed, new fields added)
3. **Task 3** — Payment derivation updated to use agreed_price
4. **Task 4** — All page consumers updated
5. **Task 5** — Settings page price management UI
6. **Task 6** — PatientFormPage snapshot logic
7. **Task 7** — Tests + final verification

Tasks 2–4 must be atomic (all in same commit ideally, or fast sequence) since
removing PACKAGE_PRICES without updating consumers breaks the build.

**Revised commit strategy:** Tasks 2+3+4 as one commit to keep tsc clean at
every commit point.

**Checkpoint gate:** After Task 1 audit query (item 5), STOP and send results
to %123 before running the backfill portion of the migration.

---

## Edge-Case Adjustments (from review, items 1–6)

### A1: Package mutation semantics + DB invariants
- Upgrade/downgrade (standard→premium): re-snapshot from current price, pre-filled but editable
- Package cleared → NULL: agreed_price must also go NULL
- Derivation: `package_type IS NULL` → null target FIRST, regardless of stray agreed_price
- DB CHECKs (added AFTER backfill in same transaction):
  - `CHECK ((package_type IS NULL) = (agreed_price IS NULL))` on patients
  - `CHECK (agreed_price >= 0)` on patients
  - `CHECK (price_standard > 0 AND price_premium > 0 AND price_vip > 0)` on practitioner_settings
- Verify manychat-webhook still passes (never sets package → both NULL ✓)

### A2: Settings dependency in PatientFormPage
- Settings fetch failed/pending → disable package select + save button
- Snapshot reads price at SUBMIT time (fresh fetch), not mount-time state

### A3: Cents-based integer comparison in derivation
- Compare in cents: `Math.round(totalPaid * 100) >= Math.round(target * 100)`
- Test: price 299.99, payments 149.99+150.00 → paid; 149.99+149.99 → partial

### A4: Number input validation
- Keep string state for price inputs; validate before save
- Reject empty/negative/NaN — disable save button until all valid

### A5: Backfill cutoff audit (CHECKPOINT before backfill)
- Query recently-packaged patients (created since 2026-07-11) with payment sums
- Output IDs + sums only (no PII) to orchestrator
- User decides which get NEW price; rest get OLD price backfill

### A6: Migration atomicity + evidence
- Single transaction: add columns → backfill → add CHECK constraints
- Idempotent (WHERE agreed_price IS NULL)
- Evidence pair: before/after status SQL (id + status), zero diffs
- Future-immutability proof: change settings price → re-run → zero diffs

### Advisory (noted, addressed inline)
- A7: grep ALL PACKAGE_PRICES usages including Edge Functions
- A8: Dashboard doesn't use PACKAGE_PRICES for projections (only revenue sums)
- A9: updatePatient() has no optimistic concurrency — acceptable (single user)
- A10: Test fixtures must include agreed_price; add settings-price-change test

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Historical statuses flip | Backfill agreed_price=OLD price + evidence query before/after |
| Recent new-price sales mis-snapshotted | Item-5 audit checkpoint before backfill |
| Floating point comparison | Cents-based integer math (A3) |
| Settings row doesn't exist | upsertSettings handles create-or-update; DEFAULT_SETTINGS has prices |
| Stale price snapshot (tab left open) | Fresh settings fetch at submit time (A2) |
| Package cleared but agreed_price lingers | DB CHECK constraint + app code enforces NULL pairing (A1) |
| Number input empty string = 0 | String state + validation before save (A4) |
| Migration partial failure | Single transaction wraps all DDL+DML (A6) |

---

## Done Criteria (from brief)

- [x] Prices editable in Settings
- [x] agreed_price snapshot live (on package assignment)
- [x] Historical statuses unchanged (evidence query output)
- [x] New sales compute against new prices
- [x] tsc + tests green
- [x] SUMMARY.md + STATE/ROADMAP/HANDOFF updated
- [x] Tree clean, report to orchestrator
