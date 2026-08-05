import { authMutation, authQuery, requireRecordAccess, getOwnedRecord, requireSameCompany, getIfSameCompany } from "./lib/withAuth";
import { v } from "convex/values";

// FIFO batch selection for sale
async function selectFIFOBatches(
  ctx: any,
  companyId: string,
  productId: string,
  locationId: string | undefined,
  qtyNeeded: number
): Promise<Array<{ batchId: string; qty: number; costBasis: number | undefined }>> {
  const allBatches = await ctx.db
    .query("inventoryBatches")
    .withIndex("by_company", (q: any) => q.eq("companyId", companyId))
    .collect();

  const eligible = allBatches
    .filter(
      (b: any) =>
        b.productId === productId &&
        (locationId ? b.locationId === locationId : true) &&
        b.quantityOnHand > 0
    )
    .sort((a: any, b: any) => {
      const aTime = (a as any)._creationTime || (a as any).createdAt || 0;
      const bTime = (b as any)._creationTime || (b as any).createdAt || 0;
      return aTime - bTime;
    });

  const consumed: Array<{ batchId: string; qty: number; costBasis: number | undefined }> = [];
  let remaining = qtyNeeded;

  for (const batch of eligible) {
    if (remaining <= 0) break;
    const take = Math.min(batch.quantityOnHand, remaining);
    consumed.push({ batchId: batch._id, qty: take, costBasis: batch.costBasis });
    remaining -= take;
  }

  if (remaining > 0) {
    throw new Error(
      `Insufficient inventory for product ${productId}. Needed ${qtyNeeded}, available ${qtyNeeded - remaining}`
    );
  }

  return consumed;
}

/* ─── Products ─── */

export const getProducts = authQuery({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
      .collect();
  },
});

export const getActiveProducts = authQuery({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (ctx, args) => {
    return (
      await ctx.db
        .query("products")
        .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
        .collect()
    ).filter((p) => p.active);
  },
});

export const upsertProduct = authMutation({
  args: {
    companyId: v.id("cannabisCompanies"),
    sku: v.string(),
    name: v.string(),
    category: v.string(),
    unitOfMeasure: v.string(),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = (
      await ctx.db
        .query("products")
        .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
        .collect()
    ).find((p) => p.sku === args.sku);

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("products", args);
  },
});

/* ─── Inventory Batches ─── */

export const getBatches = authQuery({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("inventoryBatches")
      .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
      .collect();
  },
});

export const getBatchesByPackageTag = authQuery({
  args: {
    companyId: v.id("cannabisCompanies"),
    packageTag: v.string(),
  },
  handler: async (ctx, args) => {
    return (
      await ctx.db
        .query("inventoryBatches")
        .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
        .collect()
    ).filter((b) => b.packageTag === args.packageTag);
  },
});

export const upsertBatch = authMutation({
  args: {
    companyId: v.id("cannabisCompanies"),
    productId: v.id("products"),
    locationId: v.optional(v.id("cannabisLocations")),
    packageTag: v.string(),
    quantityOnHand: v.number(),
    costBasis: v.optional(v.number()),
    source: v.union(v.literal("csv_import"), v.literal("metrc_import"), v.literal("manual")),
  },
  handler: async (ctx, args) => {
    const existing = (
      await ctx.db
        .query("inventoryBatches")
        .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
        .collect()
    ).find((b) => b.packageTag === args.packageTag);

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("inventoryBatches", args);
  },
});

/* ─── Inventory Movements ─── */

export const getMovements = authQuery({
  args: {
    companyId: v.id("cannabisCompanies"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("inventoryMovements")
      .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
      .collect();

    // Sort by date descending, then take limit
    const sorted = all.sort((a, b) => b.movementDate.localeCompare(a.movementDate));
    return sorted.slice(0, args.limit ?? 50);
  },
});

export const getMovementsByBatch = authQuery({
  args: { batchId: v.id("inventoryBatches") },
  handler: async (ctx, args, identity) => {
    await getOwnedRecord(ctx, identity, args.batchId, "batch");
    return await ctx.db
      .query("inventoryMovements")
      .withIndex("by_batch", (q: any) => q.eq("batchId", args.batchId))
      .collect();
  },
});

export const recordMovement = authMutation({
  args: {
    companyId: v.id("cannabisCompanies"),
    batchId: v.id("inventoryBatches"),
    movementType: v.union(
      v.literal("receive"),
      v.literal("sale"),
      v.literal("adjustment"),
      v.literal("waste"),
      v.literal("transfer"),
    ),
    quantity: v.number(),
    movementDate: v.string(),
    relatedTransactionId: v.optional(v.id("transactions")),
  },
  handler: async (ctx, args) => {
    /*
     * The batch has to be this company's.
     *
     * This fetched the batch by ID and patched its quantity with no ownership
     * check at all, so a movement could add to or drain another company's
     * inventory. That flows straight into their COGS, and it would surface as
     * an unexplained inventory variance in their reconciliation rather than as
     * anything resembling a security event.
     *
     * Note the old `if (batch)` — a missing batch silently skipped the update
     * and still wrote the movement, leaving a movement record pointing at
     * nothing. requireSameCompany refuses instead.
     */
    const batch = await requireSameCompany(ctx, args.companyId, args.batchId, "inventory batch");
    await requireSameCompany(ctx, args.companyId, args.relatedTransactionId, "transaction");

    await ctx.db.patch(args.batchId, {
      quantityOnHand: batch.quantityOnHand + args.quantity,
    });

    return await ctx.db.insert("inventoryMovements", args);
  },
});

/* ─── Aggregate Stats ─── */

export const getInventoryStats = authQuery({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (ctx, args) => {
    const [products, batches] = await Promise.all([
      ctx.db
        .query("products")
        .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
        .collect(),
      ctx.db
        .query("inventoryBatches")
        .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
        .collect(),
    ]);

    const activeProducts = products.filter((p) => p.active);
    const totalUnitsOnHand = batches.reduce((sum, b) => sum + b.quantityOnHand, 0);
    const totalInventoryValue = batches.reduce(
      (sum, b) => sum + b.quantityOnHand * (b.costBasis ?? 0),
      0,
    );

    return {
      totalProducts: products.length,
      activeProducts: activeProducts.length,
      activeBatches: batches.length,
      totalUnitsOnHand,
      totalInventoryValue: Number(totalInventoryValue.toFixed(2)),
    };
  },
});

/* ─── Batch Editing & Merging ─── */

export const updateBatch = authMutation({
  args: {
    batchId: v.id("inventoryBatches"),
    locationId: v.optional(v.id("cannabisLocations")),
    costBasis: v.optional(v.number()),
  },
  handler: async (ctx, args, identity) => {
    const batch = await ctx.db.get(args.batchId);
    await requireRecordAccess(ctx, identity, batch, "batch");
    if (!batch) throw new Error("Batch not found");
    await ctx.db.patch(args.batchId, {
      locationId: args.locationId,
      costBasis: args.costBasis,
    });
    return args.batchId;
  },
});

export const mergeBatches = authMutation({
  args: {
    companyId: v.id("cannabisCompanies"),
    targetBatchId: v.id("inventoryBatches"),
    sourceBatchIds: v.array(v.id("inventoryBatches")),
  },
  handler: async (ctx, args) => {
    const target = await ctx.db.get(args.targetBatchId);
    if (!target || target.companyId !== args.companyId)
      throw new Error("Target batch not found or mismatched company");

    const sourceBatches = await Promise.all(
      args.sourceBatchIds.map((id) => ctx.db.get(id))
    );
    const validSources = sourceBatches.filter(
      (b): b is any => b && b.companyId === args.companyId && b._id !== args.targetBatchId
    );

    if (validSources.length === 0) throw new Error("No valid source batches to merge");

    // Sum quantities from sources
    const totalQtyAdd = validSources.reduce((sum, b) => sum + b.quantityOnHand, 0);
    const allQty = target.quantityOnHand + totalQtyAdd;

    // Weighted average cost basis across all batches (including target)
    let totalCost = (target.costBasis ?? 0) * target.quantityOnHand;
    for (const b of validSources) {
      totalCost += (b.costBasis ?? 0) * b.quantityOnHand;
    }
    const newCostBasis = totalQtyAdd > 0 ? totalCost / allQty : (target.costBasis ?? 0);

    // Update target
    await ctx.db.patch(args.targetBatchId, {
      quantityOnHand: allQty,
      costBasis: newCostBasis,
      mergedFrom: [...(target.mergedFrom ?? []), ...args.sourceBatchIds],
      lastMergedAt: Date.now(),
    });

    // Record movements to reflect the merge (reclassify source batches into target)
    for (const src of validSources) {
      await ctx.db.insert("inventoryMovements", {
        companyId: args.companyId,
        batchId: args.targetBatchId,
        movementType: "transfer" as const,
        quantity: src.quantityOnHand,
        movementDate: new Date().toISOString().split("T")[0],
        relatedTransactionId: null,
      });
      // Delete source batch
      await ctx.db.delete(src._id);
    }

    return { targetBatchId: args.targetBatchId, mergedCount: validSources.length };
  },
});

export const deleteBatch = authMutation({
  args: {
    batchId: v.id("inventoryBatches"),
  },
  handler: async (ctx, args, identity) => {
    const batch = await ctx.db.get(args.batchId);
    await requireRecordAccess(ctx, identity, batch, "batch");
    if (!batch) throw new Error("Batch not found");

    // Zero out any remaining inventory via waste adjustment first
    if (batch.quantityOnHand !== 0) {
      await ctx.db.insert("inventoryMovements", {
        companyId: batch.companyId,
        batchId: args.batchId,
        movementType: "waste" as const,
        quantity: -batch.quantityOnHand,
        movementDate: new Date().toISOString().split("T")[0],
        relatedTransactionId: null,
      });
    }

    await ctx.db.delete(args.batchId);
    return { ok: true };
  },
});


/**
 * syncMetrcInventory — Bulk upsert inventory batches from Metrc packages.
 *
 * This mutation is called from the Metrc sync server action after
 * packages are fetched (either from the real API or demo mode).
 * It ensures that:
 *  - A product exists for each Metrc item (upsert by SKU)
 *  - An inventory batch exists for each package tag (upsert)
 *  - Location is resolved by name if available
 *
 * All operations are performed server-side with full DB access.
 */
export const syncMetrcInventory = authMutation({
  args: {
    companyId: v.id("cannabisCompanies"),
    packages: v.array(
      v.object({
        Id: v.optional(v.number()),
        PackageId: v.optional(v.string()),
        Tag: v.string(),
        Quantity: v.number(),
        UnitOfMeasureName: v.optional(v.string()),
        Item: v.optional(v.object({
          Id: v.optional(v.number()),
          Name: v.optional(v.string()),
          ProductCategoryName: v.optional(v.string()),
          UnitOfMeasureName: v.optional(v.string()),
        })),
        LocationName: v.optional(v.string()),
        Label: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { companyId, packages } = args;

    // Pre-fetch locations for mapping
    const locations = await ctx.db
      .query("cannabisLocations")
      .withIndex("by_company", (q: any) => q.eq("companyId", companyId))
      .collect();
    const locMap = new Map(locations.map((l: any) => [l.name.toLowerCase(), l._id]));

    for (const pkg of packages) {
      const item = pkg.Item ?? {};
      const sku = String(item.Id ?? pkg.PackageId ?? pkg.Id);
      const productName = item.Name ?? pkg.Label ?? "Unknown Product";
      const category = item.ProductCategoryName ?? "Unknown";
      const uom = item.UnitOfMeasureName ?? pkg.UnitOfMeasureName ?? "each";

      // --- Upsert product ---
      const existingProducts = await ctx.db
        .query("products")
        .withIndex("by_company", (q: any) => q.eq("companyId", companyId))
        .collect();
      const existingProd = existingProducts.find((p: any) => p.sku === sku);
      let productId: string;
      if (existingProd) {
        await ctx.db.patch(existingProd._id, { name: productName, category, unitOfMeasure: uom, active: true });
        productId = existingProd._id;
      } else {
        productId = await ctx.db.insert("products", { companyId, sku, name: productName, category, unitOfMeasure: uom, active: true });
      }

      // --- Resolve location ---
      let locationId: string | undefined;
      if (pkg.LocationName) {
        locationId = locMap.get(pkg.LocationName.toLowerCase()) as string | undefined;
      }

      const pkgTag = pkg.Tag;
      const qty = pkg.Quantity ?? 0;

      // --- Upsert inventory batch ---
      const existingBatches = await ctx.db
        .query("inventoryBatches")
        .withIndex("by_company", (q: any) => q.eq("companyId", companyId))
        .collect();
      const existingBatch = existingBatches.find((b: any) => b.packageTag === pkgTag);
      if (existingBatch) {
        await ctx.db.patch(existingBatch._id, { productId, locationId, quantityOnHand: qty, source: "metrc_import" });
      } else {
        await ctx.db.insert("inventoryBatches", { companyId, productId, locationId, packageTag: pkgTag, quantityOnHand: qty, source: "metrc_import" });
      }
    }

    return { success: true, count: packages.length };
  },
});

export const sellInventoryItem = authMutation({
  args: {
    companyId: v.id("cannabisCompanies"),
    productId: v.id("products"),
    locationId: v.optional(v.id("cannabisLocations")),
    quantity: v.number(),
    movementDate: v.string(),
    externalRef: v.string(),
    relatedTransactionId: v.optional(v.id("transactions")),
  },
  handler: async (ctx, args) => {
    const consumed = await selectFIFOBatches(
      ctx,
      args.companyId,
      args.productId,
      args.locationId,
      args.quantity
    );

    for (const c of consumed) {
      await ctx.db.insert("inventoryMovements", {
        companyId: args.companyId,
        batchId: c.batchId,
        movementType: "sale",
        quantity: -c.qty,
        movementDate: args.movementDate,
        relatedTransactionId: args.relatedTransactionId,
      });

      const batch = await ctx.db.get(c.batchId);
      if (!batch) throw new Error(`Batch ${c.batchId} missing during update`);
      await ctx.db.patch(c.batchId, {
        quantityOnHand: batch.quantityOnHand - c.qty,
      });
    }

    const totalCOGS = consumed.reduce((sum, c) => sum + c.qty * (c.costBasis ?? 0), 0);
    return { totalCOGS, consumed };
  },
});

