/**
 * Restores a backup snapshot into a Convex deployment.
 *
 *   npx tsx scripts/restore-backup.ts <snapshot.ndjson> --url <convex-url> [--yes] [--allow-non-empty]
 *
 * Defaults to a DRY RUN: it plans the restore, verifies every reference can be
 * resolved, and prints what it would insert without writing anything. Pass
 * --yes to actually write.
 *
 * Requires BACKUP_SECRET in the environment, matching the target deployment.
 *
 * Restoring into the wrong deployment is the expensive mistake here, so the
 * script refuses a non-empty target unless --allow-non-empty is given, and
 * prints the target URL prominently before writing.
 */

import { readFileSync } from "node:fs";
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import { parseSnapshot, planRestore, remapDocument } from "../src/lib/backup/restore-plan";

const BATCH_SIZE = 200;

function fail(message: string): never {
  console.error(`\nERROR: ${message}`);
  process.exit(1);
}

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i === -1 ? undefined : process.argv[i + 1];
}

async function main() {
  const path = process.argv[2];
  if (!path || path.startsWith("--")) {
    fail("Usage: npx tsx scripts/restore-backup.ts <snapshot.ndjson> --url <convex-url> [--yes]");
  }

  const url = arg("--url") ?? process.env.NEXT_PUBLIC_CONVEX_URL;
  const apply = process.argv.includes("--yes");
  const allowNonEmpty = process.argv.includes("--allow-non-empty");
  const secret = process.env.BACKUP_SECRET;

  if (!url) fail("No target deployment. Pass --url or set NEXT_PUBLIC_CONVEX_URL.");
  if (!secret) fail("BACKUP_SECRET is not set in the environment.");

  const { header, docsByTable } = parseSnapshot(readFileSync(path, "utf8"));

  console.log(`Snapshot:   ${path}`);
  console.log(`  taken:    ${header.startedAt}`);
  console.log(`  source:   ${header.convexUrl ?? "unknown"}`);
  console.log(`  documents:${header.totalDocuments}`);
  console.log(`Target:     ${url}`);
  console.log(`Mode:       ${apply ? "APPLY (will write)" : "dry run (no writes)"}`);

  if (header.convexUrl && header.convexUrl === url && apply) {
    fail(
      "Target is the same deployment the snapshot came from. Restoring onto itself would " +
        "duplicate every record. Point --url at a different deployment.",
    );
  }

  const plan = planRestore(docsByTable);

  if (plan.unresolvable.length > 0) {
    console.error(`\n${plan.unresolvable.length} document(s) reference records not in this snapshot:`);
    for (const entry of plan.unresolvable.slice(0, 10)) {
      console.error(`  ${entry.table} ${entry.id} -> missing ${entry.missing.join(", ")}`);
    }
    fail("Refusing to restore: inserting these would leave dangling references.");
  }

  console.log(`\nPlan: ${plan.totalDocuments} documents in ${plan.batches.length} batches.`);
  const order = plan.batches.map((b) => `${b.table}(${b.docs.length})`);
  console.log(`Order: ${order.slice(0, 12).join(" -> ")}${order.length > 12 ? " -> …" : ""}`);

  if (!apply) {
    console.log("\nDry run complete. Nothing was written. Re-run with --yes to apply.");
    return;
  }

  const client = new ConvexHttpClient(url);

  const target = await client.query((anyApi as any).restore.inspectTarget, { secret });
  if (!target.isEmpty && !allowNonEmpty) {
    fail(
      `Target already holds data in: ${target.nonEmptyTables.join(", ")}. ` +
        `Restore into an empty deployment, or pass --allow-non-empty if you accept duplicates.`,
    );
  }

  const idMap = new Map<string, string>();
  let written = 0;

  for (const batch of plan.batches) {
    for (let i = 0; i < batch.docs.length; i += BATCH_SIZE) {
      const slice = batch.docs.slice(i, i + BATCH_SIZE);
      const payload = slice.map((doc) => remapDocument(doc, idMap));

      const { ids } = await client.mutation((anyApi as any).restore.insertBatch, {
        secret,
        table: batch.table,
        documents: payload,
        allowNonEmptyTarget: true, // pre-checked above; avoids per-batch false positives
      });

      slice.forEach((doc, index) => idMap.set(doc._id, ids[index]));
      written += ids.length;
      process.stdout.write(`\r  restored ${written}/${plan.totalDocuments}`);
    }
  }

  console.log(`\n\nRestore complete: ${written} documents into ${url}.`);
  console.log("Reconnect integrations — credentials are redacted in backups by design.");
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
