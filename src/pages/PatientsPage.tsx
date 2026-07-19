import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { Badge, Button, Card } from "@/components/ui";
import { PatientStatusBadge } from "@/components/patients/PatientStatusBadge";
import { PatientFilters } from "@/components/patients/PatientFilters";
import { getPatients } from "@/lib/patients";
import { getPayments } from "@/lib/payments";
import type { LifecycleState, PackageType, Patient, Payment, PaymentStatus } from "@/types/database";
import { Loader2, Plus, Users } from "lucide-react";

const paymentStatusVariant: Record<PaymentStatus, "teal" | "coral" | "muted"> = {
  paid: "teal",
  partial: "coral",
  unpaid: "muted",
};

const paymentStatusLabel: Record<PaymentStatus, string> = {
  paid: "Paid",
  partial: "Partial",
  unpaid: "Unpaid",
};

function computePaymentStatusMap(
  payments: Payment[],
  patients: Patient[],
): Map<string, PaymentStatus> {
  // Group payments by patient_id
  const byPatient = new Map<string, number>();
  for (const p of payments) {
    byPatient.set(p.patient_id, (byPatient.get(p.patient_id) ?? 0) + Number(p.amount));
  }

  // Compute status per patient using agreed_price (PRICE-01)
  const statusMap = new Map<string, PaymentStatus>();
  for (const pt of patients) {
    const totalPaid = byPatient.get(pt.id) ?? 0;

    if (pt.package_type === null) {
      // D008: no package → any payment = paid, none = unpaid
      statusMap.set(pt.id, totalPaid > 0 ? "paid" : "unpaid");
    } else if (pt.agreed_price === null) {
      // Fallback (shouldn't happen after migration)
      statusMap.set(pt.id, totalPaid > 0 ? "paid" : "unpaid");
    } else {
      // Cents-based comparison (A3)
      const paidCents = Math.round(totalPaid * 100);
      const targetCents = Math.round(pt.agreed_price * 100);
      if (paidCents >= targetCents) {
        statusMap.set(pt.id, "paid");
      } else if (paidCents > 0) {
        statusMap.set(pt.id, "partial");
      } else {
        statusMap.set(pt.id, "unpaid");
      }
    }
  }

  return statusMap;
}

const packageLabels: Record<PackageType, string> = {
  standard: "Standard",
  premium: "Premium",
  vip: "VIP",
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [paymentStatusMap, setPaymentStatusMap] = useState<Map<string, PaymentStatus>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<LifecycleState | "">("");
  const [packageType, setPackageType] = useState<PackageType | "">("");

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError(null);

    const filters: {
      search?: string;
      status?: LifecycleState;
      packageType?: PackageType;
    } = {};

    if (search.trim()) filters.search = search.trim();
    if (status) filters.status = status;
    if (packageType) filters.packageType = packageType;

    const [result, paymentsResult] = await Promise.all([
      getPatients(filters),
      getPayments(),
    ]);

    if (result.error) {
      setError(result.error.message);
      setPatients([]);
      setLoading(false);
      return;
    }

    setPatients(result.data);

    // Compute payment status map — non-blocking; if payments fail, just skip badges
    if (!paymentsResult.error) {
      setPaymentStatusMap(computePaymentStatusMap(paymentsResult.data, result.data));
    }

    setLoading(false);
  }, [search, status, packageType]);

  useEffect(() => {
    // Debounce search input, instant for dropdowns
    const timer = setTimeout(fetchPatients, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchPatients, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl text-text">Patients</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage patient records and track lifecycle progress.
          </p>
        </div>
        <Link to="/patients/new">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Add Patient
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card hover={false}>
        <PatientFilters
          search={search}
          status={status}
          packageType={packageType}
          onSearchChange={setSearch}
          onStatusChange={setStatus}
          onPackageTypeChange={setPackageType}
        />
      </Card>

      {/* Content area */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-teal" />
        </div>
      ) : error ? (
        <Card hover={false} className="text-center py-12">
          <p className="text-coral font-medium">Something went wrong</p>
          <p className="mt-1 text-sm text-text-secondary">{error}</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={() => void fetchPatients()}
          >
            Try Again
          </Button>
        </Card>
      ) : patients.length === 0 ? (
        <Card hover={false} className="text-center py-16">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal/10">
            <Users className="h-8 w-8 text-teal" />
          </div>
          <h3 className="mt-4 font-heading text-lg text-text">
            {search || status || packageType
              ? "No patients match your filters"
              : "No patients yet"}
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            {search || status || packageType
              ? "Try adjusting your search or filters."
              : "Add your first patient to get started."}
          </p>
          {!search && !status && !packageType && (
            <Link to="/patients/new" className="mt-4 inline-block">
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Add Your First Patient
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {patients.map((patient) => (
            <Link
              key={patient.id}
              to={`/patients/${patient.id}`}
              className="block"
            >
              <Card className="flex items-center gap-4">
                {/* Name + email */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-text">
                    {patient.first_name} {patient.last_name}
                  </p>
                  {patient.email && (
                    <p className="truncate text-sm text-text-secondary">
                      {patient.email}
                    </p>
                  )}
                </div>

                {/* Status badge */}
                <PatientStatusBadge status={patient.lifecycle_state} />

                {/* Payment status badge */}
                {paymentStatusMap.has(patient.id) && (
                  <Badge variant={paymentStatusVariant[paymentStatusMap.get(patient.id)!]}>
                    {paymentStatusLabel[paymentStatusMap.get(patient.id)!]}
                  </Badge>
                )}

                {/* Package */}
                {patient.package_type && (
                  <span className="hidden text-sm text-text-secondary sm:inline">
                    {packageLabels[patient.package_type]}
                  </span>
                )}

                {/* Phone */}
                <span className="hidden text-sm text-text-secondary lg:inline">
                  {patient.phone_country_code} {patient.phone_number}
                </span>

                {/* Date */}
                <span className="hidden text-xs text-text-muted xl:inline">
                  {new Date(patient.created_at).toLocaleDateString()}
                </span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
