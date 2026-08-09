/**
 * Verifies a backup snapshot is complete and parseable.
 *
 * A backup nobody has ever read is a guess, not a backup. Run this against a
 * downloaded snapshot before trusting it:
 *
 *   npx tsx scripts/verify-backup.ts path/to/snapshot.ndjson
 *
 * Exits non-zero when the header is missing, a line fails to parse, or the
 * document count disagrees with the header — so it can be wired into a cron
 * or CI check rather than eyeballed.
 */

import { readFileSync } from "node:fs";

function fail(message: string): never {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

const path = process.argv[2];
if (!path) {
  fail("Usage: npx tsx scripts/verify-backup.ts <snapshot.ndjson>");
}

let raw: string;
try {
  raw = readFileSync(path, "utf8");
} catch (error) {
  fail(`Could not read ${path}: ${error instanceof Error ? error.message : error}`);
}

const lines = raw.split("\n").filter((line) => line.trim().length > 0);
if (lines.length === 0) fail("Snapshot is empty.");

let header: any;
try {
  header = JSON.parse(lines[0]);
} catch {
  fail("First line is not valid JSON — snapshot header is missing or corrupt.");
}

if (header._meta !== "tranquillo-green-backup") {
  fail(`Unexpected header: ${JSON.stringify(header).slice(0, 200)}`);
}

const counts = new Map<string, number>();
for (let i = 1; i < lines.length; i++) {
  let doc: any;
  try {
    doc = JSON.parse(lines[i]);
  } catch {
    fail(`Line ${i + 1} is not valid JSON — snapshot is truncated or corrupt.`);
  }
  if (!doc._table) fail(`Line ${i + 1} has no _table tag.`);
  if (!doc._id) fail(`Line ${i + 1} (${doc._table}) has no _id — document is not restorable.`);
  counts.set(doc._table, (counts.get(doc._table) ?? 0) + 1);
}

const actualTotal = lines.length - 1;
if (actualTotal !== header.totalDocuments) {
  fail(
    `Document count mismatch: header claims ${header.totalDocuments}, file contains ${actualTotal}.`,
  );
}

for (const entry of header.tables as Array<{ table: string; documents: number }>) {
  const actual = counts.get(entry.table) ?? 0;
  if (actual !== entry.documents) {
    fail(`Table ${entry.table}: header claims ${entry.documents}, file contains ${actual}.`);
  }
}

const emptyTables = (header.tables as Array<{ table: string; documents: number }>)
  .filter((t) => t.documents === 0)
  .map((t) => t.table);

console.log(`OK: ${path}`);
console.log(`  taken at:   ${header.startedAt}`);
console.log(`  deployment: ${header.convexUrl}`);
console.log(`  documents:  ${actualTotal} across ${counts.size} non-empty tables`);
if (emptyTables.length > 0) {
  console.log(`  empty:      ${emptyTables.length} tables (${emptyTables.slice(0, 5).join(", ")}${emptyTables.length > 5 ? ", …" : ""})`);
}
