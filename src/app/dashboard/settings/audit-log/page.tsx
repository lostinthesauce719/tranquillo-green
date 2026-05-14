"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";

// ─── Types ────────────────────────────────────────────────────────────

type AuditEntityType =
  | "transaction"
  | "allocation"
  | "reconciliation"
  | "reporting_period"
  | "import_job"
  | "packet"
  | "system"
  | "user"
  | "settings";

interface AuditEvent {
  id: string;
  timestamp: number;
  actor: string;
  actorRole: string;
  action: string;
  entityType: AuditEntityType;
  entityId: string;
  beforeSummary: string;
  afterSummary: string;
  reason?: string;
}

// ─── Demo Data ────────────────────────────────────────────────────────

const DEMO_ACTORS = [
  { id: "user_1", name: "Sarah Chen", role: "owner" },
  { id: "user_2", name: "Marcus Rivera", role: "controller" },
  { id: "user_3", name: "Jamie Park", role: "accountant" },
  { id: "system", name: "System", role: "system" },
];

const DEMO_EVENTS: AuditEvent[] = [
  {
    id: "evt_001",
    timestamp: Date.now() - 1800000,
    actor: "Sarah Chen",
    actorRole: "owner",
    action: "allocation_approved",
    entityType: "allocation",
    entityId: "alloc_280e_q2_0042",
    beforeSummary: "status: needs_review · deductible: $12,400 · nondeductible: $8,200",
    afterSummary: "status: approved · deductible: $12,400 · nondeductible: $8,200",
    reason: "Reviewed and approved Q2 280E allocation for Emerald Cultivation",
  },
  {
    id: "evt_002",
    timestamp: Date.now() - 3600000,
    actor: "Marcus Rivera",
    actorRole: "controller",
    action: "journal_entry_posted",
    entityType: "transaction",
    entityId: "txn_je_202605_0117",
    beforeSummary: "status: draft · amount: $45,200.00 · period: May 2026",
    afterSummary: "status: posted · amount: $45,200.00 · period: May 2026",
    reason: "Monthly COGS reclassification journal entry",
  },
  {
    id: "evt_003",
    timestamp: Date.now() - 7200000,
    actor: "Jamie Park",
    actorRole: "accountant",
    action: "settings_changed",
    entityType: "settings",
    entityId: "company_profile",
    beforeSummary: "accounting_method: cash · operator_type: dispensary",
    afterSummary: "accounting_method: accrual · operator_type: vertical",
    reason: "Updated company profile to reflect vertical integration license",
  },
  {
    id: "evt_004",
    timestamp: Date.now() - 14400000,
    actor: "Sarah Chen",
    actorRole: "owner",
    action: "user_invited",
    entityType: "user",
    entityId: "user_4",
    beforeSummary: "team_members: 3",
    afterSummary: "team_members: 4 · new_user: alex@tranquillogreen.com (accountant)",
    reason: "Invited Alex Torres as accountant for Q3 close support",
  },
  {
    id: "evt_005",
    timestamp: Date.now() - 28800000,
    actor: "System",
    actorRole: "system",
    action: "reconciliation_flagged",
    entityType: "reconciliation",
    entityId: "rec_drawer_loc1_may14",
    beforeSummary: "status: open · expected: $18,420.00 · actual: $18,420.00",
    afterSummary: "status: investigating · variance: -$340.00 · driver: unrecorded cash drop",
    reason: "Automated variance detection triggered investigation",
  },
  {
    id: "evt_006",
    timestamp: Date.now() - 43200000,
    actor: "Marcus Rivera",
    actorRole: "controller",
    action: "import_job_promoted",
    entityType: "import_job",
    entityId: "imp_qbo_may14_001",
    beforeSummary: "status: validated · rows: 247 · errors: 0 · warnings: 3",
    afterSummary: "status: promoted · rows: 247 · transactions_created: 244",
    reason: "Promoted QBO bank feed import after resolving 3 mapping warnings",
  },
  {
    id: "evt_007",
    timestamp: Date.now() - 86400000,
    actor: "Sarah Chen",
    actorRole: "owner",
    action: "packet_assembled",
    entityType: "packet",
    entityId: "pkt_q1_2026_cpa",
    beforeSummary: "status: not_started · schedules: 0",
    afterSummary: "status: assembled · formats: [PDF, Excel] · schedules: 7",
    reason: "Assembled Q1 2026 CPA handoff packet with all supporting schedules",
  },
  {
    id: "evt_008",
    timestamp: Date.now() - 172800000,
    actor: "Jamie Park",
    actorRole: "accountant",
    action: "period_closed",
    entityType: "reporting_period",
    entityId: "period_apr_2026",
    beforeSummary: "status: open · tasks: 8/12 complete · blockers: [pending receipts, bank rec]",
    afterSummary: "status: closed · tasks: 12/12 complete · closed_at: 2026-05-13",
    reason: "Completed all close tasks and locked April 2026 reporting period",
  },
  {
    id: "evt_009",
    timestamp: Date.now() - 259200000,
    actor: "Marcus Rivera",
    actorRole: "controller",
    action: "allocation_overridden",
    entityType: "allocation",
    entityId: "alloc_280e_q1_0038",
    beforeSummary: "basis: square_footage · deductible: $9,100 · nondeductible: $11,500",
    afterSummary: "basis: labor_hours · deductible: $10,800 · nondeductible: $9,800",
    reason: "Overrode allocation basis to labor hours per CPA recommendation",
  },
  {
    id: "evt_010",
    timestamp: Date.now() - 345600000,
    actor: "System",
    actorRole: "system",
    action: "metrc_sync_completed",
    entityType: "system",
    entityId: "metrc_sync_may11",
    beforeSummary: "last_sync: 2026-05-10T08:00:00Z · packages_synced: 0",
    afterSummary: "last_sync: 2026-05-11T08:00:00Z · packages_synced: 1,247",
    reason: "Scheduled Metrc inventory sync completed successfully",
  },
  {
    id: "evt_011",
    timestamp: Date.now() - 432000000,
    actor: "Sarah Chen",
    actorRole: "owner",
    action: "tax_rate_updated",
    entityType: "settings",
    entityId: "tax_rate_ca_excise",
    beforeSummary: "rate: 15.0% · effective: 2025-01-01",
    afterSummary: "rate: 15.5% · effective: 2026-07-01",
    reason: "Updated California excise tax rate per BOE bulletin 2026-04",
  },
  {
    id: "evt_012",
    timestamp: Date.now() - 518400000,
    actor: "Jamie Park",
    actorRole: "accountant",
    action: "transaction_posted",
    entityType: "transaction",
    entityId: "txn_exp_202605_0089",
    beforeSummary: "status: needs_review · amount: $2,340.00 · account: 6100-Marketing",
    afterSummary: "status: posted · amount: $2,340.00 · account: 6100-Marketing",
    reason: "Posted marketing expense after receipt verification",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────

const ENTITY_TYPE_LABELS: Record<AuditEntityType, string> = {
  transaction: "Transaction",
  allocation: "Allocation",
  reconciliation: "Reconciliation",
  reporting_period: "Reporting Period",
  import_job: "Import Job",
  packet: "CPA Packet",
  system: "System",
  user: "User",
  settings: "Settings",
};

const ENTITY_TYPE_COLORS: Record<AuditEntityType, string> = {
  transaction: "bg-blue-500/15 text-blue-300",
  allocation: "bg-purple-500/15 text-purple-300",
  reconciliation: "bg-amber-500/15 text-amber-300",
  reporting_period: "bg-emerald-500/15 text-emerald-300",
  import_job: "bg-cyan-500/15 text-cyan-300",
  packet: "bg-rose-500/15 text-rose-300",
  system: "bg-neutral-500/15 text-neutral-300",
  user: "bg-indigo-500/15 text-indigo-300",
  settings: "bg-orange-500/15 text-orange-300",
};

const ROLE_BADGE_COLOR: Record<string, string> = {
  owner: "bg-amber-500/20 text-amber-300",
  controller: "bg-blue-500/20 text-blue-300",
  accountant: "bg-emerald-500/20 text-emerald-300",
  viewer: "bg-neutral-500/20 text-neutral-300",
  system: "bg-neutral-500/20 text-neutral-400",
};

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatAction(action: string): string {
  return action
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ─── Components ───────────────────────────────────────────────────────

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${className ?? ""}`}
    >
      {children}
    </span>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-text-muted">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function AuditEventRow({ event }: { event: AuditEvent }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-xl border border-border bg-surface transition hover:border-border-subtle"
    >
      {/* Main row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3.5 flex items-start gap-4"
      >
        {/* Timestamp */}
        <div className="shrink-0 w-28 pt-0.5">
          <div className="text-xs font-medium text-text-primary">
            {formatRelative(event.timestamp)}
          </div>
          <div className="text-[10px] text-text-faint mt-0.5">
            {formatTimestamp(event.timestamp)}
          </div>
        </div>

        {/* Actor */}
        <div className="shrink-0 w-28">
          <div className="text-sm font-medium text-text-primary truncate">
            {event.actor}
          </div>
          <Badge className={ROLE_BADGE_COLOR[event.actorRole] ?? "bg-neutral-500/20 text-neutral-300"}>
            {event.actorRole}
          </Badge>
        </div>

        {/* Action */}
        <div className="shrink-0 w-40">
          <div className="text-sm font-medium text-text-primary">
            {formatAction(event.action)}
          </div>
        </div>

        {/* Entity */}
        <div className="shrink-0 w-32">
          <Badge className={ENTITY_TYPE_COLORS[event.entityType] ?? "bg-neutral-500/20 text-neutral-300"}>
            {ENTITY_TYPE_LABELS[event.entityType] ?? event.entityType}
          </Badge>
          <div className="text-[10px] text-text-faint mt-1 font-mono truncate">
            {event.entityId}
          </div>
        </div>

        {/* Summary preview */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-text-muted truncate">
            {event.afterSummary}
          </p>
        </div>

        {/* Expand indicator */}
        <div className="shrink-0 text-text-faint text-xs pt-1">
          {expanded ? "▲" : "▼"}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border px-4 py-4 space-y-4 bg-surface-mid/50">
          {event.reason && (
            <div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-text-faint mb-1">
                Reason
              </div>
              <p className="text-sm text-text-secondary">{event.reason}</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface p-3">
              <div className="text-[10px] uppercase tracking-[0.15em] text-text-faint mb-2">
                Before
              </div>
              <p className="text-xs text-text-muted font-mono leading-relaxed whitespace-pre-wrap">
                {event.beforeSummary}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3">
              <div className="text-[10px] uppercase tracking-[0.15em] text-text-faint mb-2">
                After
              </div>
              <p className="text-xs text-text-muted font-mono leading-relaxed whitespace-pre-wrap">
                {event.afterSummary}
              </p>
            </div>
          </div>

          <div className="flex gap-4 text-[10px] text-text-faint">
            <span>ID: <span className="font-mono">{event.id}</span></span>
            <span>Entity: <span className="font-mono">{event.entityId}</span></span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────

export default function AuditLogPage() {
  const [dateRange, setDateRange] = useState("7d");
  const [actorFilter, setActorFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");

  // Derive unique values from demo data
  const uniqueActors = useMemo(() => {
    const seen = new Set<string>();
    return DEMO_EVENTS.filter((e) => {
      if (seen.has(e.actor)) return false;
      seen.add(e.actor);
      return true;
    }).map((e) => ({ value: e.actor, label: e.actor }));
  }, []);

  const uniqueActions = useMemo(() => {
    const seen = new Set<string>();
    return DEMO_EVENTS.filter((e) => {
      if (seen.has(e.action)) return false;
      seen.add(e.action);
      return true;
    }).map((e) => ({ value: e.action, label: formatAction(e.action) }));
  }, []);

  const uniqueEntityTypes = useMemo(() => {
    const seen = new Set<string>();
    return DEMO_EVENTS.filter((e) => {
      if (seen.has(e.entityType)) return false;
      seen.add(e.entityType);
      return true;
    }).map((e) => ({
      value: e.entityType,
      label: ENTITY_TYPE_LABELS[e.entityType] ?? e.entityType,
    }));
  }, []);

  // Date range helper
  const getDateCutoff = (range: string): number => {
    const now = Date.now();
    switch (range) {
      case "1d": return now - 86400000;
      case "7d": return now - 7 * 86400000;
      case "30d": return now - 30 * 86400000;
      case "90d": return now - 90 * 86400000;
      default: return 0;
    }
  };

  // Filter events
  const filteredEvents = useMemo(() => {
    const cutoff = getDateCutoff(dateRange);
    return DEMO_EVENTS.filter((e) => {
      if (e.timestamp < cutoff) return false;
      if (actorFilter !== "all" && e.actor !== actorFilter) return false;
      if (actionFilter !== "all" && e.action !== actionFilter) return false;
      if (entityFilter !== "all" && e.entityType !== entityFilter) return false;
      return true;
    });
  }, [dateRange, actorFilter, actionFilter, entityFilter]);

  const hasActiveFilters = actorFilter !== "all" || actionFilter !== "all" || entityFilter !== "all" || dateRange !== "all";

  function clearFilters() {
    setDateRange("7d");
    setActorFilter("all");
    setActionFilter("all");
    setEntityFilter("all");
  }

  return (
    <AppShell
      title="Audit Log"
      description="Complete audit trail of all actions and changes across your organization."
    >
      {/* Demo mode banner */}
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-300 mb-6">
        <strong>Demo mode</strong> — Showing sample audit events. In production, this displays your real audit trail from the database.
      </div>

      {/* Filters */}
      <section className="rounded-2xl border border-border bg-surface-mid p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs uppercase tracking-[0.2em] text-accent">Filters</div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-text-muted transition hover:text-text-primary"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FilterSelect
            label="Date Range"
            value={dateRange}
            options={[
              { value: "1d", label: "Last 24 hours" },
              { value: "7d", label: "Last 7 days" },
              { value: "30d", label: "Last 30 days" },
              { value: "90d", label: "Last 90 days" },
              { value: "all", label: "All time" },
            ]}
            onChange={setDateRange}
          />
          <FilterSelect
            label="Actor"
            value={actorFilter}
            options={[
              { value: "all", label: "All actors" },
              ...uniqueActors,
            ]}
            onChange={setActorFilter}
          />
          <FilterSelect
            label="Action Type"
            value={actionFilter}
            options={[
              { value: "all", label: "All actions" },
              ...uniqueActions,
            ]}
            onChange={setActionFilter}
          />
          <FilterSelect
            label="Entity Type"
            value={entityFilter}
            options={[
              { value: "all", label: "All entities" },
              ...uniqueEntityTypes,
            ]}
            onChange={setEntityFilter}
          />
        </div>
      </section>

      {/* Results summary */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-text-muted">
          Showing <span className="font-medium text-text-primary">{filteredEvents.length}</span>{" "}
          {filteredEvents.length === 1 ? "event" : "events"}
        </div>
        <div className="text-xs text-text-faint">
          Sorted by most recent
        </div>
      </div>

      {/* Column headers */}
      <div className="hidden sm:flex items-center gap-4 px-4 pb-2 text-[10px] uppercase tracking-[0.15em] text-text-faint">
        <div className="w-28">When</div>
        <div className="w-28">Actor</div>
        <div className="w-40">Action</div>
        <div className="w-32">Entity</div>
        <div className="flex-1">Summary</div>
        <div className="w-4" />
      </div>

      {/* Event list */}
      <div className="space-y-2">
        {filteredEvents.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-8 text-center">
            <div className="text-2xl mb-2">🔍</div>
            <div className="text-sm text-text-muted">No audit events match your filters.</div>
            <button
              onClick={clearFilters}
              className="mt-3 text-xs text-brand hover:underline"
            >
              Clear filters to see all events
            </button>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <AuditEventRow key={event.id} event={event} />
          ))
        )}
      </div>

      {/* Footer note */}
      <div className="mt-6 rounded-lg border border-border-subtle bg-surface px-4 py-3 text-xs text-text-faint">
        Audit events are retained for 7 years to meet cannabis compliance requirements.
        All changes are immutable and cryptographically chained.
      </div>
    </AppShell>
  );
}
