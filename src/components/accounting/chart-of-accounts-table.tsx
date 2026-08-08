import { DemoChartOfAccount } from "@/lib/demo/accounting";

const categoryStyles: Record<DemoChartOfAccount["category"], string> = {
  asset: "text-blue-300/70",
  liability: "text-amber-300/70",
  equity: "text-violet-300/70",
  revenue: "text-emerald-300/70",
  cogs: "text-teal-300/70",
  opex: "text-rose-300/70",
};

const taxTreatmentStyles: Record<DemoChartOfAccount["taxTreatment"], string> = {
  deductible: "text-emerald-300/60",
  cogs: "text-cyan-300/60",
  nondeductible: "text-rose-300/60",
};

export function ChartOfAccountsTable({ accounts }: { accounts: DemoChartOfAccount[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface-mid">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border text-left text-sm">
          <thead className="bg-surface/80 text-[10px] uppercase tracking-[0.15em] text-text-muted/50">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Tax</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {accounts.map((account) => (
              <tr key={account.code} className="align-top transition hover:bg-surface/60">
                <td className="whitespace-nowrap px-4 py-4 font-mono text-xs text-text-muted/60">{account.code}</td>
                <td className="px-4 py-4">
                  <div className="text-sm font-medium text-text-primary">{account.name}</div>
                  <div className="mt-0.5 max-w-xl text-xs text-text-muted/50">{account.description}</div>
                </td>
                <td className="px-4 py-4">
                  <span className={`text-xs font-medium capitalize ${categoryStyles[account.category]}`}>
                    {account.category}
                  </span>
                  {account.subcategory ? (
                    <div className="mt-0.5 text-xs text-text-muted/40">{account.subcategory}</div>
                  ) : null}
                </td>
                <td className="px-4 py-4">
                  <span className={`text-xs font-medium capitalize ${taxTreatmentStyles[account.taxTreatment]}`}>
                    {account.taxTreatment}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className={`text-xs font-medium ${account.isActive ? "text-emerald-300/60" : "text-slate-300/40"}`}>
                    {account.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
