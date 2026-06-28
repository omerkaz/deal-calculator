import { Badge, getVariantForState } from "@/components/ui";
import { LIFECYCLE_LABELS } from "@/types/database";
import type { LifecycleState } from "@/types/database";

interface PatientStatusBadgeProps {
  status: LifecycleState;
  className?: string;
}

export function PatientStatusBadge({ status, className }: PatientStatusBadgeProps) {
  return (
    <Badge variant={getVariantForState(status)} className={className}>
      {LIFECYCLE_LABELS[status]}
    </Badge>
  );
}
