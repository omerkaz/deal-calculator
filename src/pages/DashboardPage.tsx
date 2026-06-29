import { useEffect, useState } from "react";
import { Activity, CreditCard, Loader2, TrendingUp, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui";
import { getPatients } from "@/lib/patients";
import { getPayments } from "@/lib/payments";
import {
  LIFECYCLE_LABELS,
  LIFECYCLE_STATES,
  PACKAGE_PRICES,
  type LifecycleState,
  type PackageType,
  type Patient,
  type Payment,
} from "@/types/database";

// ── Aggregation helpers ──

interface DashboardMetrics {
  totalClients: number;
  activeClients: number;
  stageCounts: Record<LifecycleState, number>;
  revenueTotal: number;
  revenueThisMonth: number;
  revenueByPackage: Record<PackageType, number>;
}

const ACTIVE_STATES: ReadonlySet<LifecycleState> = new Set<LifecycleState>([
  "active_treatment",
  "week_6_checkin",
  "end_review",
  "extended_support",
]);

function computeMetrics(patients: Patient[], payments: Payment[]): DashboardMetrics {
  const stageCounts = Object.fromEntries(
    LIFECYCLE_STATES.map((s) => [s, 0]),
  ) as Record<LifecycleState, number>;

  let activeClients = 0;
  for (const p of patients) {
    stageCounts[p.lifecycle_state] += 1;
    if (ACTIVE_STATES.has(p.lifecycle_state)) activeClients += 1;
  }

  const now = new Date();
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

function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

// ── Sub-components ──

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card hover={false} className="flex items-center gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-inner)] bg-[var(--color-teal-glow)]">
        <Icon className="h-5 w-5 text-teal" />
      </div>
      <div>
        <p className="text-xs text-text-secondary">{label}</p>
        <p className="font-heading text-xl text-text">{value}</p>
      </div>
    </Card>
  );
}

function StageBreakdown({ stageCounts }: { stageCounts: Record<LifecycleState, number> }) {
  const total = Object.values(stageCounts).reduce((s, n) => s + n, 0);

  return (
    <Card hover={false}>
      <h3 className="font-heading text-base text-text mb-4">Pipeline Breakdown</h3>
      {total === 0 ? (
        <p className="text-sm text-text-secondary">No patients in the system yet.</p>
      ) : (
        <div className="space-y-2">
          {LIFECYCLE_STATES.map((state) => {
            const count = stageCounts[state];
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={state} className="flex items-center gap-3">
                <span className="w-36 shrink-0 text-xs text-text-secondary">
                  {LIFECYCLE_LABELS[state]}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-surface-raised overflow-hidden">
                  <div
                    className="h-full rounded-full bg-teal transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-xs font-medium text-text">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function RevenueSummary({
  revenueTotal,
  revenueThisMonth,
  revenueByPackage,
}: Pick<DashboardMetrics, "revenueTotal" | "revenueThisMonth" | "revenueByPackage">) {
  const packageEntries: Array<{ key: PackageType; label: string; price: number }> = [
    { key: "standard", label: "Standard", price: PACKAGE_PRICES.standard },
    { key: "premium", label: "Premium", price: PACKAGE_PRICES.premium },
    { key: "vip", label: "VIP", price: PACKAGE_PRICES.vip },
  ];

  return (
    <Card hover={false}>
      <h3 className="font-heading text-base text-text mb-4">Revenue Summary</h3>
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">All time</span>
          <span className="font-medium text-text">{formatUSD(revenueTotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">This month</span>
          <span className="font-medium text-text">{formatUSD(revenueThisMonth)}</span>
        </div>
        <div className="my-3 h-px bg-surface-raised" />
        <p className="text-xs text-text-secondary mb-2">By package</p>
        {packageEntries.map(({ key, label, price }) => (
          <div key={key} className="flex justify-between text-sm">
            <span className="text-text-secondary">
              {label} <span className="text-xs">({formatUSD(price)}/client)</span>
            </span>
            <span className="font-medium text-text">{formatUSD(revenueByPackage[key])}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── Page ──

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchMetrics() {
    setLoading(true);
    setError(null);

    const [patientsResult, paymentsResult] = await Promise.all([
      getPatients(),
      getPayments(),
    ]);

    if (patientsResult.error) {
      setError(patientsResult.error.message);
      setLoading(false);
      return;
    }

    const payments = paymentsResult.error ? [] : paymentsResult.data;
    setMetrics(computeMetrics(patientsResult.data, payments));
    setLoading(false);
  }

  useEffect(() => {
    void fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-teal" />
      </div>
    );
  }

  if (error) {
    return (
      <Card hover={false} className="text-center py-16">
        <p className="text-coral font-medium">Failed to load dashboard</p>
        <p className="mt-1 text-sm text-text-secondary">{error}</p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={() => void fetchMetrics()}
        >
          Try Again
        </Button>
      </Card>
    );
  }

  const m = metrics!;

  return (
    <div className="space-y-6">
      {/* Top stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Clients" value={String(m.totalClients)} icon={Users} />
        <StatCard label="Active in Treatment" value={String(m.activeClients)} icon={Activity} />
        <StatCard label="Revenue (All Time)" value={formatUSD(m.revenueTotal)} icon={CreditCard} />
        <StatCard label="Revenue (This Month)" value={formatUSD(m.revenueThisMonth)} icon={TrendingUp} />
      </div>

      {/* Stage breakdown + Revenue summary */}
      <div className="grid gap-4 lg:grid-cols-2">
        <StageBreakdown stageCounts={m.stageCounts} />
        <RevenueSummary
          revenueTotal={m.revenueTotal}
          revenueThisMonth={m.revenueThisMonth}
          revenueByPackage={m.revenueByPackage}
        />
      </div>
    </div>
  );
}
