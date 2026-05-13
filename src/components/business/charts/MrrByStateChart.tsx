"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  type TooltipProps,
} from "recharts";
import { useFetchMrrByState } from "@/lib/business/client-hooks";

const STATE_COLORS = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#f59e0b", // amber
  "#ef4444", // red
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#84cc16", // lime
  "#f97316", // orange
  "#6366f1", // indigo
];

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
    return (
      <div className="rounded-xl border border-border bg-surface-mid p-3 shadow-lg shadow-black/20">
        <p className="text-xs font-semibold text-text-primary">
          {payload[0].payload.state}
        </p>
        <p className="text-sm font-mono text-text-muted mt-1">
          {formatCurrency(payload[0].value as number)} MRR
        </p>
      </div>
    );
  }
  return null;
}

export function MrrByStateChart() {
  const [data, setData] = useState<
    Array<{
      state: string;
      mrrCents: number;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  const fetchMrrByState = useFetchMrrByState(10);

  useEffect(() => {
    let mounted = true;
    fetchMrrByState().then((stateData) => {
      if (mounted) {
        const chartData = stateData.map((item: any) => ({
          state: item.state,
          mrrCents: item.mrrCents,
        }));
        setData(chartData);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [fetchMrrByState]);

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
        <span className="text-neutral-400 text-sm">
          No active customers yet.
        </span>
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
        >
          <XAxis
            type="number"
            stroke="#9CA3AF"
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="state"
            stroke="#9CA3AF"
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            tickLine={false}
            axisLine={false}
            width={35}
          />
          <Tooltip content={<CustomTooltip {...({} as any)} />} />
          <Bar
            dataKey="mrrCents"
            radius={[0, 4, 4, 0]}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={STATE_COLORS[index % STATE_COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
