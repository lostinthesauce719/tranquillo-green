import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { TransactionDetailWorkspace } from "@/components/accounting/transaction-detail-workspace";
import { demoTransactions } from "@/lib/demo/accounting";
import { getDemoTransactionDetail } from "@/lib/demo/transaction-workflows";

export function generateStaticParams() {
  return demoTransactions.map((transaction) => ({ id: transaction.id }));
}

export default function TransactionDetailPage({ params }: { params: { id: string } }) {
  const transaction = demoTransactions.find((entry) => entry.id === params.id);
  const detail = getDemoTransactionDetail(params.id);

  if (!transaction || !detail) {
    notFound();
  }

  return (
    <AppShell
      title={`Transaction detail · ${transaction.reference}`}
      description="Static review workspace for transaction approval, support collection, reviewer actions, and audit trail context. This route is pre-rendered from demo data so static builds remain safe."
    >
      <TransactionDetailWorkspace transaction={transaction} detail={detail} />
    </AppShell>
  );
}
