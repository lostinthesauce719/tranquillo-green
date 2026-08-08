/**
 * Function registration smoke test.
 *
 * WHY THIS EXISTS
 *
 * The 2026-08-01 audit found 62 Convex functions that threw
 * `TypeError: spec.handler is not a function` on every call, because
 * authQuery/authMutation supported only one of the three call shapes used in
 * this codebase. They also silently lost their argument validators.
 *
 * TypeScript could not catch this: every handler is typed (ctx: any, args: any,
 * identity: any), so `tsc --noEmit` passes cleanly on code that cannot run.
 *
 * This test imports every module under convex/ and asserts that each exported
 * function is a correctly registered Convex function — callable handler,
 * declared argument validators, sane visibility. It is a structural check, not
 * a behavioural one: it does not assert what a function does, only that it
 * exists in a runnable state.
 *
 * Run: npm test
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";

const CONVEX_DIR = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

/** Modules that are not Convex function files. */
const SKIP_DIRS = new Set(["_generated", "__tests__", "seed", "fixtures"]);
const SKIP_FILES = new Set([
  "schema.ts",
  "auth.config.ts",
  "tsconfig.json",
  "test_hello.ts",
]);

function collect(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (!SKIP_DIRS.has(entry)) collect(full, acc);
      continue;
    }
    if (!entry.endsWith(".ts")) continue;
    if (entry.endsWith(".test.ts")) continue;
    if (SKIP_FILES.has(entry)) continue;
    acc.push(full);
  }
  return acc;
}

/** A registered Convex function, as produced by queryGeneric/mutationGeneric. */
function isRegistered(v: any): boolean {
  return (
    typeof v === "function" &&
    (v.isQuery === true || v.isMutation === true || v.isAction === true)
  );
}

const files = collect(CONVEX_DIR).sort();

describe("Convex function registry", () => {
  it("finds function modules to check", () => {
    assert.ok(files.length > 0, "no convex modules discovered");
  });

  for (const file of files) {
    const rel = relative(CONVEX_DIR, file).replace(/\\/g, "/");

    it(`${rel} — every export is a runnable registered function`, async () => {
      const mod = await import(pathToFileURL(file).href);

      const registered = Object.entries(mod).filter(([, v]) => isRegistered(v));

      for (const [name, fn] of registered as Array<[string, any]>) {
        // The defect: handler resolved to undefined, so the function threw on
        // every invocation.
        const handler = fn._handler ?? fn.handler;
        assert.equal(
          typeof handler,
          "function",
          `${rel}::${name} has no callable handler — it would throw on every call`
        );

        // The quieter half of the defect: args resolved to undefined, which
        // disables Convex argument validation entirely.
        assert.equal(
          typeof fn.exportArgs,
          "function",
          `${rel}::${name} exposes no exportArgs`
        );
        assert.doesNotThrow(
          () => fn.exportArgs(),
          `${rel}::${name} has malformed argument validators`
        );
      }
    });
  }
});
