/**
 * Tenant isolation — regression suite.
 *
 * WHY THIS EXISTS
 *
 * An audit on 2026-08-01 found that authQuery/authMutation supported only one
 * of the three call shapes used across convex/. The 62 call sites using the
 * positional (args, handler) form resolved `spec.handler` to undefined, so they
 * threw TypeError on every invocation and received no argument validation.
 *
 * Worse: the shape that DID work passed only (ctx, args) to the handler — no
 * identity — so those handlers structurally could not call a tenant guard.
 * The result was 0 of 121 company-scoped functions that both executed and
 * enforced isolation, and 79 that any signed-in user could call against
 * another operator's companyId.
 *
 * A previous review (qa-security-review.md, 2026-04-14) flagged this class of
 * bug and it regressed — one finding was renamed rather than fixed. These tests
 * are the ratchet that stops that happening again. They assert behaviour, not
 * implementation, so they stay valid if withAuth is refactored.
 *
 * Run: npm test
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { v } from "convex/values";
import { TestDb, makeCtx, call, rejects } from "../../tests/convex/harness";

import {
  authQuery,
  authMutation,
  requireCompanyAccessById,
  requireCompanyAccessBySlug,
  requireIdentity,
} from "../lib/withAuth";

/**
 * Convex's queryGeneric/mutationGeneric return a *registered function*, not the
 * spec object. The original handler is exposed as `_handler`, and the argument
 * validators via `exportArgs()`.
 *
 * Note: the pre-existing tax tests in this directory call `.handler(...)`
 * directly, which does not exist on a registered function — one of several
 * reasons that suite has never run.
 */
function invoke(fn: any) {
  const h = fn._handler ?? fn.handler;
  assert.equal(
    typeof h,
    "function",
    "registered function exposes no callable handler"
  );
  return h as (ctx: any, args: any) => Promise<any>;
}

/** Names of the declared argument validators, via Convex's own serialisation. */
function argNames(fn: any): string[] {
  if (typeof fn.exportArgs !== "function") return [];
  try {
    return Object.keys(JSON.parse(fn.exportArgs()).value ?? {});
  } catch {
    return [];
  }
}

/* ─── Minimal Convex ctx double ──────────────────────────────────────────── */

const ACME = { _id: "company_acme", name: "Acme Cannabis", slug: "acme" };
const RIVAL = { _id: "company_rival", name: "Rival Co", slug: "rival" };

const USERS = [
  { _id: "user_1", clerkId: "clerk_acme_owner", companyId: ACME._id },
  { _id: "user_2", clerkId: "clerk_rival_owner", companyId: RIVAL._id },
  // Provisioned in Clerk but never mapped to a company.
  { _id: "user_3", clerkId: "clerk_orphan", companyId: undefined },
];

const COMPANIES = [ACME, RIVAL];

function makeDb() {
  return {
    async get(id: string) {
      return COMPANIES.find((c) => c._id === id) ?? null;
    },
    query(table: string) {
      const rows: any[] =
        table === "users" ? USERS : table === "cannabisCompanies" ? COMPANIES : [];
      let predicate: (row: any) => boolean = () => true;
      const builder: any = {
        withIndex(_name: string, selector: (q: any) => any) {
          // Capture the eq() calls the selector performs.
          const captured: Record<string, unknown> = {};
          const q = {
            eq(field: string, value: unknown) {
              captured[field] = value;
              return q;
            },
          };
          selector(q);
          predicate = (row) =>
            Object.entries(captured).every(([f, v]) => row[f] === v);
          return builder;
        },
        async unique() {
          const hits = rows.filter(predicate);
          return hits.length === 1 ? hits[0] : hits[0] ?? null;
        },
        async first() {
          return rows.filter(predicate)[0] ?? null;
        },
        async collect() {
          return rows.filter(predicate);
        },
      };
      return builder;
    },
  };
}

/** ctx for a signed-in user, or an anonymous caller when clerkId is null. */
function ctxFor(clerkId: string | null) {
  return {
    db: makeDb(),
    auth: {
      async getUserIdentity() {
        return clerkId ? { subject: clerkId } : null;
      },
    },
  } as any;
}

const asAcme = () => ctxFor("clerk_acme_owner");
const asRival = () => ctxFor("clerk_rival_owner");
const anonymous = () => ctxFor(null);

async function rejects(fn: () => Promise<unknown>, match: RegExp) {
  await assert.rejects(fn, (err: Error) => {
    assert.match(err.message, match);
    return true;
  });
}

/* ─── The three call shapes must all execute ─────────────────────────────── */

describe("withAuth — call shape compatibility", () => {
  // Shape A: authQuery({ args, handler })  — 108 call sites
  const shapeA = authQuery({
    args: { companyId: v.string() },
    handler: async (_ctx: any, _args: any, identity: any) =>
      `ran:${identity.subject}`,
  });

  // Shape B: authQuery({ args: {...} }, handler)  — 25 call sites
  const shapeB = authQuery({ args: { companyId: v.string() } }, async (
    _ctx: any,
    _args: any,
    identity: any
  ) => `ran:${identity.subject}`);

  // Shape C: authQuery({ ...validators }, handler)  — 37 call sites
  const shapeC = authQuery({ companyId: v.string() }, async (
    _ctx: any,
    _args: any,
    identity: any
  ) => `ran:${identity.subject}`);

  const shapes: Array<[string, any]> = [
    ["A (single spec object)", shapeA],
    ["B (positional, nested args)", shapeB],
    ["C (positional, bare args)", shapeC],
  ];

  for (const [label, fn] of shapes) {
    it(`shape ${label} executes instead of throwing TypeError`, async () => {
      const result = await invoke(fn)(asAcme(), { companyId: ACME._id });
      assert.equal(result, "ran:clerk_acme_owner");
    });

    it(`shape ${label} preserves its argument validators`, async () => {
      // Regression: shapes B and C previously produced args === undefined,
      // which silently disabled Convex argument validation. Read them back
      // through Convex's own serialisation rather than a private field.
      assert.deepEqual(argNames(fn), ["companyId"]);
    });

    it(`shape ${label} passes identity to the handler`, async () => {
      // Regression: shape A never received identity, so no handler using it
      // could call a tenant guard.
      const result = await invoke(fn)(asAcme(), { companyId: ACME._id });
      assert.ok(
        String(result).includes("clerk_acme_owner"),
        "handler did not receive a usable identity"
      );
    });
  }
});

/* ─── Tenant isolation ───────────────────────────────────────────────────── */

describe("withAuth — tenant isolation by companyId", () => {
  const readCompany = authQuery({ companyId: v.string() }, async () => "leaked");

  it("allows a member to access their own company", async () => {
    const result = await invoke(readCompany)(asAcme(), { companyId: ACME._id });
    assert.equal(result, "leaked");
  });

  it("blocks a member of another company", async () => {
    await rejects(
      () => invoke(readCompany)(asRival(), { companyId: ACME._id }),
      /Unauthorized: Not a member of this company/
    );
  });

  it("blocks a user with no company mapping", async () => {
    await rejects(
      () => invoke(readCompany)(ctxFor("clerk_orphan"), { companyId: ACME._id }),
      /Unauthorized: Not a member of this company/
    );
  });

  it("blocks an unauthenticated caller", async () => {
    await rejects(
      () => invoke(readCompany)(anonymous(), { companyId: ACME._id }),
      /Unauthenticated/
    );
  });

  it("blocks writes cross-tenant, not just reads", async () => {
    const write = authMutation({ companyId: v.string() }, async () => "written");
    await rejects(
      () => invoke(write)(asRival(), { companyId: ACME._id }),
      /Unauthorized: Not a member of this company/
    );
  });
});

describe("withAuth — tenant isolation by slug", () => {
  const readBySlug = authQuery({ slug: v.string() }, async () => "leaked");

  it("allows a member to access their own company by slug", async () => {
    const result = await invoke(readBySlug)(asAcme(), { slug: ACME.slug });
    assert.equal(result, "leaked");
  });

  it("blocks slug access to another company", async () => {
    await rejects(
      () => invoke(readBySlug)(asRival(), { slug: ACME.slug }),
      /Unauthorized: Not a member of this company/
    );
  });

  it("blocks an unauthenticated caller by slug", async () => {
    await rejects(
      () => invoke(readBySlug)(anonymous(), { slug: ACME.slug }),
      /Unauthenticated/
    );
  });
});

/* ─── Guard return contracts ─────────────────────────────────────────────── */

describe("tenant guards — return contracts", () => {
  let identity: any;

  beforeEach(() => {
    identity = { subject: "clerk_acme_owner" };
  });

  it("requireCompanyAccessById returns { company, user }", async () => {
    // companies.ts::updateCompany destructures `{ company }`. This previously
    // returned undefined, throwing "Cannot destructure property 'company'".
    const result: any = await requireCompanyAccessById(
      asAcme(),
      identity,
      ACME._id
    );
    assert.ok(result, "guard returned undefined");
    assert.equal(result.company._id, ACME._id);
    assert.equal(result.user.clerkId, "clerk_acme_owner");
  });

  it("requireCompanyAccessBySlug returns the company record", async () => {
    // accountingCore.ts and importJobs.ts assign the result and read _id.
    const company: any = await requireCompanyAccessBySlug(
      asAcme(),
      identity,
      ACME.slug
    );
    assert.ok(company, "guard returned undefined");
    assert.equal(company._id, ACME._id);
  });

  it("requireCompanyAccessById rejects a foreign company", async () => {
    await rejects(
      () => requireCompanyAccessById(asAcme(), identity, RIVAL._id) as any,
      /Unauthorized: Not a member of this company/
    );
  });

  it("requireIdentity rejects an anonymous caller", async () => {
    await rejects(() => requireIdentity(anonymous()), /Unauthenticated/);
  });
});

/* ─── Guard-forgetting must not reopen the hole ──────────────────────────── */

describe("withAuth — enforcement does not depend on the handler", () => {
  it("blocks cross-tenant access even when the handler calls no guard", async () => {
    // This is the core property. 79 functions shipped without a guard call.
    // Enforcement lives in the wrapper so a handler cannot forget it.
    const forgetful = authQuery({ companyId: v.string() }, async (ctx: any, args: any) => {
      return await ctx.db.get(args.companyId);
    });

    await rejects(
      () => invoke(forgetful)(asRival(), { companyId: ACME._id }),
      /Unauthorized: Not a member of this company/
    );
  });

  it("still returns data to the legitimate owner", async () => {
    const forgetful = authQuery({ companyId: v.string() }, async (ctx: any, args: any) => {
      return await ctx.db.get(args.companyId);
    });

    const result: any = await invoke(forgetful)(asAcme(), {
      companyId: ACME._id,
    });
    assert.equal(result.name, "Acme Cannabis");
  });
});

/* ─── Records reached by their own ID ────────────────────────────────────── */

describe("tenant isolation — functions reached by record ID", () => {
  /**
   * The structural guard in byIdTenantScope.test.ts proves a check is present.
   * These prove the check actually refuses, which is a different claim: a
   * scope call in the wrong place, or against the wrong company, would satisfy
   * the structural test and still leak.
   *
   * The shape of the original hole: the withAuth wrapper scopes a request by
   * reading companyId out of it. Give it only `{ policyId }` and it has nothing
   * to check, so the call sailed through untouched.
   */
  const OWNER = "company_owner";
  const OTHER = "company_other";

  function seedTwoCompanies() {
    return new TestDb({
      cannabisCompanies: [
        { _id: OWNER, name: "Verdant Hollow" },
        { _id: OTHER, name: "Rival Cannabis Co" },
      ],
      users: [
        { _id: "u_owner", clerkId: "clerk_owner", companyId: OWNER },
        { _id: "u_rival", clerkId: "clerk_rival", companyId: OTHER },
      ],
      allocationPolicies: [
        { _id: "pol_owner", companyId: OWNER, name: "Facility split", method: "square_footage", status: "active", effectiveFrom: "2026-01-01" },
      ],
      cogsAllocations: [
        { _id: "alloc_owner", companyId: OWNER, basisType: "square_footage", deductibleAmount: 100, nondeductibleAmount: 50, reviewStatus: "needs_review" },
      ],
      taxFilings: [
        { _id: "filing_owner", companyId: OWNER, taxProfileId: "tp1", filingType: "excise", periodLabel: "2026-03", dueDate: "2026-04-20", status: "pending" },
      ],
      section471cElections: [
        { _id: "elec_owner", companyId: OWNER, elected: true, eligible: true, priorYear1: 2025, priorYear1Receipts: 1, priorYear2: 2024, priorYear2Receipts: 1, priorYear3: 2023, priorYear3Receipts: 1, averageGrossReceipts: 1 },
      ],
      complianceAlerts: [
        { _id: "alert_owner", companyId: OWNER, category: "tax", severity: "warning", title: "x", body: "y" },
      ],
      inventoryBatches: [
        { _id: "batch_owner", companyId: OWNER, productId: "p1", packageTag: "TAG1", quantityOnHand: 10, source: "manual" },
      ],
    });
  }

  const cases: Array<{ what: string; mod: string; fn: string; args: any }> = [
    { what: "read another company's allocation policy", mod: "allocationPolicies", fn: "getById", args: { policyId: "pol_owner" } },
    { what: "rewrite another company's allocation policy", mod: "allocationPolicies", fn: "update", args: { policyId: "pol_owner", name: "Hijacked" } },
    { what: "delete another company's allocation policy", mod: "allocationPolicies", fn: "remove", args: { policyId: "pol_owner" } },
    { what: "read another company's COGS allocation", mod: "cogsAllocations", fn: "getById", args: { allocationId: "alloc_owner" } },
    { what: "approve another company's COGS allocation", mod: "cogsAllocations", fn: "approve", args: { allocationId: "alloc_owner" } },
    { what: "reopen another company's COGS allocation", mod: "cogsAllocations", fn: "markNeedsReview", args: { allocationId: "alloc_owner" } },
    { what: "read another company's tax filing", mod: "taxFilings", fn: "getTaxFiling", args: { filingId: "filing_owner" } },
    { what: "delete another company's tax filing", mod: "taxFilings", fn: "deleteTaxFiling", args: { filingId: "filing_owner" } },
    { what: "edit another company's 471(c) election notes", mod: "section471c", fn: "updateElectionNotes", args: { electionId: "elec_owner", notes: "tampered" } },
    { what: "resolve another company's compliance alert", mod: "compliance", fn: "resolveAlert", args: { alertId: "alert_owner" } },
    { what: "delete another company's inventory batch", mod: "inventory", fn: "deleteBatch", args: { batchId: "batch_owner" } },
  ];

  for (const c of cases) {
    it(`refuses: ${c.what}`, async () => {
      const db = seedTwoCompanies();
      const rival = makeCtx(db, { clerkId: "clerk_rival" });
      const mod: any = await import(`../${c.mod}`);
      const fn = mod[c.fn];
      assert.ok(fn, `${c.mod}.${c.fn} does not exist`);

      await rejects(
        () => call(fn, rival, c.args),
        /unauthorized|not a member|access|denied/i,
      );
    });
  }

  it("the owner can still reach their own records", async () => {
    // A guard that refuses everyone is not isolation, it is an outage.
    const db = seedTwoCompanies();
    const owner = makeCtx(db, { clerkId: "clerk_owner" });
    const mod: any = await import("../allocationPolicies");
    const policy: any = await call(mod.getById, owner, { policyId: "pol_owner" });
    assert.equal(policy?.name, "Facility split");
  });
});

describe("platform reference data", () => {
  it("a tenant cannot rewrite the shared tax rate tables", async () => {
    // These tables are shared by every company. A single bad write would alter
    // other businesses' filings, and the wrong figure would look legitimate.
    const db = new TestDb({
      cannabisCompanies: [{ _id: "c1", name: "Any Co" }],
      users: [{ _id: "u1", clerkId: "clerk_any", companyId: "c1" }],
    });
    const ctx = makeCtx(db, { clerkId: "clerk_any" });
    const tax: any = await import("../tax");

    await rejects(
      () =>
        call(tax.upsertTaxRate, ctx, {
          data: {
            jurisdictionId: "jur_co",
            taxTypeId: "tt_excise",
            rate: 0.0,
            rateType: "percentage",
            effectiveFrom: Date.now(),
          },
        }),
      /not a tenant operation/i,
    );
  });
});
