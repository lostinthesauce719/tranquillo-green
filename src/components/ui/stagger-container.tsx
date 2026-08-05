import * as React from "react";
import { cn } from "@/lib/utils";

export interface StaggerContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  staggerMs?: number;
  baseDelayMs?: number;
}

export function StaggerContainer({
  children,
  staggerMs = 80,
  baseDelayMs = 100,
  className,
  ...props
}: StaggerContainerProps) {
  const wrapped = React.Children.map(children, (child, i) => {
    if (!React.isValidElement(child)) return child;
    return (
      <div
        style={{
          animationDelay: `${baseDelayMs + i * staggerMs}ms`,
          animationFillMode: "both",
        }}
        className="animate-[slide-in-up_0.5s_var(--ease-out)_both]"
      >
        {child}
      </div>
    );
  });

  return (
    <div className={cn(className)} {...props}>
      {wrapped}
    </div>
  );
}
