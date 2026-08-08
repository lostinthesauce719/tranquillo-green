import { AppShell } from "@/components/shell/app-shell";
import { BillingPage } from "@/components/billing/billing-page";

export const metadata = {
  title: "Billing & Plans — Tranquillo Green",
  description: "Manage your subscription, billing, and plan.",
};

export default function BillingRoute() {
  return (
    <AppShell
      title="Billing & Plans"
      description="Choose the plan that fits your operation. All plans include a 14-day free trial."
    >
      <BillingPage />
    </AppShell>
  );
}
