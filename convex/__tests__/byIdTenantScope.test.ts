/**
 * Structural guard: every auth function reached by a record ID must scope itself.
 *
 * WHAT THIS CATCHES
 *
 * The authQuery/authMutation wrapper enforces tenant scope by looking for a
 * companyId or slug in the request. That covers most of the API for free, which
 * is exactly why this gap was invisible: 21 functions took only an opaque record
 * ID, so there was nothing for the wrapper to check and it let them through.
 *
 * Anyone signed in could read or rewrite another company's allocation policies,
 * COGS allocations, tax filings, compliance alerts, inventory batches and 471(c)
 * election by ID. Convex IDs are not secrets — they appear in URLs and in API
 * responses.
 *
 * The existing tenant isolation suite passed 23 tests and missed all of it,
 * because every one of those tests passed a companyId. They were testing the
 * case that already worked.
 *
 * WHY IT IS STRUCTURAL RATHER THAN BEHAVIOURAL
 *
 * A behavioural test per function would be better evidence but would only cover
 * the functions someone remembered to write. This reads the source and fails on
 * any function that takes a v.id() and does not scope itself, so a new one added
 * next month is caught without anyone thinking about it.
 *
 * If a function legitimately needs no check, add it to ALLOWED with a reason.
 * That list is the record of every deliberate exception.
 *
 * Run: npm test
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const CONVEX_DIR = join(import.meta.dirname, "..");

/** Functions that may be reached by record ID without a tenant check. */
const ALLOWED: Record<string, string> = {
  // Reference data. Rates and jurisdictions are published tax law, shared by
  // every tenant and not sensitive to read. The write paths are refused
  // outright — see requirePlatformAdmin.
  "tax.ts::listTaxRates": "public reference data (published state rates)",
  "tax.ts::upsertTaxJurisdiction": "refused via requirePlatformAdmin",
  "tax.ts::upsertTaxRate": "refused via requirePlatformAdmin",

  // Tranquillo Green's own sales CRM, not tenant data. These operate on leads
  // and customers, which have no companyId because they are not owned by a
  // tenant. They should not be reachable from the customer application at all;
  // tracked separately rather than papered over with a scope check that would
  // have nothing to scope against.
  "business.ts::generateProposal": "platform CRM — see vault note, needs removal from tenant API",
  "business.ts::startTrial": "platform CRM — see vault note, needs removal from tenant API",
  "business.ts::activateSubscription": "platform CRM — see vault note, needs removal from tenant API",
  "business.ts::markSubscriptionActive": "platform CRM — see vault note, needs removal from tenant API",
};

/** Any of these appearing in a handler counts as scoping itself. */
const SCOPE_CALLS = [
  "requireCompanyAccessById",
  "requireCompanyAccessBySlug",
  "requireRecordAccess",
  "getOwnedRecord",
  "requirePlatformAdmin",
  "requireTenantRecordForTransaction",
];

function convexSourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "_generated" || entry === "__tests__" || entry === "node_modules") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) convexSourceFiles(full, acc);
    else if (entry.endsWith(".ts") && !entry.endsWith(".d.ts")) acc.push(full);
  }
  return acc;
}

interface Finding {
  file: string;
  name: string;
  kind: string;
  idArg: string;
}

function findUnscopedByIdFunctions(): Finding[] {
  const findings: Finding[] = [];

  for (const file of convexSourceFiles(CONVEX_DIR)) {
    const src = readFileSync(file, "utf-8");
    const rel = relative(CONVEX_DIR, file).replace(/\\/g, "/");

    const re = /export const (\w+)\s*=\s*(authQuery|authMutation)\(/g;
    let m: RegExpExecArray | null;

    while ((m = re.exec(src)) !== null) {
      const [, name, kind] = m;

      // Walk to the matching close paren to get the whole definition.
      let depth = 1;
      let i = m.index + m[0].length;
      while (i < src.length && depth > 0) {
        if (src[i] === "(") depth++;
        else if (src[i] === ")") depth--;
        i++;
      }
      const body = src.slice(m.index + m[0].length, i);

      // The args portion is everything before the handler.
      const handlerAt = body.search(/handler\s*:|async \(ctx/);
      const argsPart = handlerAt > 0 ? body.slice(0, handlerAt) : body;

      // A companyId or slug in the args means the wrapper scopes it.
      if (/companyId|companySlug|\bslug\b/.test(argsPart)) continue;

      // Does it take some other record ID?
      const idMatch = argsPart.match(/v\.id\("(\w+)"\)/);
      if (!idMatch) continue;

      if (SCOPE_CALLS.some((c) => body.includes(c))) continue;

      const key = `${rel}::${name}`;
      if (key in ALLOWED) continue;

      findings.push({ file: rel, name, kind, idArg: idMatch[1] });
    }
  }

  return findings;
}

describe("tenant scope — functions reached by record ID", () => {
  it("every auth function taking a record ID scopes itself", () => {
    const unscoped = findUnscopedByIdFunctions();

    const detail = unscoped
      .map((f) => `  ${f.file}::${f.name} (${f.kind}, v.id("${f.idArg}"))`)
      .join("\n");

    assert.equal(
      unscoped.length,
      0,
      unscoped.length === 0
        ? ""
        : `${unscoped.length} auth function(s) are reached by a record ID with no tenant check.\n\n` +
            `The withAuth wrapper cannot scope these — there is no companyId in the request\n` +
            `for it to check, so any signed-in user can reach another company's record by ID.\n\n` +
            detail +
            `\n\nFix: resolve the record and call requireRecordAccess or getOwnedRecord.\n` +
            `If the function genuinely needs no check, add it to ALLOWED with a reason.`,
    );
  });

  it("every ALLOWED entry still exists and carries a reason", () => {
    // Stops the exception list rotting into a place where dead entries hide
    // real problems.
    for (const [key, reason] of Object.entries(ALLOWED)) {
      assert.ok(reason.length > 10, `${key} needs a real reason, got "${reason}"`);

      const [file, name] = key.split("::");
      const full = join(CONVEX_DIR, file);
      const src = readFileSync(full, "utf-8");
      assert.ok(
        src.includes(`export const ${name}`),
        `ALLOWED lists ${key}, but that function no longer exists — remove the entry.`,
      );
    }
  });
});

/* ─── Optional tenant filters ────────────────────────────────────────────── */

/**
 * A companyId declared v.optional() on a function that queries or writes across
 * companies is not a filter — it is a default of "everything".
 *
 * audit.queryAuditLogs had exactly this, and it was the widest hole in the API:
 * calling it with no arguments returned every tenant's audit log. The wrapper
 * could not help, because the wrapper scopes by reading companyId out of the
 * request and there was nothing there to read.
 *
 * Structural, for the same reason as the check above: this catches the next one
 * without anyone having to think of it.
 */
const OPTIONAL_COMPANY_ALLOWED: Record<string, string> = {
  // Onboarding runs before the caller has a company, so it cannot supply one.
  "onboarding.ts::createCompany": "runs before the user belongs to a company",
};

function findOptionalCompanyIdFunctions(): Finding[] {
  const findings: Finding[] = [];

  for (const file of convexSourceFiles(CONVEX_DIR)) {
    const src = readFileSync(file, "utf-8");
    const rel = relative(CONVEX_DIR, file).replace(/\\/g, "/");

    const re = /export const (\w+)\s*=\s*(authQuery|authMutation)\(/g;
    let m: RegExpExecArray | null;

    while ((m = re.exec(src)) !== null) {
      const [, name, kind] = m;
      let depth = 1;
      let i = m.index + m[0].length;
      while (i < src.length && depth > 0) {
        if (src[i] === "(") depth++;
        else if (src[i] === ")") depth--;
        i++;
      }
      const body = src.slice(m.index + m[0].length, i);
      const handlerAt = body.search(/handler\s*:|async \(ctx/);
      const argsPart = handlerAt > 0 ? body.slice(0, handlerAt) : body;

      if (!/companyId:\s*v\.optional\(\s*v\.id\("cannabisCompanies"\)\s*\)/.test(argsPart)) {
        continue;
      }

      const key = `${rel}::${name}`;
      if (key in OPTIONAL_COMPANY_ALLOWED) continue;

      findings.push({ file: rel, name, kind, idArg: "cannabisCompanies (optional)" });
    }
  }

  return findings;
}

describe("tenant scope — optional companyId", () => {
  it("no auth function declares companyId as optional", () => {
    const found = findOptionalCompanyIdFunctions();

    const detail = found.map((f) => `  ${f.file}::${f.name} (${f.kind})`).join("\n");

    assert.equal(
      found.length,
      0,
      found.length === 0
        ? ""
        : `${found.length} auth function(s) declare companyId as v.optional().\n\n` +
            `The wrapper scopes a request by reading companyId out of it. When the\n` +
            `argument is absent there is nothing to scope, and the handler's own\n` +
            `"if (companyId)" filter simply does not run — so the call returns or\n` +
            `touches every company on the platform.\n\n` +
            detail +
            `\n\nFix: make companyId required. If the function genuinely runs before\n` +
            `the caller has a company, add it to OPTIONAL_COMPANY_ALLOWED with a reason.`,
    );
  });
});
