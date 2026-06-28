import { type TextareaHTMLAttributes, forwardRef, useId } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = "", id: externalId, ...props }, ref) => {
    const generatedId = useId();
    const id = externalId ?? generatedId;

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-[0.78rem] font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={`
            w-full px-3.5 py-2.5 text-[0.95rem]
            bg-surface text-text
            border-[1.5px] rounded-[10px]
            outline-none transition-all duration-300
            ease-[cubic-bezier(0.4,0,0.2,1)]
            placeholder:text-text-muted
            resize-y min-h-[80px]
            ${
              error
                ? "border-coral focus:border-coral focus:ring-2 focus:ring-coral-glow"
                : "border-divider focus:border-teal focus:ring-2 focus:ring-teal-glow"
            }
            ${className}
          `}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={
            error ? `${id}-error` : hint ? `${id}-hint` : undefined
          }
          {...props}
        />
        {error && (
          <p id={`${id}-error`} className="text-[0.75rem] text-coral font-medium">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${id}-hint`} className="text-[0.7rem] text-text-muted">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";

export { Textarea };
export type { TextareaProps };
