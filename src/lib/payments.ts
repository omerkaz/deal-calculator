import { supabase } from "@/lib/supabase";
import type {
  Payment,
  PaymentInsert,
  PaymentMethod,
  PaymentSummary,
  PackageType,
} from "@/types/database";

export async function getPatientPayments(
  patientId: string,
): Promise<{ data: Payment[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("patient_id", patientId)
    .order("payment_date", { ascending: false });

  if (error) {
    return {
      data: [],
      error: new Error(`Failed to fetch payments for patient ${patientId}: ${error.message}`),
    };
  }

  return { data: (data ?? []) as Payment[], error: null };
}

export async function getPayments(
  filters?: { patientId?: string; method?: PaymentMethod },
): Promise<{ data: Payment[]; error: Error | null }> {
  let query = supabase
    .from("payments")
    .select("*")
    .order("payment_date", { ascending: false });

  if (filters?.patientId) {
    query = query.eq("patient_id", filters.patientId);
  }
  if (filters?.method) {
    query = query.eq("payment_method", filters.method);
  }

  const { data, error } = await query;

  if (error) {
    return {
      data: [],
      error: new Error(`Failed to fetch payments: ${error.message}`),
    };
  }

  return { data: (data ?? []) as Payment[], error: null };
}

export async function createPayment(
  payment: PaymentInsert,
): Promise<{ data: Payment | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("payments")
    .insert(payment)
    .select()
    .single();

  if (error) {
    return {
      data: null,
      error: new Error(`Failed to create payment for patient ${payment.patient_id}: ${error.message}`),
    };
  }

  return { data: data as Payment, error: null };
}

export async function deletePayment(
  id: string,
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("payments")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: new Error(`Failed to delete payment ${id}: ${error.message}`) };
  }

  return { error: null };
}

export async function getPatientPaymentSummary(
  patientId: string,
  packageType: PackageType | null,
  agreedPrice: number | null,
): Promise<{ data: PaymentSummary; error: Error | null }> {
  const { data: payments, error } = await getPatientPayments(patientId);

  if (error) {
    return {
      data: { totalPaid: 0, status: "unpaid", paymentCount: 0 },
      error,
    };
  }

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const paymentCount = payments.length;

  let status: PaymentSummary["status"];

  if (packageType === null) {
    // D008: No package selected — if they've paid anything, consider it paid
    status = paymentCount > 0 ? "paid" : "unpaid";
  } else if (agreedPrice === null) {
    // Edge case: package set but no agreed_price (shouldn't happen after migration)
    // Fall back to D008 semantics
    status = paymentCount > 0 ? "paid" : "unpaid";
  } else {
    // Compare in cents to avoid floating point issues (A3)
    const paidCents = Math.round(totalPaid * 100);
    const targetCents = Math.round(agreedPrice * 100);
    if (paidCents >= targetCents) {
      status = "paid";
    } else if (paidCents > 0) {
      status = "partial";
    } else {
      status = "unpaid";
    }
  }

  return {
    data: { totalPaid, status, paymentCount },
    error: null,
  };
}
