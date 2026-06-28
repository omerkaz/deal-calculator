import { type ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-teal text-white hover:bg-teal-hover shadow-[0_4px_16px_var(--color-teal-glow)] hover:shadow-[0_6px_24px_rgba(42,157,143,0.3)]",
  secondary:
    "bg-transparent text-teal border-2 border-teal hover:bg-teal hover:text-white",
  danger:
    "bg-coral text-white hover:bg-[#D45A3D] shadow-[0_4px_16px_var(--color-coral-glow)]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-1.5 text-sm rounded-lg",
  md: "px-6 py-2.5 text-sm rounded-[100px]",
  lg: "px-8 py-3 text-base rounded-[100px]",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      children,
      className = "",
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center gap-2
          font-semibold transition-all duration-300
          ease-[cubic-bezier(0.4,0,0.2,1)]
          hover:-translate-y-0.5
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button };
export type { ButtonProps };
