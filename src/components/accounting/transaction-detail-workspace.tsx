import Link from "next/link";
import { AccountingStatusBadge } from "@/components/accounting/accounting-status-badge";
import { EvidenceBadge, AuditContextBar, ReviewerTimestamp, WhatChangedRationale, SourceLinkBadge } from "@/components/accounting/trust-markers";
import { demoAllocationReviewQueue } from "@/lib/demo/accounting-operations";
import { type DemoTransaction } from "@/lib/demo/accounting";
import { getRelatedAccounts, type DemoTransactionDetail } from "@/lib/demo/transaction-workflows";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function getStatusTone(status: DemoTransaction["status"]) {
  switch (status) {
    case "posted":
      return "emerald" as const;
    case "ready_to_post":
      return "blue" as const;
    case "in_review":
      return "amber" as const;
    case "unposted":
      return "slate" as const;
  }
}

function getReviewTone(state: DemoTransaction["reviewState"]) {
  switch (state) {
    case "ready":
      return "emerald" as const;
    case "needs_mapping":
      return "rose" as const;
    case "drafted":
      return "violet" as const;
    case "posted":
      return "blue" as const;
  }
}

function actionToneClass(tone: DemoTransactionDetail["reviewerActions"][number]["tone"]) {
  switch (tone) {
    case "emerald":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-100";
    case "amber":
      return "border-amber-500/20 bg-amber-500/10 text-amber-100";
    case "violet":
      return "border-violet-500/20 bg-violet-500/10 text-violet-100";
    case "slate":
      return "border-border bg-background text-text-muted";
  }
}

function eventToneClass(tone: DemoTransactionDetail["auditTrail"][number]["tone"]) {
  switch (tone) {
    case "emerald":
      return "border-emerald-500/20 bg-emerald-500/10";
    case "amber":
      return "border-amber-500/20 bg-amber-500/10";
    case "violet":
      return "border-violet-500/20 bg-violet-500/10";
    case "rose":
      return "border-rose-500/20 bg-rose-500/10";
    case "slate":
      return "border-border bg-surface";
  }
}

function stepToneClass(state: DemoTransactionDetail["approvalPath"][number]["state"]) {
  switch (state) {
    case "completed":
      return "border-emerald-500/20 bg-emerald-500/10";
    case "current":
      return "border-blue-500/20 bg-blue-500/10";
    case "upcoming":
      return "border-border bg-surface";
  }
}

export function TransactionDetailWorkspace({ transaction, detail }: { transaction: DemoTransaction; detail: DemoTransactionDetail }) {
  const amountLabel = transaction.direction === "inflow" ? currencyFormatter.format(transaction.amount) : `(${currencyFormatter.format(transaction.amount)})`;
  const relatedAccounts = getRelatedAccounts(transaction);
  const linkedAllocation = detail.linkedAllocationId
    ? demoAllocationReviewQueue.find((item) => item.id === detail.linkedAllocationId)
    : undefined;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-surface-mid p-5">
        <div className="flex flex-col gap-4 border-b border-border pb-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-accent">{transaction.periodLabel} • {transaction.location}</div>
            <h2 className="mt-2 text-2xl font-semibold">{transaction.reference}</h2>
            <p className="mt-2 max-w-3xl text-sm text-text-muted">{detail.summary}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AccountingStatusBadge label={transaction.status.replaceAll("_", " ")} tone={getStatusTone(transaction.status)} className="capitalize" />
            <AccountingStatusBadge label={transaction.reviewState.replaceAll("_", " ")} tone={getReviewTone(transaction.reviewState)} className="capitalize" />
            <AccountingStatusBadge label={transaction.source} tone="slate" className="capitalize" />
            {transaction.needsReceipt ? <AccountingStatusBadge label="support gap" tone="amber" /> : null}
            {transaction.needsReceipt ? <EvidenceBadge tone="missing" label="Support gap" /> : null}
            {!transaction.needsReceipt && transaction.status === "posted" ? <EvidenceBadge tone="verified" /> : null}
            {!transaction.needsReceipt && transaction.status !== "posted" ? <EvidenceBadge tone="partial" /> : null}
          </div>
        </div>

        <div className="mt-4">
          <AuditContextBar
            sourceSystem={transaction.source.toUpperCase()}
            lastVerified={transaction.postedDate}
            documentCount={detail.supportingDocs.items.length}
            confidence={transaction.status === "posted" && !transaction.needsReceipt ? 0.98 : transaction.needsReceipt ? 0.55 : 0.78}
          />
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Payee</div>
            <div className="mt-2 font-medium text-text-primary">{transaction.payee}</div>
            <div className="mt-1 text-sm text-text-muted">{transaction.date}</div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Amount impact</div>
            <div className="mt-2 text-xl font-semibold text-text-primary">{amountLabel}</div>
            <div className="mt-1 text-sm text-text-muted">{detail.amountImpact.functionalArea}</div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Debit</div>
            <div className="mt-2 font-medium text-text-primary">{detail.amountImpact.debitLabel}</div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Credit</div>
            <div className="mt-2 font-medium text-text-primary">{detail.amountImpact.creditLabel}</div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-surface-mid p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Source and mapping</div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-surface p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Source detail</div>
                <p className="mt-3 text-sm text-text-muted">{detail.sourceDetail}</p>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Suggested mapping reason</div>
                <p className="mt-3 text-sm text-text-muted">{detail.suggestedMappingReason}</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Memo / description</div>
              <div className="mt-2 font-medium text-text-primary">{transaction.description}</div>
              <p className="mt-2 text-sm text-text-muted">{transaction.journalHint}</p>
              <div className="mt-3 rounded-xl border border-accent/20 bg-accent/5 px-3 py-3 text-sm text-text-primary">Tax lens: {detail.amountImpact.taxView}</div>
              {detail.whatChanged && detail.whatChanged.length > 0 ? (
                <div className="mt-4">
                  <WhatChangedRationale changes={detail.whatChanged} />
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface-mid p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Related accounts and support package</div>
            <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-3">
                {relatedAccounts.map((account) => (
                  <div key={account.code} className="rounded-2xl border border-border bg-surface p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium text-text-primary">{account.code} · {account.name}</div>
                      <AccountingStatusBadge label={account.taxTreatment} tone={account.taxTreatment === "cogs" ? "blue" : account.taxTreatment === "deductible" ? "emerald" : "rose"} className="capitalize" />
                    </div>
                    <div className="mt-2 text-sm text-text-muted">{account.description}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Supporting docs</div>
                  <AccountingStatusBadge
                    label={detail.supportingDocs.received ? "support complete" : "missing docs"}
                    tone={detail.supportingDocs.received ? "emerald" : "amber"}
                  />
                </div>
                <ul className="mt-4 space-y-2 text-sm text-text-muted">
                  {detail.supportingDocs.items.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
                {detail.supportingDocs.gapNote ? <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-3 text-sm text-amber-100">{detail.supportingDocs.gapNote}</div> : null}
                {linkedAllocation ? (
                  <div className="mt-4 rounded-xl border border-violet-500/20 bg-violet-500/10 px-3 py-3 text-sm text-violet-100">
                    Linked 280E review item: {linkedAllocation.accountCode} · {linkedAllocation.accountName} — {linkedAllocation.driverValue}
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-surface-mid p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Approval workflow</div>
            <div className="mt-4 space-y-3">
              {detail.approvalPath.map((step, index) => (
                <div key={step.label} className={`rounded-2xl border p-4 ${stepToneClass(step.state)}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-text-primary">{index + 1}. {step.label}</div>
                    <AccountingStatusBadge label={step.state} tone={step.state === "completed" ? "emerald" : step.state === "current" ? "blue" : "slate"} className="capitalize" />
                  </div>
                  <div className="mt-2 text-sm text-text-muted">Owner: {step.owner}</div>
                  <div className="mt-1 text-sm text-text-muted">{step.detail}</div>
                  {step.state === "completed" || step.state === "current" ? (
                    <div className="mt-2">
                      <ReviewerTimestamp reviewer={step.owner} timestamp={step.timestamp ?? "Verified"} action={step.state === "current" ? "In progress" : "Completed"} />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface-mid p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Reviewer actions</div>
            <div className="mt-4 grid gap-3">
              {detail.reviewerActions.map((action) => (
                <button key={action.label} className={`rounded-2xl border px-4 py-3 text-left text-sm transition hover:opacity-90 ${actionToneClass(action.tone)}`}>
                  <div className="font-medium">{action.label}</div>
                  <div className="mt-1 opacity-90">{action.detail}</div>
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-border bg-background px-3 py-3 text-sm text-text-muted">
              Reviewer attribution is demo-backed and non-persistent, but the UI mirrors an audit-friendly approval package.
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface-mid p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Audit trail</div>
            <div className="mt-4 space-y-3">
              {detail.auditTrail.map((event) => (
                <div key={`${event.at}-${event.action}`} className={`rounded-2xl border p-4 ${eventToneClass(event.tone)}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="font-medium text-text-primary">{event.action}</div>
                    <div className="text-xs text-text-muted">{event.at}</div>
                  </div>
                  <div className="mt-2 text-sm text-text-muted">{event.actor}</div>
                  <div className="mt-1 text-sm text-text-muted">{event.detail}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/accounting/transactions" className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary transition hover:bg-surface/70">
          Back to transactions
        </Link>
        {linkedAllocation ? (
          <Link href="/dashboard/allocations/support-schedule" className="rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-sm text-violet-100 transition hover:bg-violet-500/20">
            Open linked 280E support schedule
          </Link>
        ) : null}
      </div>
    </div>
  );
}
