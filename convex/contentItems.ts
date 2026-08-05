import { authMutation, authQuery, requireCompanyAccessById } from "./lib/withAuth";
import { v } from "convex/values";

const contentStatus = v.union(v.literal("draft"), v.literal("scheduled"), v.literal("published"));

export const listByCompany = authQuery({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (ctx, args, identity) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);
    return await ctx.db
      .query("contentItems")
      .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
      .collect();
  },
});

export const createItem = authMutation({
  args: {
    companyId: v.id("cannabisCompanies"),
    title: v.string(),
    channel: v.string(),
    status: v.optional(contentStatus),
    scheduledFor: v.optional(v.string()),
    body: v.optional(v.string()),
  },
  handler: async (ctx, args, identity) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);
    if (!args.title.trim()) throw new Error("Title is required.");
    const now = Date.now();
    return await ctx.db.insert("contentItems", {
      companyId: args.companyId,
      title: args.title.trim(),
      channel: args.channel,
      status: args.status ?? "draft",
      scheduledFor: args.scheduledFor,
      body: args.body,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateItem = authMutation({
  args: {
    itemId: v.id("contentItems"),
    title: v.optional(v.string()),
    channel: v.optional(v.string()),
    status: v.optional(contentStatus),
    scheduledFor: v.optional(v.string()),
    body: v.optional(v.string()),
  },
  handler: async (ctx, args, identity) => {
    const { itemId, ...updates } = args;
    const item = await ctx.db.get(itemId);
    if (!item) throw new Error("Content item not found.");
    await requireCompanyAccessById(ctx, identity, item.companyId);
    const patch = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined),
    );
    await ctx.db.patch(itemId, { ...patch, updatedAt: Date.now() });
    return await ctx.db.get(itemId);
  },
});

export const deleteItem = authMutation({
  args: { itemId: v.id("contentItems") },
  handler: async (ctx, args, identity) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Content item not found.");
    await requireCompanyAccessById(ctx, identity, item.companyId);
    await ctx.db.delete(args.itemId);
    return { ok: true };
  },
});
