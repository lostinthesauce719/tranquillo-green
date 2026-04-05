import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

export const listByTransaction = queryGeneric({
  args: {
    transactionId: v.id("transactions"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transactionLines")
      .withIndex("by_transaction", (q) => q.eq("transactionId", args.transactionId))
      .collect();
  },
});

export const replaceForTransaction = mutationGeneric({
  args: {
    transactionId: v.id("transactions"),
    lines: v.array(
      v.object({
        accountId: v.id("chartOfAccounts"),
        debit: v.optional(v.number()),
        credit: v.optional(v.number()),
        locationId: v.optional(v.id("cannabisLocations")),
        packageTag: v.optional(v.string()),
        memo: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("transactionLines")
      .withIndex("by_transaction", (q) => q.eq("transactionId", args.transactionId))
      .collect();

    for (const line of existing) {
      await ctx.db.delete(line._id);
    }

    const insertedIds = [] as string[];
    for (const line of args.lines) {
      const lineId = await ctx.db.insert("transactionLines", {
        transactionId: args.transactionId,
        ...line,
      });
      insertedIds.push(lineId);
    }

    return insertedIds;
  },
});
