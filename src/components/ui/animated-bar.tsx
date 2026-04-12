import * as React from "react";
import { cn } from "@/lib/utils";

export interface AnimatedBarProps extends React.HTMLAttributes<HTMLDivElement> {
  percent: number;
  color?: string;
  height?: string;
  delayMs?: number;
}

export function AnimatedBar({
  percent,
  color = "bg-accent/80",
  height = "h-2.5",
  delayMs = 0,
  className,
  ...props
}: AnimatedBarProps) {
  return (
    <div className={cn("overflow-hidden rounded-full bg-background", className)} {...props}>
      <div
        className={cn(
          "origin-left rounded-full",
          height,
          color,
          "animate-[bar-grow_1s_var(--ease-out)_both]"
        )}
        style={{
          width: `${Math.min(Math.max(percent, 0), 100)}%`,
          animationDelay: `${delayMs}ms`,
        }}
      />
    </div>
  );
}
