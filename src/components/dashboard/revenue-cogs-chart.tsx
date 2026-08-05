"use client";

import { useState } from "react";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

type MonthlyData = {
  month: string;
  shortMonth: string;
  revenue: number;
  cogs: number;
  revenueChange: number | null;
  cogsChange: number | null;
};

interface RevenueCogsChartProps {
  data: MonthlyData[];
  maxRevenue: number;
}

export function RevenueCogsChart({ data, maxRevenue }: RevenueCogsChartProps) {
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);

  return (
    <div className="mt-5 overflow-x-auto">
      <div className="flex items-end gap-3 sm:gap-5" style={{ minHeight: 200, minWidth: 480 }}>
        {data.map((d, i) => {
          const revenueHeight = (d.revenue / maxRevenue) * 180;
          const cogsHeight = (d.cogs / maxRevenue) * 180;
          const isCurrent = i === data.length - 1;
          return (
            <div
              key={d.month}
              className="flex-1 flex flex-col items-center gap-1 relative"
              onMouseEnter={() => setHoveredMonth(d.month)}
              onMouseLeave={() => setHoveredMonth(null)}
            >
              {/* Change indicators */}
              <div className="flex items-center gap-1 text-[10px] leading-none h-4">
                {d.revenueChange !== null ? (
                  <span className={d.revenueChange >= 0 ? "text-success" : "text-danger"}>
                    {d.revenueChange >= 0 ? "↑" : "↓"}{Math.abs(d.revenueChange).toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-text-faint">—</span>
                )}
              </div>
              <div className="flex items-center gap-1 text-[10px] leading-none h-3">
                {d.cogsChange !== null ? (
                  <span className={d.cogsChange <= 0 ? "text-success" : "text-warning"}>
                    {d.cogsChange >= 0 ? "↑" : "↓"}{Math.abs(d.cogsChange).toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-text-faint">—</span>
                )}
              </div>

              {/* Bars */}
              <div className="flex items-end gap-1" style={{ height: 180 }}>
                <div
                  className={`w-4 sm:w-6 rounded-t-sm transition-all duration-500 cursor-pointer`}
                  style={{
                    height: revenueHeight,
                    backgroundColor: isCurrent ? "var(--brand)" : "rgba(34, 133, 90, 0.45)",
                    boxShadow: isCurrent ? "0 0 12px rgba(34, 133, 90, 0.3)" : "none",
                    opacity: hoveredMonth && hoveredMonth !== d.month ? 0.4 : 1,
                  }}
                />
                <div
                  className={`w-4 sm:w-6 rounded-t-sm transition-all duration-500 cursor-pointer`}
                  style={{
                    height: cogsHeight,
                    backgroundColor: isCurrent ? "var(--accent)" : "rgba(212, 146, 42, 0.45)",
                    boxShadow: isCurrent ? "0 0 12px rgba(212, 146, 42, 0.3)" : "none",
                    opacity: hoveredMonth && hoveredMonth !== d.month ? 0.4 : 1,
                  }}
                />
              </div>

              {/* Month label */}
              <span className={`mt-2 text-[10px] sm:text-xs ${isCurrent ? "text-text-primary font-medium" : "text-text-muted"}`}>
                {d.shortMonth}
              </span>

              {/* Tooltip */}
              {hoveredMonth === d.month && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                  <div className="rounded-lg border border-border bg-surface-raised px-3 py-2 shadow-xl text-xs whitespace-nowrap">
                    <div className="font-medium text-text-primary mb-1">{d.month}</div>
                    <div className="text-text-secondary">Revenue: <span className="text-brand font-medium">{currencyFormatter.format(d.revenue)}</span></div>
                    <div className="text-text-secondary">COGS: <span className="text-accent font-medium">{currencyFormatter.format(d.cogs)}</span></div>
                    <div className="text-text-muted mt-1">Gross Margin: {(((d.revenue - d.cogs) / d.revenue) * 100).toFixed(1)}%</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
