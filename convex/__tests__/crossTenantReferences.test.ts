/**
 * Cross-tenant references — the leak that survives a correct access check.
 *
 * The by-ID sweep fixed functions that never checked the caller. These are
 * different and harder to see: the caller IS authorised, for their own company,
 * and the wrapper correctly lets them through. The leak is in what they are
 * allowed to point at.
 *
 * Two halves:
 *
 *   WRITE — a function takes companyId plus a secondary reference
 *   (transactionId, policyId, periodId) and stores it without checking that the
 *   reference belongs to the same company. Nothing looks wrong: the record is
 *   correctly owned, it just points somewhere it shouldn't.
 *
 *   READ — a list query resolves those references with ctx.db.get() and returns
 *   the joined records. The allocation is yours. The transaction hanging off it
 *   is not, and it comes back in full: memo, reference, amount, dates.
 *
 * Neither half is a bug on its own reading. Together they are an exfiltration
 * path that a tenant-scoped access check cannot see, because every access check
 * involved passes.
 *
 * Run: npm test
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { TestDb, makeCtx, call, rejects } from "../../tests/convex/harness";
import { listByCompany, bulkCreate, create } from "../cogsAllocations";

const MINE = "company_mine";
const THEIRS = "company_theirs";
const THEIR_TXN = "txn_theirs";
const THEIR_POLICY = "policy_theirs";

let db: TestDb;
let ctx: any;

beforeEach(() => {
  db = new TestDb({
    cannabisCompanies: [
      { _id: MINE, name: "My Dispensary" },
      { _id: THEIRS, name: "Rival Cannabis Co" },
    ],
    users: [
      { _id: "u_mine", clerkId: "clerk_mine", companyId: MINE },
      { _id: "u_theirs", clerkId: "clerk_theirs", companyId: THEIRS },
    ],
    transactions: [
      {
        _id: THEIR_TXN,
        companyId: THEIRS,
        status: "posted",
        transactionDate: "2026-03-05",
        // The things a competitor would actually want.
        memo: "Bulk flower purchase — Emerald Farms",
        reference: "INV-9912",
        amount: 184_000,
      },
    ],
    allocationPolicies: [
      {
        _id: THEIR_POLICY,
        companyId: THEIRS,
        name: "Rival's facility split",
        method: "square_footage",
        status: "active",
      },
    ],
    cogsAllocations: [],
  });
  ctx = makeCtx(db, { clerkId: "clerk_mine" });
});

describe("cross-tenant references — write side", () => {
  it("refuses an allocation pointing at another company's transaction", async () => {
    await rejects(
      () =>
        call(create, ctx, {
          companyId: MINE,
          transactionId: THEIR_TXN,
          basisType: "square_footage",
          deductibleAmount: 100,
          nondeductibleAmount: 50,
          reviewStatus: "needs_review",
        }),
      /does not belong|must belong|another company|not found/i,
    );
  });

  it("refuses a bulk allocation pointing at another company's transaction", async () => {
    // bulkCreate is the wider hole: it takes an array, so one bad reference can
    // ride along with legitimate rows.
    await rejects(
      () =>
        call(bulkCreate, ctx, {
          companyId: MINE,
          allocations: [
            {
              transactionId: THEIR_TXN,
              basisType: "square_footage",
              deductibleAmount: 100,
              nondeductibleAmount: 50,
              reviewStatus: "needs_review",
            },
          ],
        }),
      /does not belong|must belong|another company|not found/i,
    );
  });

  it("refuses an allocation pointing at another company's policy", async () => {
    await rejects(
      () =>
        call(create, ctx, {
          companyId: MINE,
          policyId: THEIR_POLICY,
          basisType: "square_footage",
          deductibleAmount: 100,
          nondeductibleAmount: 50,
          reviewStatus: "needs_review",
        }),
      /does not belong|must belong|another company|not found/i,
    );
  });

  it("still accepts references to the caller's own records", async () => {
    // The guard has to permit the ordinary case, or it is just an outage.
    const mineTxn = await db.insert("transactions", {
      companyId: MINE,
      status: "posted",
      transactionDate: "2026-03-05",
      memo: "My rent",
    });
    const id = await call(create, ctx, {
      companyId: MINE,
      transactionId: mineTxn,
      basisType: "square_footage",
      deductibleAmount: 100,
      nondeductibleAmount: 50,
      reviewStatus: "needs_review",
    });
    assert.ok(id, "a well-formed allocation must still be accepted");
  });
});

describe("cross-tenant references — read side", () => {
  it("never returns another company's transaction through a join", async () => {
    // Defence in depth. Even if a bad reference exists — written before the
    // guard, or by an import path that bypasses it — the read must not serve
    // the foreign record. A leak needs both halves; closing either one is
    // enough, so close both.
    await db.insert("cogsAllocations", {
      companyId: MINE,
      transactionId: THEIR_TXN,
      policyId: THEIR_POLICY,
      basisType: "square_footage",
      deductibleAmount: 100,
      nondeductibleAmount: 50,
      reviewStatus: "needs_review",
    });

    const rows: any = await call(listByCompany, ctx, { companyId: MINE });
    assert.equal(rows.length, 1);

    const serialised = JSON.stringify(rows);
    assert.ok(
      !serialised.includes("Emerald Farms"),
      "another company's transaction memo came back through the join",
    );
    assert.ok(
      !serialised.includes("INV-9912"),
      "another company's transaction reference came back through the join",
    );
    assert.ok(
      !serialised.includes("Rival's facility split"),
      "another company's policy name came back through the join",
    );
    assert.equal(rows[0].transaction, null, "foreign transaction must resolve to null");
    assert.equal(rows[0].policy, null, "foreign policy must resolve to null");
  });
});

/* ─── Optional tenant filters ────────────────────────────────────────────── */

describe("optional companyId — a filter that defaults to everything", () => {
  /**
   * The widest hole found in this sweep, and the least like a hole.
   *
   * audit.queryAuditLogs declared companyId as v.optional(). The withAuth
   * wrapper scopes a request by reading companyId out of it, so when the
   * argument was absent there was nothing to scope — and the handler only
   * filtered by company `if (companyId)`.
   *
   * queryAuditLogs({}) therefore returned the audit log for every company on
   * the platform: who did what, to which records, when. Not a leak of one
   * record through a join — the whole ledger of activity, for everyone.
   *
   * An optional tenant filter on a query that spans tenants is not a filter.
   * It is a default of "everything".
   */
  it("queryAuditLogs cannot be called without a company", async () => {
    const audit: any = await import("../audit");
    const spec = JSON.parse(audit.queryAuditLogs.exportArgs());
    const companyArg = spec.value.companyId;
    assert.ok(companyArg, "companyId must still be an argument");
    // Convex reports optionality as an `optional` boolean on the field, not as
    // a union type. My first version of this assertion checked `.type` and so
    // passed against the very code it was written to catch — verified by
    // reverting the fix and watching it stay green.
    assert.equal(
      companyArg.optional,
      false,
      "companyId must be required — v.optional() here means the query spans every tenant",
    );
  });

  it("queryAuditLogs refuses another company's log", async () => {
    const audit: any = await import("../audit");
    await db.insert("auditLogs", {
      action: "transaction.posted",
      entity: "transactions",
      entityId: THEIR_TXN,
      userId: "u_theirs",
      companyId: THEIRS,
      timestamp: Date.now(),
      changes: [],
      metadata: {},
    });

    await rejects(
      () => call(audit.queryAuditLogs, ctx, { companyId: THEIRS }),
      /unauthorized|not a member/i,
    );
  });

  it("generateComplianceAlerts cannot sweep every company", async () => {
    // Same shape on the write side: omitting companyId iterated all companies,
    // reading their licences and filings and writing alerts into their
    // accounts. A platform-wide sweep is a scheduled job, not something the
    // customer application can trigger.
    const compliance: any = await import("../compliance");
    const spec = JSON.parse(compliance.generateComplianceAlerts.exportArgs());
    const companyArg = spec.value.companyId;
    assert.ok(companyArg, "companyId must still be an argument");
    assert.equal(
      companyArg.optional,
      false,
      "companyId must be required — optional meant 'every company'",
    );
  });
});

/* ─── Shared reference data ──────────────────────────────────────────────── */

describe("shared reference data — shared, or ours, never theirs", () => {
  /**
   * Tax jurisdictions are the awkward case: a state-level jurisdiction has
   * companyId null and every operator in that state legitimately uses it, while
   * a company may also define its own. requireSameCompany is the wrong rule
   * here — it would refuse the system records, which are the ordinary case.
   */
  it("accepts a system-wide jurisdiction", async () => {
    const tax: any = await import("../tax");
    await db.insert("taxJurisdictions", {
      _id: "jur_system",
      companyId: null,
      stateCode: "CO",
      jurisdictionName: "Colorado",
      jurisdictionLevel: "state",
      filingFrequency: "monthly",
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    await db.insert("taxProfiles", { companyId: MINE, state: "CO", isPrimary: true });

    // Should not throw on the jurisdiction check. It may fail later for other
    // reasons; what matters is that the reference itself is accepted.
    let refusedOnReference = false;
    try {
      await call(tax.updateCompanyTaxProfile, ctx, {
        companyId: MINE,
        primaryJurisdictionId: "jur_system",
        nexusStates: ["CO"],
        filingCalendar: {},
        taxTypesEnabled: [],
      });
    } catch (e: any) {
      if (/belongs to another company/i.test(e.message)) refusedOnReference = true;
    }
    assert.equal(refusedOnReference, false, "a shared jurisdiction must be usable");
  });

  it("refuses another company's private jurisdiction", async () => {
    const tax: any = await import("../tax");
    await db.insert("taxJurisdictions", {
      _id: "jur_theirs",
      companyId: THEIRS,
      stateCode: "CO",
      jurisdictionName: "Rival's local district",
      jurisdictionLevel: "city",
      filingFrequency: "monthly",
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await rejects(
      () =>
        call(tax.updateCompanyTaxProfile, ctx, {
          companyId: MINE,
          primaryJurisdictionId: "jur_theirs",
          nexusStates: ["CO"],
          filingCalendar: {},
          taxTypesEnabled: [],
        }),
      /belongs to another company/i,
    );
  });
});
