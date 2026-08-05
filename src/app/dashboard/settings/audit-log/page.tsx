"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useTenant } from "@/lib/auth/tenant-context";
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

function summarizeState(raw: unknown): string {
  if (typeof raw !== "string" || !raw) return "";
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      const entries = Object.entries(parsed)
        .filter(([, value]) => ["string", "number", "boolean"].includes(typeof value))
        .slice(0, 4)
        .map(([key, value]) => `${key}: ${value}`);
      if (entries.length > 0) return entries.join(" · ");
    }
  } catch {
    // Not JSON — fall through to raw truncation.
  }
  return raw.length > 120 ? raw.slice(0, 117) + "…" : raw;
}

export default function AuditLogPage() {
  const tenant = useTenant();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("7d");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/audit-trail/event?companyId=${tenant.companyId}&limit=500`);
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || "Failed to load audit events");
      setEvents(
        (data.events ?? []).map((e: any): AuditEvent => ({
          id: e._id,
          timestamp: e.timestamp ?? e._creationTime,
          actor: e.actor || "System",
          actorRole: e.actor === "System" ? "system" : e.actorRole ?? "member",
          action: e.action,
          entityType: e.entityType ?? "system",
          entityId: e.entityId ?? "",
          beforeSummary: summarizeState(e.beforeState),
          afterSummary: summarizeState(e.afterState),
          reason: e.reason || undefined,
        }))
      );
    } catch (err: any) {
      setError(err.message || "Failed to load audit events");
    } finally {
      setLoading(false);
    }
  }, [tenant.companyId]);

  useEffect(() => {
    load();
  }, [load]);
  const [actorFilter, setActorFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");

  // Derive unique values from demo data
  const uniqueActors = useMemo(() => {
    const seen = new Set<string>();
    return events.filter((e) => {
      if (seen.has(e.actor)) return false;
      seen.add(e.actor);
      return true;
    }).map((e) => ({ value: e.actor, label: e.actor }));
  }, [events]);

  const uniqueActions = useMemo(() => {
    const seen = new Set<string>();
    return events.filter((e) => {
      if (seen.has(e.action)) return false;
      seen.add(e.action);
      return true;
    }).map((e) => ({ value: e.action, label: formatAction(e.action) }));
  }, [events]);

  const uniqueEntityTypes = useMemo(() => {
    const seen = new Set<string>();
    return events.filter((e) => {
      if (seen.has(e.entityType)) return false;
      seen.add(e.entityType);
      return true;
    }).map((e) => ({
      value: e.entityType,
      label: ENTITY_TYPE_LABELS[e.entityType] ?? e.entityType,
    }));
  }, [events]);

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
    return events.filter((e) => {
      if (e.timestamp < cutoff) return false;
      if (actorFilter !== "all" && e.actor !== actorFilter) return false;
      if (actionFilter !== "all" && e.action !== actionFilter) return false;
      if (entityFilter !== "all" && e.entityType !== entityFilter) return false;
      return true;
    });
  }, [events, dateRange, actorFilter, actionFilter, entityFilter]);

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
      {error && (
        <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
      {loading && (
        <div className="mb-6 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg border border-border/50 bg-surface-mid/50" />
          ))}
        </div>
      )}

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
