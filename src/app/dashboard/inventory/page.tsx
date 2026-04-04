import { AppShell } from "@/components/shell/app-shell";

export default function InventoryPage() {
  return (
    <AppShell title="Inventory" description="Product, batch, and package-level inventory records used to reconcile seed-to-sale activity to the books.">
      <div className="rounded-2xl border border-border bg-surface-mid p-5 text-sm text-text-muted">
        MVP starts with CSV and Metrc-export imports before live API sync.
      </div>
    </AppShell>
  );
}
