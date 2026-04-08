import Link from "next/link";
import { TransactionPipelineBoard } from "@/components/accounting/transaction-pipeline-board";
import { AppShell } from "@/components/shell/app-shell";
import { MetricCard } from "@/components/ui/metric-card";
import { loadImportWorkspace } from "@/lib/data/import-jobs";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default async function AccountingPipelinePage() {
  const importWorkspace = await loadImportWorkspace();
  const stages = importWorkspace.pipelineStages;
  const imported = stages.find((stage) => stage.id === "imported");
  const needsReview = stages.find((stage) => stage.id === "needs_review");
  const ready = stages.find((stage) => stage.id === "ready_to_post");
  const posted = stages.find((stage) => stage.id === "posted");
  const totalBlockers = stages.reduce((sum, stage) => sum + stage.blockerCount, 0);

  return (
    <AppShell
      title="Transaction pipeline"
      description={importWorkspace.sourceDetail}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Imported rows" value={String(imported?.cards.length ?? 0)} detail={`${imported?.blockerCount ?? 0} imports still blocked before queue handoff`} />
        <MetricCard label="Needs review" value={String(needsReview?.cards.length ?? 0)} detail={`${needsReview?.blockerCount ?? 0} transactions still waiting on docs or reviewer judgment`} />
        <MetricCard label="Ready to post" value={String(ready?.cards.length ?? 0)} detail={currencyFormatter.format(ready?.totalAmount ?? 0)} />
        <MetricCard label="Posted" value={String(posted?.cards.length ?? 0)} detail={`${totalBlockers} total blockers tracked across the pipeline`} />
      </div>

      {importWorkspace.fallbackReason ? (
        <section className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
          Demo fallback active: {importWorkspace.fallbackReason}
        </section>
      ) : null}

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-accent">Operator handoff logic</div>
          <div className="mt-2 text-sm text-text-muted">
            This board answers one question: what can move forward now, what still needs cleanup, and which items are clean enough to hand from import operations into accounting review.
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-muted">Imports stage keeps mapping repairs, duplicate risk, and source-data anomalies out of the posting queue until jobs are promoted.</div>
            <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-muted">Review stage concentrates missing support, policy judgment, and promoted warning rows in one lane for accountants and controllers.</div>
            <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-muted">Ready-to-post stage acts like the release tray for transactions that survived import checks and now only need final accounting approval.</div>
            <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-muted">Posted stage preserves proof that the transaction cleared review and can now join the close binder, export packet, and audit trail.</div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-accent">Related close actions</div>
          <div className="mt-4 grid gap-3">
            <Link href="/dashboard/accounting/close" className="rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-sm text-violet-100 transition hover:bg-violet-500/20">
              Open month-end close dashboard
            </Link>
            <Link href="/dashboard/accounting/imports" className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary transition hover:bg-surface/70">
              Return to imports workspace
            </Link>
            <Link href="/dashboard/accounting/transactions" className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary transition hover:bg-surface/70">
              Review all transactions table
            </Link>
          </div>
        </section>
      </div>

      <div className="mt-6">
        <TransactionPipelineBoard stages={stages} source={importWorkspace.source} />
      </div>
    </AppShell>
  );
}
