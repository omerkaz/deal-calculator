import type { LifecycleState } from "@/types/database";

type BadgeVariant = "teal" | "coral" | "neutral" | "muted";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  teal: "bg-teal/10 text-teal border-teal/20",
  coral: "bg-coral/10 text-coral border-coral/20",
  neutral: "bg-text/5 text-text-secondary border-text/10",
  muted: "bg-text-muted/10 text-text-muted border-text-muted/15",
};

/**
 * Map lifecycle states to badge color variants.
 * Active/in-progress states → teal, cold → coral, terminal → neutral, early → muted.
 */
const stateVariantMap: Record<LifecycleState, BadgeVariant> = {
  lead: "muted",
  contacted: "muted",
  awaiting_blood_test: "teal",
  active_treatment: "teal",
  week_6_checkin: "teal",
  end_review: "teal",
  extended_support: "teal",
  completed: "neutral",
  cold: "coral",
};

export function getVariantForState(state: LifecycleState): BadgeVariant {
  return stateVariantMap[state];
}

function Badge({ children, variant = "neutral", className = "" }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center
        px-2.5 py-0.5 text-[0.7rem] font-semibold
        rounded-full border
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

Badge.displayName = "Badge";

export { Badge };
export type { BadgeProps, BadgeVariant };
