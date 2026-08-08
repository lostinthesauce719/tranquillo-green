"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface BarChartDatum {
  label: string;
  value: number;
  color?: string;
}

export interface BarChartAnimatedProps extends React.HTMLAttributes<HTMLDivElement> {
  data: BarChartDatum[];
  maxValue?: number;
  barHeight?: "sm" | "md" | "lg";
  showLabels?: boolean;
  showValues?: boolean;
}

const barHeightMap = {
  sm: "h-3",
  md: "h-5",
  lg: "h-7",
};

const BarChartAnimated = React.forwardRef<HTMLDivElement, BarChartAnimatedProps>(
  (
    {
      className,
      data,
      maxValue,
      barHeight = "md",
      showLabels = true,
      showValues = true,
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const computedMax = maxValue ?? Math.max(...data.map((d) => d.value), 1);

    React.useEffect(() => {
      const el = containerRef.current;
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );

      observer.observe(el);
      return () => observer.disconnect();
    }, []);

    return (
      <div
        ref={(node) => {
          containerRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        className={cn("flex flex-col gap-3", className)}
        {...props}
      >
        {data.map((item, index) => {
          const percentage = (item.value / computedMax) * 100;
          const color = item.color ?? "var(--brand)";

          return (
            <div key={item.label} className="flex items-center gap-3">
              {showLabels && (
                <span className="w-20 shrink-0 text-xs text-text-muted truncate">
                  {item.label}
                </span>
              )}
              <div className="flex-1 rounded-full bg-surface-overlay overflow-hidden">
                <div
                  className={cn(
                    "rounded-full origin-left",
                    barHeightMap[barHeight]
                  )}
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: color,
                    transform: isVisible ? "scaleX(1)" : "scaleX(0)",
                    transition: `transform var(--duration-slow) var(--ease-out) ${index * 80}ms`,
                  }}
                />
              </div>
              {showValues && (
                <span className="w-12 shrink-0 text-right text-xs font-medium text-text-secondary">
                  {item.value.toLocaleString()}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }
);

BarChartAnimated.displayName = "BarChartAnimated";

export { BarChartAnimated };
