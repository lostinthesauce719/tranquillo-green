/**
 * Tax calculation — behavioural tests.
 *
 * Replaces the quarantined vitest suite, which imported a package that is not a
 * dependency and called `.handler` on registered Convex functions. It never ran.
 *
 * These tests pin down what tax.ts actually computes. Where the behaviour looks
 * wrong for tax purposes rather than merely surprising, the test asserts the
 * CURRENT behaviour and carries a DEFECT note, so that changing it is a
 * deliberate act with a CPA in the loop — not a silent edit to tax maths.
 *
 * Run: npm test
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import {
  calculateTax,
  getTaxLiability,
  getCompanyTaxProfile,
  listJurisdictions,
} from "../tax";
import { TestDb, makeCtx, call, rejects, cents } from "./harness";

/* ─── Fixture ────────────────────────────────────────────────────────────── */

const CO = "jurisdiction_co";
const CA = "jurisdiction_ca";
const EXCISE = "taxtype_excise";
const SALES = "taxtype_sales";
const FLATFEE = "taxtype_flatfee";
const ACME = "company_acme";
const RIVAL = "company_rival";

const JAN_15 = new Date(2026, 0, 15).getTime();
const JAN_START = new Date(2026, 0, 1).getTime();
const JAN_END = new Date(2026, 1, 0).getTime();

function seed() {
  return new TestDb({
    cannabisCompanies: [
      { _id: ACME, name: "Acme Cannabis", slug: "acme", operatorType: "dispensary" },
      { _id: RIVAL, name: "Rival Co", slug: "rival", operatorType: "cultivator" },
    ],
    users: [
      { _id: "user_1", clerkId: "clerk_owner", companyId: ACME },
      { _id: "user_2", clerkId: "clerk_rival", companyId: RIVAL },
    ],
    taxJurisdictions: [
      { _id: CO, stateCode: "CO", jurisdictionName: "Colorado" },
      { _id: CA, stateCode: "CA", jurisdictionName: "California" },
    ],
    taxTypes: [
      {
        _id: EXCISE,
        code: "excise",
        name: "Cannabis Excise Tax",
        calculationBasis: "percentage",
        appliesToProductCategories: ["*"],
      },
      {
        _id: SALES,
        code: "sales",
        name: "State Sales Tax",
        calculationBasis: "percentage",
        // Deliberately narrow: used to prove category filtering works.
        appliesToProductCategories: ["flower", "edibles"],
      },
      {
        _id: FLATFEE,
        code: "flatfee",
        name: "Per-Transaction Fee",
        calculationBasis: "flat",
        appliesToProductCategories: ["*"],
      },
    ],
    taxRates: [
      {
        jurisdictionId: CO,
        taxTypeId: EXCISE,
        rate: 0.15,
        rateType: "percentage",
        effectiveFrom: new Date(2025, 0, 1).getTime(),
        effectiveTo: null,
      },
      {
        jurisdictionId: CO,
        taxTypeId: SALES,
        rate: 0.029,
        rateType: "percentage",
        effectiveFrom: new Date(2025, 0, 1).getTime(),
        effectiveTo: null,
      },
      {
        jurisdictionId: CO,
        taxTypeId: FLATFEE,
        rate: 25,
        rateType: "flat",
        effectiveFrom: new Date(2025, 0, 1).getTime(),
        effectiveTo: null,
      },
      {
        // Expired before our test date — must not be selected.
        jurisdictionId: CA,
        taxTypeId: EXCISE,
        rate: 0.99,
        rateType: "percentage",
        effectiveFrom: new Date(2020, 0, 1).getTime(),
        effectiveTo: new Date(2021, 0, 1).getTime(),
      },
    ],
    taxProfiles: [
      {
        companyId: ACME,
        state: "CO",
        primaryJurisdictionId: CO,
        nexusStates: ["CO"],
        filingCalendar: { "CO-excise": "monthly", "CO-sales": "monthly" },
        taxTypesEnabled: [EXCISE, SALES],
        isPrimary: true,
      },
    ],
    taxCalculations: [],
  });
}

let db: TestDb;
let ctx: any;
beforeEach(() => {
  db = seed();
  ctx = makeCtx(db, { clerkId: "clerk_owner" });
});

/* ─── Regression: the module could not run at all ────────────────────────── */

describe("tax.ts — executes", () => {
  it("calculateTax runs (was ReferenceError: db is not defined)", async () => {
    // tax.ts used a bare `db` identifier in 9 places, declared nowhere and
    // imported from nowhere, while the file carried @ts-nocheck. Every affected
    // function threw at runtime: getCompanyTaxProfile, listJurisdictions,
    // calculateTax, getTaxLiability, getUpcomingDeadlines,
    // updateCompanyTaxProfile.
    const result = await call(calculateTax, ctx, {
      companyId: ACME,
      transactionAmount: 1000,
      productCategory: "flower",
      transactionDate: JAN_15,
    });
    assert.ok(result, "calculateTax returned nothing");
    assert.ok(Array.isArray(result.taxBreakdown));
  });

  it("getCompanyTaxProfile runs", async () => {
    const profile = await call(getCompanyTaxProfile, ctx, { companyId: ACME });
    assert.equal(profile?.state, "CO");
  });

  it("listJurisdictions runs", async () => {
    const rows = await call(listJurisdictions, ctx, { companyId: ACME });
    assert.ok(Array.isArray(rows));
  });
});

/* ─── Rate application ───────────────────────────────────────────────────── */

describe("calculateTax — rate application", () => {
  it("applies a percentage rate to the transaction amount", async () => {
    const r = await call(calculateTax, ctx, {
      companyId: ACME,
      transactionAmount: 1000,
      productCategory: "flower",
      taxTypeCodes: [EXCISE],
      transactionDate: JAN_15,
    });
    const excise = r.taxBreakdown.find((t: any) => t.taxTypeCode === "excise");
    assert.ok(excise, "no excise line produced");
    assert.equal(cents(excise.amount), 150); // 1000 * 0.15
  });

  it("applies a flat rate as a fixed amount, ignoring transaction size", async () => {
    const small = await call(calculateTax, ctx, {
      companyId: ACME,
      transactionAmount: 100,
      productCategory: "flower",
      taxTypeCodes: [FLATFEE],
      transactionDate: JAN_15,
    });
    const large = await call(calculateTax, ctx, {
      companyId: ACME,
      transactionAmount: 100000,
      productCategory: "flower",
      taxTypeCodes: [FLATFEE],
      transactionDate: JAN_15,
    });
    assert.equal(cents(small.totalTax), 25);
    assert.equal(cents(large.totalTax), 25);
  });

  it("sums multiple tax types into totalTax", async () => {
    const r = await call(calculateTax, ctx, {
      companyId: ACME,
      transactionAmount: 1000,
      productCategory: "flower",
      taxTypeCodes: [EXCISE, SALES],
      transactionDate: JAN_15,
    });
    // 1000 * 0.15 + 1000 * 0.029
    assert.equal(cents(r.totalTax), 179);
    assert.equal(r.taxBreakdown.length, 2);
  });

  it("skips tax types that do not apply to the product category", async () => {
    // SALES applies only to flower/edibles.
    const r = await call(calculateTax, ctx, {
      companyId: ACME,
      transactionAmount: 1000,
      productCategory: "accessories",
      taxTypeCodes: [EXCISE, SALES],
      transactionDate: JAN_15,
    });
    const codes = r.taxBreakdown.map((t: any) => t.taxTypeCode);
    assert.deepEqual(codes, ["excise"], "sales tax should not apply to accessories");
    assert.equal(cents(r.totalTax), 150);
  });

  it("throws when no rate is active for the date", async () => {
    await rejects(
      () =>
        call(calculateTax, ctx, {
          companyId: ACME,
          transactionAmount: 1000,
          productCategory: "flower",
          jurisdictionId: CA, // only has a rate expired in 2021
          taxTypeCodes: [EXCISE],
          transactionDate: JAN_15,
        }),
      /No active tax rate found/
    );
  });

  it("does not select a rate that expired before the transaction date", async () => {
    // Guards the effectiveFrom/effectiveTo window. If this regresses, CA's 99%
    // rate would be applied to current transactions.
    await rejects(
      () =>
        call(calculateTax, ctx, {
          companyId: ACME,
          transactionAmount: 1000,
          productCategory: "flower",
          jurisdictionId: CA,
          taxTypeCodes: [EXCISE],
          transactionDate: JAN_15,
        }),
      /No active tax rate found/
    );
  });
});

/* ─── Persistence ────────────────────────────────────────────────────────── */

describe("calculateTax — persistence", () => {
  it("writes a taxCalculations audit record per applied tax type", async () => {
    await call(calculateTax, ctx, {
      companyId: ACME,
      transactionAmount: 1000,
      productCategory: "flower",
      taxTypeCodes: [EXCISE, SALES],
      transactionDate: JAN_15,
    });
    const rows = db.rows("taxCalculations");
    assert.equal(rows.length, 2);
    for (const row of rows) {
      assert.equal(row.companyId, ACME);
      assert.equal(row.isPosted, false, "new calculations must start unposted");
      assert.equal(row.calculationMethod, "manual_rate");
    }
  });

  it("stamps the period as the calendar month of the transaction", async () => {
    await call(calculateTax, ctx, {
      companyId: ACME,
      transactionAmount: 1000,
      productCategory: "flower",
      taxTypeCodes: [EXCISE],
      transactionDate: JAN_15,
    });
    const row = db.rows("taxCalculations")[0];
    assert.equal(row.periodStart, JAN_START);
    assert.equal(row.periodEnd, JAN_END);
  });
});

/* ─── Liability aggregation ──────────────────────────────────────────────── */

describe("getTaxLiability", () => {
  it("aggregates unposted calculations by jurisdiction and tax type", async () => {
    for (const amount of [1000, 2000]) {
      await call(calculateTax, ctx, {
        companyId: ACME,
        transactionAmount: amount,
        productCategory: "flower",
        taxTypeCodes: [EXCISE],
        transactionDate: JAN_15,
      });
    }

    const liability = await call(getTaxLiability, ctx, {
      companyId: ACME,
      periodStart: JAN_START,
      periodEnd: JAN_END,
    });

    assert.equal(liability.byJurisdiction.length, 1);
    const co = liability.byJurisdiction[0];
    assert.equal(co.name, "Colorado");
    assert.equal(cents(co.total), 450); // (1000 + 2000) * 0.15
    assert.equal(cents(liability.grandTotal), 450);
    assert.equal(co.byTaxType.length, 1, "same tax type should merge, not duplicate");
  });

  it("excludes posted calculations from outstanding liability", async () => {
    await call(calculateTax, ctx, {
      companyId: ACME,
      transactionAmount: 1000,
      productCategory: "flower",
      taxTypeCodes: [EXCISE],
      transactionDate: JAN_15,
    });
    await db.patch(db.rows("taxCalculations")[0]._id, { isPosted: true });

    const liability = await call(getTaxLiability, ctx, {
      companyId: ACME,
      periodStart: JAN_START,
      periodEnd: JAN_END,
    });
    assert.equal(cents(liability.grandTotal), 0);
  });

  it("does not report another company's liability", async () => {
    await call(calculateTax, ctx, {
      companyId: ACME,
      transactionAmount: 1000,
      productCategory: "flower",
      taxTypeCodes: [EXCISE],
      transactionDate: JAN_15,
    });

    // Rival's own context, asking for its own company: must see nothing.
    const rivalCtx = makeCtx(db, { clerkId: "clerk_rival" });
    const liability = await call(getTaxLiability, rivalCtx, {
      companyId: RIVAL,
      periodStart: JAN_START,
      periodEnd: JAN_END,
    });
    assert.equal(cents(liability.grandTotal), 0);
  });

  it("DEFECT: period matching is exact-equality, not a range", async () => {
    // getTaxLiability filters on periodStart === and periodEnd ===, so a caller
    // must reproduce calculateTax's exact stamps. A natural month range — e.g.
    // an end-of-month timestamp at 23:59:59 rather than 00:00:00 — silently
    // returns zero liability rather than erroring.
    //
    // Reporting no tax owed is the most dangerous possible failure mode here,
    // so this is pinned deliberately. Changing it to a range query is the
    // likely fix, but that is a decision for a CPA review, not a silent edit.
    await call(calculateTax, ctx, {
      companyId: ACME,
      transactionAmount: 1000,
      productCategory: "flower",
      taxTypeCodes: [EXCISE],
      transactionDate: JAN_15,
    });

    const offByOneSecond = await call(getTaxLiability, ctx, {
      companyId: ACME,
      periodStart: JAN_START,
      periodEnd: JAN_END + 1000,
    });
    assert.equal(
      cents(offByOneSecond.grandTotal),
      0,
      "current behaviour: a period end that differs at all yields zero"
    );
  });
});

/* ─── Money precision ────────────────────────────────────────────────────── */

describe("calculateTax — money precision", () => {
  it("DEFECT: tax amounts are stored unrounded floating point", async () => {
    // 0.1 + 0.2 territory. tax.ts computes `taxableAmt * rate` and neither
    // rounds nor uses integer cents, then accumulates with `totalTax +=`.
    // Filings require cent precision, and errors compound across a period.
    //
    // Pinned as current behaviour rather than "fixed", because the rounding
    // convention on a tax return (half-up vs banker's, per-line vs per-return)
    // is a tax decision, not a coding preference.
    const r = await call(calculateTax, ctx, {
      companyId: ACME,
      transactionAmount: 1999.99,
      productCategory: "flower",
      taxTypeCodes: [SALES], // 2.9%
      transactionDate: JAN_15,
    });
    const raw = r.taxBreakdown[0].amount;
    const stored = db.rows("taxCalculations")[0].taxAmount;

    assert.equal(raw, stored, "breakdown and stored value should agree");
    assert.notEqual(
      raw,
      cents(raw),
      "current behaviour: value is not rounded to cents before storage"
    );
  });
});
