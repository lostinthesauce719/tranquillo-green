import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { ReconciliationDetailWorkspace } from "@/components/accounting/reconciliation-detail-workspace";
import { demoCashReconciliations } from "@/lib/demo/accounting-operations";
import { loadReconciliationPageData } from "@/lib/data/accounting-core";

export function generateStaticParams() {
  return demoCashReconciliations.map((item) => ({ id: item.id }));
}

export const dynamicParams = true;

export default async function ReconciliationDetailPage({ params }: { params: { id: string } }) {
  const data = await loadReconciliationPageData(params.id);

  if (!data) {
    notFound();
  }

  return (
    <AppShell
      title={`Reconciliation detail · ${data.item.accountName}`}
      description={`Server-rendered drill-down workspace for controller review of expected vs actual balances, variance drivers, source breakdown, investigation notes, and related transactions using ${data.source === "convex" ? "persisted Convex data" : "demo fallback data"}.`}
    >
      <ReconciliationDetailWorkspace item={data.item} />
    </AppShell>
  );
}
