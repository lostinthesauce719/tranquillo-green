"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useFetchCustomerGrowth } from "@/lib/business/client-hooks";

interface CustomTooltipData {
  date: string;
  newCount: number;
  churnedCount: number;
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

const CustomTooltip = ({
  active,
  payload,
  label,
}: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border bg-surface-mid p-3 shadow-lg shadow-black/20">
        <p className="text-xs font-semibold text-text-primary">{label}</p>
        {payload.map((entry, index) => (
          <p
            key={index}
            className="text-sm font-mono mt-1"
            style={{ color: entry.color }}
          >
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function CustomerGrowthChart() {
  const [data, setData] = useState<CustomTooltipData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGrowth = useFetchCustomerGrowth(30);

  useEffect(() => {
    let mounted = true;
    fetchGrowth().then((growthData) => {
      if (mounted) {
        setData(growthData);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [fetchGrowth]);

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
          No customer activity yet. New activations will appear here.
        </span>
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorChurned" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
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
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="newCount"
            name="New Customers"
            stroke="#10b981"
            fillOpacity={1}
            fill="url(#colorNew)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="churnedCount"
            name="Churned"
            stroke="#ef4444"
            fillOpacity={1}
            fill="url(#colorChurned)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
