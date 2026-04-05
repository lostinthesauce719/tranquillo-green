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

  return (
    <AppShell
      title="Imports"
      description={
        importWorkspace.source === "convex"
          ? "CSV imports now load from the persisted import-job backend when Convex is available, while still falling back safely to demo data during static builds and disconnected runtime."
          : "CSV import mapping and validation workspace running on the demo-safe fallback path because the persisted Convex import backend is unavailable in this runtime."
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={importWorkspace.source === "convex" ? "Persisted jobs" : "Demo files"} value={String(importWorkspace.datasets.length)} detail="Bank and payroll source formats staged for review" />
        <MetricCard label="Rows previewed" value={String(totalRows)} detail="Total staged transactions across current imports" />
        <MetricCard label="Warnings" value={String(warningRows)} detail="Rows that need support or accounting review before post" />
        <MetricCard label="Promoted rows" value={String(promotedRows)} detail={`${errorRows} blocked row${errorRows === 1 ? "" : "s"} still need repair`} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <section className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-accent">Workflow coverage</div>
          <ul className="mt-4 space-y-3 text-sm text-text-muted">
            <li>• Choose a staged source file and apply a reusable mapping profile.</li>
            <li>• Persist source-file metadata, profile mappings, and row-level validation results when Convex is available.</li>
            <li>• Review row-level posting suggestions, confidence, warnings, and blocking errors.</li>
            <li>• Promote eligible import rows into transactions with a safe demo fallback when the backend path is unavailable.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-accent">Related workspaces</div>
          <div className="mt-4 grid gap-3">
            <Link href="/dashboard/accounting/pipeline" className="rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-sm text-violet-100 transition hover:bg-violet-500/20">
              Open transaction pipeline
            </Link>
            <Link href="/dashboard/accounting/transactions" className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary transition hover:bg-surface/70">
              Open transactions review
            </Link>
            <Link href="/dashboard/accounting/periods" className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary transition hover:bg-surface/70">
              Open close periods
            </Link>
            <Link href="/dashboard/accounting/close" className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary transition hover:bg-surface/70">
              Open month-end close dashboard
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
