"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { useTenant } from "@/lib/auth/tenant-context";
import {
  Briefcase,
  AlertCircle,
  CalendarClock,
  Plus,
  Trash2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

interface CPAClient {
  linkId: string;
  companyId: string;
  name: string;
  state: string;
  operatorType: string;
  accountingMethod: string;
  status: string;
  openAlerts: number;
  criticalAlerts: number;
  openPeriods: number;
  totalPeriods: number;
  linkedAt: number;
}

interface CPAPartner {
  _id: string;
  cpaEmail: string;
  addedBy: string;
  createdAt: number;
}

export default function CPAPortalPage() {
  const tenant = useTenant();
  const isOwner = tenant.role === "owner" || tenant.role === "controller";

  const [clients, setClients] = useState<CPAClient[]>([]);
  const [partners, setPartners] = useState<CPAPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [clientsRes, partnersRes] = await Promise.all([
        fetch("/api/cpa-portal?view=clients"),
        fetch(`/api/cpa-portal?view=partners&companyId=${tenant.companyId}`),
      ]);
      const clientsData = await clientsRes.json();
      const partnersData = await partnersRes.json();
      if (!clientsRes.ok || !clientsData.ok) throw new Error(clientsData.message || "Failed to load clients");
      setClients(clientsData.clients ?? []);
      if (partnersRes.ok && partnersData.ok) {
        setPartners(partnersData.partners ?? []);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load CPA portal");
    } finally {
      setLoading(false);
    }
  }, [tenant.companyId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddPartner() {
    if (!newEmail.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/cpa-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addPartner", companyId: tenant.companyId, cpaEmail: newEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || "Failed to add CPA");
      setNewEmail("");
      await load();
    } catch (e: any) {
      setError(e.message || "Failed to add CPA");
    } finally {
      setSaving(false);
    }
  }

  async function handleRevoke(partner: CPAPartner) {
    if (!confirm(`Revoke CPA access for ${partner.cpaEmail}?`)) return;
    const previous = partners;
    setPartners((prev) => prev.filter((p) => p._id !== partner._id));
    try {
      const res = await fetch("/api/cpa-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revokePartner", linkId: partner._id }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || "Failed to revoke access");
    } catch (e: any) {
      setPartners(previous);
      setError(e.message || "Failed to revoke access");
    }
  }

  return (
    <AppShell title="CPA Partner Portal" description="Review client books you have access to, and manage which CPAs can see this company.">
      <div className="space-y-6">
        {error && (
          <div className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
            <span>{error}</span>
            <button
              onClick={load}
              className="inline-flex items-center gap-1.5 rounded-md border border-red-500/30 px-3 py-1 text-xs font-medium hover:bg-red-500/10"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
          </div>
        )}

        {/* My clients (CPA view) */}
        <section className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-brand" />
            <h3 className="text-lg font-semibold text-text-primary">Client Companies</h3>
            <span className="text-xs text-text-faint">({clients.length})</span>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[0, 1].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl border border-border/50 bg-surface/50" />
              ))}
            </div>
          ) : clients.length === 0 ? (
            <div className="py-10 text-center">
              <Briefcase className="mx-auto mb-3 h-10 w-10 text-text-faint" />
              <p className="text-sm text-text-muted">
                No client companies yet. Ask your clients to add your account email under
                &ldquo;CPA Access&rdquo; below on their own portal page.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {clients.map((client) => (
                <div key={client.linkId} className="rounded-xl border border-border bg-surface p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-semibold text-text-primary">{client.name}</div>
                      <div className="mt-0.5 text-xs text-text-muted">
                        {client.operatorType} · {client.state} · {client.accountingMethod}
                      </div>
                    </div>
                    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-text-muted">
                      {client.status}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-border bg-surface-raised p-2.5">
                      <div className="flex items-center gap-1.5 text-xs text-text-muted">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Open alerts
                      </div>
                      <div className="mt-0.5 text-lg font-bold text-text-primary">
                        {client.openAlerts}
                        {client.criticalAlerts > 0 && (
                          <span className="ml-2 text-xs font-medium text-red-400">
                            {client.criticalAlerts} critical
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="rounded-lg border border-border bg-surface-raised p-2.5">
                      <div className="flex items-center gap-1.5 text-xs text-text-muted">
                        <CalendarClock className="h-3.5 w-3.5" />
                        Open periods
                      </div>
                      <div className="mt-0.5 text-lg font-bold text-text-primary">
                        {client.openPeriods}
                        <span className="ml-1 text-xs font-normal text-text-faint">/ {client.totalPeriods}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* CPA access management (owner view) */}
        <section className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="mb-1 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand" />
            <h3 className="text-lg font-semibold text-text-primary">CPA Access for {tenant.companyName}</h3>
          </div>
          <p className="mb-4 text-sm text-text-muted">
            Grant your external CPA read access to this company&rsquo;s close and compliance summary. They&rsquo;ll see it on their own CPA portal after signing in with the email you add.
          </p>

          {isOwner ? (
            <div className="mb-4 flex gap-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="cpa@firm.com"
                className="w-full max-w-sm rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
              />
              <button
                onClick={handleAddPartner}
                disabled={!newEmail.trim() || saving}
                className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand/90 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                {saving ? "Adding…" : "Grant Access"}
              </button>
            </div>
          ) : (
            <div className="mb-4 rounded-lg border border-border bg-surface px-4 py-2.5 text-xs text-text-muted">
              Only owners and controllers can manage CPA access.
            </div>
          )}

          {partners.length === 0 ? (
            <p className="text-sm text-text-faint">No CPAs have access to this company.</p>
          ) : (
            <div className="space-y-2">
              {partners.map((partner) => (
                <div key={partner._id} className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-2.5">
                  <div>
                    <div className="text-sm text-text-primary">{partner.cpaEmail}</div>
                    <div className="text-xs text-text-faint">
                      Added by {partner.addedBy} · {new Date(partner.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => handleRevoke(partner)}
                      className="rounded-lg border border-border p-2 text-text-faint transition hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="text-xs text-text-faint">
          Looking for exports? Client-ready packets live in the{" "}
          <Link href="/dashboard/exports" className="text-brand hover:underline">Export Center</Link>.
        </div>
      </div>
    </AppShell>
  );
}
