// @ts-nocheck
import { v } from "convex/values";
import { authMutation, requireCompanyAccessById } from "./lib/withAuth";

const RECLASS_PERCENTAGES: Record<string, Record<string, number>> = {
  dispensary: {
    "4210": 0.45,
    "4200": 0.55,
  },
};

export const apply471cReclassification = authMutation(
  { transactionId: v.id("transactions") },
  async (ctx: any, args: any, identity: any) => {
    const { transactionId } = args;
    const txn = await ctx.db.get(transactionId);
    if (!txn) throw new Error("Transaction not found");
    await requireCompanyAccessById(ctx, identity, txn.companyId);
    const companyId = txn.companyId;

    // idempotency
    const existing = await ctx.db
      .query("transactions")
      .withIndex("by_company_external_ref", (q: any) =>
        q.eq("companyId", companyId).eq("externalRef", `reclass_471c:${transactionId}`)
      )
      .first();
    if (existing) return { skipped: true, reason: "already_applied", reclassificationTransactionId: existing._id };

    if (txn.source === "system" && txn.sourceLabel === "471c_reclassification") {
      return { skipped: true, reason: "system_reclass" };
    }
    if (txn.status !== "posted") {
      return { skipped: true, reason: "not_posted" };
    }

    // election
    const election = await ctx.db
      .query("section471cElections")
      .withIndex("by_company", (q: any) => q.eq("companyId", companyId))
      .first();
    if (!election?.elected) return { skipped: true, reason: "no_election" };

    // operator type
    const company = await ctx.db.get(companyId);
    if (!company) throw new Error("Company not found");
    const operatorType = (company.operatorType as string) || "dispensary";

    // lines
    const lines = await ctx.db
      .query("transactionLines")
      .withIndex("by_transaction", (q: any) => q.eq("transactionId", transactionId))
      .collect();

    const pctMap = RECLASS_PERCENTAGES[operatorType] || {};
    const defaultPct = (election.reclassifiablePct as any)?.default ?? 0.4;

    const reclassEntries: any[] = [];
    for (const line of lines) {
      const account = await ctx.db.get(line.accountId);
      if (!account) continue;
      const amount = Math.abs((line.debit ?? 0) - (line.credit ?? 0));
      if (amount <= 0) continue;
      if ((account.taxTreatment as string) !== "nondeductible") continue;
      const acctCode = account.code;
      const pct = pctMap[acctCode] ?? defaultPct;
      if (pct <= 0) continue;
      const reclassAmount = Math.round(amount * pct * 100) / 100;
      if (reclassAmount < 0.01) continue;
      reclassEntries.push({ accountId: line.accountId, acctCode, amount: reclassAmount });
    }

    if (reclassEntries.length === 0) {
      return { skipped: true, reason: "no_reclassifiable_lines" };
    }

    const totalReclass = reclassEntries.reduce((s, e) => s + e.amount, 0);

    // find 4110 account
    const chart = await ctx.db
      .query("chartOfAccounts")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();
    let reclassAcctId: string | null = null;
    for (const acct of chart) {
      if (acct.code === "4110") {
        reclassAcctId = acct._id;
        break;
      }
    }
    if (!reclassAcctId) throw new Error("Chart of accounts missing 4110 reclassification account");

    // insert reclassification transaction
    const reclassTxn = await ctx.db.insert("transactions", {
      companyId,
      periodId: txn.periodId,
      locationId: txn.locationId,
      transactionDate: txn.transactionDate,
      source: "system",
      sourceLabel: "471c_reclassification",
      memo: `471(c) reclassification for ${txn.reference || txn.memo || "transaction"}`,
      status: "posted",
      workflowStatus: "posted",
      externalRef: `reclass_471c:${transactionId}`,
      reference: txn._id,
      amount: totalReclass,
      direction: "outflow",
      activity: "admin",
    });

    // lines
    for (const entry of reclassEntries) {
      await ctx.db.insert("transactionLines", {
        transactionId: reclassTxn,
        accountId: entry.accountId,
        debit: 0,
        credit: entry.amount,
        locationId: txn.locationId,
      });
    }
    // Debit 4110
    await ctx.db.insert("transactionLines", {
      transactionId: reclassTxn,
      accountId: reclassAcctId,
      debit: totalReclass,
      credit: 0,
      locationId: txn.locationId,
    });

    return {
      skipped: false,
      reclassificationTransactionId: reclassTxn,
      reclassAmount: totalReclass,
      linesAffected: reclassEntries.length,
    };
  },
);
