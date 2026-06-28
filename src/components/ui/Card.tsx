import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

function Card({ hover = true, className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`
        bg-surface rounded-[14px] shadow-warm p-8
        transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${hover ? "hover:shadow-warm-lg hover:-translate-y-0.5" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

export { Card };
export type { CardProps };
