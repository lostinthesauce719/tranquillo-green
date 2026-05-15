import { AppShell } from "@/components/shell/app-shell";
import { TrialBalance } from "@/components/accounting/trial-balance";

export const metadata = {
  title: "Trial Balance — Tranquillo Green",
  description:
    "Trial balance for your cannabis operation with 280E COGS impact analysis.",
};

export default function TrialBalancePage() {
  return (
    <AppShell
      title="Trial Balance"
      description="Chart of accounts with debit and credit balances, grouped by category. Includes 280E-specific COGS guidance for cannabis operators."
    >
      <TrialBalance />
    </AppShell>
  );
}
