/**
 * 280E / COGS allocation — behavioural tests.
 *
 * These exercise allocationEngine.allocateTransaction, which is the core of the
 * product: splitting a cost into a COGS-eligible (deductible) portion and a
 * nondeductible portion under IRC 280E.
 *
 * IMPORTANT — read before changing any assertion here.
 *
 * Tests marked DEFECT pin CURRENT behaviour, not correct behaviour. Tests marked
 * TAX-REVIEW record a position that needs a cannabis CPA's sign-off, because the
 * answer is a matter of tax law and contested case law rather than code. Neither
 * kind should be "fixed" by editing the assertion.
 *
 * Run: npm test
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { allocateTransaction, getAllocationSummary, getSupportSchedule } from "../allocationEngine";
import { TestDb, makeCtx, call, rejects, cents } from "../../tests/convex/harness";
import { apply471cReclassificationInline } from "../lib/reclassificationInline";

/* ─── Fixture ────────────────────────────────────────────────────────────── */

const DISPENSARY = "company_dispensary";
const CULTIVATOR = "company_cultivator";
const TXN = "txn_1";
const POLICY_SQFT = "policy_sqft";
const POLICY_LABOR = "policy_labor";
const POLICY_CUSTOM = "policy_custom";
const POLICY_INACTIVE = "policy_inactive";
const ACCT_COGS = "acct_cogs";
const ACCT_OPEX = "acct_opex";
const RESELLER = "company_reseller";
const UNCLASSIFIED = "company_unclassified";
const POLICY_FLAT_PCT = "policy_flat_pct";
const POLICY_FLAT_AMT = "policy_flat_amt";

function seed() {
  return new TestDb({
    cannabisCompanies: [
      // A dispensary that owns product through production can be a producer;
      // classification is independent of licence type.
      { _id: DISPENSARY, name: "Acme Dispensary", operatorType: "dispensary", inventoryRole: "producer" },
      { _id: CULTIVATOR, name: "Acme Grow", operatorType: "cultivator", inventoryRole: "producer" },
      { _id: RESELLER, name: "Buys Finished Goods LLC", operatorType: "dispensary", inventoryRole: "reseller" },
      { _id: UNCLASSIFIED, name: "No Classification Co", operatorType: "dispensary" },
    ],
    users: [
      { _id: "u1", clerkId: "clerk_owner", companyId: DISPENSARY },
      { _id: "u2", clerkId: "clerk_other", companyId: CULTIVATOR },
    ],
    chartOfAccounts: [
      {
        _id: ACCT_COGS,
        companyId: DISPENSARY,
        code: "5000",
        name: "Cost of Goods Sold",
        category: "cogs",
        taxTreatment: "cogs",
        isActive: true,
      },
      {
        _id: ACCT_OPEX,
        companyId: DISPENSARY,
        code: "6000",
        name: "Selling & Admin",
        category: "expense",
        taxTreatment: "nondeductible",
        isActive: true,
      },
    ],
    allocationPolicies: [
      { _id: POLICY_SQFT, companyId: DISPENSARY, method: "square_footage", status: "active" },
      { _id: POLICY_LABOR, companyId: DISPENSARY, method: "labor", status: "active" },
      { _id: POLICY_CUSTOM, companyId: DISPENSARY, method: "custom", status: "active" },
      { _id: POLICY_INACTIVE, companyId: DISPENSARY, method: "custom", status: "draft" },
      { _id: POLICY_FLAT_PCT, companyId: DISPENSARY, method: "flat_percentage", status: "active" },
      { _id: POLICY_FLAT_AMT, companyId: DISPENSARY, method: "flat_amount", status: "active" },
    ],
    transactions: [
      { _id: TXN, companyId: DISPENSARY, status: "posted", transactionDate: Date.now() },
    ],
    transactionLines: [
      { transactionId: TXN, accountId: ACCT_COGS, debit: 1000, credit: 0 },
    ],
    cogsAllocations: [],
  });
}

let db: TestDb;
let ctx: any;
beforeEach(() => {
  db = seed();
  ctx = makeCtx(db, { clerkId: "clerk_owner" });
});

const allocate = (args: any) =>
  call(allocateTransaction, ctx, {
    companyId: DISPENSARY,
    transactionId: TXN,
    ...args,
  });

/* ─── Allocation maths ───────────────────────────────────────────────────── */

describe("computeAllocation — square footage", () => {
  it("splits cost by production-to-total square footage", async () => {
    await allocate({
      policyId: POLICY_SQFT,
      basisDetails: { productionSqFt: 3000, totalSqFt: 10000 },
    });
    const a = db.rows("cogsAllocations")[0];
    // 30% of 1000 is COGS-eligible; the rest is nondeductible under 280E.
    assert.equal(cents(a.deductibleAmount), 300);
    assert.equal(cents(a.nondeductibleAmount), 700);
  });

  it("deductible + nondeductible always equals the total cost", async () => {
    await allocate({
      policyId: POLICY_SQFT,
      basisDetails: { productionSqFt: 1, totalSqFt: 3 }, // repeating decimal
    });
    const a = db.rows("cogsAllocations")[0];
    assert.equal(
      cents(a.deductibleAmount + a.nondeductibleAmount),
      1000,
      "allocation must not create or destroy value"
    );
  });

  it("clamps a production area larger than the total to 100%", async () => {
    await allocate({
      policyId: POLICY_SQFT,
      basisDetails: { productionSqFt: 50000, totalSqFt: 10000 },
    });
    const a = db.rows("cogsAllocations")[0];
    assert.equal(cents(a.deductibleAmount), 1000);
    assert.equal(cents(a.nondeductibleAmount), 0);
  });

  it("rejects a zero total area rather than dividing by zero", async () => {
    await rejects(
      () => allocate({ policyId: POLICY_SQFT, basisDetails: { productionSqFt: 100, totalSqFt: 0 } }),
      /totalSqFt must be greater than zero/
    );
  });

  it("refuses a negative production area (was: produced negative COGS)", async () => {
    // Previously ratio = Math.min(x, 1) clamped only the upper bound, so a
    // negative basis yielded negative deductible COGS and a nondeductible
    // amount exceeding the cost. Now refused outright.
    await rejects(
      () =>
        allocate({
          policyId: POLICY_SQFT,
          basisDetails: { productionSqFt: -2000, totalSqFt: 10000 },
        }),
      /must not be negative/
    );
  });
});

describe("computeAllocation — labor", () => {
  it("splits cost by production-to-total labor hours", async () => {
    await allocate({
      policyId: POLICY_LABOR,
      basisDetails: { productionHours: 600, totalHours: 2000 },
    });
    const a = db.rows("cogsAllocations")[0];
    assert.equal(cents(a.deductibleAmount), 300);
    assert.equal(cents(a.nondeductibleAmount), 700);
  });

  it("rejects zero total hours", async () => {
    await rejects(
      () => allocate({ policyId: POLICY_LABOR, basisDetails: { productionHours: 5, totalHours: 0 } }),
      /totalHours must be greater than zero/
    );
  });
});

describe("computeAllocation — custom ratio", () => {
  it("applies a user-supplied ratio", async () => {
    await allocate({ policyId: POLICY_CUSTOM, basisDetails: { ratio: 0.42 } });
    const a = db.rows("cogsAllocations")[0];
    assert.equal(cents(a.deductibleAmount), 420);
  });

  it("rejects a ratio outside 0..1", async () => {
    await rejects(
      () => allocate({ policyId: POLICY_CUSTOM, basisDetails: { ratio: 1.5 } }),
      /between 0 and 1/
    );
    await rejects(
      () => allocate({ policyId: POLICY_CUSTOM, basisDetails: { ratio: -0.2 } }),
      /between 0 and 1/
    );
  });

  it("treats a missing ratio as zero — the whole cost becomes nondeductible", async () => {
    // Conservative default: absent substantiation, nothing is capitalised.
    await allocate({ policyId: POLICY_CUSTOM, basisDetails: {} });
    const a = db.rows("cogsAllocations")[0];
    assert.equal(cents(a.deductibleAmount), 0);
    assert.equal(cents(a.nondeductibleAmount), 1000);
  });
});

/* ─── Review routing ─────────────────────────────────────────────────────── */

describe("allocateTransaction — review routing", () => {
  it("flags low-confidence methods for human review", async () => {
    // custom carries confidence 55, below the 70 threshold.
    await allocate({ policyId: POLICY_CUSTOM, basisDetails: { ratio: 0.5 } });
    assert.equal(db.rows("cogsAllocations")[0].reviewStatus, "needs_review");
  });

  it("auto-applies high-confidence methods on small amounts", async () => {
    // square_footage carries confidence 85 and the cost is under 10,000.
    await allocate({
      policyId: POLICY_SQFT,
      basisDetails: { productionSqFt: 3000, totalSqFt: 10000 },
    });
    assert.equal(db.rows("cogsAllocations")[0].reviewStatus, "system_applied");
  });

  it("flags large amounts for review even on a high-confidence method", async () => {
    await db.patch(
      db.rows("transactionLines")[0]._id,
      { debit: 25000 }
    );
    await allocate({
      policyId: POLICY_SQFT,
      basisDetails: { productionSqFt: 3000, totalSqFt: 10000 },
    });
    assert.equal(db.rows("cogsAllocations")[0].reviewStatus, "needs_review");
  });
});

/* ─── Guards ─────────────────────────────────────────────────────────────── */

describe("allocateTransaction — guards", () => {
  it("refuses an inactive policy", async () => {
    await rejects(
      () => allocate({ policyId: POLICY_INACTIVE, basisDetails: { ratio: 0.5 } }),
      /not active/
    );
  });

  it("refuses a transaction belonging to another company", async () => {
    const foreign = await db.insert("transactions", {
      companyId: CULTIVATOR,
      status: "posted",
      transactionDate: Date.now(),
    });
    await rejects(
      () =>
        call(allocateTransaction, ctx, {
          companyId: DISPENSARY,
          transactionId: foreign,
          policyId: POLICY_SQFT,
          basisDetails: { productionSqFt: 1, totalSqFt: 2 },
        }),
      /does not belong to this company/
    );
  });

  it("refuses a zero-cost transaction", async () => {
    await db.patch(db.rows("transactionLines")[0]._id, { debit: 0, credit: 0 });
    await rejects(
      () =>
        allocate({
          policyId: POLICY_SQFT,
          basisDetails: { productionSqFt: 1, totalSqFt: 2 },
        }),
      /zero cost/
    );
  });

  it("does not duplicate an allocation when re-run for the same transaction", async () => {
    const args = {
      policyId: POLICY_SQFT,
      basisDetails: { productionSqFt: 3000, totalSqFt: 10000 },
    };
    await allocate(args);
    await allocate(args);
    assert.equal(
      db.rows("cogsAllocations").length,
      1,
      "re-allocating should update in place, not append"
    );
  });
});

/* ─── Tax positions requiring professional review ────────────────────────── */

describe("TAX-REVIEW — positions needing CPA sign-off", () => {
  it("applies the same allocation methods regardless of operator type", async () => {
    // This test does not assert correctness. It records that the engine makes no
    // distinction between a reseller and a producer.
    //
    // Under Reg. 1.471-3(b) a reseller (typically a dispensary that does not own
    // the goods through production) is generally limited to invoice price plus
    // costs of acquiring possession. Producers under 1.471-11 may use full
    // absorption, capitalising indirect production costs. Harborside turned on
    // exactly this distinction and the dispensary's COGS increases were denied.
    //
    // Here, a company recorded as operatorType "dispensary" can allocate an
    // arbitrary cost into COGS by square footage. Whether an IRC 471(c) election
    // changes that for a small business is genuinely contested.
    //
    // A cannabis CPA needs to decide whether the engine should refuse, or warn
    // on, production-basis allocation for reseller-classified entities.
    const company = await db.get(DISPENSARY);
    assert.equal(company.operatorType, "dispensary");

    await allocate({
      policyId: POLICY_SQFT,
      basisDetails: { productionSqFt: 3000, totalSqFt: 10000 },
    });
    const a = db.rows("cogsAllocations")[0];
    assert.equal(
      cents(a.deductibleAmount),
      300,
      "current behaviour: reseller classification does not constrain the allocation"
    );
  });

  it("records the basis used, which is what substantiates the position", async () => {
    // Whatever the method, an audit turns on substantiation. Confirm the basis
    // is persisted rather than only the result.
    await allocate({
      policyId: POLICY_SQFT,
      basisDetails: { productionSqFt: 3000, totalSqFt: 10000 },
    });
    const a = db.rows("cogsAllocations")[0];
    assert.equal(a.basisType, "square_footage");
    assert.ok(a.confidence > 0, "confidence should be recorded with the allocation");
  });
});

/* ─── Flat methods ───────────────────────────────────────────────────────── */

describe("computeAllocation — flat percentage", () => {
  it("accepts a ratio expressed 0..1", async () => {
    await allocate({ policyId: POLICY_FLAT_PCT, basisDetails: { percentage: 0.35 } });
    assert.equal(cents(db.rows("cogsAllocations")[0].deductibleAmount), 350);
  });

  it("accepts the same figure expressed 0..100", async () => {
    await allocate({ policyId: POLICY_FLAT_PCT, basisDetails: { percentage: 35 } });
    assert.equal(cents(db.rows("cogsAllocations")[0].deductibleAmount), 350);
  });

  it("rejects a percentage above 100", async () => {
    await rejects(
      () => allocate({ policyId: POLICY_FLAT_PCT, basisDetails: { percentage: 140 } }),
      /between 0 and 100/
    );
  });

  it("carries low confidence and warns that the basis is unmeasured", async () => {
    await allocate({ policyId: POLICY_FLAT_PCT, basisDetails: { percentage: 35 } });
    const a = db.rows("cogsAllocations")[0];
    assert.ok(a.confidence < 70, "a flat percentage must not read as high confidence");
    assert.ok(a.warnings.some((w: any) => w.code === "unmeasured_basis"));
    assert.equal(a.requiresAcknowledgement, true);
  });
});

describe("computeAllocation — flat amount", () => {
  it("treats a fixed dollar amount as the COGS-eligible portion", async () => {
    await allocate({ policyId: POLICY_FLAT_AMT, basisDetails: { amount: 250 } });
    const a = db.rows("cogsAllocations")[0];
    assert.equal(cents(a.deductibleAmount), 250);
    assert.equal(cents(a.nondeductibleAmount), 750);
  });

  it("caps the amount at the actual cost", async () => {
    await allocate({ policyId: POLICY_FLAT_AMT, basisDetails: { amount: 999999 } });
    const a = db.rows("cogsAllocations")[0];
    assert.equal(cents(a.deductibleAmount), 1000, "cannot capitalise more than was spent");
    assert.equal(cents(a.nondeductibleAmount), 0);
  });

  it("rejects a negative amount", async () => {
    await rejects(
      () => allocate({ policyId: POLICY_FLAT_AMT, basisDetails: { amount: -50 } }),
      /must not be negative/
    );
  });
});

/* ─── Reseller vs producer ───────────────────────────────────────────────── */

describe("IRC 471 classification", () => {
  async function allocateFor(companyId: string, policyId: string) {
    const txn = await db.insert("transactions", {
      companyId,
      status: "posted",
      transactionDate: Date.now(),
    });
    const acct = await db.insert("chartOfAccounts", {
      companyId,
      code: "5000",
      name: "COGS",
      category: "cogs",
      taxTreatment: "cogs",
      isActive: true,
    });
    await db.insert("transactionLines", { transactionId: txn, accountId: acct, debit: 1000, credit: 0 });
    await db.insert("allocationPolicies", { _id: policyId, companyId, method: "square_footage", status: "active" });
    await db.insert("users", { clerkId: `clerk_${companyId}`, companyId });

    const c = makeCtx(db, { clerkId: `clerk_${companyId}` });
    await call(allocateTransaction, c, {
      companyId,
      transactionId: txn,
      policyId,
      basisDetails: { productionSqFt: 3000, totalSqFt: 10000 },
    });
    return db.rows("cogsAllocations").find((a: any) => a.transactionId === txn);
  }

  it("warns when a reseller uses a production basis", async () => {
    // Reg. 1.471-3(b): a reseller is generally limited to invoice price plus
    // costs of acquiring possession. Harborside denied the COGS increases.
    const a = await allocateFor(RESELLER, "policy_reseller_sqft");
    assert.ok(
      a.warnings.some((w: any) => w.code === "reseller_production_basis"),
      "reseller + square footage must raise a warning"
    );
    assert.equal(a.requiresAcknowledgement, true);
    assert.equal(a.reviewStatus, "needs_review");
  });

  it("does not warn when a producer uses a production basis", async () => {
    const a = await allocateFor(CULTIVATOR, "policy_cultivator_sqft");
    assert.ok(
      !a.warnings.some((w: any) => w.code === "reseller_production_basis"),
      "a producer using full absorption is the expected case"
    );
  });

  it("warns when the entity has no classification at all", async () => {
    const a = await allocateFor(UNCLASSIFIED, "policy_unclassified_sqft");
    assert.ok(a.warnings.some((w: any) => w.code === "inventory_role_unset"));
    assert.equal(a.requiresAcknowledgement, true);
  });
});

/* ─── Balanced journals ──────────────────────────────────────────────────── */

describe("classifyTransactionLines — balanced journals", () => {
  it("does not count the funding side of a journal as a second cost", async () => {
    // Found by the operator walkthrough, not by unit tests: the fixtures here
    // used a single line, so nobody noticed that a real balanced journal —
    // debit Rent 18,500 / credit Cash 18,500 — was summed as 37,000 of
    // allocatable cost. Every allocation in the system was double.
    const cash = await db.insert("chartOfAccounts", {
      companyId: DISPENSARY,
      code: "1000",
      name: "Cash",
      category: "asset",
      taxTreatment: "deductible",
      isActive: true,
    });
    const rent = await db.insert("chartOfAccounts", {
      companyId: DISPENSARY,
      code: "4210",
      name: "Rent Expense",
      category: "opex",
      taxTreatment: "nondeductible",
      isActive: true,
    });
    const txn = await db.insert("transactions", {
      companyId: DISPENSARY,
      status: "posted",
      transactionDate: Date.now(),
    });
    await db.insert("transactionLines", { transactionId: txn, accountId: rent, debit: 18_500, credit: 0 });
    await db.insert("transactionLines", { transactionId: txn, accountId: cash, debit: 0, credit: 18_500 });

    await call(allocateTransaction, ctx, {
      companyId: DISPENSARY,
      transactionId: txn,
      policyId: POLICY_SQFT,
      basisDetails: { productionSqFt: 6500, totalSqFt: 10000 },
    });

    const a = db.rows("cogsAllocations").find((x: any) => x.transactionId === txn);
    assert.equal(
      cents(a.deductibleAmount + a.nondeductibleAmount),
      18_500,
      "total allocated must equal the expense, not the expense plus its funding"
    );
  });

  it("treats a credit to an expense account as a reversal, not a cost", async () => {
    const rent = await db.insert("chartOfAccounts", {
      companyId: DISPENSARY,
      code: "4211",
      name: "Rent Expense",
      category: "opex",
      taxTreatment: "nondeductible",
      isActive: true,
    });
    const cash = await db.insert("chartOfAccounts", {
      companyId: DISPENSARY,
      code: "1001",
      name: "Cash",
      category: "asset",
      taxTreatment: "deductible",
      isActive: true,
    });
    const txn = await db.insert("transactions", {
      companyId: DISPENSARY,
      status: "posted",
      transactionDate: Date.now(),
    });
    // Rent of 10,000 with a 2,000 credit note against it — net cost 8,000.
    await db.insert("transactionLines", { transactionId: txn, accountId: rent, debit: 10_000, credit: 0 });
    await db.insert("transactionLines", { transactionId: txn, accountId: rent, debit: 0, credit: 2_000 });
    await db.insert("transactionLines", { transactionId: txn, accountId: cash, debit: 0, credit: 8_000 });

    await call(allocateTransaction, ctx, {
      companyId: DISPENSARY,
      transactionId: txn,
      policyId: POLICY_SQFT,
      basisDetails: { productionSqFt: 5000, totalSqFt: 10000 },
    });

    const a = db.rows("cogsAllocations").find((x: any) => x.transactionId === txn);
    assert.equal(
      cents(a.deductibleAmount + a.nondeductibleAmount),
      8_000,
      "Math.abs() would have made this 12,000 by treating the credit as a cost"
    );
  });

  it("ignores balance-sheet accounts entirely", async () => {
    const inventory = await db.insert("chartOfAccounts", {
      companyId: DISPENSARY,
      code: "1200",
      name: "Inventory",
      category: "asset",
      taxTreatment: "cogs",
      isActive: true,
    });
    const payable = await db.insert("chartOfAccounts", {
      companyId: DISPENSARY,
      code: "2000",
      name: "Accounts Payable",
      category: "liability",
      taxTreatment: "deductible",
      isActive: true,
    });
    const txn = await db.insert("transactions", {
      companyId: DISPENSARY,
      status: "posted",
      transactionDate: Date.now(),
    });
    // Purchasing inventory on credit moves value between balance-sheet accounts.
    // It is not a period cost and nothing should be allocatable.
    await db.insert("transactionLines", { transactionId: txn, accountId: inventory, debit: 5_000, credit: 0 });
    await db.insert("transactionLines", { transactionId: txn, accountId: payable, debit: 0, credit: 5_000 });

    await rejects(
      () =>
        call(allocateTransaction, ctx, {
          companyId: DISPENSARY,
          transactionId: txn,
          policyId: POLICY_SQFT,
          basisDetails: { productionSqFt: 5000, totalSqFt: 10000 },
        }),
      /zero cost/
    );
  });
});

/* ─── Support schedule ───────────────────────────────────────────────────── */

describe("getSupportSchedule", () => {
  /**
   * The support schedule is the audit-defence surface: it is what an operator
   * hands over when the allocation is questioned. Two things have to hold —
   * the figures must be right, and the reason behind each one must be present.
   */

  async function seedPostedMonth() {
    // A realistic balanced journal: one expense leg, one cash leg.
    const rent = await db.insert("chartOfAccounts", {
      companyId: DISPENSARY,
      code: "4210",
      name: "Rent Expense",
      category: "opex",
      taxTreatment: "nondeductible",
      isActive: true,
    });
    const cash = await db.insert("chartOfAccounts", {
      companyId: DISPENSARY,
      code: "1000",
      name: "Cash",
      category: "asset",
      taxTreatment: "deductible",
      isActive: true,
    });
    await db.insert("reportingPeriods", {
      companyId: DISPENSARY,
      label: "March 2026",
      startDate: "2026-03-01",
      endDate: "2026-03-31",
      status: "open",
    });
    const txn = await db.insert("transactions", {
      companyId: DISPENSARY,
      status: "posted",
      transactionDate: "2026-03-05",
      memo: "March rent",
    });
    await db.insert("transactionLines", { transactionId: txn, accountId: rent, debit: 18_500, credit: 0 });
    await db.insert("transactionLines", { transactionId: txn, accountId: cash, debit: 0, credit: 18_500 });
    return { txn, rent, cash };
  }

  it("does not count both legs of a balanced journal", async () => {
    // The defect: Math.abs(debit - credit) over every line counted the expense
    // and the cash leg, reporting $37,000 of cost against an $18,500 bill. The
    // same bug classifyTransactionLines had; it lived on here because no test
    // drove a balanced journal through the schedule.
    const { txn } = await seedPostedMonth();
    await call(allocateTransaction, ctx, {
      companyId: DISPENSARY,
      transactionId: txn,
      policyId: POLICY_SQFT,
      basisDetails: { productionSqFt: 5_200, totalSqFt: 8_000 },
    });

    const report: any = await call(getSupportSchedule, ctx, {
      companyId: DISPENSARY,
      periodLabel: "March 2026",
    });

    const rentRows = report.rows.filter((r: any) => r.accountCode === "4210");
    assert.equal(rentRows.length, 1, "the cash leg must not appear as a cost row");
    assert.equal(cents(rentRows[0].totalAmount), 18_500, "cost is 18,500 — not 37,000");
  });

  it("ties back to the allocations it was built from", async () => {
    const { txn } = await seedPostedMonth();
    await call(allocateTransaction, ctx, {
      companyId: DISPENSARY,
      transactionId: txn,
      policyId: POLICY_SQFT,
      basisDetails: { productionSqFt: 5_200, totalSqFt: 8_000 },
    });

    const report: any = await call(getSupportSchedule, ctx, {
      companyId: DISPENSARY,
      periodLabel: "March 2026",
    });

    assert.equal(report.reconciliation.reconciles, true);
    // Rent is an opex account, so allocateTransaction leaves it fully
    // nondeductible — moving it into COGS is the 471(c) reclassification's job,
    // covered separately below. What matters here is that the schedule totals
    // match the allocation exactly rather than being pro-rated against an
    // unrelated header amount.
    assert.equal(cents(report.summary.totalNondeductible), 18_500);
    assert.equal(
      cents(report.reconciliation.scheduleNondeductible),
      cents(report.reconciliation.allocationNondeductible)
    );
  });

  it("carries the measured basis on every row", async () => {
    const { txn } = await seedPostedMonth();
    await call(allocateTransaction, ctx, {
      companyId: DISPENSARY,
      transactionId: txn,
      policyId: POLICY_SQFT,
      basisDetails: { productionSqFt: 5_200, totalSqFt: 8_000 },
    });

    const report: any = await call(getSupportSchedule, ctx, {
      companyId: DISPENSARY,
      periodLabel: "March 2026",
    });

    const row = report.rows.find((r: any) => r.accountCode === "4210");
    // The sentence is the substantiation. Assert its substance, not its wording,
    // so the prose can be improved without the test objecting — but the
    // measurements themselves must be in it.
    assert.match(row.basisExplanation, /5,200/);
    assert.match(row.basisExplanation, /8,000/);
    assert.match(row.basisExplanation, /65\.0%/);
    assert.equal(report.summary.unsubstantiatedCount, 0);
  });

  it("excludes transactions outside the period", async () => {
    const { txn } = await seedPostedMonth();
    await call(allocateTransaction, ctx, {
      companyId: DISPENSARY,
      transactionId: txn,
      policyId: POLICY_SQFT,
      basisDetails: { productionSqFt: 5_200, totalSqFt: 8_000 },
    });

    await db.insert("reportingPeriods", {
      companyId: DISPENSARY,
      label: "April 2026",
      startDate: "2026-04-01",
      endDate: "2026-04-30",
      status: "open",
    });

    const april: any = await call(getSupportSchedule, ctx, {
      companyId: DISPENSARY,
      periodLabel: "April 2026",
    });
    assert.equal(april.rows.length, 0, "March cost must not appear in April");
    assert.equal(cents(april.summary.totalDeductible), 0);
  });

  it("refuses to serve another company's schedule", async () => {
    await seedPostedMonth();
    const intruder = makeCtx(db, { clerkId: "clerk_other" });
    await rejects(
      () => call(getSupportSchedule, intruder, { companyId: DISPENSARY, periodLabel: "March 2026" }),
      /unauthorized|access|denied|not found/i
    );
  });
});

describe("getSupportSchedule — 471(c) reclassifications", () => {
  /**
   * The gap this covers: apply471cReclassificationInline wrote a journal entry
   * and nothing else. The support schedule reads cogsAllocations, so the single
   * largest 280E position the product takes never appeared on the document that
   * exists to defend it.
   *
   * Nothing caught it because the walkthrough asserted the journal was correct
   * (it was) and the page rendered fixtures (so it looked populated).
   */
  it("shows reclassified rent on the schedule, with its measurement", async () => {
    await db.patch(DISPENSARY, {
      productionSqFt: 5_200,
      totalSqFt: 8_000,
      productionHours: 2_100,
      totalHours: 3_200,
    });

    const rent = await db.insert("chartOfAccounts", {
      companyId: DISPENSARY,
      code: "4210",
      name: "Rent Expense",
      category: "opex",
      taxTreatment: "nondeductible",
      isActive: true,
    });
    const cash = await db.insert("chartOfAccounts", {
      companyId: DISPENSARY,
      code: "1000",
      name: "Cash",
      category: "asset",
      taxTreatment: "deductible",
      isActive: true,
    });
    // 4110 is the destination account; without it reclassification bails out.
    await db.insert("chartOfAccounts", {
      companyId: DISPENSARY,
      code: "4110",
      name: "COGS — 280E Reclassification",
      category: "cogs",
      taxTreatment: "cogs",
      isActive: true,
    });
    await db.insert("reportingPeriods", {
      companyId: DISPENSARY,
      label: "March 2026",
      startDate: "2026-03-01",
      endDate: "2026-03-31",
      status: "open",
    });
    // Reclassification correctly refuses without an election on file.
    await db.insert("section471cElections", {
      companyId: DISPENSARY,
      elected: true,
      eligible: true,
      taxYear: 2026,
      electionDate: "2026-01-15",
      priorYear1: 2025, priorYear1Receipts: 4_000_000,
      priorYear2: 2024, priorYear2Receipts: 3_500_000,
      priorYear3: 2023, priorYear3Receipts: 3_000_000,
      averageGrossReceipts: 3_500_000,
    });
    const txn = await db.insert("transactions", {
      companyId: DISPENSARY,
      status: "posted",
      transactionDate: "2026-03-05",
      memo: "March rent",
      amount: 18_500,
    });
    await db.insert("transactionLines", { transactionId: txn, accountId: rent, debit: 18_500, credit: 0 });
    await db.insert("transactionLines", { transactionId: txn, accountId: cash, debit: 0, credit: 18_500 });

    const result: any = await apply471cReclassificationInline(ctx, txn);
    assert.equal(result.applied, true, JSON.stringify(result));

    const report: any = await call(getSupportSchedule, ctx, {
      companyId: DISPENSARY,
      periodLabel: "March 2026",
    });

    // 5,200 / 8,000 = 65% of 18,500 = 12,025
    assert.equal(cents(report.summary.totalDeductible), 12_025);
    assert.equal(cents(report.summary.totalNondeductible), 6_475);
    assert.equal(report.reconciliation.reconciles, true);

    const row = report.rows[0];
    assert.match(row.basisExplanation, /5,200 sq ft/);
    assert.match(row.basisExplanation, /65\.0%/);
    // The contested position must travel with the row, not be discovered later.
    assert.ok(
      row.warnings.some((w: any) => /471|CCA|contest/i.test(w.message)),
      "the 471(c) position warning must appear on the schedule row"
    );
  });
});
