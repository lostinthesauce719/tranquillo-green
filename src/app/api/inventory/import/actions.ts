"use server";

import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
import { anyApi } from "convex/server";

export async function importInventoryCsv(args: {
  companyId: string;
  rows: Array<{
    productName: string;
    sku: string;
    packageTag?: string;
    quantity: number;
    unitCost: number;
    category?: string;
    unitOfMeasure?: string;
    locationName?: string;
  }>;
}): Promise<
  Array<{
    rowIdx: number;
    success: boolean;
    message: string;
  }>
> {
  const convex = await getAuthenticatedConvexClient();
  if (!convex) {
    throw new Error("Unauthorized: no Convex client");
  }
  return await convex.mutation(
    (anyApi as any).inventoryImport.importInventoryFromCsv,
    { companyId: args.companyId, rows: args.rows }
  );
}
