import { v } from "convex/values";
import { authQuery, authMutation, requireTenantRecordForTransaction } from "./lib/withAuth";

export const listByTransaction = authQuery(
  {
    transactionId: v.id("transactions"),
  },
  async (ctx: any, args: any, identity: any) => {
    await requireTenantRecordForTransaction(ctx, identity, args.transactionId);

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
  async (ctx: any, args: any, identity: any) => {
    const transaction = await requireTenantRecordForTransaction(ctx, identity, args.transactionId);
    const companyId = transaction.companyId;

    const existing = await ctx.db
      .query("transactionLines")
      .withIndex("by_transaction", (q: any) => q.eq("transactionId", args.transactionId))
      .collect();

    for (const line of existing) {
      await ctx.db.delete(line._id);
    }

    const insertedIds = [] as string[];
    for (const line of args.lines) {
      const account = await ctx.db.get(line.accountId);
      if (!account || account.companyId !== companyId) {
        throw new Error("Transaction line account must belong to the same company.");
      }
      if (line.locationId) {
        const location = await ctx.db.get(line.locationId);
        if (!location || location.companyId !== companyId) {
          throw new Error("Transaction line location must belong to the same company.");
        }
      }

      const lineId = await ctx.db.insert("transactionLines", {
        transactionId: args.transactionId,
        ...line,
      });
      insertedIds.push(lineId);
    }

    return insertedIds;
  },
);
