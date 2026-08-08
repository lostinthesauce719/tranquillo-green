"use client";
import Link from "next/link";
import { AllocationPolicyWorkspace } from "@/components/accounting/allocation-policy-workspace";
import { AppShell } from "@/components/shell/app-shell";
import { AiAssistant } from "@/components/ai/ai-assistant";

export default function AllocationPoliciesPage() {
  return (
    <AppShell
      title="Allocation Policies"
      description="Create and manage 280E allocation policies. Each policy defines how shared costs split between deductible (COGS) and nondeductible amounts. Only one policy can be active at a time."
    >
      <div className="mb-6 flex gap-3">
        <Link
          href="/dashboard/allocations"
          className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary transition hover:bg-surface/70"
        >
          Review Queue
        </Link>
        <Link
          href="/dashboard/allocations/history"
          className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary transition hover:bg-surface/70"
        >
          Override History
        </Link>
        <Link
          href="/dashboard/allocations/support-schedule"
          className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary transition hover:bg-surface/70"
        >
          Support Schedule
        </Link>
      </div>

      <AllocationPolicyWorkspace />

      <AiAssistant pageContext="/dashboard/allocations/policies" />
    </AppShell>
  );
}
