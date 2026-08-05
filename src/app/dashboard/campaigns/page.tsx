"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { useTenant } from "@/lib/auth/tenant-context";
import {
  DollarSign,
  MousePointer,
  Eye,
  Play,
  Pause,
  CheckCircle2,
  Target,
  Plus,
  Trash2,
  RefreshCw,
  Pencil,
  Megaphone,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────────── */

type CampaignStatus = "draft" | "active" | "paused" | "completed";

interface Campaign {
  _id: string;
  name: string;
  channel: string;
  status: CampaignStatus;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  leads: number;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

const CHANNELS = [
  { value: "google", label: "Google" },
  { value: "meta", label: "Meta" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "reddit", label: "Reddit" },
  { value: "leafly", label: "Leafly" },
  { value: "weedmaps", label: "Weedmaps" },
  { value: "email", label: "Email" },
  { value: "other", label: "Other" },
];

const STATUS_STYLES: Record<CampaignStatus, string> = {
  active: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  paused: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  draft: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  completed: "bg-blue-500/15 text-blue-300 border-blue-500/30",
};

const fmtMoney = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function channelLabel(value: string) {
  return CHANNELS.find((c) => c.value === value)?.label ?? value;
}

/* ─── Components ────────────────────────────────────────────────── */

function MetricCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-raised p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-muted">{label}</span>
        <Icon className={"h-4 w-4 " + color} />
      </div>
      <div className="mt-1 text-2xl font-bold text-text-primary">{value}</div>
    </div>
  );
}

function MetricsEditor({
  campaign,
  onSave,
  onCancel,
}: {
  campaign: Campaign;
  onSave: (patch: Partial<Campaign>) => Promise<void>;
  onCancel: () => void;
}) {
  const [spent, setSpent] = useState(String(campaign.spent));
  const [impressions, setImpressions] = useState(String(campaign.impressions));
  const [clicks, setClicks] = useState(String(campaign.clicks));
  const [leads, setLeads] = useState(String(campaign.leads));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave({
      spent: Math.max(0, parseFloat(spent) || 0),
      impressions: Math.max(0, parseInt(impressions) || 0),
      clicks: Math.max(0, parseInt(clicks) || 0),
      leads: Math.max(0, parseInt(leads) || 0),
    });
    setSaving(false);
  }

  const fields: Array<[string, string, (value: string) => void]> = [
    ["Spent ($)", spent, setSpent],
    ["Impressions", impressions, setImpressions],
    ["Clicks", clicks, setClicks],
    ["Leads", leads, setLeads],
  ];

  return (
    <div className="mt-2 rounded-lg border border-brand/30 bg-brand/5 p-4">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand">Update Metrics</div>
      <div className="grid gap-3 sm:grid-cols-4">
        {fields.map(([label, value, setter]) => (
          <div key={label}>
            <label className="mb-1 block text-xs text-text-muted">{label}</label>
            <input
              type="number"
              min="0"
              value={value}
              onChange={(e) => setter(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-brand px-4 py-1.5 text-sm font-medium text-white transition hover:bg-brand/90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-border px-4 py-1.5 text-sm text-text-muted transition hover:text-text-primary"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────── */

export default function CampaignsPage() {
  const tenant = useTenant();
  const companyId = tenant.companyId;

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [newName, setNewName] = useState("");
  const [newChannel, setNewChannel] = useState("google");
  const [newBudget, setNewBudget] = useState("");
  const [newStart, setNewStart] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/campaigns?companyId=${companyId}`);
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || "Failed to load campaigns");
      setCampaigns(data.campaigns ?? []);
    } catch (e: any) {
      setError(e.message || "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(() => {
    const spent = campaigns.reduce((s, c) => s + c.spent, 0);
    const impressions = campaigns.reduce((s, c) => s + c.impressions, 0);
    const clicks = campaigns.reduce((s, c) => s + c.clicks, 0);
    const leads = campaigns.reduce((s, c) => s + c.leads, 0);
    return {
      spent,
      impressions,
      clicks,
      leads,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      cpl: leads > 0 ? spent / leads : 0,
    };
  }, [campaigns]);

  async function postAction(payload: Record<string, unknown>): Promise<any> {
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.message || "Request failed");
    return data;
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await postAction({
        action: "create",
        companyId,
        name: newName.trim(),
        channel: newChannel,
        budget: parseFloat(newBudget) || 0,
        ...(newStart ? { startDate: newStart } : {}),
      });
      setNewName("");
      setNewBudget("");
      setNewStart("");
      setShowAddForm(false);
      await load();
    } catch (e: any) {
      setError(e.message || "Failed to create campaign");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(campaign: Campaign, status: CampaignStatus) {
    const previous = campaigns;
    setCampaigns((prev) => prev.map((c) => (c._id === campaign._id ? { ...c, status } : c)));
    try {
      await postAction({ action: "update", campaignId: campaign._id, status });
    } catch (e: any) {
      setCampaigns(previous);
      setError(e.message || "Failed to update status");
    }
  }

  async function handleMetricsSave(campaign: Campaign, patch: Partial<Campaign>) {
    try {
      await postAction({ action: "update", campaignId: campaign._id, ...patch });
      setCampaigns((prev) => prev.map((c) => (c._id === campaign._id ? { ...c, ...patch } : c)));
      setEditingId(null);
    } catch (e: any) {
      setError(e.message || "Failed to save metrics");
    }
  }

  async function handleDelete(campaign: Campaign) {
    if (!confirm(`Delete campaign "${campaign.name}"? This cannot be undone.`)) return;
    const previous = campaigns;
    setCampaigns((prev) => prev.filter((c) => c._id !== campaign._id));
    try {
      await postAction({ action: "delete", campaignId: campaign._id });
    } catch (e: any) {
      setCampaigns(previous);
      setError(e.message || "Failed to delete campaign");
    }
  }

  return (
    <AppShell title="Ad Campaigns" description="Track advertising spend, reach, and lead generation across channels.">
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

        {/* Totals */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Total Spent" value={fmtMoney.format(totals.spent)} icon={DollarSign} color="text-brand" />
          <MetricCard label="Impressions" value={totals.impressions.toLocaleString()} icon={Eye} color="text-blue-400" />
          <MetricCard label="Clicks" value={totals.clicks.toLocaleString()} icon={MousePointer} color="text-accent" />
          <MetricCard label="Leads" value={totals.leads.toLocaleString()} icon={Target} color="text-emerald-400" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface-raised p-4">
            <div className="text-xs font-medium text-text-muted">Avg. CTR</div>
            <div className="mt-1 text-2xl font-bold text-text-primary">{totals.ctr.toFixed(2)}%</div>
          </div>
          <div className="rounded-xl border border-border bg-surface-raised p-4">
            <div className="text-xs font-medium text-text-muted">Cost per Lead</div>
            <div className="mt-1 text-2xl font-bold text-text-primary">
              {totals.leads > 0 ? fmtMoney.format(totals.cpl) : "—"}
            </div>
          </div>
        </div>

        {/* Campaign list */}
        <section className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">Campaigns ({campaigns.length})</h3>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand/90"
            >
              <Plus className="h-4 w-4" />
              New Campaign
            </button>
          </div>

          {showAddForm && (
            <div className="mb-4 rounded-xl border border-brand/30 bg-brand/5 p-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs text-text-muted">Name</label>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Spring lead gen"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-muted">Channel</label>
                  <select
                    value={newChannel}
                    onChange={(e) => setNewChannel(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
                  >
                    {CHANNELS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-muted">Budget ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    placeholder="1000"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-muted">Start date</label>
                  <input
                    type="date"
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
                  />
                </div>
              </div>
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || saving}
                className="mt-3 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand/90 disabled:opacity-50"
              >
                {saving ? "Creating…" : "Create Campaign"}
              </button>
            </div>
          )}

          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg border border-border/50 bg-surface/50" />
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <div className="py-12 text-center">
              <Megaphone className="mx-auto mb-3 h-10 w-10 text-text-faint" />
              <p className="text-sm text-text-muted">No campaigns yet. Create one to start tracking spend and leads.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {campaigns.map((campaign) => (
                <div key={campaign._id}>
                  <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-text-primary">{campaign.name}</span>
                        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-text-muted">
                          {channelLabel(campaign.channel)}
                        </span>
                        <span className={"rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider " + STATUS_STYLES[campaign.status]}>
                          {campaign.status}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-text-muted">
                        {fmtMoney.format(campaign.spent)} of {fmtMoney.format(campaign.budget)} · {campaign.impressions.toLocaleString()} impressions · {campaign.clicks.toLocaleString()} clicks · {campaign.leads} leads
                        {campaign.startDate ? ` · started ${campaign.startDate}` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {campaign.status !== "active" && campaign.status !== "completed" && (
                        <button
                          onClick={() => handleStatusChange(campaign, "active")}
                          title="Activate"
                          className="rounded-lg border border-border p-2 text-emerald-300 transition hover:bg-emerald-500/10"
                        >
                          <Play className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {campaign.status === "active" && (
                        <button
                          onClick={() => handleStatusChange(campaign, "paused")}
                          title="Pause"
                          className="rounded-lg border border-border p-2 text-amber-300 transition hover:bg-amber-500/10"
                        >
                          <Pause className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {campaign.status !== "completed" && (
                        <button
                          onClick={() => handleStatusChange(campaign, "completed")}
                          title="Mark completed"
                          className="rounded-lg border border-border p-2 text-blue-300 transition hover:bg-blue-500/10"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => setEditingId(editingId === campaign._id ? null : campaign._id)}
                        title="Edit metrics"
                        className="rounded-lg border border-border p-2 text-text-muted transition hover:text-text-primary"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(campaign)}
                        title="Delete"
                        className="rounded-lg border border-border p-2 text-text-faint transition hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {editingId === campaign._id && (
                    <MetricsEditor
                      campaign={campaign}
                      onSave={(patch) => handleMetricsSave(campaign, patch)}
                      onCancel={() => setEditingId(null)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
