/**
 * Structurally compares two snapshots, ignoring ids.
 *
 *   npx tsx scripts/compare-snapshots.ts before.ndjson after.ndjson
 *
 * A restore legitimately changes every `_id`, so a byte or id comparison is
 * useless. What must survive is the *shape of the graph*: the same documents,
 * with the same field values, pointing at the same records.
 *
 * Each document is reduced to a canonical form in which every reference is
 * replaced by the canonical form of the document it points at, computed
 * recursively. Two graphs match only if they are isomorphic with identical
 * field values — which is exactly the property a restore must preserve, and
 * the one that breaks silently when remapping is wrong.
 *
 * Exits non-zero on any difference, so it can gate a drill or run in CI.
 */

import { readFileSync } from "node:fs";
import { parseSnapshot } from "../src/lib/backup/restore-plan";

function fail(message: string): never {
  console.error(`\nMISMATCH: ${message}`);
  process.exit(1);
}

function load(path: string) {
  const { docsByTable } = parseSnapshot(readFileSync(path, "utf8"));
  const byId = new Map<string, Record<string, any>>();
  for (const docs of Array.from(docsByTable.values())) {
    for (const doc of docs) byId.set(doc._id, doc);
  }
  return { docsByTable, byId };
}

/**
 * Canonical form of a document: its table plus every field, with references
 * resolved to the canonical form of their target. Cycles are cut with a
 * marker so the recursion terminates.
 */
function canonicalize(
  doc: Record<string, any>,
  byId: Map<string, Record<string, any>>,
  visiting: Set<string> = new Set(),
): string {
  if (visiting.has(doc._id)) return `<cycle:${doc._table}>`;
  visiting.add(doc._id);

  const transform = (value: any): any => {
    if (typeof value === "string" && byId.has(value)) {
      return `→${canonicalize(byId.get(value)!, byId, visiting)}`;
    }
    if (Array.isArray(value)) return value.map(transform);
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => [k, transform(v)]),
      );
    }
    return value;
  };

  const fields = Object.entries(doc)
    .filter(([key]) => key !== "_id" && key !== "_table" && key !== "_creationTime")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => [key, transform(value)]);

  visiting.delete(doc._id);
  return `${doc._table}${JSON.stringify(fields)}`;
}

const [pathA, pathB] = process.argv.slice(2);
if (!pathA || !pathB) {
  fail("Usage: npx tsx scripts/compare-snapshots.ts <before.ndjson> <after.ndjson>");
}

const a = load(pathA);
const b = load(pathB);

const tablesA = new Set(Array.from(a.docsByTable.keys()));
const tablesB = new Set(Array.from(b.docsByTable.keys()));

for (const table of Array.from(tablesA)) {
  if (!tablesB.has(table)) fail(`table "${table}" is present in ${pathA} but missing from ${pathB}`);
}
for (const table of Array.from(tablesB)) {
  if (!tablesA.has(table)) fail(`table "${table}" appeared in ${pathB} but is not in ${pathA}`);
}

let compared = 0;

for (const table of Array.from(tablesA)) {
  const docsA = a.docsByTable.get(table)!;
  const docsB = b.docsByTable.get(table)!;

  if (docsA.length !== docsB.length) {
    fail(`table "${table}": ${docsA.length} documents before, ${docsB.length} after`);
  }

  const canonA = docsA.map((d) => canonicalize(d, a.byId)).sort();
  const canonB = docsB.map((d) => canonicalize(d, b.byId)).sort();

  for (let i = 0; i < canonA.length; i++) {
    if (canonA[i] !== canonB[i]) {
      console.error(`\nTable "${table}" differs.`);
      console.error(`  before: ${canonA[i].slice(0, 400)}`);
      console.error(`  after:  ${canonB[i].slice(0, 400)}`);
      fail(`document mismatch in "${table}"`);
    }
  }

  compared += docsA.length;
}

// A restore that reused ids would look "identical" while being broken, so
// confirm the identifiers actually changed.
const idsA = new Set(Array.from(a.byId.keys()));
const shared = Array.from(b.byId.keys()).filter((id) => idsA.has(id));

console.log(`MATCH: ${compared} documents across ${tablesA.size} tables are structurally identical.`);
if (shared.length > 0) {
  console.log(
    `  note: ${shared.length} id(s) are identical across both snapshots — expected 0 after a ` +
      `cross-deployment restore. Verify the target really is a different deployment.`,
  );
} else {
  console.log(`  every id was reassigned by the target, and every reference still resolves.`);
}
