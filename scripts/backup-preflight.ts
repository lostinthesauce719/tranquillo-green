/**
 * Proves the backup destination actually works, before trusting it.
 *
 *   npm run backup:preflight
 *
 * Reads BACKUP_S3_* from the environment and performs a real round trip
 * against the bucket: write an object, read it back, confirm the bytes match,
 * then delete it. Nothing is assumed from the absence of an error.
 *
 * This exists because the failure mode it catches is silent. A misconfigured
 * bucket does not announce itself — the nightly job fails into a log nobody
 * reads, and the first sign of trouble is discovering there are no snapshots
 * on the day you need one. Run this the moment you finish configuring
 * storage, and again after rotating keys.
 */

import { randomUUID } from "node:crypto";
import { readS3TargetFromEnv, putObject, getObject, deleteObject } from "../src/lib/backup/s3";

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const BOLD = "\x1b[1m";
const OFF = "\x1b[0m";

function fail(message: string, hint?: string): never {
  console.error(`\n${RED}FAIL:${OFF} ${message}`);
  if (hint) console.error(`\n${hint}`);
  process.exit(1);
}

async function main() {
  console.log(`${BOLD}Backup destination preflight${OFF}\n`);

  const target = readS3TargetFromEnv();
  if (!target) {
    fail(
      "Storage is not configured — one or more BACKUP_S3_* variables are missing.",
      `Set all of these in the environment you are testing:\n` +
        `  BACKUP_S3_ENDPOINT           e.g. https://<account>.r2.cloudflarestorage.com\n` +
        `  BACKUP_S3_BUCKET             e.g. tranquillo-green-backups\n` +
        `  BACKUP_S3_REGION             "auto" for R2, the region name for S3\n` +
        `  BACKUP_S3_ACCESS_KEY_ID\n` +
        `  BACKUP_S3_SECRET_ACCESS_KEY`,
    );
  }

  console.log(`  endpoint: ${target.endpoint}`);
  console.log(`  bucket:   ${target.bucket}`);
  console.log(`  region:   ${target.region}`);
  console.log(`  key id:   ${target.accessKeyId.slice(0, 4)}…${target.accessKeyId.slice(-4)}\n`);

  const key = `tranquillo-green/_preflight/${new Date().toISOString().slice(0, 10)}-${randomUUID()}.txt`;
  const payload = `tranquillo-green preflight ${new Date().toISOString()} ${randomUUID()}`;

  // 1. write
  process.stdout.write("  1/4 writing a test object … ");
  try {
    await putObject(target, key, payload, "text/plain");
  } catch (error) {
    console.log(`${RED}failed${OFF}`);
    fail(
      error instanceof Error ? error.message : String(error),
      `${YELLOW}Common causes:${OFF}\n` +
        `  403 SignatureDoesNotMatch  — wrong secret access key, or wrong region\n` +
        `  403 AccessDenied           — the token lacks write permission on this bucket\n` +
        `  404 NoSuchBucket           — bucket name is wrong, or it lives in another account\n` +
        `  ENOTFOUND / DNS failure    — endpoint URL is wrong`,
    );
  }
  console.log(`${GREEN}ok${OFF}`);

  // 2. read back
  process.stdout.write("  2/4 reading it back … ");
  let readBack: string | null;
  try {
    readBack = await getObject(target, key);
  } catch (error) {
    console.log(`${RED}failed${OFF}`);
    fail(
      error instanceof Error ? error.message : String(error),
      `The write succeeded but the read did not. The token likely has write ` +
        `permission without read — which means you could not actually recover ` +
        `from these backups.`,
    );
  }
  if (readBack === null) {
    console.log(`${RED}failed${OFF}`);
    fail("The object was written but came back 404 on read.");
  }
  console.log(`${GREEN}ok${OFF}`);

  // 3. verify contents
  process.stdout.write("  3/4 verifying the bytes match … ");
  if (readBack !== payload) {
    console.log(`${RED}failed${OFF}`);
    fail(
      `Content mismatch. Wrote ${payload.length} bytes, read back ${readBack.length}.`,
      "Something between here and the bucket is altering objects. Do not use this destination.",
    );
  }
  console.log(`${GREEN}ok${OFF}`);

  // 4. clean up
  process.stdout.write("  4/4 deleting the test object … ");
  try {
    await deleteObject(target, key);
    console.log(`${GREEN}ok${OFF}`);
  } catch (error) {
    console.log(`${YELLOW}could not delete${OFF}`);
    console.log(
      `\n${YELLOW}Note:${OFF} write and read both work, so backups will function. ` +
        `The token cannot delete, so remove this object by hand:\n  ${key}\n` +
        `A lifecycle rule for expiring old snapshots will also need delete permission.`,
    );
  }

  console.log(`\n${BOLD}${GREEN}PASS${OFF} — the destination accepts writes and returns them intact.\n`);
  console.log("Next:");
  console.log("  1. Confirm BACKUP_SECRET is set on BOTH Convex and Vercel (checked independently).");
  console.log("  2. Trigger one real backup:");
  console.log('       curl -X POST -H "Authorization: Bearer $BACKUP_SECRET" https://<your-app>/api/backup');
  console.log("     It should return uploaded:true with a destination URL.");
  console.log("  3. Download that snapshot and run: npm run backup:verify -- <file>");
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
