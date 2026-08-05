import * as React from "react";
import { cn } from "@/lib/utils";

const colorMap = {
  green: {
    dot: "bg-success",
    ring: "border-success",
  },
  amber: {
    dot: "bg-warning",
    ring: "border-warning",
  },
  red: {
    dot: "bg-danger",
    ring: "border-danger",
  },
  blue: {
    dot: "bg-info",
    ring: "border-info",
  },
  violet: {
    dot: "bg-violet",
    ring: "border-violet",
  },
} as const;

const sizeMap = {
  sm: {
    dot: "h-2 w-2",
    ring: "h-2 w-2",
  },
  md: {
    dot: "h-2.5 w-2.5",
    ring: "h-2.5 w-2.5",
  },
} as const;

export interface PulseDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: "green" | "amber" | "red" | "blue" | "violet";
  size?: "sm" | "md";
}

const PulseDot = React.forwardRef<HTMLSpanElement, PulseDotProps>(
  ({ className, color = "green", size = "md", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn("relative inline-flex", className)}
        {...props}
      >
        {/* Pulse ring */}
        <span
          className={cn(
            "absolute inset-0 rounded-full border",
            colorMap[color].ring,
            sizeMap[size].ring,
            "animate-[pulse-ring_2s_ease-out_infinite]"
          )}
        />
        {/* Solid dot */}
        <span
          className={cn(
            "relative inline-block rounded-full",
            colorMap[color].dot,
            sizeMap[size].dot
          )}
        />
      </span>
    );
  }
);

PulseDot.displayName = "PulseDot";

export { PulseDot };
