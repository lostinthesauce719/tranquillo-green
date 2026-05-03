import { authMutation, authQuery } from "./lib/withAuth";
import { v } from "convex/values";

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
  handler: async (ctx, args) => {
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
    // Update batch quantity
    const batch = await ctx.db.get(args.batchId);
    if (batch) {
      await ctx.db.patch(args.batchId, {
        quantityOnHand: batch.quantityOnHand + args.quantity,
      });
    }

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
  handler: async (ctx, args) => {
    const batch = await ctx.db.get(args.batchId);
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
  handler: async (ctx, args) => {
    const batch = await ctx.db.get(args.batchId);
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

