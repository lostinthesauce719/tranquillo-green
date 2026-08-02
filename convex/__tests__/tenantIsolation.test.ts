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

import {
  authQuery,
  authMutation,
  requireCompanyAccessById,
  requireCompanyAccessBySlug,
  requireIdentity,
} from "../lib/withAuth";

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
    args: { companyId: "v.id" },
    handler: async (_ctx: any, _args: any, identity: any) =>
      `ran:${identity.subject}`,
  });

  // Shape B: authQuery({ args: {...} }, handler)  — 25 call sites
  const shapeB = authQuery({ args: { companyId: "v.id" } }, async (
    _ctx: any,
    _args: any,
    identity: any
  ) => `ran:${identity.subject}`);

  // Shape C: authQuery({ ...validators }, handler)  — 37 call sites
  const shapeC = authQuery({ companyId: "v.id" }, async (
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
      const result = await fn.handler(asAcme(), { companyId: ACME._id });
      assert.equal(result, "ran:clerk_acme_owner");
    });

    it(`shape ${label} preserves its argument validators`, async () => {
      // Regression: shapes B and C previously produced args === undefined,
      // which silently disabled Convex argument validation.
      assert.deepEqual(fn.args, { companyId: "v.id" });
    });

    it(`shape ${label} passes identity to the handler`, async () => {
      // Regression: shape A never received identity, so no handler using it
      // could call a tenant guard.
      const result = await fn.handler(asAcme(), { companyId: ACME._id });
      assert.ok(
        String(result).includes("clerk_acme_owner"),
        "handler did not receive a usable identity"
      );
    });
  }
});

/* ─── Tenant isolation ───────────────────────────────────────────────────── */

describe("withAuth — tenant isolation by companyId", () => {
  const readCompany = authQuery({ companyId: "v.id" }, async () => "leaked");

  it("allows a member to access their own company", async () => {
    const result = await readCompany.handler(asAcme(), { companyId: ACME._id });
    assert.equal(result, "leaked");
  });

  it("blocks a member of another company", async () => {
    await rejects(
      () => readCompany.handler(asRival(), { companyId: ACME._id }),
      /Unauthorized: Not a member of this company/
    );
  });

  it("blocks a user with no company mapping", async () => {
    await rejects(
      () => readCompany.handler(ctxFor("clerk_orphan"), { companyId: ACME._id }),
      /Unauthorized: Not a member of this company/
    );
  });

  it("blocks an unauthenticated caller", async () => {
    await rejects(
      () => readCompany.handler(anonymous(), { companyId: ACME._id }),
      /Unauthenticated/
    );
  });

  it("blocks writes cross-tenant, not just reads", async () => {
    const write = authMutation({ companyId: "v.id" }, async () => "written");
    await rejects(
      () => write.handler(asRival(), { companyId: ACME._id }),
      /Unauthorized: Not a member of this company/
    );
  });
});

describe("withAuth — tenant isolation by slug", () => {
  const readBySlug = authQuery({ slug: "v.string" }, async () => "leaked");

  it("allows a member to access their own company by slug", async () => {
    const result = await readBySlug.handler(asAcme(), { slug: ACME.slug });
    assert.equal(result, "leaked");
  });

  it("blocks slug access to another company", async () => {
    await rejects(
      () => readBySlug.handler(asRival(), { slug: ACME.slug }),
      /Unauthorized: Not a member of this company/
    );
  });

  it("blocks an unauthenticated caller by slug", async () => {
    await rejects(
      () => readBySlug.handler(anonymous(), { slug: ACME.slug }),
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
    const forgetful = authQuery({ companyId: "v.id" }, async (ctx: any, args: any) => {
      return await ctx.db.get(args.companyId);
    });

    await rejects(
      () => forgetful.handler(asRival(), { companyId: ACME._id }),
      /Unauthorized: Not a member of this company/
    );
  });

  it("still returns data to the legitimate owner", async () => {
    const forgetful = authQuery({ companyId: "v.id" }, async (ctx: any, args: any) => {
      return await ctx.db.get(args.companyId);
    });

    const result: any = await forgetful.handler(asAcme(), {
      companyId: ACME._id,
    });
    assert.equal(result.name, "Acme Cannabis");
  });
});
