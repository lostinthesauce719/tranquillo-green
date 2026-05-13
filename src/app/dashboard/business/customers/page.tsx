"use client";

import { useEffect, useState } from "react";
import { MetricCard } from "@/components/ui/metric-card";
import { useAllCustomers, useAllLeads } from "@/lib/business/client-hooks";

type Customer = {
  _id: string;
  companyName: string;
  tier: "DISPENSARY" | "CULTIVATOR" | "MANUFACTURER" | "ENTERPRISE";
  mrrCents: number;
  status: "trial" | "active" | "churned" | "expired";
  activationDate: number;
};

type Lead = {
  _id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  operatorType: string;
  state: string;
  monthlyRevenueRange?: string;
  bookkeepingMethod?: string;
  painPoints: string[];
  status: "new" | "qualified" | "converted" | "unqualified";
  createdAt: number;
  acquisitionSource: string;
};

export default function CustomerAdminPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [view, setView] = useState<"leads" | "customers">("customers");
  const [loading, setLoading] = useState(true);

  const fetchCustomers = useAllCustomers();
  const fetchLeads = useAllLeads();

  useEffect(() => {
    async function load() {
      try {
        const [leadsData, customersData] = await Promise.all([
          fetchLeads(),
          fetchCustomers(),
        ]);
        setLeads(leadsData);
        setCustomers(customersData);
      } catch (e) {
        console.error("Failed to load customers", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [fetchCustomers, fetchLeads]);

  const activeCustomers = customers.filter((c) => c.status === "active").length;
  const trialCustomers = customers.filter((c) => c.status === "trial").length;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Customer Management</h1>
        <p className="text-neutral-400">Leads, trials, and active accounts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard label="Total Leads" value={String(leads.length)} detail="Captured in system" />
        <MetricCard label="Trials" value={String(trialCustomers)} detail="Onboarding period" />
        <MetricCard label="Active Customers" value={String(activeCustomers)} detail="Paying" />
        <MetricCard
          label="Pipeline Value"
          value={`${(customers.reduce((sum, c) => sum + c.mrrCents / 100, 0) / 1000).toFixed(1)}k`}
          detail="Annualized run rate"
        />
      </div>

      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setView("customers")}
          className={`px-4 py-2 rounded ${view === "customers" ? "bg-brand text-white" : "bg-neutral-700 text-neutral-300"}`}
        >
          Customers ({customers.length})
        </button>
        <button
          onClick={() => setView("leads")}
          className={`px-4 py-2 rounded ${view === "leads" ? "bg-brand text-white" : "bg-neutral-700 text-neutral-300"}`}
        >
          Leads ({leads.length})
        </button>
      </div>

      {loading ? (
        <p className="text-neutral-500">Loading...</p>
      ) : (
        <div className="bg-neutral-800 border border-neutral-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-700 text-neutral-200">
              <tr>
                {view === "customers" ? (
                  <>
                    <th className="text-left p-3">Company</th>
                    <th>Tier</th>
                    <th>MRR</th>
                    <th>Status</th>
                    <th>Start Date</th>
                  </>
                ) : (
                  <>
                    <th className="text-left p-3">Company</th>
                    <th>Operator</th>
                    <th>State</th>
                    <th>Acquired</th>
                    <th>Source</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {view === "customers"
                ? customers.map((row) => (
                    <tr key={row._id} className="border-t border-neutral-700">
                      <td className="p-3 text-white">{row.companyName}</td>
                      <td className="p-3 text-neutral-300">{row.tier}</td>
                      <td className="p-3 text-neutral-300">${(row.mrrCents / 100).toFixed(2)}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          row.status === "active" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="p-3 text-neutral-400">
                        {new Date(row.activationDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                : leads.map((row) => (
                    <tr key={row._id} className="border-t border-neutral-700">
                      <td className="p-3 text-white">{row.companyName}</td>
                      <td className="p-3 text-neutral-300">{row.operatorType}</td>
                      <td className="p-3 text-neutral-300">{row.state}</td>
                      <td className="p-3 text-neutral-400">
                        {new Date(row.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-neutral-300">{row.acquisitionSource}</td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
