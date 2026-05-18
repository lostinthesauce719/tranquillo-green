// @ts-nocheck
/**
 * Shared 471(c) reclassification logic.
 * Can be called from within any mutation context (no action/scheduler needed).
 *
 * Checks:
 *  1. Idempotency — skip if reclassification already exists for this transaction
 *  2. Transaction must be posted
 *  3. Company must have an active 471(c) election
 *  4. Transaction lines must have nondeductible tax treatment
 *
 * Inserts a reclassification transaction with:
 *  - Debit 4110 (reclassification account) for total reclass amount
 *  - Credit each reclassifiable expense line's account for its reclass portion
 */

const RECLASS_PERCENTAGES: Record<string, Record<string, number>> = {
  dispensary: {
    "4210": 0.45,  // Rent → 45% reclass
    "4200": 0.55,  // Labor → 55% reclass
  },
  cultivator: {
    "4210": 0.45,
    "4200": 0.55,
  },
  manufacturer: {
    "4210": 0.45,
    "4200": 0.55,
  },
  distributor: {
    "4210": 0.45,
    "4200": 0.55,
  },
  vertical: {
    "4210": 0.45,
    "4200": 0.55,
  },
};

export async function apply471cReclassificationInline(ctx: any, transactionId: string): Promise<{
  applied: boolean;
  reason?: string;
  reclassificationTransactionId?: string;
  reclassAmount?: number;
}> {
  const txn = await ctx.db.get(transactionId);
  if (!txn) return { applied: false, reason: "transaction_not_found" };

  const companyId = txn.companyId;

  // Idempotency check
  const existing = await ctx.db
    .query("transactions")
    .withIndex("by_company_external_ref", (q: any) =>
      q.eq("companyId", companyId).eq("externalRef", `reclass_471c:${transactionId}`)
    )
    .first();
  if (existing) {
    return { applied: false, reason: "already_applied", reclassificationTransactionId: existing._id };
  }

  // Skip system reclassifications
  if (txn.source === "system" && txn.sourceLabel === "471c_reclassification") {
    return { applied: false, reason: "system_reclass" };
  }

  // Only posted transactions
  if (txn.status !== "posted") {
    return { applied: false, reason: "not_posted" };
  }

  // Check election
  const election = await ctx.db
    .query("section471cElections")
    .withIndex("by_company", (q: any) => q.eq("companyId", companyId))
    .first();
  if (!election?.elected) return { applied: false, reason: "no_election" };

  // Operator type
  const company = await ctx.db.get(companyId);
  if (!company) return { applied: false, reason: "company_not_found" };
  const operatorType = (company.operatorType as string) || "dispensary";

  // Get transaction lines
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
    return { applied: false, reason: "no_reclassifiable_lines" };
  }

  const totalReclass = reclassEntries.reduce((s: number, e: any) => s + e.amount, 0);

  // Find 4110 account
  const chart = await ctx.db
    .query("chartOfAccounts")
    .withIndex("by_company", (q: any) => q.eq("companyId", companyId))
    .collect();

  let reclassAcctId: string | null = null;
  for (const acct of chart) {
    if (acct.code === "4110") {
      reclassAcctId = acct._id;
      break;
    }
  }
  if (!reclassAcctId) {
    // Graceful skip if 4110 not in chart — don't block the transaction
    return { applied: false, reason: "missing_4110_account" };
  }

  // Insert reclassification transaction
  const reclassTxnId = await ctx.db.insert("transactions", {
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

  // Credit each reclassifiable expense account
  for (const entry of reclassEntries) {
    await ctx.db.insert("transactionLines", {
      transactionId: reclassTxnId,
      accountId: entry.accountId,
      debit: 0,
      credit: entry.amount,
      locationId: txn.locationId,
    });
  }

  // Debit 4110
  await ctx.db.insert("transactionLines", {
    transactionId: reclassTxnId,
    accountId: reclassAcctId,
    debit: totalReclass,
    credit: 0,
    locationId: txn.locationId,
  });

  return {
    applied: true,
    reclassificationTransactionId: reclassTxnId,
    reclassAmount: totalReclass,
  };
}
