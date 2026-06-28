import { useAuth } from "@/context/auth";
import { Card } from "@/components/ui/Card";
import { Activity, Users, CreditCard, TrendingUp } from "lucide-react";

const stats = [
  { label: "Patients", value: "—", icon: Users, color: "text-teal" },
  { label: "Pipeline", value: "—", icon: Activity, color: "text-teal" },
  { label: "Revenue", value: "—", icon: CreditCard, color: "text-teal" },
  { label: "Growth", value: "—", icon: TrendingUp, color: "text-teal" },
] as const;

/**
 * Placeholder dashboard — stat cards will be wired to real data in S06.
 */
export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome card */}
      <Card hover={false}>
        <h2 className="font-heading text-2xl text-text">Welcome back</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Signed in as{" "}
          <span className="font-medium text-text">{user?.email ?? "—"}</span>.
          Dashboard data will be populated once the patient and pipeline modules
          are built.
        </p>
      </Card>

      {/* Stat cards placeholder */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} hover={false} className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-inner)] bg-[var(--color-teal-glow)]">
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-text-secondary">{label}</p>
              <p className="font-heading text-xl text-text">{value}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
