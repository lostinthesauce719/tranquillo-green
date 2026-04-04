import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  cannabisCompanies: defineTable({
    name: v.string(),
    slug: v.string(),
    timezone: v.string(),
    state: v.string(),
    operatorType: v.union(
      v.literal("dispensary"),
      v.literal("cultivator"),
      v.literal("manufacturer"),
      v.literal("distributor"),
      v.literal("vertical")
    ),
    defaultAccountingMethod: v.union(v.literal("cash"), v.literal("accrual")),
    status: v.union(v.literal("onboarding"), v.literal("active"), v.literal("inactive")),
  }).index("by_slug", ["slug"]),

  cannabisLocations: defineTable({
    companyId: v.id("cannabisCompanies"),
    name: v.string(),
    licenseNumber: v.string(),
    state: v.string(),
    city: v.string(),
    isPrimary: v.boolean(),
    squareFootage: v.optional(v.number()),
  }).index("by_company", ["companyId"]),

  cannabisLicenses: defineTable({
    companyId: v.id("cannabisCompanies"),
    locationId: v.optional(v.id("cannabisLocations")),
    licenseType: v.string(),
    state: v.string(),
    licenseNumber: v.string(),
    status: v.union(v.literal("active"), v.literal("pending"), v.literal("expired")),
    issuedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  }).index("by_company", ["companyId"]).index("by_state", ["state"]),

  chartOfAccounts: defineTable({
    companyId: v.id("cannabisCompanies"),
    code: v.string(),
    name: v.string(),
    category: v.union(
      v.literal("asset"),
      v.literal("liability"),
      v.literal("equity"),
      v.literal("revenue"),
      v.literal("cogs"),
      v.literal("opex")
    ),
    subcategory: v.optional(v.string()),
    isActive: v.boolean(),
    taxTreatment: v.union(v.literal("deductible"), v.literal("cogs"), v.literal("nondeductible")),
  }).index("by_company", ["companyId"]).index("by_company_code", ["companyId", "code"]),

  counterparties: defineTable({
    companyId: v.id("cannabisCompanies"),
    name: v.string(),
    type: v.union(v.literal("vendor"), v.literal("customer"), v.literal("tax_authority"), v.literal("bank"), v.literal("other")),
    externalRef: v.optional(v.string()),
  }).index("by_company", ["companyId"]),

  reportingPeriods: defineTable({
    companyId: v.id("cannabisCompanies"),
    label: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    status: v.union(v.literal("open"), v.literal("review"), v.literal("closed")),
  }).index("by_company", ["companyId"]),

  transactions: defineTable({
    companyId: v.id("cannabisCompanies"),
    periodId: v.optional(v.id("reportingPeriods")),
    transactionDate: v.string(),
    source: v.union(v.literal("manual"), v.literal("csv_import"), v.literal("metrc_import"), v.literal("pos_import"), v.literal("system")),
    memo: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("posted"), v.literal("needs_review")),
    counterpartyId: v.optional(v.id("counterparties")),
    externalRef: v.optional(v.string()),
  }).index("by_company", ["companyId"]).index("by_company_date", ["companyId", "transactionDate"]),

  transactionLines: defineTable({
    transactionId: v.id("transactions"),
    accountId: v.id("chartOfAccounts"),
    debit: v.optional(v.number()),
    credit: v.optional(v.number()),
    locationId: v.optional(v.id("cannabisLocations")),
    packageTag: v.optional(v.string()),
    memo: v.optional(v.string()),
  }).index("by_transaction", ["transactionId"]),

  allocationPolicies: defineTable({
    companyId: v.id("cannabisCompanies"),
    name: v.string(),
    method: v.union(v.literal("square_footage"), v.literal("labor"), v.literal("custom")),
    effectiveFrom: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive")),
  }).index("by_company", ["companyId"]),

  cogsAllocations: defineTable({
    companyId: v.id("cannabisCompanies"),
    transactionId: v.optional(v.id("transactions")),
    policyId: v.optional(v.id("allocationPolicies")),
    basisType: v.string(),
    deductibleAmount: v.number(),
    nondeductibleAmount: v.number(),
    confidence: v.optional(v.number()),
    reviewStatus: v.union(v.literal("system_applied"), v.literal("needs_review"), v.literal("approved")),
  }).index("by_company", ["companyId"]).index("by_company_review", ["companyId", "reviewStatus"]),

  products: defineTable({
    companyId: v.id("cannabisCompanies"),
    sku: v.string(),
    name: v.string(),
    category: v.string(),
    unitOfMeasure: v.string(),
    active: v.boolean(),
  }).index("by_company", ["companyId"]).index("by_company_sku", ["companyId", "sku"]),

  inventoryBatches: defineTable({
    companyId: v.id("cannabisCompanies"),
    productId: v.id("products"),
    locationId: v.optional(v.id("cannabisLocations")),
    packageTag: v.string(),
    quantityOnHand: v.number(),
    costBasis: v.optional(v.number()),
    source: v.union(v.literal("csv_import"), v.literal("metrc_import"), v.literal("manual")),
  }).index("by_company", ["companyId"]).index("by_packageTag", ["packageTag"]),

  inventoryMovements: defineTable({
    companyId: v.id("cannabisCompanies"),
    batchId: v.id("inventoryBatches"),
    movementType: v.union(v.literal("receive"), v.literal("sale"), v.literal("adjustment"), v.literal("waste"), v.literal("transfer")),
    quantity: v.number(),
    movementDate: v.string(),
    relatedTransactionId: v.optional(v.id("transactions")),
  }).index("by_company", ["companyId"]).index("by_batch", ["batchId"]),

  cashAccounts: defineTable({
    companyId: v.id("cannabisCompanies"),
    locationId: v.optional(v.id("cannabisLocations")),
    name: v.string(),
    type: v.union(v.literal("drawer"), v.literal("vault"), v.literal("bank_clearing")),
    active: v.boolean(),
  }).index("by_company", ["companyId"]),

  cashReconciliations: defineTable({
    companyId: v.id("cannabisCompanies"),
    periodId: v.optional(v.id("reportingPeriods")),
    cashAccountId: v.id("cashAccounts"),
    expectedAmount: v.number(),
    actualAmount: v.number(),
    varianceAmount: v.number(),
    status: v.union(v.literal("open"), v.literal("investigating"), v.literal("resolved")),
  }).index("by_company", ["companyId"]).index("by_company_status", ["companyId", "status"]),

  taxProfiles: defineTable({
    companyId: v.id("cannabisCompanies"),
    state: v.string(),
    exciseRule: v.string(),
    salesTaxRule: v.string(),
    filingFrequency: v.string(),
    isPrimary: v.boolean(),
  }).index("by_company", ["companyId"]),

  taxFilings: defineTable({
    companyId: v.id("cannabisCompanies"),
    taxProfileId: v.id("taxProfiles"),
    filingType: v.string(),
    periodLabel: v.string(),
    dueDate: v.string(),
    status: v.union(v.literal("pending"), v.literal("ready"), v.literal("filed"), v.literal("late")),
  }).index("by_company", ["companyId"]).index("by_dueDate", ["dueDate"]),

  complianceAlerts: defineTable({
    companyId: v.id("cannabisCompanies"),
    category: v.union(v.literal("license"), v.literal("tax"), v.literal("reconciliation"), v.literal("allocation")),
    severity: v.union(v.literal("info"), v.literal("warning"), v.literal("critical")),
    title: v.string(),
    body: v.string(),
    resolvedAt: v.optional(v.number()),
  }).index("by_company", ["companyId"]),

  complianceDocuments: defineTable({
    companyId: v.id("cannabisCompanies"),
    type: v.string(),
    title: v.string(),
    storageId: v.optional(v.string()),
    periodLabel: v.optional(v.string()),
    generatedAt: v.number(),
  }).index("by_company", ["companyId"]),
});
