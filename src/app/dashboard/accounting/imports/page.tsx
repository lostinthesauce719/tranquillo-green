import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { CsvImportWorkflow } from "@/components/accounting/csv-import-workflow";
import { MetricCard } from "@/components/ui/metric-card";
import { demoChartOfAccounts } from "@/lib/demo/accounting";
import { demoImportDatasets } from "@/lib/demo/accounting-workflows";

export default function AccountingImportsPage() {
  const totalRows = demoImportDatasets.reduce((sum, dataset) => sum + dataset.rows.length, 0);
  const warningRows = demoImportDatasets.reduce(
    (sum, dataset) => sum + dataset.rows.filter((row) => row.status === "warning").length,
    0,
  );
  const errorRows = demoImportDatasets.reduce(
    (sum, dataset) => sum + dataset.rows.filter((row) => row.status === "error").length,
    0,
  );

  return (
    <AppShell
      title="Imports"
      description="CSV import mapping and validation workspace for accounting. The entire flow uses demo files and client state so the app stays statically buildable while still feeling like a real staging workflow."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Demo files" value={String(demoImportDatasets.length)} detail="Bank and payroll source formats staged for review" />
        <MetricCard label="Rows previewed" value={String(totalRows)} detail="Total staged transactions across demo imports" />
        <MetricCard label="Warnings" value={String(warningRows)} detail="Rows that need support or accounting review before post" />
        <MetricCard label="Errors" value={String(errorRows)} detail="Rows blocked by missing required data or suspense fallback" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <section className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-accent">Workflow coverage</div>
          <ul className="mt-4 space-y-3 text-sm text-text-muted">
            <li>• Choose a staged source file and apply a reusable mapping profile.</li>
            <li>• Inspect required field coverage for date, description, reference, and amount handling.</li>
            <li>• Review row-level posting suggestions, confidence, warnings, and blocking errors.</li>
            <li>• Stage the import locally with no server mutation and no Convex dependency.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-accent">Related workspaces</div>
          <div className="mt-4 grid gap-3">
            <Link href="/dashboard/accounting/transactions" className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary transition hover:bg-surface/70">
              Open transactions review
            </Link>
            <Link href="/dashboard/accounting/periods" className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary transition hover:bg-surface/70">
              Open close periods
            </Link>
          </div>
        </section>
      </div>

      <div className="mt-6">
        <CsvImportWorkflow accounts={demoChartOfAccounts} />
      </div>
    </AppShell>
  );
}
