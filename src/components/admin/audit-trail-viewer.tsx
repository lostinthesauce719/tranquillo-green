"use client";

import { useState, useMemo, Fragment } from "react";
import type { AuditTrailEvent } from "@/lib/data/audit-trail";

interface AuditTrailViewerProps {
  initialEvents: AuditTrailEvent[];
}

export default function AuditTrailViewer({
  initialEvents,
}: AuditTrailViewerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState("");
  const [actorFilter, setActorFilter] = useState("");

  const filteredEvents = useMemo(() => {
    return initialEvents.filter((event) => {
      const matchesEntity =
        entityTypeFilter === "all" || event.entityType === entityTypeFilter;
      const matchesAction = event.action
        .toLowerCase()
        .includes(actionFilter.toLowerCase());
      const matchesActor = event.actor
        ? event.actor.toLowerCase().includes(actorFilter.toLowerCase())
        : false;
      return matchesEntity && matchesAction && matchesActor;
    });
  }, [initialEvents, entityTypeFilter, actionFilter, actorFilter]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleString();
  };

  const renderJsonBlock = (title: string, jsonString?: string) => {
    if (!jsonString) {
      return <div className="text-text-muted italic">None</div>;
    }
    let parsed: any = null;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      // not valid JSON, show raw
    }
    return (
      <div className="mb-2">
        <div className="mb-1 text-xs font-medium text-text-secondary">
          {title}
        </div>
        <div className="rounded-lg bg-black/30 p-3 font-mono text-xs text-text-muted overflow-auto">
          <pre>
            {parsed
              ? JSON.stringify(parsed, null, 2)
              : jsonString}
          </pre>
        </div>
      </div>
    );
  };

  const entityTypes = useMemo(() => {
    const types = new Set(initialEvents.map((e) => e.entityType));
    return Array.from(types).sort();
  }, [initialEvents]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 rounded-xl border border-border bg-surface-mid p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-text-secondary">
            Entity Type
          </label>
          <select
            value={entityTypeFilter}
            onChange={(e) => setEntityTypeFilter(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
          >
            <option value="all">All Types</option>
            {entityTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-text-secondary">
            Action
          </label>
          <input
            type="text"
            placeholder="Filter by action..."
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-brand"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-text-secondary">
            Actor
          </label>
          <input
            type="text"
            placeholder="Filter by actor..."
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-brand"
          />
        </div>
        {(entityTypeFilter !== "all" || actionFilter || actorFilter) && (
          <div className="flex items-end">
            <button
              onClick={() => {
                setEntityTypeFilter("all");
                setActionFilter("");
                setActorFilter("");
              }}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-muted transition hover:text-text-primary hover:bg-surface/70"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface-mid">
        <div className="border-b border-border bg-surface/80 px-4 py-3 text-xs uppercase tracking-[0.2em] text-text-muted">
          Audit events ({filteredEvents.length} of {initialEvents.length})
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-left text-sm">
            <thead className="bg-surface/80 text-xs uppercase tracking-[0.2em] text-text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">Entity Type</th>
                <th className="px-4 py-3 font-medium">Entity ID</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Reason</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredEvents.map((event) => {
                const isExpanded = expandedId === event._id;
                return (
                  <Fragment key={event._id}>
                    <tr
                      className="align-top transition hover:bg-surface/60 cursor-pointer"
                      onClick={() => toggleExpand(event._id)}
                    >
                      <td className="whitespace-nowrap px-4 py-4 text-text-muted">
                        {formatTimestamp(event.timestamp)}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-block rounded-full bg-violet-soft px-2 py-1 text-xs text-violet-300">
                          {event.entityType}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-text-muted">
                        {event.entityId}
                      </td>
                      <td className="px-4 py-4 font-medium text-text-primary">
                        {event.action}
                      </td>
                      <td className="px-4 py-4 text-text-muted">
                        {event.actor ? (
                          <span className="max-w-[150px] truncate block">
                            {event.actor}
                          </span>
                        ) : (
                          <span className="italic text-text-faint">
                            system
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs text-text-muted max-w-[200px] truncate">
                        {event.reason || "-"}
                      </td>
                      <td className="px-4 py-4 text-text-faint">
                        {isExpanded ? "▾" : "▸"}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr
                        key={`${event._id}-detail`}
                        className="bg-surface-raised/50"
                      >
                        <td colSpan={7} className="px-4 py-4">
                          <div className="ml-4 space-y-2">
                            {event.actorRole && (
                              <div className="text-xs text-text-muted">
                                Role: {event.actorRole}
                              </div>
                            )}
                            {event.metadata &&
                              Object.keys(event.metadata).length > 0 && (
                                <div className="rounded-lg bg-black/30 p-3 font-mono text-xs text-text-muted overflow-auto">
                                  <div className="mb-1 text-xs font-medium text-text-secondary">
                                    Metadata
                                  </div>
                                  <pre>
                                    {JSON.stringify(event.metadata, null, 2)}
                                  </pre>
                                </div>
                              )}
                            {renderJsonBlock("Before State", event.beforeState)}
                            {renderJsonBlock("After State", event.afterState)}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredEvents.length === 0 && (
        <div className="py-8 text-center text-text-muted">
          No audit events match the current filters.
        </div>
      )}
    </div>
  );
}
