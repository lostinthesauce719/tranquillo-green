import * as React from "react";
import { cn } from "@/lib/utils";
import { PulseDot } from "./pulse-dot";

export interface LiveBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  label?: string;
  color?: "green" | "amber" | "red";
}

const LiveBadge = React.forwardRef<HTMLSpanElement, LiveBadgeProps>(
  ({ className, label = "LIVE", color = "green", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5",
          "bg-surface-overlay border border-border-subtle",
          "text-xs font-medium tracking-wide",
          color === "green" && "text-success",
          color === "amber" && "text-warning",
          color === "red" && "text-danger",
          className
        )}
        {...props}
      >
        <PulseDot color={color} size="sm" />
        {label}
      </span>
    );
  }
);

LiveBadge.displayName = "LiveBadge";

export { LiveBadge };
