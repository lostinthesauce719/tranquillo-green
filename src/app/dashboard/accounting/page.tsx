import { AppShell } from "@/components/shell/app-shell";

export default function AccountingPage() {
  return (
    <AppShell title="Accounting" description="Chart of accounts, transactions, period close, and operator financial reporting.">
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface-mid p-5">
          <h2 className="text-lg font-semibold">Primary entities</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text-muted">
            <li>chartOfAccounts</li>
            <li>transactions</li>
            <li>transactionLines</li>
            <li>reportingPeriods</li>
            <li>counterparties</li>
          </ul>
        </section>
        <section className="rounded-2xl border border-border bg-surface-mid p-5">
          <h2 className="text-lg font-semibold">MVP deliverables</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text-muted">
            <li>COA templates by operator type</li>
            <li>manual journal entry and CSV imports</li>
            <li>P&amp;L, balance sheet, trial balance</li>
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
