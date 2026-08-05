import "server-only";

import { anyApi } from "convex/server";
import { getAuthenticatedConvexClient, getConvexClient, withTimeout } from "@/lib/data/convex-client";

const DEMO_COMPANY_SLUG = "california-operator-demo";

type WorkspaceSource = "demo" | "convex";

export type InventoryProduct = {
  id: string;
  sku: string;
  name: string;
  category: string;
  unitOfMeasure: string;
  active: boolean;
};

export type InventoryBatch = {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  packageTag: string;
  quantityOnHand: number;
  costBasis: number;
  source: string;
};

export type InventoryMovement = {
  id: string;
  batchId: string;
  productName: string;
  movementType: string;
  quantity: number;
  date: string;
  note: string;
};

export type InventoryWorkspace = {
  source: WorkspaceSource;
  products: InventoryProduct[];
  batches: InventoryBatch[];
  movements: InventoryMovement[];
  stats: {
    totalProducts: number;
    activeProducts: number;
    activeBatches: number;
    totalUnitsOnHand: number;
    totalInventoryValue: number;
  };
};

/* ─── Demo fallback ─── */

const demoProducts: InventoryProduct[] = [
  { id: "prod-1", sku: "FLWR-OG-KUSH-3.5", name: "OG Kush Flower 3.5g", category: "flower", unitOfMeasure: "g", active: true },
  { id: "prod-2", sku: "PRRL-GLUE-10PK", name: "GG #4 Pre-Roll 10pk", category: "pre-roll", unitOfMeasure: "pk", active: true },
  { id: "prod-3", sku: "VPE-GSC-1G", name: "GSC Live Resin Cart 1g", category: "vape", unitOfMeasure: "ea", active: true },
  { id: "prod-4", sku: "EDBL-GUMMY-20PK", name: "Sativa Gummies 20ct", category: "edible", unitOfMeasure: "ea", active: true },
  { id: "prod-5", sku: "CONC-BHO-1G", name: "Blue Dream BHO Shatter 1g", category: "concentrate", unitOfMeasure: "g", active: true },
  { id: "prod-6", sku: "FLWR-PINK-7G", name: "Pink Panties Flower 7g", category: "flower", unitOfMeasure: "g", active: true },
];

const demoBatches: InventoryBatch[] = [
  { id: "batch-1", productId: "prod-1", productName: "OG Kush Flower 3.5g", productSku: "FLWR-OG-KUSH-3.5", packageTag: "1A4060300001C10000010012", quantityOnHand: 420, costBasis: 5.25, source: "Metrc" },
  { id: "batch-2", productId: "prod-1", productName: "OG Kush Flower 3.5g", productSku: "FLWR-OG-KUSH-3.5", packageTag: "1A4060300001C10000010018", quantityOnHand: 112, costBasis: 5.50, source: "Metrc" },
  { id: "batch-3", productId: "prod-2", productName: "GG #4 Pre-Roll 10pk", productSku: "PRRL-GLUE-10PK", packageTag: "1A4060300001C20000020045", quantityOnHand: 340, costBasis: 18.00, source: "manual" },
  { id: "batch-4", productId: "prod-3", productName: "GSC Live Resin Cart 1g", productSku: "VPE-GSC-1G", packageTag: "1A4060300001C30000030078", quantityOnHand: 560, costBasis: 22.50, source: "Metrc" },
  { id: "batch-5", productId: "prod-4", productName: "Sativa Gummies 20ct", productSku: "EDBL-GUMMY-20PK", packageTag: "1A4060300001C40000040091", quantityOnHand: 180, costBasis: 14.00, source: "manual" },
  { id: "batch-6", productId: "prod-5", productName: "Blue Dream BHO Shatter 1g", productSku: "CONC-BHO-1G", packageTag: "1A4060300001C50000050112", quantityOnHand: 95, costBasis: 28.00, source: "Metrc" },
  { id: "batch-7", productId: "prod-6", productName: "Pink Panties Flower 7g", productSku: "FLWR-PINK-7G", packageTag: "1A4060300001C10000060130", quantityOnHand: 224, costBasis: 4.75, source: "Metrc" },
];

const demoMovements: InventoryMovement[] = [
  { id: "mov-1", batchId: "batch-1", productName: "OG Kush Flower 3.5g", movementType: "receive", quantity: 500, date: "2026-04-01", note: "Initial harvest intake" },
  { id: "mov-2", batchId: "batch-1", productName: "OG Kush Flower 3.5g", movementType: "sale", quantity: -80, date: "2026-04-03", note: "Wholesale to Green Leaf Dispensary" },
  { id: "mov-3", batchId: "batch-3", productName: "GG #4 Pre-Roll 10pk", movementType: "receive", quantity: 500, date: "2026-04-02", note: "Production run PR-0402 complete" },
  { id: "mov-4", batchId: "batch-3", productName: "GG #4 Pre-Roll 10pk", movementType: "sale", quantity: -160, date: "2026-04-05", note: "Retail POS morning batch" },
  { id: "mov-5", batchId: "batch-4", productName: "GSC Live Resin Cart 1g", movementType: "receive", quantity: 600, date: "2026-04-03", note: "Cart fill from live resin run" },
  { id: "mov-6", batchId: "batch-4", productName: "GSC Live Resin Cart 1g", movementType: "sale", quantity: -40, date: "2026-04-06", note: "Retail POS evening batch" },
  { id: "mov-7", batchId: "batch-6", productName: "Blue Dream BHO Shatter 1g", movementType: "adjustment", quantity: -5, date: "2026-04-04", note: "QC failed units pulled" },
  { id: "mov-8", batchId: "batch-7", productName: "Pink Panties Flower 7g", movementType: "transfer", quantity: 0, date: "2026-04-05", note: "Location transfer: Oakland to Richmond" },
];

function buildDemoWorkspace(): InventoryWorkspace {
  return {
    source: "demo",
    products: demoProducts,
    batches: demoBatches,
    movements: demoMovements,
    stats: {
      totalProducts: demoProducts.length,
      activeProducts: demoProducts.filter((p) => p.active).length,
      activeBatches: demoBatches.length,
      totalUnitsOnHand: demoBatches.reduce((sum, b) => sum + b.quantityOnHand, 0),
      totalInventoryValue: demoBatches.reduce((sum, b) => sum + b.quantityOnHand * b.costBasis, 0),
    },
  };
}

/* ─── Loader ─── */

export async function loadInventoryWorkspace(
  companySlug: string = DEMO_COMPANY_SLUG,
): Promise<InventoryWorkspace> {
  const client = await getAuthenticatedConvexClient();
  if (!client) {
    return buildDemoWorkspace();
  }

  try {
    const company = await withTimeout(
      client.query((anyApi as any).cannabisCompanies.getBySlug, { slug: companySlug }),
    );
    if (!company?._id) {
      return buildDemoWorkspace();
    }

    const companyId = company._id;

    const [productsResult, batchesResult, movementsResult, statsResult] = await Promise.allSettled([
      withTimeout(client.query((anyApi as any).inventory.getActiveProducts, { companyId })),
      withTimeout(client.query((anyApi as any).inventory.getBatches, { companyId })),
      withTimeout(client.query((anyApi as any).inventory.getMovements, { companyId, limit: 8 })),
      withTimeout(client.query((anyApi as any).inventory.getInventoryStats, { companyId })),
    ]);

    const convexProducts = productsResult.status === "fulfilled" && productsResult.value?.length > 0
      ? productsResult.value.map((p: any) => ({
          id: p._id,
          sku: p.sku,
          name: p.name,
          category: p.category,
          unitOfMeasure: p.unitOfMeasure,
          active: p.active,
        }))
      : null;

    const convexBatches = batchesResult.status === "fulfilled" && batchesResult.value?.length > 0
      ? batchesResult.value.map((b: any) => ({
          id: b._id,
          productId: b.productId,
          productName: "", // Will be resolved below
          productSku: "",
          packageTag: b.packageTag,
          quantityOnHand: b.quantityOnHand,
          costBasis: b.costBasis ?? 0,
          source: b.source,
        }))
      : null;

    if (convexBatches && convexProducts) {
      // Resolve product names from products list
      const productMap = new Map<string, { name: string; sku: string }>();
      for (const p of convexProducts) {
        productMap.set(p.id, { name: p.name, sku: p.sku });
      }
      for (const batch of convexBatches) {
        const product = productMap.get(batch.productId);
        if (product) {
          batch.productName = product.name;
          batch.productSku = product.sku;
        }
      }
    }

    const convexMovements = movementsResult.status === "fulfilled" && movementsResult.value?.length > 0
      ? movementsResult.value.map((m: any) => ({
          id: m._id,
          batchId: m.batchId,
          productName: "", // Simplified - movements don't carry product name
          movementType: m.movementType,
          quantity: m.quantity,
          date: m.movementDate,
          note: "",
        }))
      : null;

    const convexStats = statsResult.status === "fulfilled" && statsResult.value
      ? statsResult.value
      : null;

    if (convexProducts || convexBatches) {
      const demo = buildDemoWorkspace();
      return {
        source: "convex",
        products: convexProducts ?? demo.products,
        batches: convexBatches ?? demo.batches,
        movements: convexMovements ?? demo.movements,
        stats: convexStats
          ? {
              totalProducts: convexStats.totalProducts,
              activeProducts: convexStats.activeProducts,
              activeBatches: convexStats.activeBatches,
              totalUnitsOnHand: convexStats.totalUnitsOnHand,
              totalInventoryValue: convexStats.totalInventoryValue,
            }
          : demo.stats,
      };
    }

    return buildDemoWorkspace();
  } catch {
    return buildDemoWorkspace();
  }
}
