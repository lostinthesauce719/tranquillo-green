import * as React from "react";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "./animated-counter";

export interface LiveMetricCardProps {
  label: string;
  value: number;
  detail: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  dotColor?: "green" | "amber" | "red" | "blue" | "violet";
  animate?: boolean;
}

function InlinePulseDot({ color = "green" }: { color?: "green" | "amber" | "red" | "blue" | "violet" }) {
  const dotColorMap = {
    green: "bg-success",
    amber: "bg-warning",
    red: "bg-danger",
    blue: "bg-info",
    violet: "bg-violet",
  };
  const ringColorMap = {
    green: "border-success/40",
    amber: "border-warning/40",
    red: "border-danger/40",
    blue: "border-info/40",
    violet: "border-violet/40",
  };

  return (
    <span className="relative mr-2 inline-flex h-2.5 w-2.5">
      <span
        className={cn(
          "absolute inline-flex h-full w-full rounded-full border",
          ringColorMap[color],
          "animate-[pulse-ring_1.5s_cubic-bezier(0.16,1,0.3,1)_infinite]"
        )}
      />
      <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", dotColorMap[color])} />
    </span>
  );
}

export function LiveMetricCard({
  label,
  value,
  detail,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
  dotColor,
  animate = true,
}: LiveMetricCardProps) {
  return (
    <div className={cn("rounded-2xl border border-border bg-surface-mid p-5", className)}>
      <div className="text-xs uppercase tracking-[0.2em] text-text-muted">{label}</div>
      <div className="mt-3 flex items-center text-3xl font-semibold">
        {dotColor && <InlinePulseDot color={dotColor} />}
        {animate ? (
          <AnimatedCounter value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
        ) : (
          <span>
            {prefix}
            {value}
            {suffix}
          </span>
        )}
      </div>
      <div className="mt-2 text-sm text-text-muted">{detail}</div>
    </div>
  );
}
