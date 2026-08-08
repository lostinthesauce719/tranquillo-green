"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface BeakerGaugeProps {
  value: number;
  label: string;
  detail: string;
  color?: "green" | "amber" | "red" | "auto";
  className?: string;
}

function resolveColor(value: number, color: BeakerGaugeProps["color"]) {
  if (color && color !== "auto") return color;
  if (value >= 75) return "red";
  if (value >= 50) return "amber";
  return "green";
}

export function BeakerGauge({
  value,
  label,
  detail,
  color = "auto",
  className,
}: BeakerGaugeProps) {
  const [fillHeight, setFillHeight] = useState(0);
  const resolved = resolveColor(value, color);

  useEffect(() => {
    const t = requestAnimationFrame(() => {
      setFillHeight(Math.min(Math.max(value, 0), 100));
    });
    return () => cancelAnimationFrame(t);
  }, [value]);

  const fillColor = {
    green: "bg-success",
    amber: "bg-warning",
    red: "bg-danger",
  }[resolved];

  const glowColor = {
    green: "rgba(34, 197, 94, 0.35)",
    amber: "rgba(245, 158, 11, 0.35)",
    red: "rgba(239, 68, 68, 0.35)",
  }[resolved];

  const textColor = {
    green: "text-success",
    amber: "text-warning",
    red: "text-danger",
  }[resolved];

  const percentValue = Math.min(Math.max(Math.round(value), 0), 100);

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      {/* Beaker body */}
      <div className="relative flex h-48 w-28 flex-col items-center justify-end overflow-hidden rounded-2xl border border-border bg-surface p-2">
        {/* Tick marks */}
        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-0 flex flex-col justify-between py-3">
          {[100, 75, 50, 25, 0].map((tick) => (
            <div key={tick} className="flex items-center px-3">
              <div className="h-px w-2 bg-text-faint/40" />
              <span className="ml-1.5 text-[9px] leading-none text-text-faint/60">
                {tick}
              </span>
            </div>
          ))}
        </div>

        {/* Beaker rim / spout at top */}
        <div className="absolute -top-px left-1/2 h-[3px] w-[70%] -translate-x-1/2 rounded-b-sm border-x border-b border-border/60 bg-surface" />

        {/* Animated fill */}
        <div
          className={cn(
            "relative w-full rounded-t-lg transition-all duration-1000",
            fillColor,
            "animate-none",
          )}
          style={{
            height: `${fillHeight}%`,
            transitionTimingFunction: "var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1))",
            boxShadow: `0 -8px 24px ${glowColor}, inset 0 2px 8px rgba(255,255,255,0.08)`,
          }}
        >
          {/* Surface shimmer */}
          <div className="absolute inset-x-0 top-0 h-3 rounded-t-lg bg-gradient-to-b from-white/10 to-transparent" />
        </div>

        {/* Percentage label inside beaker */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className={cn("text-2xl font-bold tabular-nums drop-shadow-lg", textColor)}>
            {percentValue}
            <span className="text-base font-medium opacity-80">%</span>
          </span>
        </div>

        {/* Inner border overlay for depth */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.03]" />
      </div>

      {/* Label + detail below */}
      <div className="text-center">
        <div className="text-sm font-medium text-text-primary">{label}</div>
        <div className="mt-0.5 text-xs text-text-muted">{detail}</div>
      </div>
    </div>
  );
}
