import { AppShell } from "@/components/shell/app-shell";
import { BalanceSheet } from "@/components/accounting/balance-sheet";

export const metadata = {
  title: "Balance Sheet — Tranquillo Green",
  description:
    "Balance sheet for your cannabis operation with 280E inventory valuation notes.",
};

export default function BalanceSheetPage() {
  return (
    <AppShell
      title="Balance Sheet"
      description="Assets, liabilities, and equity. Includes 280E-specific inventory valuation guidance for cannabis operators."
    >
      <BalanceSheet />
    </AppShell>
  );
}
