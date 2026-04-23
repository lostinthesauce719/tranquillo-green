import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { TransactionDetailWorkspace } from "@/components/accounting/transaction-detail-workspace";
import { demoTransactions } from "@/lib/demo/accounting";
import { loadTransactionPageData } from "@/lib/data/accounting-core";

export function generateStaticParams() {
  return demoTransactions.map((transaction) => ({ id: transaction.id }));
}

export const dynamicParams = true;

export default async function TransactionDetailPage({ params }: { params: { id: string } }) {
  const data = await loadTransactionPageData(params.id);

  if (!data) {
    notFound();
  }

  return (
    <AppShell
      title={`Transaction detail · ${data.transaction.reference}`}
      description={`Server-rendered transaction review workspace using ${data.source === "convex" ? "persisted Convex data" : "demo fallback data"}. Static builds remain safe because the loader falls back automatically when Convex is unavailable.`}
    >
      <TransactionDetailWorkspace transaction={data.transaction} detail={data.detail} />
    </AppShell>
  );
}
