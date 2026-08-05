import { AppShell } from "@/components/shell/app-shell";
import { PayrollModule } from "@/components/accounting/payroll-module";

export const metadata = {
  title: "Payroll — Tranquillo Green",
  description: "Employee payroll and 280E plant-touching labor allocation.",
};

export default function PayrollPage() {
  return (
    <AppShell
      title="Payroll & Labor Allocation"
      description="Manage employee payroll and allocate labor costs between plant-touching (COGS) and non-plant-touching (OpEx) for 280E compliance."
    >
      <PayrollModule />
    </AppShell>
  );
}
