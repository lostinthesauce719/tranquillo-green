import { AppShell } from "@/components/shell/app-shell";
import { SupportScheduleReport } from "@/components/accounting/support-schedule-report";
import { demoSupportScheduleReport } from "@/lib/demo/accounting-reports";

export default function SupportSchedulePage() {
  return (
    <AppShell
      title="280E support schedule"
      description="First-pass support schedule for deductible versus nondeductible allocations. The page is demo-backed and static-safe, but organized like an audit-ready monthly tax workpaper."
    >
      <SupportScheduleReport report={demoSupportScheduleReport} />
    </AppShell>
  );
}
