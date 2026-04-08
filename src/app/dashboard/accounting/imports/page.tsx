import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { CsvImportWorkflow } from "@/components/accounting/csv-import-workflow";
import { MetricCard } from "@/components/ui/metric-card";
import { loadAccountingWorkspace } from "@/lib/data/accounting-core";
import { loadImportWorkspace } from "@/lib/data/import-jobs";

export default async function AccountingImportsPage() {
  const [accountingWorkspace, importWorkspace] = await Promise.all([
    loadAccountingWorkspace(),
    loadImportWorkspace(),
  ]);
  const totalRows = importWorkspace.datasets.reduce((sum, dataset) => sum + dataset.rows.length, 0);
  const warningRows = importWorkspace.datasets.reduce(
    (sum, dataset) => sum + dataset.rows.filter((row) => row.status === "warning").length,
    0,
  );
  const errorRows = importWorkspace.datasets.reduce(
    (sum, dataset) => sum + dataset.rows.filter((row) => row.status === "error").length,
    0,
  );
  const promotedRows = importWorkspace.datasets.reduce((sum, dataset) => sum + dataset.promotedRowCount, 0);
  const readyToPromoteRows = importWorkspace.datasets.reduce((sum, dataset) => sum + dataset.promotionReadyCount, 0);
  const persistedJobs = importWorkspace.datasets.filter((dataset) => dataset.backendMode === "persisted").length;
  const recentDatasets = [...importWorkspace.datasets].slice(0, 3);

  return (
    <AppShell
      title="Imports"
      description="Stage files, apply mappings, and validate rows before posting."
    >
      <div className="grid gap-5 md:grid-cols-3">
        <MetricCard label="Files" value={String(importWorkspace.datasets.length)} detail="Bank and payroll sources staged" />
        <MetricCard label="Rows" value={String(totalRows)} detail="Total staged transactions" />
        <MetricCard label="Ready" value={String(readyToPromoteRows)} detail={`${promotedRows} already promoted`} />
      </div>

      <div className="mt-8 grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <section className="rounded-2xl border border-border bg-surface-mid p-6">
          <div className="text-[11px] uppercase tracking-[0.15em] text-accent/70">Workflow</div>
          <ul className="mt-4 space-y-1.5 text-sm text-text-muted/60">
            <li>Choose a source file and apply a mapping profile.</li>
            <li>Review posting suggestions and validation results.</li>
            <li>Promote clean rows into transactions.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-surface-mid p-6">
          <div className="text-[11px] uppercase tracking-[0.15em] text-accent/70">Recent jobs</div>
          <div className="mt-4 grid gap-3">
            {recentDatasets.map((dataset) => (
              <div key={dataset.id} className="rounded-xl border border-border bg-surface px-4 py-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-text-primary">{dataset.fileName}</div>
                    <div className="mt-1 text-xs text-text-muted">
                      {dataset.source} • {dataset.uploadedAt} • {dataset.periodLabel}
                    </div>
                  </div>
                  <div className="text-right text-xs text-text-muted">
                    {dataset.promotionReadyCount} ready • {dataset.blockedRowCount} blocked
                  </div>
                </div>
                <div className="mt-2 text-xs text-text-muted">
                  {dataset.persistedStatusReason ?? "Review mappings, clear issues, and move the clean rows into accounting review."}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 text-[11px] uppercase tracking-[0.15em] text-accent/70">Workspaces</div>
          <div className="mt-3 space-y-2">
            <Link href="/dashboard/accounting/pipeline" className="block rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-muted transition hover:text-text-primary hover:bg-surface/70">
              Pipeline
            </Link>
            <Link href="/dashboard/accounting/transactions" className="block rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-muted transition hover:text-text-primary hover:bg-surface/70">
              Transactions
            </Link>
            <Link href="/dashboard/accounting/periods" className="block rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-muted transition hover:text-text-primary hover:bg-surface/70">
              Periods
            </Link>
          </div>
        </section>
      </div>

      <div className="mt-6">
        <CsvImportWorkflow
          accounts={accountingWorkspace.chartOfAccounts}
          companySlug={accountingWorkspace.company.slug}
          workspace={importWorkspace}
        />
      </div>
    </AppShell>
  );
}
