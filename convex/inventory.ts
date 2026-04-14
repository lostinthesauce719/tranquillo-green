import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

/* ─── Products ─── */

export const getProducts = queryGeneric({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();
  },
});

export const getActiveProducts = queryGeneric({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (ctx, args) => {
    return (
      await ctx.db
        .query("products")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect()
    ).filter((p) => p.active);
  },
});

export const upsertProduct = mutationGeneric({
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
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
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

export const getBatches = queryGeneric({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("inventoryBatches")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();
  },
});

export const getBatchesByPackageTag = queryGeneric({
  args: {
    companyId: v.id("cannabisCompanies"),
    packageTag: v.string(),
  },
  handler: async (ctx, args) => {
    return (
      await ctx.db
        .query("inventoryBatches")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect()
    ).filter((b) => b.packageTag === args.packageTag);
  },
});

export const upsertBatch = mutationGeneric({
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
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
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

export const getMovements = queryGeneric({
  args: {
    companyId: v.id("cannabisCompanies"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("inventoryMovements")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    // Sort by date descending, then take limit
    const sorted = all.sort((a, b) => b.movementDate.localeCompare(a.movementDate));
    return sorted.slice(0, args.limit ?? 50);
  },
});

export const getMovementsByBatch = queryGeneric({
  args: { batchId: v.id("inventoryBatches") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("inventoryMovements")
      .withIndex("by_batch", (q) => q.eq("batchId", args.batchId))
      .collect();
  },
});

export const recordMovement = mutationGeneric({
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

export const getInventoryStats = queryGeneric({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (ctx, args) => {
    const [products, batches] = await Promise.all([
      ctx.db
        .query("products")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect(),
      ctx.db
        .query("inventoryBatches")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
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
