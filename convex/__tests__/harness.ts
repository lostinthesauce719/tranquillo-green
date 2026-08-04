/**
 * Test harness for Convex functions.
 *
 * WHY THIS EXISTS
 *
 * The previous harness (now in quarantine/convex-legacy-tests/) could not work:
 * it imported `vitest`, which is not a dependency, and invoked functions via
 * `fn.handler(...)`, which does not exist on a registered Convex function. Its
 * `testUtils.ts` also never exported the helpers every test imported from it.
 *
 * This one exercises the real registered-function API and models enough of the
 * Convex database surface for the financial modules: withIndex, filter with
 * eq/and/or/lt(e)/gt(e), order, first/unique/collect/take, get, insert, patch.
 */

import assert from "node:assert/strict";

/* ─── Registered-function invocation ─────────────────────────────────────── */

/**
 * Convex's queryGeneric/mutationGeneric return a registered function exposing
 * the original handler as `_handler`. Calling `fn.handler(...)` — as the legacy
 * tests did — hits `undefined`.
 */
export function invoke(fn: any) {
  const h = fn?._handler ?? fn?.handler;
  assert.equal(
    typeof h,
    "function",
    "registered function exposes no callable handler"
  );
  return h as (ctx: any, args: any) => Promise<any>;
}

/** Call a registered Convex function against a context. */
export function call(fn: any, ctx: any, args: any = {}) {
  return invoke(fn)(ctx, args);
}

/* ─── Filter expression evaluation ───────────────────────────────────────── */

type Expr =
  | { op: "field"; name: string }
  | { op: "lit"; value: unknown }
  | { op: "eq" | "neq" | "lt" | "lte" | "gt" | "gte"; l: Expr; r: Expr }
  | { op: "and" | "or"; parts: Expr[] }
  | { op: "not"; part: Expr };

function lit(v: unknown): Expr {
  return v && typeof v === "object" && "op" in (v as any)
    ? (v as Expr)
    : { op: "lit", value: v };
}

/** The `q` object handed to .filter(). Mirrors Convex's expression builder. */
const q = {
  field: (name: string): Expr => ({ op: "field", name }),
  eq: (l: any, r: any): Expr => ({ op: "eq", l: lit(l), r: lit(r) }),
  neq: (l: any, r: any): Expr => ({ op: "neq", l: lit(l), r: lit(r) }),
  lt: (l: any, r: any): Expr => ({ op: "lt", l: lit(l), r: lit(r) }),
  lte: (l: any, r: any): Expr => ({ op: "lte", l: lit(l), r: lit(r) }),
  gt: (l: any, r: any): Expr => ({ op: "gt", l: lit(l), r: lit(r) }),
  gte: (l: any, r: any): Expr => ({ op: "gte", l: lit(l), r: lit(r) }),
  and: (...parts: any[]): Expr => ({ op: "and", parts: parts.map(lit) }),
  or: (...parts: any[]): Expr => ({ op: "or", parts: parts.map(lit) }),
  not: (part: any): Expr => ({ op: "not", part: lit(part) }),
};

function evalExpr(e: Expr, doc: any): any {
  switch (e.op) {
    case "field":
      return doc?.[e.name];
    case "lit":
      return e.value;
    case "eq":
      return evalExpr(e.l, doc) === evalExpr(e.r, doc);
    case "neq":
      return evalExpr(e.l, doc) !== evalExpr(e.r, doc);
    case "lt":
      return (evalExpr(e.l, doc) as any) < (evalExpr(e.r, doc) as any);
    case "lte":
      return (evalExpr(e.l, doc) as any) <= (evalExpr(e.r, doc) as any);
    case "gt":
      return (evalExpr(e.l, doc) as any) > (evalExpr(e.r, doc) as any);
    case "gte":
      return (evalExpr(e.l, doc) as any) >= (evalExpr(e.r, doc) as any);
    case "and":
      return e.parts.every((p) => evalExpr(p, doc));
    case "or":
      return e.parts.some((p) => evalExpr(p, doc));
    case "not":
      return !evalExpr(e.part, doc);
  }
}

/* ─── Database double ────────────────────────────────────────────────────── */

let idSeq = 0;
const newId = (table: string) => `${table}_${(++idSeq).toString(36)}`;

export type Seed = Record<string, any[]>;

export class TestDb {
  tables = new Map<string, any[]>();

  constructor(seed: Seed = {}) {
    for (const [table, rows] of Object.entries(seed)) {
      this.tables.set(
        table,
        rows.map((r) => ({
          _id: r._id ?? newId(table),
          _creationTime: r._creationTime ?? Date.now(),
          ...r,
        }))
      );
    }
  }

  rows(table: string): any[] {
    if (!this.tables.has(table)) this.tables.set(table, []);
    return this.tables.get(table)!;
  }

  /** Find a document by _id across every table, as ctx.db.get does. */
  async get(id: string) {
    if (id == null) return null;
    for (const rows of this.tables.values()) {
      const hit = rows.find((r) => r._id === id);
      if (hit) return hit;
    }
    return null;
  }

  async insert(table: string, doc: any) {
    const _id = newId(table);
    this.rows(table).push({ _id, _creationTime: Date.now(), ...doc });
    return _id;
  }

  async patch(id: string, fields: any) {
    for (const rows of this.tables.values()) {
      const hit = rows.find((r) => r._id === id);
      if (hit) {
        Object.assign(hit, fields);
        return;
      }
    }
    throw new Error(`patch: no document ${id}`);
  }

  async replace(id: string, doc: any) {
    for (const rows of this.tables.values()) {
      const i = rows.findIndex((r) => r._id === id);
      if (i >= 0) {
        rows[i] = { _id: id, _creationTime: rows[i]._creationTime, ...doc };
        return;
      }
    }
    throw new Error(`replace: no document ${id}`);
  }

  async delete(id: string) {
    for (const rows of this.tables.values()) {
      const i = rows.findIndex((r) => r._id === id);
      if (i >= 0) {
        rows.splice(i, 1);
        return;
      }
    }
  }

  query(table: string) {
    return new TestQuery(this.rows(table));
  }
}

class TestQuery {
  private pending: any[];
  private desc = false;
  private orderField: string | null = null;

  constructor(rows: any[]) {
    this.pending = [...rows];
  }

  /**
   * Indexes are modelled as equality constraints. The selector calls
   * q.eq(field, value) one or more times; we capture and apply them. Range
   * bounds (gt/lt) inside withIndex are treated as filters too.
   */
  withIndex(_name: string, selector?: (b: any) => any) {
    if (!selector) return this;
    const constraints: Array<[string, unknown]> = [];
    const builder: any = {
      eq(field: string, value: unknown) {
        constraints.push([field, value]);
        return builder;
      },
      gt: () => builder,
      gte: () => builder,
      lt: () => builder,
      lte: () => builder,
    };
    selector(builder);
    this.pending = this.pending.filter((d) =>
      constraints.every(([f, v]) => d[f] === v)
    );
    return this;
  }

  filter(fn: (b: typeof q) => Expr) {
    const expr = fn(q);
    this.pending = this.pending.filter((d) => evalExpr(expr, d));
    return this;
  }

  order(dir: "asc" | "desc", field?: string) {
    this.desc = dir === "desc";
    this.orderField = field ?? null;
    return this;
  }

  private sorted() {
    const f = this.orderField ?? "_creationTime";
    const out = [...this.pending].sort((a, b) =>
      a[f] === b[f] ? 0 : (a[f] as any) < (b[f] as any) ? -1 : 1
    );
    return this.desc ? out.reverse() : out;
  }

  async collect() {
    return this.sorted();
  }
  async first() {
    return this.sorted()[0] ?? null;
  }
  async unique() {
    const r = this.sorted();
    if (r.length > 1) throw new Error("unique(): more than one match");
    return r[0] ?? null;
  }
  async take(n: number) {
    return this.sorted().slice(0, n);
  }
}

/* ─── Context ────────────────────────────────────────────────────────────── */

export type CtxOptions = {
  /** Clerk subject; null models an unauthenticated caller. */
  clerkId?: string | null;
};

export function makeCtx(db: TestDb, { clerkId = "clerk_owner" }: CtxOptions = {}) {
  return {
    db,
    auth: {
      async getUserIdentity() {
        return clerkId ? { subject: clerkId } : null;
      },
    },
    scheduler: { runAfter: async () => undefined, runAt: async () => undefined },
  } as any;
}

/** Assert that a promise rejects with a message matching `re`. */
export async function rejects(fn: () => Promise<unknown>, re: RegExp) {
  await assert.rejects(fn, (err: Error) => {
    assert.match(err.message, re);
    return true;
  });
}

/** Round to cents, for comparing money without float noise. */
export const cents = (n: number) => Math.round(n * 100) / 100;
