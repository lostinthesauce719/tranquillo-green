import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { ReconciliationDetailWorkspace } from "@/components/accounting/reconciliation-detail-workspace";
import { demoCashReconciliations, getDemoCashReconciliation } from "@/lib/demo/accounting-operations";

export function generateStaticParams() {
  return demoCashReconciliations.map((item) => ({ id: item.id }));
}

export default function ReconciliationDetailPage({ params }: { params: { id: string } }) {
  const item = getDemoCashReconciliation(params.id);

  if (!item) {
    notFound();
  }

  return (
    <AppShell
      title={`Reconciliation detail · ${item.accountName}`}
      description="Static drill-down workspace for controller review of expected vs actual balances, variance drivers, source breakdown, investigation notes, and related transactions."
    >
      <ReconciliationDetailWorkspace item={item} />
    </AppShell>
  );
}
