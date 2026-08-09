/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accountingAudit from "../accountingAudit.js";
import type * as accountingCore from "../accountingCore.js";
import type * as allocationEngine from "../allocationEngine.js";
import type * as allocationPolicies from "../allocationPolicies.js";
import type * as audit from "../audit.js";
import type * as auditTrail from "../auditTrail.js";
import type * as automation from "../automation.js";
import type * as backup from "../backup.js";
import type * as business from "../business.js";
import type * as businessApi from "../businessApi.js";
import type * as businessSchema from "../businessSchema.js";
import type * as campaigns from "../campaigns.js";
import type * as cannabisCompanies from "../cannabisCompanies.js";
import type * as cashAccounts from "../cashAccounts.js";
import type * as cashReconciliations from "../cashReconciliations.js";
import type * as chartOfAccounts from "../chartOfAccounts.js";
import type * as cogsAllocations from "../cogsAllocations.js";
import type * as companies from "../companies.js";
import type * as compliance from "../compliance.js";
import type * as contentItems from "../contentItems.js";
import type * as cpaPortal from "../cpaPortal.js";
import type * as dashboardMetrics from "../dashboardMetrics.js";
import type * as diagnostics from "../diagnostics.js";
import type * as employees from "../employees.js";
import type * as exportPackets from "../exportPackets.js";
import type * as financialStatements from "../financialStatements.js";
import type * as importJobs from "../importJobs.js";
import type * as integrationConfigs from "../integrationConfigs.js";
import type * as inventory from "../inventory.js";
import type * as inventoryImport from "../inventoryImport.js";
import type * as laborAndCogs from "../laborAndCogs.js";
import type * as lib_acknowledgement from "../lib/acknowledgement.js";
import type * as lib_money from "../lib/money.js";
import type * as lib_reclassificationBasis from "../lib/reclassificationBasis.js";
import type * as lib_reclassificationInline from "../lib/reclassificationInline.js";
import type * as lib_taxConstants from "../lib/taxConstants.js";
import type * as lib_withAuth from "../lib/withAuth.js";
import type * as locations from "../locations.js";
import type * as metrcReconciliation from "../metrcReconciliation.js";
import type * as middleware_emailNotifications from "../middleware/emailNotifications.js";
import type * as notifications from "../notifications.js";
import type * as onboarding from "../onboarding.js";
import type * as operations from "../operations.js";
import type * as rateLimits from "../rateLimits.js";
import type * as reclassification from "../reclassification.js";
import type * as reclassificationTrigger from "../reclassificationTrigger.js";
import type * as reportingPeriods from "../reportingPeriods.js";
import type * as restore from "../restore.js";
import type * as sandbox from "../sandbox.js";
import type * as section471c from "../section471c.js";
import type * as seed from "../seed.js";
import type * as seed_sandboxSeed from "../seed/sandboxSeed.js";
import type * as seed_taxRatesCO from "../seed/taxRatesCO.js";
import type * as tax from "../tax.js";
import type * as taxFilings from "../taxFilings.js";
import type * as test_hello from "../test_hello.js";
import type * as transactionLines from "../transactionLines.js";
import type * as transactions from "../transactions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accountingAudit: typeof accountingAudit;
  accountingCore: typeof accountingCore;
  allocationEngine: typeof allocationEngine;
  allocationPolicies: typeof allocationPolicies;
  audit: typeof audit;
  auditTrail: typeof auditTrail;
  automation: typeof automation;
  backup: typeof backup;
  business: typeof business;
  businessApi: typeof businessApi;
  businessSchema: typeof businessSchema;
  campaigns: typeof campaigns;
  cannabisCompanies: typeof cannabisCompanies;
  cashAccounts: typeof cashAccounts;
  cashReconciliations: typeof cashReconciliations;
  chartOfAccounts: typeof chartOfAccounts;
  cogsAllocations: typeof cogsAllocations;
  companies: typeof companies;
  compliance: typeof compliance;
  contentItems: typeof contentItems;
  cpaPortal: typeof cpaPortal;
  dashboardMetrics: typeof dashboardMetrics;
  diagnostics: typeof diagnostics;
  employees: typeof employees;
  exportPackets: typeof exportPackets;
  financialStatements: typeof financialStatements;
  importJobs: typeof importJobs;
  integrationConfigs: typeof integrationConfigs;
  inventory: typeof inventory;
  inventoryImport: typeof inventoryImport;
  laborAndCogs: typeof laborAndCogs;
  "lib/acknowledgement": typeof lib_acknowledgement;
  "lib/money": typeof lib_money;
  "lib/reclassificationBasis": typeof lib_reclassificationBasis;
  "lib/reclassificationInline": typeof lib_reclassificationInline;
  "lib/taxConstants": typeof lib_taxConstants;
  "lib/withAuth": typeof lib_withAuth;
  locations: typeof locations;
  metrcReconciliation: typeof metrcReconciliation;
  "middleware/emailNotifications": typeof middleware_emailNotifications;
  notifications: typeof notifications;
  onboarding: typeof onboarding;
  operations: typeof operations;
  rateLimits: typeof rateLimits;
  reclassification: typeof reclassification;
  reclassificationTrigger: typeof reclassificationTrigger;
  reportingPeriods: typeof reportingPeriods;
  restore: typeof restore;
  sandbox: typeof sandbox;
  section471c: typeof section471c;
  seed: typeof seed;
  "seed/sandboxSeed": typeof seed_sandboxSeed;
  "seed/taxRatesCO": typeof seed_taxRatesCO;
  tax: typeof tax;
  taxFilings: typeof taxFilings;
  test_hello: typeof test_hello;
  transactionLines: typeof transactionLines;
  transactions: typeof transactions;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
