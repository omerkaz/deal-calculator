import { test, describe } from "node:test";
import assert from "node:assert/strict";

/**
 * Unit tests for payment status derivation logic (PRICE-01).
 * Tests the pure derivation logic extracted from getPatientPaymentSummary.
 * The async function itself calls Supabase, so we test the derivation math directly.
 */

type PaymentStatus = "paid" | "partial" | "unpaid";

// Extract the derivation logic as a pure function for testing
function derivePaymentStatus(
  totalPaid: number,
  paymentCount: number,
  packageType: string | null,
  agreedPrice: number | null,
): PaymentStatus {
  if (packageType === null) {
    // D008: no package → any payment = paid, none = unpaid
    return paymentCount > 0 ? "paid" : "unpaid";
  }
  if (agreedPrice === null) {
    // Fallback: package set but no agreed_price
    return paymentCount > 0 ? "paid" : "unpaid";
  }
  // Cents-based comparison (A3)
  const paidCents = Math.round(totalPaid * 100);
  const targetCents = Math.round(agreedPrice * 100);
  if (paidCents >= targetCents) {
    return "paid";
  } else if (paidCents > 0) {
    return "partial";
  } else {
    return "unpaid";
  }
}

describe("derivePaymentStatus — D008 (null package)", () => {
  test("null package + any payment → paid", () => {
    assert.equal(derivePaymentStatus(100, 1, null, null), "paid");
  });

  test("null package + no payment → unpaid", () => {
    assert.equal(derivePaymentStatus(0, 0, null, null), "unpaid");
  });

  test("null package ignores stray agreedPrice", () => {
    // D008 must win FIRST regardless of agreed_price (A1)
    assert.equal(derivePaymentStatus(50, 1, null, 297), "paid");
  });
});

describe("derivePaymentStatus — package with agreed_price", () => {
  test("total >= agreed_price → paid", () => {
    assert.equal(derivePaymentStatus(297, 1, "standard", 297), "paid");
  });

  test("total > 0 but < agreed_price → partial", () => {
    assert.equal(derivePaymentStatus(100, 1, "standard", 297), "partial");
  });

  test("total = 0 → unpaid", () => {
    assert.equal(derivePaymentStatus(0, 0, "standard", 297), "unpaid");
  });

  test("overpayment → paid", () => {
    assert.equal(derivePaymentStatus(500, 2, "standard", 297), "paid");
  });
});

describe("derivePaymentStatus — fallback (package set, agreed_price null)", () => {
  test("package set but no agreed_price + payment → paid", () => {
    assert.equal(derivePaymentStatus(50, 1, "premium", null), "paid");
  });

  test("package set but no agreed_price + no payment → unpaid", () => {
    assert.equal(derivePaymentStatus(0, 0, "premium", null), "unpaid");
  });
});

describe("derivePaymentStatus — cents-based comparison (A3)", () => {
  test("price 299.99 with split payments 149.99 + 150.00 → paid", () => {
    const totalPaid = 149.99 + 150.00; // 299.99
    assert.equal(derivePaymentStatus(totalPaid, 2, "standard", 299.99), "paid");
  });

  test("price 299.99 with split payments 149.99 + 149.99 → partial", () => {
    const totalPaid = 149.99 + 149.99; // 299.98
    assert.equal(derivePaymentStatus(totalPaid, 2, "standard", 299.99), "partial");
  });

  test("floating point edge: 0.1 + 0.2 compared to 0.3 → paid", () => {
    // 0.1 + 0.2 = 0.30000000000000004 in JS, but cents comparison handles it
    const totalPaid = 0.1 + 0.2;
    assert.equal(derivePaymentStatus(totalPaid, 2, "vip", 0.3), "paid");
  });
});

describe("derivePaymentStatus — settings price change doesn't affect history", () => {
  test("patient agreed at 197, settings now 297 → still paid at 197", () => {
    // This is the core PRICE-01 invariant:
    // Patient agreed_price stays 197 regardless of current settings price
    assert.equal(derivePaymentStatus(197, 1, "standard", 197), "paid");
  });

  test("new patient at 297 with 197 paid → partial", () => {
    assert.equal(derivePaymentStatus(197, 1, "standard", 297), "partial");
  });
});
