import { DemoChartOfAccount } from "@/lib/demo/accounting";

const categoryStyles: Record<DemoChartOfAccount["category"], string> = {
  asset: "bg-blue-500/10 text-blue-200 border-blue-500/20",
  liability: "bg-amber-500/10 text-amber-200 border-amber-500/20",
  equity: "bg-violet-500/10 text-violet-200 border-violet-500/20",
  revenue: "bg-emerald-500/10 text-emerald-200 border-emerald-500/20",
  cogs: "bg-teal-500/10 text-teal-200 border-teal-500/20",
  opex: "bg-rose-500/10 text-rose-200 border-rose-500/20",
};

const taxTreatmentStyles: Record<DemoChartOfAccount["taxTreatment"], string> = {
  deductible: "bg-emerald-500/10 text-emerald-200 border-emerald-500/20",
  cogs: "bg-cyan-500/10 text-cyan-200 border-cyan-500/20",
  nondeductible: "bg-rose-500/10 text-rose-200 border-rose-500/20",
};

export function ChartOfAccountsTable({ accounts }: { accounts: DemoChartOfAccount[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface-mid">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border text-left text-sm">
          <thead className="bg-surface/80 text-xs uppercase tracking-[0.2em] text-text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Subcategory</th>
              <th className="px-4 py-3 font-medium">Tax treatment</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {accounts.map((account) => (
              <tr key={account.code} className="align-top transition hover:bg-surface/60">
                <td className="whitespace-nowrap px-4 py-4 font-mono text-xs text-text-muted">{account.code}</td>
                <td className="px-4 py-4">
                  <div className="font-medium text-text-primary">{account.name}</div>
                  <div className="mt-1 max-w-xl text-xs text-text-muted">{account.description}</div>
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${categoryStyles[account.category]}`}>
                    {account.category}
                  </span>
                </td>
                <td className="px-4 py-4 text-text-muted">{account.subcategory ?? "—"}</td>
                <td className="px-4 py-4">
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${taxTreatmentStyles[account.taxTreatment]}`}>
                    {account.taxTreatment}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                      account.isActive
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                        : "border-slate-500/20 bg-slate-500/10 text-slate-300"
                    }`}
                  >
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
