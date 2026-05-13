"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Bell,
  Filter,
  Calendar,
  Clock,
  ExternalLink,
} from "lucide-react";

type NotificationSeverity = "critical" | "warning" | "info" | "success";
type NotificationCategory = "compliance" | "close" | "allocation" | "reconciliation" | "tax" | "system";
type NotificationStatus = "unread" | "read" | "resolved";

type Notification = {
  id: string;
  severity: NotificationSeverity;
  category: NotificationCategory;
  title: string;
  body: string;
  status: NotificationStatus;
  createdAt: string;
  dueAt?: string;
  linkHref?: string;
  linkLabel?: string;
  source: string;
};

const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: "n-1",
    severity: "critical",
    category: "compliance",
    title: "280E allocation overdue for Q1 2026",
    body: "Quarterly 280E COGS allocation has not been reviewed. Deadline was April 15. Review and approve allocation splits before filing.",
    status: "unread",
    createdAt: "2026-04-16T10:00:00Z",
    dueAt: "2026-04-15T23:59:59Z",
    linkHref: "/dashboard/allocations",
    linkLabel: "Review Allocations",
    source: "Compliance Engine",
  },
  {
    id: "n-2",
    severity: "warning",
    category: "close",
    title: "Month-end close: 3 blockers remaining",
    body: "Reporting period checklist has 3 open blockers. Imports readiness and cash reconciliation need attention before lock.",
    status: "unread",
    createdAt: "2026-04-16T09:30:00Z",
    dueAt: "2026-04-18T23:59:59Z",
    linkHref: "/dashboard/accounting/close",
    linkLabel: "Open Close Dashboard",
    source: "Close Workflow",
  },
  {
    id: "n-3",
    severity: "warning",
    category: "reconciliation",
    title: "Metrc inventory variance: Package METC-001234",
    body: "2.3g variance detected between Metrc and book inventory. Investigation opened 2 days ago.",
    status: "unread",
    createdAt: "2026-04-15T14:00:00Z",
    dueAt: "2026-04-20T23:59:59Z",
    linkHref: "/dashboard/reconciliations",
    linkLabel: "Open Reconciliation",
    source: "Metrc Sync",
  },
  {
    id: "n-4",
    severity: "warning",
    category: "compliance",
    title: "Cultivation license renewal in 45 days",
    body: "Annual cultivation license renewal due. Submit application at least 30 days before expiration.",
    status: "read",
    createdAt: "2026-04-14T08:00:00Z",
    dueAt: "2026-05-30T23:59:59Z",
    linkHref: "/dashboard/compliance",
    linkLabel: "View Compliance",
    source: "License Monitor",
  },
  {
    id: "n-5",
    severity: "info",
    category: "tax",
    title: "State excise tax filing due in 12 days",
    body: "Monthly cannabis excise tax return (CDTFA-501) is due by the 15th of next month.",
    status: "read",
    createdAt: "2026-04-13T08:00:00Z",
    dueAt: "2026-04-28T23:59:59Z",
    linkHref: "/dashboard/compliance",
    linkLabel: "View Filing Calendar",
    source: "Tax Calendar",
  },
  {
    id: "n-6",
    severity: "info",
    category: "allocation",
    title: "471(c) election review recommended",
    body: "Based on current revenue, your operation may benefit from a 471(c) small business inventory method election. Review with your CPA.",
    status: "read",
    createdAt: "2026-04-12T10:00:00Z",
    linkHref: "/dashboard/allocations/policies",
    linkLabel: "Review Policy",
    source: "Allocation Engine",
  },
  {
    id: "n-7",
    severity: "success",
    category: "close",
    title: "Q4 2025 close packet generated",
    body: "CPA handoff packet for Q4 2025 has been assembled and is ready for review. 8 sections included.",
    status: "resolved",
    createdAt: "2026-04-10T16:00:00Z",
    linkHref: "/dashboard/exports",
    linkLabel: "View Export Center",
    source: "Packet Builder",
  },
  {
    id: "n-8",
    severity: "success",
    category: "reconciliation",
    title: "Bank reconciliation completed",
    body: "April bank statement reconciled. All transactions matched. Variance: $0.00.",
    status: "resolved",
    createdAt: "2026-04-09T11:00:00Z",
    linkHref: "/dashboard/reconciliations",
    linkLabel: "View Reconciliation",
    source: "Cash Reconciliation",
  },
];

const severityConfig: Record<NotificationSeverity, { icon: React.ElementType; color: string; bg: string }> = {
  critical: { icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  warning: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  info: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  success: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
};

const categoryLabels: Record<NotificationCategory, string> = {
  compliance: "Compliance",
  close: "Close",
  allocation: "Allocation",
  reconciliation: "Reconciliation",
  tax: "Tax",
  system: "System",
};

export function NotificationInbox() {
  const [notifications, setNotifications] = useState<Notification[]>(DEMO_NOTIFICATIONS);
  const [filterSeverity, setFilterSeverity] = useState<NotificationSeverity | "all">("all");
  const [filterStatus, setFilterStatus] = useState<NotificationStatus | "all">("all");
  const [showResolved, setShowResolved] = useState(false);

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (filterSeverity !== "all" && n.severity !== filterSeverity) return false;
      if (filterStatus !== "all" && n.status !== filterStatus) return false;
      if (!showResolved && n.status === "resolved") return false;
      return true;
    });
  }, [notifications, filterSeverity, filterStatus, showResolved]);

  const unreadCount = notifications.filter((n) => n.status === "unread").length;
  const criticalCount = notifications.filter((n) => n.severity === "critical" && n.status !== "resolved").length;

  function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: "read" as const } : n))
    );
  }

  function markAllRead() {
    setNotifications((prev) =>
      prev.map((n) => (n.status === "unread" ? { ...n, status: "read" as const } : n))
    );
  }

  function resolveNotification(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: "resolved" as const } : n))
    );
  }

  return (
    <div className="space-y-6">
      {/* Demo mode banner */}
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-300">
        <strong>Demo mode</strong> — Showing sample notifications. Connect your live systems for real-time alerts.
      </div>

      {/* Summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-text-muted" />
            <span className="text-sm font-medium text-text-primary">{notifications.length} notifications</span>
          </div>
          {unreadCount > 0 && (
            <span className="rounded-full bg-brand/20 px-2 py-0.5 text-xs font-medium text-brand">
              {unreadCount} unread
            </span>
          )}
          {criticalCount > 0 && (
            <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
              {criticalCount} critical
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-muted transition hover:text-text-primary"
            >
              Mark all read
            </button>
          )}
          <label className="flex items-center gap-2 text-xs text-text-muted cursor-pointer">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
              className="rounded accent-brand"
            />
            Show resolved
          </label>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Filter className="h-4 w-4 text-text-muted" />
        {(["all", "critical", "warning", "info"] as const).map((sev) => (
          <button
            key={sev}
            onClick={() => setFilterSeverity(sev)}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              filterSeverity === sev
                ? "border-brand bg-brand/10 text-brand"
                : "border-border text-text-muted hover:border-brand/50"
            }`}
          >
            {sev === "all" ? "All severities" : sev.charAt(0).toUpperCase() + sev.slice(1)}
          </button>
        ))}
        <span className="mx-2 text-text-faint">|</span>
        {(["all", "unread", "read", "resolved"] as const).map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              filterStatus === st
                ? "border-brand bg-brand/10 text-brand"
                : "border-border text-text-muted hover:border-brand/50"
            }`}
          >
            {st === "all" ? "All statuses" : st.charAt(0).toUpperCase() + st.slice(1)}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface px-6 py-12 text-center">
            <Bell className="h-8 w-8 mx-auto text-text-faint" />
            <p className="mt-3 text-sm text-text-muted">No notifications match your filters.</p>
          </div>
        ) : (
          filtered.map((notification) => {
            const config = severityConfig[notification.severity];
            const Icon = config.icon;
            return (
              <div
                key={notification.id}
                className={`rounded-xl border p-4 transition ${
                  notification.status === "unread"
                    ? `${config.bg} border-l-4`
                    : "border-border bg-surface opacity-70"
                }`}
                style={{ borderLeftColor: notification.status === "unread" ? undefined : "transparent" }}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${config.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`text-sm font-medium ${notification.status === "unread" ? "text-text-primary" : "text-text-secondary"}`}>
                        {notification.title}
                      </h4>
                      {notification.status === "unread" && (
                        <span className="h-2 w-2 rounded-full bg-brand" />
                      )}
                    </div>
                    <p className="mt-1 text-xs text-text-muted">{notification.body}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-text-faint">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </span>
                      {notification.dueAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Due: {new Date(notification.dueAt).toLocaleDateString()}
                        </span>
                      )}
                      <span>{categoryLabels[notification.category]}</span>
                      <span>via {notification.source}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      {notification.linkHref && (
                        <Link
                          href={notification.linkHref}
                          onClick={() => markAsRead(notification.id)}
                          className="flex items-center gap-1 rounded-lg bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand transition hover:bg-brand/20"
                        >
                          {notification.linkLabel || "View"}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                      {notification.status === "unread" && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-muted transition hover:text-text-primary"
                        >
                          Mark read
                        </button>
                      )}
                      {notification.status !== "resolved" && (
                        <button
                          onClick={() => resolveNotification(notification.id)}
                          className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-xs text-emerald-300 transition hover:bg-emerald-500/10"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
