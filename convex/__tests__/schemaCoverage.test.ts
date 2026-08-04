/**
 * Schema coverage — every table the code writes to must be declared.
 *
 * WHY THIS EXISTS
 *
 * Nine tables were referenced by live code but never declared in schema.ts:
 *
 *   auditLogs   accountingAuditEvents   exportPacketRuns
 *   customers   dailyMetrics            invoices
 *   leads       revenueEvents           organizationCompanies
 *
 * Convex enforces schemaValidation by default, so every insert into them failed
 * at runtime. This was a third, independent reason the audit trail never worked
 * — audit.ts had corrupted encoding, called a registered mutation as a plain
 * function, AND wrote to a table that did not exist. It is also why CPA handoff
 * never produced a packet.
 *
 * Nothing caught it: TypeScript cannot see a table name in a string literal,
 * and 26 of 44 modules carried @ts-nocheck anyway. This test can, so it does.
 *
 * A failure here means either the table needs declaring, or the reference is a
 * typo. Both are worth stopping for.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const CONVEX_DIR = new URL("..", import.meta.url).pathname.replace(
  /^\/([A-Za-z]:)/,
  "$1"
);

const SKIP_DIRS = new Set(["_generated", "__tests__", "node_modules"]);

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (!SKIP_DIRS.has(entry)) sourceFiles(full, acc);
      continue;
    }
    if (entry.endsWith(".ts") && !entry.endsWith(".test.ts")) acc.push(full);
  }
  return acc;
}

const schemaSrc = readFileSync(join(CONVEX_DIR, "schema.ts"), "utf8");

/** Table names declared via `name: defineTable({`. */
const declared = new Set(
  [...schemaSrc.matchAll(/^\s{2}(\w+):\s*defineTable/gm)].map((m) => m[1])
);

/** Table names referenced via ctx.db.insert("x") / ctx.db.query("x"). */
const referenced = new Map<string, Set<string>>();
for (const file of sourceFiles(CONVEX_DIR)) {
  if (file.endsWith("schema.ts")) continue;
  const src = readFileSync(file, "utf8");
  for (const m of src.matchAll(/\.(?:insert|query)\(\s*"(\w+)"/g)) {
    const rel = file.slice(CONVEX_DIR.length).replace(/\\/g, "/");
    if (!referenced.has(m[1])) referenced.set(m[1], new Set());
    referenced.get(m[1])!.add(rel);
  }
}

describe("schema coverage", () => {
  it("finds declarations and references to compare", () => {
    assert.ok(declared.size > 0, "no tables parsed from schema.ts");
    assert.ok(referenced.size > 0, "no table references parsed from source");
  });

  it("every table written to or queried is declared in schema.ts", () => {
    const missing = [...referenced.keys()].filter((t) => !declared.has(t));
    assert.deepEqual(
      missing,
      [],
      missing.length
        ? `Undeclared tables — every insert into these fails at runtime under ` +
            `Convex schemaValidation:\n` +
            missing
              .map((t) => `  ${t}  (referenced in ${[...referenced.get(t)!].join(", ")})`)
              .join("\n")
        : ""
    );
  });

  it("schemaValidation is not disabled", () => {
    // Turning this off would hide the bug class above rather than fix it.
    assert.ok(
      !/schemaValidation\s*:\s*false/.test(schemaSrc),
      "schemaValidation must stay enabled — it is what surfaces undeclared tables"
    );
  });
});
