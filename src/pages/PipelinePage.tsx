import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { Badge, Card, getVariantForState } from "@/components/ui";
import { PatientStatusBadge } from "@/components/patients/PatientStatusBadge";
import { getPatients } from "@/lib/patients";
import { LIFECYCLE_STATES, LIFECYCLE_LABELS } from "@/types/database";
import type { LifecycleState, PackageType, Patient } from "@/types/database";
import { Kanban, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";

const packageLabels: Record<PackageType, string> = {
  standard: "Standard",
  premium: "Premium",
  vip: "VIP",
};

function groupByState(
  patients: Patient[],
): Record<LifecycleState, Patient[]> {
  const grouped = {} as Record<LifecycleState, Patient[]>;
  for (const state of LIFECYCLE_STATES) {
    grouped[state] = [];
  }
  for (const patient of patients) {
    grouped[patient.lifecycle_state].push(patient);
  }
  return grouped;
}

export default function PipelinePage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await getPatients();

    if (result.error) {
      setError(result.error.message);
      setPatients([]);
    } else {
      setPatients(result.data);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchPatients();
  }, [fetchPatients]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-teal" />
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  const grouped = groupByState(patients);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Kanban className="h-6 w-6 text-teal" />
        <div>
          <h1 className="font-heading text-2xl text-text">Pipeline</h1>
          <p className="mt-0.5 text-sm text-text-secondary">
            {patients.length} {patients.length === 1 ? "patient" : "patients"} across {LIFECYCLE_STATES.length} stages
          </p>
        </div>
      </div>

      {/* Kanban columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {LIFECYCLE_STATES.map((state) => {
          const statePatients = grouped[state];
          const count = statePatients.length;

          return (
            <div
              key={state}
              className="min-w-[260px] flex-shrink-0 rounded-xl border border-border bg-surface/50 p-3"
            >
              {/* Column header */}
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-text">
                  {LIFECYCLE_LABELS[state]}
                </span>
                <Badge variant={getVariantForState(state)}>
                  {count}
                </Badge>
              </div>

              {/* Column body */}
              <div className="space-y-2">
                {count === 0 ? (
                  <p className="py-6 text-center text-xs text-text-muted">
                    No patients
                  </p>
                ) : (
                  statePatients.map((patient) => (
                    <Link
                      key={patient.id}
                      to={`/patients/${patient.id}`}
                      className="block"
                    >
                      <Card className="!p-4 !rounded-lg">
                        <p className="truncate text-sm font-medium text-text">
                          {patient.first_name} {patient.last_name}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <PatientStatusBadge status={patient.lifecycle_state} />
                          {patient.package_type && (
                            <Badge variant="neutral">
                              {packageLabels[patient.package_type]}
                            </Badge>
                          )}
                        </div>
                      </Card>
                    </Link>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
