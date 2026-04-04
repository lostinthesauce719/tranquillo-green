import { AppShell } from "@/components/shell/app-shell";

export default function AllocationsPage() {
  return (
    <AppShell title="280E Allocations" description="Deterministic allocation engine first: square footage, labor %, and custom basis with review queue.">
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-surface-mid p-5 text-sm text-text-muted">
          Inputs: allocation policies, supporting documents, employee labor splits, location square footage.
        </div>
        <div className="rounded-2xl border border-border bg-surface-mid p-5 text-sm text-text-muted">
          Outputs: cogsAllocations records, exception queue items, and audit-ready support schedules.
        </div>
      </div>
    </AppShell>
  );
}
