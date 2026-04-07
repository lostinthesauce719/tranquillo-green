import { v } from "convex/values";
import { authQuery, authMutation } from "./lib/withAuth";

export const listByTransaction = authQuery(
  {
    transactionId: v.id("transactions"),
  },
  async (ctx: any, args: any, _identity: any) => {
    return await ctx.db
      .query("transactionLines")
      .withIndex("by_transaction", (q: any) => q.eq("transactionId", args.transactionId))
      .collect();
  },
);

export const replaceForTransaction = authMutation(
  {
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
  async (ctx: any, args: any, _identity: any) => {
    const existing = await ctx.db
      .query("transactionLines")
      .withIndex("by_transaction", (q: any) => q.eq("transactionId", args.transactionId))
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
);
