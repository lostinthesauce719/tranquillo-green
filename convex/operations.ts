import { authMutation, authQuery, requireCurrentUserRecord } from "./lib/withAuth";
import { v } from "convex/values";
import { DEFAULT_CHART } from "./chartOfAccounts";

async function getLink(ctx: any, userId: string, companyId: string) {
  return await ctx.db
    .query("userCompanyLinks")
    .withIndex("by_user_company", (q: any) => q.eq("userId", userId).eq("companyId", companyId))
    .unique();
}

/**
 * listMyOperations: All companies the calling user is linked to, including
 * their current active company. isActive marks the active tenant.
 */
export const listMyOperations = authQuery({
  args: {},
  handler: async (ctx, _args, identity) => {
    const user = await requireCurrentUserRecord(ctx, identity);

    const links = await ctx.db
      .query("userCompanyLinks")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    const companyIds = new Set<string>(links.map((l: any) => l.companyId));
    if (user.companyId) companyIds.add(user.companyId);

    const operations: any[] = [];
    for (const companyId of Array.from(companyIds)) {
      const company = await ctx.db.get(companyId);
      if (!company) continue;
      operations.push({
        companyId: company._id,
        name: company.name,
        operatorType: company.operatorType,
        states: Array.isArray(company.states) ? company.states : company.state ? [company.state] : [],
        accountingMethod: company.defaultAccountingMethod,
        status: company.status,
        isActive: user.companyId === company._id,
      });
    }

    operations.sort((a, b) => (a.isActive === b.isActive ? a.name.localeCompare(b.name) : a.isActive ? -1 : 1));
    return operations;
  },
});

/**
 * createOperation: Creates an additional company owned by the calling user,
 * links it, and seeds its default chart of accounts. Does not switch the
 * active tenant.
 */
export const createOperation = authMutation({
  args: {
    name: v.string(),
    operatorType: v.union(
      v.literal("dispensary"),
      v.literal("cultivator"),
      v.literal("manufacturer"),
      v.literal("distributor"),
      v.literal("delivery"),
      v.literal("vertical"),
    ),
    state: v.string(),
    accountingMethod: v.union(v.literal("cash"), v.literal("accrual")),
  },
  handler: async (ctx, args, identity) => {
    const user = await requireCurrentUserRecord(ctx, identity);
    const name = args.name.trim();
    if (!name) throw new Error("Operation name is required.");

    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    let slug = baseSlug;
    for (let attempt = 1; attempt < 20; attempt++) {
      const clash = await ctx.db
        .query("cannabisCompanies")
        .withIndex("by_slug", (q: any) => q.eq("slug", slug))
        .unique();
      if (!clash) break;
      slug = `${baseSlug}-${attempt + 1}`;
    }

    const companyId = await ctx.db.insert("cannabisCompanies", {
      name,
      slug,
      states: [args.state],
      operatorType: args.operatorType,
      defaultAccountingMethod: args.accountingMethod,
      status: "active",
      timezone: "America/Denver",
    });

    await ctx.db.insert("userCompanyLinks", {
      userId: user._id,
      companyId,
      role: "owner",
      createdAt: Date.now(),
    });

    // Backfill a link for the user's original company so switching back works.
    if (user.companyId && !(await getLink(ctx, user._id, user.companyId))) {
      await ctx.db.insert("userCompanyLinks", {
        userId: user._id,
        companyId: user.companyId,
        role: user.role === "owner" ? "owner" : "controller",
        createdAt: Date.now(),
      });
    }

    for (const account of DEFAULT_CHART) {
      await ctx.db.insert("chartOfAccounts", { companyId, ...account });
    }

    return { companyId, slug };
  },
});

/**
 * switchActiveCompany: Sets the active tenant to a linked company.
 */
export const switchActiveCompany = authMutation({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (ctx, args, identity) => {
    const user = await requireCurrentUserRecord(ctx, identity);
    if (user.companyId === args.companyId) return { ok: true };

    const link = await getLink(ctx, user._id, args.companyId);
    if (!link) throw new Error("You are not linked to this operation.");

    // Preserve a way back to the current company.
    if (user.companyId && !(await getLink(ctx, user._id, user.companyId))) {
      await ctx.db.insert("userCompanyLinks", {
        userId: user._id,
        companyId: user.companyId,
        role: user.role === "owner" ? "owner" : "controller",
        createdAt: Date.now(),
      });
    }

    await ctx.db.patch(user._id, { companyId: args.companyId, role: link.role });
    return { ok: true };
  },
});
