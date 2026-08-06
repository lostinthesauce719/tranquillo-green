import "server-only";

import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import { putObject, readS3TargetFromEnv } from "./s3";

export interface BackupResult {
  startedAt: string;
  finishedAt: string;
  tables: Array<{ table: string; documents: number }>;
  totalDocuments: number;
  bytes: number;
  destination: string | null;
  key: string;
}

const PAGE_SIZE = 500;

/**
 * Pulls every table out of Convex and assembles a restorable NDJSON snapshot.
 *
 * NDJSON (one JSON document per line, each tagged with its table) is used
 * instead of one large JSON object so a partial or truncated file is still
 * parseable up to the last complete line — a property that matters when the
 * artifact is the last copy of someone's books.
 */
export async function buildSnapshot(): Promise<{ body: string; result: Omit<BackupResult, "destination" | "key" | "finishedAt"> }> {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const secret = process.env.BACKUP_SECRET;

  if (!convexUrl) throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured.");
  if (!secret) throw new Error("BACKUP_SECRET is not configured.");

  const startedAt = new Date().toISOString();
  const client = new ConvexHttpClient(convexUrl);

  const { tables } = await client.query((anyApi as any).backup.listTables, { secret });

  const lines: string[] = [];
  const counts: Array<{ table: string; documents: number }> = [];
  let totalDocuments = 0;

  for (const table of tables as string[]) {
    let cursor: string | null = null;
    let isDone = false;
    let tableCount = 0;

    while (!isDone) {
      const page: any = await client.query((anyApi as any).backup.exportPage, {
        secret,
        table,
        cursor,
        numItems: PAGE_SIZE,
      });

      for (const doc of page.documents) {
        lines.push(JSON.stringify({ _table: table, ...doc }));
        tableCount++;
        totalDocuments++;
      }

      cursor = page.cursor;
      isDone = page.isDone;
    }

    counts.push({ table, documents: tableCount });
  }

  const header = JSON.stringify({
    _meta: "tranquillo-green-backup",
    version: 1,
    startedAt,
    convexUrl,
    tables: counts,
    totalDocuments,
  });

  const body = [header, ...lines].join("\n") + "\n";

  return {
    body,
    result: {
      startedAt,
      tables: counts,
      totalDocuments,
      bytes: Buffer.byteLength(body, "utf8"),
    },
  };
}

/** Builds a snapshot and, when storage is configured, uploads it off-site. */
export async function runBackup(): Promise<BackupResult> {
  const { body, result } = await buildSnapshot();

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const key = `tranquillo-green/${stamp.slice(0, 10)}/snapshot-${stamp}.ndjson`;

  const target = readS3TargetFromEnv();
  let destination: string | null = null;

  if (target) {
    destination = await putObject(target, key, body);
  }

  return {
    ...result,
    finishedAt: new Date().toISOString(),
    destination,
    key,
  };
}
