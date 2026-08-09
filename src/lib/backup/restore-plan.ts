/**
 * Pure planning logic for restoring a backup snapshot.
 *
 * The hard part of a Convex restore is that `_id` values cannot be reused
 * across deployments. Every cross-document reference (transactionLines →
 * transactions, transactions → reportingPeriods, and so on) has to be rewritten
 * to the id the target deployment assigns on insert. That means documents must
 * be inserted in an order where everything they point at already exists.
 *
 * This module contains no I/O so the remapping — the part that silently
 * corrupts a restore when it is wrong — can be tested directly.
 */

export interface SnapshotHeader {
  _meta: string;
  version: number;
  startedAt: string;
  convexUrl?: string;
  tables: Array<{ table: string; documents: number }>;
  totalDocuments: number;
}

export interface ParsedSnapshot {
  header: SnapshotHeader;
  docsByTable: Map<string, Array<Record<string, any>>>;
}

export class SnapshotError extends Error {}

/** Parses NDJSON. Throws rather than silently restoring a partial file. */
export function parseSnapshot(text: string): ParsedSnapshot {
  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  if (lines.length === 0) throw new SnapshotError("Snapshot is empty.");

  let header: SnapshotHeader;
  try {
    header = JSON.parse(lines[0]);
  } catch {
    throw new SnapshotError("First line is not valid JSON — header missing or corrupt.");
  }
  if (header._meta !== "tranquillo-green-backup") {
    throw new SnapshotError("Not a Tranquillo Green backup snapshot.");
  }

  const docsByTable = new Map<string, Array<Record<string, any>>>();
  for (let i = 1; i < lines.length; i++) {
    let doc: Record<string, any>;
    try {
      doc = JSON.parse(lines[i]);
    } catch {
      throw new SnapshotError(`Line ${i + 1} is not valid JSON — snapshot is truncated.`);
    }
    const table = doc._table;
    if (!table) throw new SnapshotError(`Line ${i + 1} has no _table tag.`);
    if (!doc._id) throw new SnapshotError(`Line ${i + 1} (${table}) has no _id.`);

    if (!docsByTable.has(table)) docsByTable.set(table, []);
    docsByTable.get(table)!.push(doc);
  }

  const actual = lines.length - 1;
  if (actual !== header.totalDocuments) {
    throw new SnapshotError(
      `Document count mismatch: header claims ${header.totalDocuments}, file has ${actual}.`,
    );
  }

  return { header, docsByTable };
}

/**
 * Collects the id-valued references in a document.
 *
 * Rather than hard-coding which field of which table is a foreign key — which
 * would silently rot every time the schema changes — a value is treated as a
 * reference when it matches an `_id` that exists elsewhere in the snapshot.
 * Convex ids are opaque high-entropy strings, so a collision with ordinary
 * user data is not a practical concern.
 */
export function collectReferences(
  doc: Record<string, any>,
  knownIds: Set<string>,
): string[] {
  const found: string[] = [];

  const walk = (value: any) => {
    if (typeof value === "string") {
      if (knownIds.has(value)) found.push(value);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (value && typeof value === "object") {
      for (const [key, nested] of Object.entries(value)) {
        if (key === "_id") continue; // the document's own identity, not a reference
        walk(nested);
      }
    }
  };

  for (const [key, value] of Object.entries(doc)) {
    if (key === "_id" || key === "_table" || key === "_creationTime") continue;
    walk(value);
  }

  return found;
}

/** Rewrites every reference in a document using the old→new id map. */
export function remapDocument(
  doc: Record<string, any>,
  idMap: Map<string, string>,
): Record<string, any> {
  const transform = (value: any): any => {
    if (typeof value === "string") return idMap.get(value) ?? value;
    if (Array.isArray(value)) return value.map(transform);
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, transform(v)]));
    }
    return value;
  };

  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(doc)) {
    // System fields are assigned by the target deployment, never carried over.
    if (key === "_id" || key === "_table" || key === "_creationTime") continue;
    out[key] = transform(value);
  }
  return out;
}

export interface RestoreBatch {
  table: string;
  /** Snapshot documents, still carrying their original `_id`. */
  docs: Array<Record<string, any>>;
}

export interface RestorePlan {
  batches: RestoreBatch[];
  /** Documents whose references can never be satisfied (cycles or dangling). */
  unresolvable: Array<{ table: string; id: string; missing: string[] }>;
  totalDocuments: number;
}

/**
 * Orders documents so every reference points at something already inserted.
 *
 * Uses a fixpoint rather than a hand-maintained table order: each pass takes
 * whatever is now insertable. This copes with schema changes and with tables
 * that reference each other in unexpected directions, and it reports what it
 * could not place instead of inserting documents with dangling pointers.
 */
export function planRestore(docsByTable: Map<string, Array<Record<string, any>>>): RestorePlan {
  const knownIds = new Set<string>();
  for (const docs of Array.from(docsByTable.values())) {
    for (const doc of docs) knownIds.add(doc._id);
  }

  const pending = new Map<string, Array<Record<string, any>>>();
  Array.from(docsByTable.entries()).forEach(([table, docs]) => pending.set(table, [...docs]));

  const resolved = new Set<string>();
  const batches: RestoreBatch[] = [];
  let totalDocuments = 0;

  for (;;) {
    let progressed = false;

    for (const [table, docs] of Array.from(pending.entries())) {
      if (docs.length === 0) continue;

      const ready: Array<Record<string, any>> = [];
      const notReady: Array<Record<string, any>> = [];

      for (const doc of docs) {
        const refs = collectReferences(doc, knownIds);
        // A self-reference is satisfied by this document's own insertion.
        const outstanding = refs.filter((ref) => ref !== doc._id && !resolved.has(ref));
        if (outstanding.length === 0) ready.push(doc);
        else notReady.push(doc);
      }

      if (ready.length > 0) {
        batches.push({ table, docs: ready });
        totalDocuments += ready.length;
        for (const doc of ready) resolved.add(doc._id);
        pending.set(table, notReady);
        progressed = true;
      }
    }

    if (!progressed) break;
  }

  const unresolvable: RestorePlan["unresolvable"] = [];
  for (const [table, docs] of Array.from(pending.entries())) {
    for (const doc of docs) {
      const missing = collectReferences(doc, knownIds).filter(
        (ref) => ref !== doc._id && !resolved.has(ref),
      );
      unresolvable.push({ table, id: doc._id, missing });
    }
  }

  return { batches, unresolvable, totalDocuments };
}
