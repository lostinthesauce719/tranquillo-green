import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { BACKUP_TABLES } from "./backup";

/**
 * Restore support. Gated by BACKUP_SECRET — the same trust boundary as export,
 * since anything that can read every tenant's records can also write them.
 *
 * Restore is far more dangerous than backup: run against the wrong deployment
 * it duplicates or corrupts live books. The guards here exist to make that
 * mistake require deliberate effort rather than a mistyped URL.
 */
function assertSecret(provided: string) {
  const expected = process.env.BACKUP_SECRET;
  if (!expected) {
    throw new Error("BACKUP_SECRET is not configured on this deployment; restore is disabled.");
  }
  if (provided.length !== expected.length) throw new Error("Unauthorized restore request.");
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  if (mismatch !== 0) throw new Error("Unauthorized restore request.");
}

/**
 * Reports how much data the target already holds, so a restore can refuse to
 * run into a populated deployment unless that is explicitly intended.
 */
export const inspectTarget = queryGeneric({
  args: { secret: v.string() },
  handler: async (ctx: any, args) => {
    assertSecret(args.secret);

    const counts: Record<string, number> = {};
    let total = 0;
    for (const table of BACKUP_TABLES) {
      // take(1) is enough to answer "is this deployment empty?" without
      // scanning a large table.
      const sample = await ctx.db.query(table).take(1);
      const present = sample.length;
      counts[table] = present;
      total += present;
    }

    return { isEmpty: total === 0, nonEmptyTables: Object.keys(counts).filter((t) => counts[t] > 0) };
  },
});

/**
 * Inserts a batch of documents into one table and returns the new ids in the
 * same order, so the caller can build the old→new mapping for later batches.
 */
export const insertBatch = mutationGeneric({
  args: {
    secret: v.string(),
    table: v.string(),
    documents: v.array(v.any()),
    allowNonEmptyTarget: v.optional(v.boolean()),
  },
  handler: async (ctx: any, args) => {
    assertSecret(args.secret);

    if (!(BACKUP_TABLES as readonly string[]).includes(args.table)) {
      throw new Error(`Unknown table: ${args.table}`);
    }
    if (args.documents.length > 500) {
      throw new Error("Batch too large; split into chunks of 500 or fewer.");
    }

    if (!args.allowNonEmptyTarget) {
      const existing = await ctx.db.query(args.table).take(1);
      if (existing.length > 0) {
        throw new Error(
          `Table "${args.table}" already contains data. Restoring into it would duplicate ` +
            `records. Pass allowNonEmptyTarget only if you intend that.`,
        );
      }
    }

    const ids: string[] = [];
    for (const doc of args.documents) {
      // Strip system fields defensively; the target assigns its own.
      const { _id, _creationTime, _table, ...rest } = doc ?? {};
      ids.push(await ctx.db.insert(args.table, rest));
    }
    return { ids };
  },
});
