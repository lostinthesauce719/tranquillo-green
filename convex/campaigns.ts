import { authMutation, authQuery, requireCompanyAccessById } from "./lib/withAuth";
import { v } from "convex/values";

const campaignStatus = v.union(
  v.literal("draft"),
  v.literal("active"),
  v.literal("paused"),
  v.literal("completed"),
);

export const listByCompany = authQuery({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (ctx, args, identity) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);
    return await ctx.db
      .query("campaigns")
      .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
      .collect();
  },
});

export const createCampaign = authMutation({
  args: {
    companyId: v.id("cannabisCompanies"),
    name: v.string(),
    channel: v.string(),
    budget: v.number(),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args, identity) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);
    if (!args.name.trim()) throw new Error("Campaign name is required.");
    if (args.budget < 0) throw new Error("Budget must be non-negative.");
    const now = Date.now();
    return await ctx.db.insert("campaigns", {
      companyId: args.companyId,
      name: args.name.trim(),
      channel: args.channel,
      status: "draft",
      budget: args.budget,
      spent: 0,
      impressions: 0,
      clicks: 0,
      leads: 0,
      startDate: args.startDate,
      endDate: args.endDate,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateCampaign = authMutation({
  args: {
    campaignId: v.id("campaigns"),
    name: v.optional(v.string()),
    channel: v.optional(v.string()),
    status: v.optional(campaignStatus),
    budget: v.optional(v.number()),
    spent: v.optional(v.number()),
    impressions: v.optional(v.number()),
    clicks: v.optional(v.number()),
    leads: v.optional(v.number()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args, identity) => {
    const { campaignId, ...updates } = args;
    const campaign = await ctx.db.get(campaignId);
    if (!campaign) throw new Error("Campaign not found.");
    await requireCompanyAccessById(ctx, identity, campaign.companyId);
    for (const key of ["budget", "spent", "impressions", "clicks", "leads"] as const) {
      const value = updates[key];
      if (value !== undefined && value < 0) throw new Error(`${key} must be non-negative.`);
    }
    const patch = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined),
    );
    await ctx.db.patch(campaignId, { ...patch, updatedAt: Date.now() });
    return await ctx.db.get(campaignId);
  },
});

export const deleteCampaign = authMutation({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, args, identity) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found.");
    await requireCompanyAccessById(ctx, identity, campaign.companyId);
    await ctx.db.delete(args.campaignId);
    return { ok: true };
  },
});
