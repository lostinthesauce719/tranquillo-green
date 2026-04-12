"use client";

import * as React from "react";

export interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

const AnimatedCounter = React.forwardRef<HTMLSpanElement, AnimatedCounterProps>(
  ({ value, duration = 1500, prefix = "", suffix = "", decimals = 0, className }, ref) => {
    const displayRef = React.useRef<HTMLSpanElement>(null);
    const frameRef = React.useRef<number>(0);
    const startValueRef = React.useRef(0);
    const startTimeRef = React.useRef<number | null>(null);

    const formatNumber = React.useCallback(
      (n: number) => {
        return n.toLocaleString("en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
      },
      [decimals]
    );

    React.useEffect(() => {
      const el = displayRef.current;
      if (!el) return;

      const startValue = startValueRef.current;
      const endValue = value;
      startTimeRef.current = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - (startTimeRef.current ?? currentTime);
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutQuart(progress);

        const currentValue = startValue + (endValue - startValue) * easedProgress;
        el.textContent = `${prefix}${formatNumber(currentValue)}${suffix}`;

        if (progress < 1) {
          frameRef.current = requestAnimationFrame(animate);
        } else {
          startValueRef.current = endValue;
        }
      };

      frameRef.current = requestAnimationFrame(animate);

      return () => {
        if (frameRef.current) {
          cancelAnimationFrame(frameRef.current);
        }
      };
    }, [value, duration, prefix, suffix, formatNumber]);

    return (
      <span ref={ref ?? displayRef} className={className}>
        {prefix}{formatNumber(value)}{suffix}
      </span>
    );
  }
);

AnimatedCounter.displayName = "AnimatedCounter";

export { AnimatedCounter };
