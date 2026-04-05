"use client";

import { useState } from "react";
import Link from "next/link";
import { AccountingStatusBadge } from "@/components/accounting/accounting-status-badge";
import { californiaOperatorDemo } from "@/lib/demo/accounting";
import type { DemoCashReconciliationItem } from "@/lib/demo/accounting-operations";
import type { ReconciliationMutation, WriteResult } from "@/lib/accounting-write-contracts";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function accountTypeLabel(type: DemoCashReconciliationItem["accountType"]) {
  switch (type) {
    case "drawer":
      return "Drawer";
    case "vault":
      return "Vault";
    case "bank_clearing":
      return "Bank clearing";
    case "bank":
      return "Bank";
  }
}

function statusTone(status: DemoCashReconciliationItem["status"]) {
  switch (status) {
    case "balanced":
      return "emerald" as const;
    case "ready_to_post":
      return "blue" as const;
    case "investigating":
      return "amber" as const;
    case "exception":
      return "rose" as const;
  }
}

function actionTone(status: DemoCashReconciliationItem["actions"][number]["status"]) {
  switch (status) {
    case "done":
      return "emerald" as const;
    case "in_progress":
      return "amber" as const;
    case "todo":
      return "slate" as const;
  }
}

export function CashReconciliationWorkspace({ items }: { items: DemoCashReconciliationItem[] }) {
  const [workspaceItems, setWorkspaceItems] = useState(items);
  const [messages, setMessages] = useState<Record<string, string | null>>({});
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  async function runAction(itemId: string, action: ReconciliationMutation["action"]) {
    const payload: ReconciliationMutation = {
      companySlug: californiaOperatorDemo.company.slug,
      reconciliationId: itemId,
      action,
    };

    setPendingKey(`${itemId}:${action}`);
    try {
      const response = await fetch("/api/accounting/reconciliations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as WriteResult<DemoCashReconciliationItem> & { message?: string };
      if (!response.ok || !result.item) {
        throw new Error(result.message ?? "Could not update reconciliation state.");
      }

      setWorkspaceItems((current) => current.map((item) => (item.id === itemId ? result.item! : item)));
      setMessages((current) => ({ ...current, [itemId]: result.message }));
    } catch (error) {
      setMessages((current) => ({
        ...current,
        [itemId]: error instanceof Error ? error.message : "Could not update reconciliation state.",
      }));
    } finally {
      setPendingKey((current) => (current?.startsWith(`${itemId}:`) ? null : current));
    }
  }

  return (
    <div className="space-y-4">
      {workspaceItems.map((item) => {
        const varianceTone = item.varianceAmount === 0 ? "text-emerald-200" : item.varianceAmount < 0 ? "text-rose-200" : "text-amber-200";
        const noteLabel = `${item.investigationNotes.length} investigation note${item.investigationNotes.length === 1 ? "" : "s"}`;
        const varianceLabel = item.status === "exception" || item.status === "investigating" ? "Variance case open" : "No variance case open";
        const reviewLabel = item.status === "ready_to_post" ? "Queued for review" : "Not yet queued for review";
        const isPending = pendingKey?.startsWith(`${item.id}:`) ?? false;

        return (
          <section key={item.id} className="rounded-2xl border border-border bg-surface-mid p-5">
            <div className="flex flex-col gap-4 border-b border-border pb-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-accent">{item.periodLabel} • {item.location}</div>
                <h2 className="mt-2 text-xl font-semibold">{item.accountName}</h2>
                <p className="mt-2 text-sm text-text-muted">{accountTypeLabel(item.accountType)} workspace owned by {item.owner}. Last counted {item.lastCountedAt}.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <AccountingStatusBadge label={item.status.replaceAll("_", " ")} tone={statusTone(item.status)} />
                <AccountingStatusBadge label={accountTypeLabel(item.accountType)} tone="slate" />
                {isPending ? <AccountingStatusBadge label="syncing" tone="blue" /> : null}
              </div>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-border bg-surface p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Expected</div>
                    <div className="mt-2 text-xl font-semibold">{currencyFormatter.format(item.expectedAmount)}</div>
                  </div>
                  <div className="rounded-2xl border border-border bg-surface p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Actual</div>
                    <div className="mt-2 text-xl font-semibold">{currencyFormatter.format(item.actualAmount)}</div>
                  </div>
                  <div className="rounded-2xl border border-border bg-surface p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Variance</div>
                    <div className={`mt-2 text-xl font-semibold ${varianceTone}`}>{currencyFormatter.format(item.varianceAmount)}</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Source context</div>
                  <ul className="mt-3 space-y-2 text-sm text-text-muted">
                    {item.sourceContext.map((context) => (
                      <li key={context}>• {context}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-surface p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Investigation notes</div>
                  <ul className="mt-3 space-y-2 text-sm text-text-muted">
                    {item.investigationNotes.map((note) => (
                      <li key={note}>• {note}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Action queue</div>
                      <p className="mt-2 text-sm text-text-muted">Reconciliation controls now prefer persisted server-backed mutations and safely fall back to demo-safe local behavior when Convex is unavailable.</p>
                    </div>
                    <AccountingStatusBadge label="Server-backed with safe fallback" tone="slate" />
                  </div>
                  <div className="mt-3 space-y-3">
                    {item.actions.map((action) => (
                      <div key={`${item.id}-${action.title}`} className="rounded-xl border border-border bg-background px-3 py-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="font-medium">{action.title}</div>
                            <div className="mt-1 text-sm text-text-muted">Owner: {action.owner}</div>
                          </div>
                          <AccountingStatusBadge label={action.status.replaceAll("_", " ")} tone={actionTone(action.status)} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-border bg-background px-3 py-3 text-sm text-text-muted">{noteLabel}</div>
                    <div className="rounded-xl border border-border bg-background px-3 py-3 text-sm text-text-muted">{varianceLabel}</div>
                    <div className="rounded-xl border border-border bg-background px-3 py-3 text-sm text-text-muted">{reviewLabel}</div>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => void runAction(item.id, "log_note")}
                      className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-text-primary transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Log note
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => void runAction(item.id, "toggle_case")}
                      className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {item.status === "exception" || item.status === "investigating" ? "Close variance case" : "Open variance case"}
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => void runAction(item.id, "toggle_review")}
                      className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-sm text-blue-100 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {item.status === "ready_to_post" ? "Remove from review queue" : "Mark ready for review"}
                    </button>
                    <Link href={`/dashboard/reconciliations/${item.id}`} className="rounded-xl border border-border bg-surface px-3 py-2 text-center text-sm text-text-primary transition hover:bg-surface/70">
                      Open detail
                    </Link>
                  </div>
                  {messages[item.id] ? <div className="mt-4 text-sm text-text-muted">{messages[item.id]}</div> : null}
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
