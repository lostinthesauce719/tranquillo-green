"use client";

import { useMemo, useState } from "react";
import { californiaOperatorDemo, DemoReportingPeriod } from "@/lib/demo/accounting";
import {
  DemoCloseChecklistItem,
  DemoCloseChecklistStatus,
  DemoCloseReviewStatus,
  DemoCloseWorkflow,
} from "@/lib/demo/accounting-workflows";
import { AccountingStatusBadge } from "@/components/accounting/accounting-status-badge";
import type { ReportingPeriodMutation, WriteResult } from "@/lib/accounting-write-contracts";

type LocalWorkflowState = DemoCloseWorkflow & {
  checklist: DemoCloseChecklistItem[];
  reviewNotes: string[];
};

function formatRange(startDate: string, endDate: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${startDate}T00:00:00`)) + " – " + new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${endDate}T00:00:00`));
}

function getStatusTone(status: DemoReportingPeriod["status"]) {
  switch (status) {
    case "closed":
      return "emerald" as const;
    case "review":
      return "amber" as const;
    case "open":
      return "blue" as const;
  }
}

function getChecklistTone(status: DemoCloseChecklistStatus) {
  switch (status) {
    case "done":
      return "emerald" as const;
    case "in_progress":
      return "blue" as const;
    case "blocked":
      return "rose" as const;
    case "todo":
      return "slate" as const;
  }
}

function getReviewTone(status: DemoCloseReviewStatus) {
  switch (status) {
    case "locked":
      return "emerald" as const;
    case "approved":
      return "blue" as const;
    case "ready_for_review":
      return "amber" as const;
    case "draft":
      return "slate" as const;
  }
}

function computePeriodStatus(workflow: LocalWorkflowState): DemoReportingPeriod["status"] {
  switch (workflow.reviewStatus) {
    case "locked":
      return "closed";
    case "approved":
    case "ready_for_review":
      return "review";
    case "draft":
      return "open";
  }
}

function computeBlockers(workflow: LocalWorkflowState) {
  return workflow.checklist.filter((item) => item.status === "blocked" && item.blocker).map((item) => item.blocker as string);
}

function computeTaskSummary(workflow: LocalWorkflowState) {
  return {
    completed: workflow.checklist.filter((item) => item.status === "done").length,
    total: workflow.checklist.length,
  };
}

function derivePeriodSnapshot(period: DemoReportingPeriod, workflow: LocalWorkflowState): DemoReportingPeriod {
  return {
    ...period,
    status: computePeriodStatus(workflow),
    blockers: computeBlockers(workflow),
    taskSummary: computeTaskSummary(workflow),
    lockedAt: workflow.reviewStatus === "locked" ? period.lockedAt ?? new Date("2026-05-06T17:00:00").toISOString().slice(0, 10) : undefined,
  };
}

async function persistPeriod(period: DemoReportingPeriod, messageFallback: string) {
  const payload: ReportingPeriodMutation = {
    companySlug: californiaOperatorDemo.company.slug,
    periodLabel: period.label,
    status: period.status,
    taskSummary: period.taskSummary,
    blockers: period.blockers,
    lockedAt: period.lockedAt,
    highlights: period.highlights,
  };

  const response = await fetch("/api/accounting/reporting-periods", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = (await response.json()) as WriteResult<DemoReportingPeriod> & { message?: string };
  if (!response.ok) {
    throw new Error(result.message ?? messageFallback);
  }
  return result;
}

export function ReportingPeriodsOverview({
  periods,
  workflows,
}: {
  periods: DemoReportingPeriod[];
  workflows: DemoCloseWorkflow[];
}) {
  const [workflowState, setWorkflowState] = useState<Record<string, LocalWorkflowState>>(
    Object.fromEntries(workflows.map((workflow) => [workflow.periodLabel, { ...workflow, checklist: workflow.checklist.map((item) => ({ ...item })), reviewNotes: [...workflow.reviewNotes] }])),
  );
  const [messages, setMessages] = useState<Record<string, string | null>>({});
  const [pendingPeriod, setPendingPeriod] = useState<string | null>(null);

  const renderedPeriods = useMemo(
    () => periods.map((period) => {
      const workflow = workflowState[period.label];
      return workflow ? derivePeriodSnapshot(period, workflow) : period;
    }),
    [periods, workflowState],
  );

  async function applyWorkflowUpdate(periodLabel: string, updater: (workflow: LocalWorkflowState) => LocalWorkflowState, fallbackMessage: string) {
    const currentWorkflow = workflowState[periodLabel];
    const basePeriod = periods.find((period) => period.label === periodLabel);
    if (!currentWorkflow || !basePeriod) {
      return;
    }

    const nextWorkflow = updater(currentWorkflow);
    const nextPeriod = derivePeriodSnapshot(basePeriod, nextWorkflow);

    setWorkflowState((current) => ({ ...current, [periodLabel]: nextWorkflow }));
    setPendingPeriod(periodLabel);
    try {
      const result = await persistPeriod(nextPeriod, fallbackMessage);
      setMessages((current) => ({ ...current, [periodLabel]: result.message }));
    } catch (error) {
      setMessages((current) => ({
        ...current,
        [periodLabel]: error instanceof Error ? error.message : fallbackMessage,
      }));
    } finally {
      setPendingPeriod((current) => (current === periodLabel ? null : current));
    }
  }

  function updateChecklistItem(periodLabel: string, itemId: string, nextStatus: DemoCloseChecklistStatus) {
    void applyWorkflowUpdate(
      periodLabel,
      (workflow) => ({
        ...workflow,
        reviewStatus: workflow.reviewStatus === "locked" ? "approved" : workflow.reviewStatus,
        reviewNotes: [`Checklist item ${itemId} updated to ${nextStatus.replaceAll("_", " ")} from the period workspace.`, ...workflow.reviewNotes],
        checklist: workflow.checklist.map((item) => {
          if (item.id !== itemId) {
            return item;
          }
          return {
            ...item,
            status: nextStatus,
            blocker: nextStatus === "blocked" ? item.blocker ?? "Waiting on supporting evidence or final reviewer sign-off." : undefined,
          };
        }),
      }),
      `Could not persist checklist change for ${periodLabel}. Local close state still updated safely.`,
    );
  }

  function requestReview(periodLabel: string) {
    void applyWorkflowUpdate(
      periodLabel,
      (workflow) => ({
        ...workflow,
        reviewStatus: "ready_for_review",
        reviewNotes: ["Marked ready for reviewer walkthrough from the close board.", ...workflow.reviewNotes],
      }),
      `Could not persist review request for ${periodLabel}. Local close state still updated safely.`,
    );
  }

  function approvePeriod(periodLabel: string) {
    void applyWorkflowUpdate(
      periodLabel,
      (workflow) => ({
        ...workflow,
        reviewStatus: "approved",
        reviewNotes: ["Controller approval captured from the close board.", ...workflow.reviewNotes],
      }),
      `Could not persist approval for ${periodLabel}. Local close state still updated safely.`,
    );
  }

  function lockPeriod(periodLabel: string) {
    void applyWorkflowUpdate(
      periodLabel,
      (workflow) => ({
        ...workflow,
        reviewStatus: "locked",
        checklist: workflow.checklist.map((item) => ({ ...item, status: item.status === "blocked" ? "in_progress" : item.status })),
        reviewNotes: ["Period locked from the close board using the persisted workflow path when available.", ...workflow.reviewNotes],
      }),
      `Could not persist period lock for ${periodLabel}. Local close state still updated safely.`,
    );
  }

  function reopenPeriod(periodLabel: string) {
    void applyWorkflowUpdate(
      periodLabel,
      (workflow) => ({
        ...workflow,
        reviewStatus: "draft",
        reviewNotes: ["Period reopened for checklist updates and manual journal follow-up.", ...workflow.reviewNotes],
      }),
      `Could not persist reopen action for ${periodLabel}. Local close state still updated safely.`,
    );
  }

  return (
    <div className="grid gap-4">
      {renderedPeriods.map((period) => {
        const workflow = workflowState[period.label];
        const progress = `${period.taskSummary.completed}/${period.taskSummary.total}`;
        const progressWidth = `${period.taskSummary.total === 0 ? 0 : (period.taskSummary.completed / period.taskSummary.total) * 100}%`;
        const blockers = workflow ? computeBlockers(workflow) : period.blockers;
        const canApprove = blockers.length === 0 && workflow?.reviewStatus === "ready_for_review";
        const canLock = blockers.length === 0 && Boolean(workflow) && ["approved", "ready_for_review"].includes(workflow?.reviewStatus ?? "draft");
        const isPending = pendingPeriod === period.label;

        return (
          <section key={period.label} className="rounded-2xl border border-border bg-surface-mid p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-semibold">{period.label}</h2>
                  <AccountingStatusBadge label={period.status.toUpperCase()} tone={getStatusTone(period.status)} />
                  {workflow ? <AccountingStatusBadge label={workflow.reviewStatus.replaceAll("_", " ")} tone={getReviewTone(workflow.reviewStatus)} className="capitalize" /> : null}
                  {blockers.length > 0 ? <AccountingStatusBadge label={`${blockers.length} blockers`} tone="rose" /> : null}
                  {isPending ? <AccountingStatusBadge label="syncing" tone="blue" /> : null}
                </div>
                <p className="mt-2 text-sm text-text-muted">{formatRange(period.startDate, period.endDate)} • Owner: {period.closeOwner} • Target close in {period.closeWindowDays} days</p>
              </div>
              <div className="min-w-[240px] rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-muted">
                <div className="flex items-center justify-between gap-4">
                  <span>Checklist progress</span>
                  <span className="font-medium text-text-primary">{progress}</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-background">
                  <div className="h-2 rounded-full bg-accent" style={{ width: progressWidth }} />
                </div>
                <div className="mt-3 text-xs">
                  {period.lockedAt ? `Locked ${period.lockedAt}` : workflow?.reviewStatus === "ready_for_review" ? `Waiting on ${workflow.reviewer} review` : "Still editable for manual journals and reconciliations"}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_1fr]">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-accent">Close workflow checklist</div>
                <div className="mt-3 space-y-3">
                  {workflow?.checklist.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-border bg-surface px-4 py-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-medium text-text-primary">{item.title}</div>
                            <AccountingStatusBadge label={item.status.replaceAll("_", " ")} tone={getChecklistTone(item.status)} className="capitalize" />
                          </div>
                          <div className="mt-2 text-sm text-text-muted">{item.guidance}</div>
                          <div className="mt-2 text-xs text-text-muted">Owner: {item.owner} • Due {item.dueLabel}</div>
                          {item.blocker ? <div className="mt-2 text-xs text-rose-200">Blocker: {item.blocker}</div> : null}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" disabled={isPending} onClick={() => updateChecklistItem(period.label, item.id, "todo")} className="rounded-lg border border-border px-3 py-2 text-xs text-text-muted transition hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50">
                            To do
                          </button>
                          <button type="button" disabled={isPending} onClick={() => updateChecklistItem(period.label, item.id, "in_progress")} className="rounded-lg border border-border px-3 py-2 text-xs text-text-primary transition hover:bg-surface-mid disabled:cursor-not-allowed disabled:opacity-50">
                            In progress
                          </button>
                          <button type="button" disabled={isPending} onClick={() => updateChecklistItem(period.label, item.id, "done")} className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-50">
                            Done
                          </button>
                          <button type="button" disabled={isPending} onClick={() => updateChecklistItem(period.label, item.id, "blocked")} className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-50">
                            Blocked
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-2xl border border-border bg-surface p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-accent">Review workflow</div>
                  {workflow ? (
                    <div className="mt-4 space-y-4 text-sm text-text-muted">
                      <div className="rounded-xl border border-border bg-surface-mid px-4 py-3">
                        <div className="font-medium text-text-primary">Reviewer: {workflow.reviewer}</div>
                        <div className="mt-1">Approver: {workflow.approver}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" disabled={isPending} onClick={() => requestReview(period.label)} className="rounded-lg border border-border px-3 py-2 text-xs text-text-primary transition hover:bg-surface-mid disabled:cursor-not-allowed disabled:opacity-50">
                          Mark ready for review
                        </button>
                        <button type="button" onClick={() => approvePeriod(period.label)} disabled={!canApprove || isPending} className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs text-blue-200 transition enabled:hover:bg-blue-500/15 disabled:cursor-not-allowed disabled:opacity-50">
                          Approve close
                        </button>
                        <button type="button" onClick={() => lockPeriod(period.label)} disabled={!canLock || isPending} className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200 transition enabled:hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-50">
                          Lock period
                        </button>
                        <button type="button" disabled={isPending} onClick={() => reopenPeriod(period.label)} className="rounded-lg border border-border px-3 py-2 text-xs text-text-muted transition hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50">
                          Reopen
                        </button>
                      </div>
                      {messages[period.label] ? <div>{messages[period.label]}</div> : null}
                    </div>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-border bg-surface p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-accent">Close highlights</div>
                  <ul className="mt-3 space-y-2 text-sm text-text-muted">
                    {period.highlights.map((highlight) => (
                      <li key={highlight}>• {highlight}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-accent">Review notes and blockers</div>
                  {workflow?.reviewNotes.length ? (
                    <ul className="mt-3 space-y-2 text-sm text-text-muted">
                      {workflow.reviewNotes.map((note) => (
                        <li key={note}>• {note}</li>
                      ))}
                    </ul>
                  ) : null}
                  {blockers.length === 0 ? (
                    <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                      No blockers. Period is ready for approval or already locked.
                    </div>
                  ) : (
                    <ul className="mt-4 space-y-2 text-sm text-text-muted">
                      {blockers.map((blocker) => (
                        <li key={blocker}>• {blocker}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
