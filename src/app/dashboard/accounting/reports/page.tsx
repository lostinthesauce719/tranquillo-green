import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { PLStatement } from "@/components/accounting/pl-statement";

export const metadata = {
  title: "Financial Reports — Tranquillo Green",
  description: "Income statement, balance sheet, and trial balance for your cannabis operation.",
};

export default function FinancialReportsPage() {
  return (
    <AppShell
      title="Financial Reports"
      description="Income statement, balance sheet, and trial balance. Period-over-period comparison with 280E impact analysis."
    >
      {/* Quick nav */}
      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href="/dashboard/accounting/reports"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white"
        >
          Income Statement
        </Link>
        <Link
          href="/dashboard/accounting/reports/balance-sheet"
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-text-muted transition hover:text-text-primary"
        >
          Balance Sheet
        </Link>
        <Link
          href="/dashboard/accounting/reports/trial-balance"
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-text-muted transition hover:text-text-primary"
        >
          Trial Balance
        </Link>
      </div>

      <PLStatement />
    </AppShell>
  );
}
