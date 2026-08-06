import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * The backup snapshot is the last copy of a customer's books, so the format
 * contract is worth pinning: header first, one tagged document per line,
 * counts that agree, and a verifier that actually rejects corruption.
 */

const dir = mkdtempSync(join(tmpdir(), "tg-backup-"));

function snapshot(lines: string[]): string {
  const path = join(dir, `snap-${Math.random().toString(36).slice(2)}.ndjson`);
  writeFileSync(path, lines.join("\n") + "\n", "utf8");
  return path;
}

function verify(path: string): { ok: boolean; output: string } {
  try {
    const output = execFileSync("npx", ["tsx", "scripts/verify-backup.ts", path], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { ok: true, output };
  } catch (error: any) {
    return { ok: false, output: `${error.stdout ?? ""}${error.stderr ?? ""}` };
  }
}

const goodHeader = JSON.stringify({
  _meta: "tranquillo-green-backup",
  version: 1,
  startedAt: "2026-08-05T00:00:00.000Z",
  convexUrl: "https://example.convex.cloud",
  tables: [{ table: "transactions", documents: 2 }],
  totalDocuments: 2,
});

describe("backup snapshot format", () => {
  test("accepts a well-formed snapshot", () => {
    const path = snapshot([
      goodHeader,
      JSON.stringify({ _table: "transactions", _id: "t1", amount: 100 }),
      JSON.stringify({ _table: "transactions", _id: "t2", amount: 250 }),
    ]);
    const { ok, output } = verify(path);
    assert.equal(ok, true, output);
    assert.match(output, /documents:\s+2/);
  });

  test("rejects a truncated snapshot", () => {
    // Simulates an upload cut short mid-write.
    const path = snapshot([
      goodHeader,
      JSON.stringify({ _table: "transactions", _id: "t1", amount: 100 }),
      '{"_table":"transactions","_id":"t2","amo',
    ]);
    const { ok, output } = verify(path);
    assert.equal(ok, false);
    assert.match(output, /truncated or corrupt/);
  });

  test("rejects a count mismatch between header and body", () => {
    const path = snapshot([
      goodHeader,
      JSON.stringify({ _table: "transactions", _id: "t1", amount: 100 }),
    ]);
    const { ok, output } = verify(path);
    assert.equal(ok, false);
    assert.match(output, /count mismatch/);
  });

  test("rejects documents with no _id, which could not be restored", () => {
    const header = JSON.stringify({
      _meta: "tranquillo-green-backup",
      version: 1,
      startedAt: "2026-08-05T00:00:00.000Z",
      convexUrl: "https://example.convex.cloud",
      tables: [{ table: "transactions", documents: 1 }],
      totalDocuments: 1,
    });
    const path = snapshot([header, JSON.stringify({ _table: "transactions", amount: 100 })]);
    const { ok, output } = verify(path);
    assert.equal(ok, false);
    assert.match(output, /no _id/);
  });

  test("rejects a file that is not a backup at all", () => {
    const path = snapshot(['{"hello":"world"}']);
    const { ok, output } = verify(path);
    assert.equal(ok, false);
    assert.match(output, /Unexpected header/);
  });
});
