import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { Button, Card } from "@/components/ui";
import { PatientStatusBadge } from "@/components/patients/PatientStatusBadge";
import { PatientFilters } from "@/components/patients/PatientFilters";
import { getPatients } from "@/lib/patients";
import type { LifecycleState, PackageType, Patient } from "@/types/database";
import { Loader2, Plus, Users } from "lucide-react";

const packageLabels: Record<PackageType, string> = {
  standard: "Standard",
  premium: "Premium",
  vip: "VIP",
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
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

    const result = await getPatients(filters);

    if (result.error) {
      setError(result.error.message);
      setPatients([]);
    } else {
      setPatients(result.data);
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
