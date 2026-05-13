"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useFetchDailyMetrics } from "@/lib/business/client-hooks";

interface DailyMetric {
  date: string;
  mrrCents: number;
  activeCustomers: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
}

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
};

const CustomTooltip = ({
  active,
  payload,
  label,
}: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border bg-surface-mid p-3 shadow-lg shadow-black/20">
        <p className="text-xs font-semibold text-text-primary">{label}</p>
        <p className="text-sm font-mono text-text-muted mt-1">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export function RevenueTrendChart() {
  const [data, setData] = useState<DailyMetric[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDailyMetrics = useFetchDailyMetrics(30);

  useEffect(() => {
    let mounted = true;
    fetchDailyMetrics().then((metrics) => {
      if (mounted) {
        const chartData = metrics.map((m: any) => ({
          date: m.date,
          mrrCents: m.mrrCents || 0,
          activeCustomers: m.activeCustomers || 0,
        }));
        setData(chartData);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [fetchDailyMetrics]);

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
          No metrics recorded yet. Run "Compute Daily Metrics" in Convex console.
        </span>
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#9CA3AF"
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => {
              const d = new Date(value);
              return `${d.getMonth() + 1}/${d.getDate()}`;
            }}
          />
          <YAxis
            stroke="#9CA3AF"
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="mrrCents"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#10b981" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
