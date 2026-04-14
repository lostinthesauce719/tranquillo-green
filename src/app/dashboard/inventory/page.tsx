import { loadInventoryWorkspace } from "@/lib/data/inventory";
import InventoryClient from "./inventory-client";

export default async function InventoryPage() {
  const workspace = await loadInventoryWorkspace();

  return (
    <InventoryClient
      source={workspace.source}
      products={workspace.products}
      batches={workspace.batches}
      movements={workspace.movements}
      stats={workspace.stats}
    />
  );
}
