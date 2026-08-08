"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, type TooltipContentProps } from "recharts";
import { useFetchMrrByTier } from "@/lib/business/client-hooks";

const TIER_COLORS: Record<string, string> = {
  DISPENSARY: "#10b981",      // emerald
  CULTIVATOR: "#3b82f6",     // blue
  MANUFACTURER: "#8b5cf6",   // purple
  ENTERPRISE: "#f59e0b",     // amber
  UNKNOWN: "#6b7280",        // gray
};

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
};

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const value = payload[0].value as number;
    const total = (payload[0] as any).payload?.total as number;
    const percent = total ? ((value / total) * 100).toFixed(1) : null;
    return (
      <div className="rounded-xl border border-border bg-surface-mid p-3 shadow-lg shadow-black/20">
        <p className="text-xs font-semibold text-text-primary capitalize">
          {payload[0].name || payload[0].payload?.name}
        </p>
        <p className="text-sm font-mono text-text-muted mt-1">
          {formatCurrency(value)}
        </p>
        {percent && (
          <p className="text-xs text-text-faint mt-0.5">{percent}% of total MRR</p>
        )}
      </div>
    );
  }
  return null;
}

export function MrrByTierChart() {
  const [data, setData] = useState<
    Array<{
      name: string;
      mrrCents: number;
      total: number;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  const fetchMrrByTier = useFetchMrrByTier();

  useEffect(() => {
    let mounted = true;
    fetchMrrByTier().then((tierData) => {
      if (mounted) {
        const total = tierData.reduce((sum: number, item: any) => sum + item.mrrCents, 0);
        const chartData = tierData.map((item: any) => ({
          name: item.tier,
          mrrCents: item.mrrCents,
          total,
        }));
        setData(chartData);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [fetchMrrByTier]);

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="size-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center border border-dashed border-neutral-600 rounded">
        <span className="text-neutral-400 text-sm">No active customers yet.</span>
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={4}
            dataKey="mrrCents"
            nameKey="name"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={TIER_COLORS[entry.name] || TIER_COLORS.UNKNOWN}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip {...({} as any)} />} />
        </PieChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-2">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: TIER_COLORS[entry.name] || TIER_COLORS.UNKNOWN }}
            />
            <span className="text-xs text-text-muted capitalize">
              {entry.name} ({formatCurrency(entry.mrrCents)})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
