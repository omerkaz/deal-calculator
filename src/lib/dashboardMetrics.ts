import {
  LIFECYCLE_STATES,
  type LifecycleState,
  type PackageType,
  type Patient,
  type Payment,
} from "../types/database.ts";

export interface DashboardMetrics {
  totalClients: number;
  activeClients: number;
  stageCounts: Record<LifecycleState, number>;
  revenueTotal: number;
  revenueThisMonth: number;
  revenueByPackage: Record<PackageType, number>;
}

export const ACTIVE_STATES: ReadonlySet<LifecycleState> = new Set<LifecycleState>([
  "active_treatment",
  "week_6_checkin",
  "end_review",
  "extended_support",
]);

export function computeMetrics(patients: Patient[], payments: Payment[], now = new Date()): DashboardMetrics {
  const stageCounts = Object.fromEntries(
    LIFECYCLE_STATES.map((s) => [s, 0]),
  ) as Record<LifecycleState, number>;

  let activeClients = 0;
  for (const p of patients) {
    stageCounts[p.lifecycle_state] += 1;
    if (ACTIVE_STATES.has(p.lifecycle_state)) activeClients += 1;
  }

  const currentYYYYMM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const packageLookup = new Map<string, PackageType | null>(
    patients.map((p) => [p.id, p.package_type]),
  );

  let revenueTotal = 0;
  let revenueThisMonth = 0;
  const revenueByPackage: Record<PackageType, number> = {
    standard: 0,
    premium: 0,
    vip: 0,
  };

  for (const pay of payments) {
    const amount = Number(pay.amount);
    revenueTotal += amount;

    if (pay.payment_date.startsWith(currentYYYYMM)) {
      revenueThisMonth += amount;
    }

    const pkg = packageLookup.get(pay.patient_id);
    if (pkg) {
      revenueByPackage[pkg] += amount;
    }
  }

  return {
    totalClients: patients.length,
    activeClients,
    stageCounts,
    revenueTotal,
    revenueThisMonth,
    revenueByPackage,
  };
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}
