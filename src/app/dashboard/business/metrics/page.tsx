"use client";

import { MetricCard } from "@/components/ui/metric-card";
import { RevenueTrendChart } from "@/components/business/charts/RevenueTrendChart";
import { CustomerGrowthChart } from "@/components/business/charts/CustomerGrowthChart";
import { MrrByTierChart } from "@/components/business/charts/MrrByTierChart";
import { MrrByStateChart } from "@/components/business/charts/MrrByStateChart";

export default function BusinessMetricsPage() {
  // Static summary cards - these would come from real queries in production
  const mrr = 127500; // $127.5k
  const customers = 42;
  const newCustomers = 3;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Business Metrics</h1>
        <p className="text-neutral-400">Financial health & growth KPIs</p>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          label="Monthly Recurring Revenue"
          value={`$${(mrr / 1000).toFixed(1)}k`}
          detail="Current MRR"
          trend="+8%"
        />
        <MetricCard
          label="Active Customers"
          value={customers.toString()}
          detail="Paying"
          trend="Target: 50+"
        />
        <MetricCard
          label="New Customers (30d)"
          value={newCustomers.toString()}
          detail="Acquired"
        />
        <MetricCard
          label="Net Revenue Retention"
          value="110%"
          detail="Industry: 110%"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <section className="bg-neutral-800 border border-neutral-700 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">MRR Over Time</h3>
          <RevenueTrendChart />
        </section>

        {/* Customer Growth */}
        <section className="bg-neutral-800 border border-neutral-700 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">Customer Acquisition vs Churn</h3>
          <CustomerGrowthChart />
        </section>

        {/* MRR by Tier */}
        <section className="bg-neutral-800 border border-neutral-700 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">
            Revenue by Tier
          </h3>
          <MrrByTierChart />
        </section>

        {/* MRR by State */}
        <section className="bg-neutral-800 border border-neutral-700 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">
            Revenue by State (Top 10)
          </h3>
          <MrrByStateChart />
        </section>
      </div>

      {/* Unit Economics (standalone panel) */}
      <section className="bg-neutral-800 border border-neutral-700 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4">Unit Economics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">
              Customer Acquisition Cost
            </div>
            <div className="text-2xl font-semibold text-white mt-1">$400</div>
            <div className="text-xs text-neutral-500 mt-0.5">Blended paid + organic</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">
              Lifetime Value
            </div>
            <div className="text-2xl font-semibold text-emerald-400 mt-1">
              $3,200
            </div>
            <div className="text-xs text-neutral-500 mt-0.5">Based on 8 mo avg</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">
              LTV : CAC Ratio
            </div>
            <div className="text-2xl font-semibold text-white mt-1">8.0</div>
            <div className="text-xs text-emerald-400 mt-0.5">Healthy &gt;3</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">
              Payback Period
            </div>
            <div className="text-2xl font-semibold text-white mt-1">4 mo</div>
            <div className="text-xs text-neutral-500 mt-0.5">Cash-flow positive</div>
          </div>
        </div>
      </section>
    </div>
  );
}
