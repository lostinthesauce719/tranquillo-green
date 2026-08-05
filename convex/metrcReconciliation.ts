import { authMutation, authQuery, requireCompanyAccessById } from "./lib/withAuth";
import { v } from "convex/values";

const QTY_TOLERANCE = 0.01;

function computeStatus(metrcQty: number, bookQty: number): "matched" | "variance" | "missing_in_books" {
  if (bookQty === 0 && metrcQty > 0) return "missing_in_books";
  if (Math.abs(metrcQty - bookQty) <= QTY_TOLERANCE) return "matched";
  return "variance";
}

export const listByCompany = authQuery({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (ctx, args, identity) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);
    return await ctx.db
      .query("metrcPackages")
      .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
      .collect();
  },
});

export const upsertPackage = authMutation({
  args: {
    companyId: v.id("cannabisCompanies"),
    packageLabel: v.string(),
    product: v.string(),
    uom: v.string(),
    metrcQty: v.number(),
    bookQty: v.number(),
    source: v.optional(v.union(v.literal("manual"), v.literal("api"))),
  },
  handler: async (ctx, args, identity) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);
    const label = args.packageLabel.trim();
    if (!label) throw new Error("Package label is required.");
    if (args.metrcQty < 0 || args.bookQty < 0) throw new Error("Quantities must be non-negative.");

    const now = Date.now();
    const status = computeStatus(args.metrcQty, args.bookQty);

    const existing = await ctx.db
      .query("metrcPackages")
      .withIndex("by_company_label", (q: any) =>
        q.eq("companyId", args.companyId).eq("packageLabel", label),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        product: args.product.trim(),
        uom: args.uom,
        metrcQty: args.metrcQty,
        bookQty: args.bookQty,
        status: existing.status === "resolved" && status === "matched" ? "resolved" : status,
        source: args.source ?? existing.source,
        lastSyncAt: now,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("metrcPackages", {
      companyId: args.companyId,
      packageLabel: label,
      product: args.product.trim(),
      uom: args.uom,
      metrcQty: args.metrcQty,
      bookQty: args.bookQty,
      status,
      source: args.source ?? "manual",
      lastSyncAt: now,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateBookQty = authMutation({
  args: {
    packageId: v.id("metrcPackages"),
    bookQty: v.number(),
  },
  handler: async (ctx, args, identity) => {
    const pkg = await ctx.db.get(args.packageId);
    if (!pkg) throw new Error("Package not found.");
    await requireCompanyAccessById(ctx, identity, pkg.companyId);
    if (args.bookQty < 0) throw new Error("Quantity must be non-negative.");
    await ctx.db.patch(args.packageId, {
      bookQty: args.bookQty,
      status: computeStatus(pkg.metrcQty, args.bookQty),
      updatedAt: Date.now(),
    });
    return await ctx.db.get(args.packageId);
  },
});

export const resolvePackage = authMutation({
  args: {
    packageId: v.id("metrcPackages"),
    resolutionNote: v.string(),
  },
  handler: async (ctx, args, identity) => {
    const pkg = await ctx.db.get(args.packageId);
    if (!pkg) throw new Error("Package not found.");
    await requireCompanyAccessById(ctx, identity, pkg.companyId);
    if (!args.resolutionNote.trim()) throw new Error("A resolution note is required for the audit trail.");

    await ctx.db.patch(args.packageId, {
      status: "resolved",
      resolutionNote: args.resolutionNote.trim(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("auditTrailEvents", {
      companyId: pkg.companyId,
      entityType: "reconciliation",
      entityId: args.packageId,
      action: "metrc_variance_resolved",
      actor: identity.name ?? identity.email ?? identity.subject,
      reason: args.resolutionNote.trim(),
      beforeState: JSON.stringify({ status: pkg.status, metrcQty: pkg.metrcQty, bookQty: pkg.bookQty }),
      afterState: JSON.stringify({ status: "resolved" }),
      timestamp: Date.now(),
    });

    return await ctx.db.get(args.packageId);
  },
});

export const deletePackage = authMutation({
  args: { packageId: v.id("metrcPackages") },
  handler: async (ctx, args, identity) => {
    const pkg = await ctx.db.get(args.packageId);
    if (!pkg) throw new Error("Package not found.");
    await requireCompanyAccessById(ctx, identity, pkg.companyId);
    await ctx.db.delete(args.packageId);
    return { ok: true };
  },
});
