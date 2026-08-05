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
