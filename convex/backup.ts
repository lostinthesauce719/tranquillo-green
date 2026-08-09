import { queryGeneric } from "convex/server";
import { v } from "convex/values";

/**
 * Full-deployment export used by the off-site backup job.
 *
 * This deliberately does NOT use authQuery: a backup runs as the operator of
 * the deployment, not as a signed-in tenant user, and must be able to read
 * every company's records. It is gated instead by BACKUP_SECRET, which must be
 * set as an environment variable on the Convex deployment. If that variable is
 * unset, every call is refused rather than falling open.
 *
 * The export is paginated per table so a large deployment cannot exceed
 * Convex's per-function limits.
 */

/** Every table in the schema. Keep in sync with convex/schema.ts. */
export const BACKUP_TABLES = [
  "cannabisCompanies",
  "cannabisLocations",
  "cannabisLicenses",
  "chartOfAccounts",
  "counterparties",
  "reportingPeriods",
  "transactions",
  "transactionLines",
  "allocationPolicies",
  "cogsAllocations",
  "products",
  "inventoryBatches",
  "inventoryMovements",
  "cashAccounts",
  "cashReconciliations",
  "taxProfiles",
  "taxJurisdictions",
  "taxTypes",
  "taxRates",
  "taxCalculations",
  "taxFilings",
  "complianceAlerts",
  "complianceDocuments",
  "contactSubmissions",
  "section471cElections",
  "importMappingProfiles",
  "importJobs",
  "importJobRows",
  "auditTrailEvents",
  "overrideDecisions",
  "packetGenerationRecords",
  "users",
  "integrationConfigs",
  "notificationStates",
  "campaigns",
  "contentItems",
  "cpaClientLinks",
  "metrcPackages",
  "userCompanyLinks",
  "employees",
  "laborTimeEntries",
  "productionCostQualifications",
  "onboardingProgress",
  "automationRuns",
] as const;

/**
 * Fields that must never leave the deployment in a backup artifact.
 * Integration credentials are re-obtainable by reconnecting the integration;
 * carrying them into an off-site bucket only widens the blast radius of a
 * leaked backup.
 */
const REDACTED_FIELDS: Record<string, readonly string[]> = {
  integrationConfigs: ["accessToken", "refreshToken", "apiKey", "apiSecret", "userKey", "integratorKey"],
};

function redact(table: string, doc: Record<string, any>): Record<string, any> {
  const fields = REDACTED_FIELDS[table];
  if (!fields) return doc;
  const copy: Record<string, any> = { ...doc };
  for (const field of fields) {
    if (copy[field] !== undefined && copy[field] !== null) {
      copy[field] = "[redacted-in-backup]";
    }
  }
  return copy;
}

function assertSecret(provided: string) {
  const expected = process.env.BACKUP_SECRET;
  if (!expected) {
    throw new Error(
      "BACKUP_SECRET is not configured on this Convex deployment; backup export is disabled.",
    );
  }
  // Length-independent comparison to avoid leaking the secret via timing.
  if (provided.length !== expected.length) {
    throw new Error("Unauthorized backup request.");
  }
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  if (mismatch !== 0) {
    throw new Error("Unauthorized backup request.");
  }
}

export const listTables = queryGeneric({
  args: { secret: v.string() },
  handler: async (_ctx, args) => {
    assertSecret(args.secret);
    return { tables: [...BACKUP_TABLES] };
  },
});

/**
 * Reads one page of one table. Returns documents verbatim (minus redacted
 * credential fields) so the artifact is restorable.
 */
export const exportPage = queryGeneric({
  args: {
    secret: v.string(),
    table: v.string(),
    cursor: v.optional(v.union(v.string(), v.null())),
    numItems: v.optional(v.number()),
  },
  handler: async (ctx: any, args) => {
    assertSecret(args.secret);

    if (!(BACKUP_TABLES as readonly string[]).includes(args.table)) {
      throw new Error(`Unknown table: ${args.table}`);
    }

    const numItems = Math.min(Math.max(args.numItems ?? 500, 1), 2000);
    const page = await ctx.db
      .query(args.table)
      .paginate({ cursor: args.cursor ?? null, numItems });

    return {
      table: args.table,
      documents: page.page.map((doc: any) => redact(args.table, doc)),
      cursor: page.continueCursor,
      isDone: page.isDone,
    };
  },
});
