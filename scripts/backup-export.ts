/**
 * Exports a snapshot straight from Convex, without the web app running.
 *
 *   BACKUP_SECRET=<value> npx tsx scripts/backup-export.ts \
 *     --url https://<deployment>.convex.cloud --out snapshot.ndjson
 *
 * The scheduled backup goes through /api/backup, which needs the Next.js
 * server. This path talks to Convex directly, which is what you want for a
 * restore drill, an ad-hoc copy before a risky migration, or recovering when
 * the app itself will not start.
 */

import { writeFileSync } from "node:fs";
import { buildSnapshot } from "../src/lib/backup/run-backup";

function fail(message: string): never {
  console.error(`\nERROR: ${message}`);
  process.exit(1);
}

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i === -1 ? undefined : process.argv[i + 1];
}

async function main() {
  const url = arg("--url") ?? process.env.NEXT_PUBLIC_CONVEX_URL;
  const out = arg("--out") ?? `snapshot-${new Date().toISOString().slice(0, 10)}.ndjson`;

  if (!url) fail("No deployment. Pass --url or set NEXT_PUBLIC_CONVEX_URL.");
  if (!process.env.BACKUP_SECRET) fail("BACKUP_SECRET is not set in the environment.");

  // buildSnapshot reads the deployment from this env var.
  process.env.NEXT_PUBLIC_CONVEX_URL = url;

  console.log(`Exporting from ${url} …`);
  const { body, result } = await buildSnapshot();
  writeFileSync(out, body, "utf8");

  const nonEmpty = result.tables.filter((t) => t.documents > 0);
  console.log(`\nWrote ${out}`);
  console.log(`  documents: ${result.totalDocuments} across ${nonEmpty.length} non-empty tables`);
  console.log(`  bytes:     ${result.bytes}`);
  console.log(`\nVerify it:  npm run backup:verify -- ${out}`);
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
