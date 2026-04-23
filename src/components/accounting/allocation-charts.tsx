"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, type TooltipContentProps } from "recharts";

type AllocationSummary = {
  total: number;
  ready: number;
  needsSupport: number;
  pendingController: number;
  approved: number;
  nondeductible: number;
  deductible: number;
};

// Tranquil cascading palette
const COLORS = ["#10b981", "#34d399", "#6ee7b7", "#0d9488"];

function CustomTooltip({ active, payload }: TooltipContentProps<number, string>) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border bg-surface-mid p-3 shadow-lg shadow-black/20">
        <p className="text-xs font-semibold text-text-primary capitalize">{`${payload[0].name}`}</p>
        <p className="text-sm text-text-muted mt-1">{`Count: ${payload[0].value} items`}</p>
      </div>
    );
  }
  return null;
}

function FinancialTooltip({ active, payload }: TooltipContentProps<number, string>) {
  if (active && payload && payload.length) {
    const formatted = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(payload[0].value as number);
    return (
      <div className="rounded-xl border border-border bg-surface-mid p-3 shadow-lg shadow-black/20">
        <p className="text-xs font-semibold text-text-primary capitalize">{`${payload[0].name}`}</p>
        <p className="text-sm font-mono text-text-muted mt-1">{formatted}</p>
      </div>
    );
  }
  return null;
}

export function AllocationCharts({ summary }: { summary: AllocationSummary }) {
  const statusData = [
    { name: "Ready", value: summary.ready },
    { name: "Needs Support", value: summary.needsSupport },
    { name: "Pending Review", value: summary.pendingController },
    { name: "Approved", value: summary.approved },
  ].filter((d) => d.value > 0);

  const financialData = [
    { name: "Deductible Impact", amount: summary.deductible, fill: "#10b981" },
    { name: "280E Nondeductible", amount: summary.nondeductible, fill: "#0d9488" }
  ];

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  return (
    <div className="grid gap-4 xl:grid-cols-2 mt-2">
      {/* Donut Chart */}
      <section className="rounded-2xl border border-border bg-surface-mid p-6 flex flex-col items-center justify-center">
        <div className="w-full flex items-start justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-accent/70">Queue Workflow Status</div>
            <div className="mt-1 text-2xl font-semibold">{summary.total} Items</div>
            <div className="mt-1 text-sm text-text-muted/60">Distributed across teams</div>
          </div>
        </div>
        <div className="w-full h-[250px] mt-4 flex items-center justify-center">
          {isMounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip {...({} as any)} />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="size-[180px] rounded-full border-8 border-surface animate-pulse" />
          )}
        </div>
      </section>

      {/* Bar Chart */}
      <section className="rounded-2xl border border-border bg-surface-mid p-6 flex flex-col justify-center">
        <div className="w-full">
          <div className="text-[11px] uppercase tracking-[0.2em] text-accent/70">Financial 280E Breakdown</div>
          <div className="mt-1 text-2xl font-semibold">
             {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(summary.nondeductible + summary.deductible)}
          </div>
          <div className="mt-1 text-sm text-text-muted/60">Total tracked mixed-spend</div>
        </div>
        <div className="w-full h-[250px] mt-4">
          {isMounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <YAxis 
                  stroke="#64748b" 
                  tick={{ fontSize: 12, fill: "#94a3b8" }} 
                  tickFormatter={(value) => `$${value}`} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip content={<FinancialTooltip {...({} as any)} />} cursor={{ fill: "rgba(255, 255, 255, 0.05)" }} />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full rounded-xl bg-surface animate-pulse" />
          )}
        </div>
      </section>
    </div>
  );
}
