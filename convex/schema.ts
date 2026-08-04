import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  cannabisCompanies: defineTable({
    name: v.string(),
    slug: v.string(),
    timezone: v.string(),
    state: v.optional(v.string()),
    states: v.optional(v.array(v.string())),
    /**
     * Inventory classification for IRC 471 purposes. This is NOT the same as
     * operatorType, which describes the licence. A dispensary that buys finished
     * product is a reseller; a dispensary that owns the goods through the whole
     * production process may be a producer.
     *
     *  reseller — Reg. 1.471-3(b): inventoriable cost is generally the invoice
     *             price plus the costs of acquiring possession. Indirect costs
     *             such as rent and non-acquisition labour are generally NOT
     *             capitalisable.
     *  producer — Reg. 1.471-11 full absorption: direct and indirect production
     *             costs may be capitalised.
     *
     * Harborside turned on this distinction: the dispensary did not own the
     * product through production, was treated as a reseller, and its COGS
     * increases were denied.
     *
     * Optional so existing records remain valid; when unset the engine treats
     * the position as unclassified and requires acknowledgement.
     */
    inventoryRole: v.optional(
      v.union(v.literal("reseller"), v.literal("producer"))
    ),
    /**
     * Measured bases for 471(c) reclassification and COGS allocation.
     *
     * These replaced a hardcoded rent 45% / labour 55% table with a 40%
     * catch-all. Reg. 1.471-11 and CCA 201504011 contemplate measured
     * allocations — floor area, direct labour hours — and a measurement is what
     * substantiates the figure if it is examined. When these are absent the
     * engine reclassifies nothing and tells the operator what to record.
     */
    productionSqFt: v.optional(v.number()),
    totalSqFt: v.optional(v.number()),
    productionHours: v.optional(v.number()),
    totalHours: v.optional(v.number()),
    /**
     * Per-account percentages entered explicitly by the operator or their
     * accountant, keyed by account code, expressed 0..1. A note is expected —
     * an unexplained percentage is the problem this replaced.
     */
    declaredReclassRatios: v.optional(
      v.record(
        v.string(),
        v.object({ ratio: v.number(), note: v.optional(v.string()) })
      )
    ),
    operatorType: v.union(
      v.literal("dispensary"),
      v.literal("cultivator"),
      v.literal("manufacturer"),
      v.literal("distributor"),
      v.literal("delivery"),
      v.literal("vertical"),
    ),
    additionalOperatorTypes: v.optional(v.array(v.union(
      v.literal("dispensary"),
      v.literal("cultivator"),
      v.literal("manufacturer"),
      v.literal("distributor"),
      v.literal("delivery"),
      v.literal("vertical"),
    ))),
    primaryOperatorType: v.optional(v.union(
      v.literal("dispensary"),
      v.literal("cultivator"),
      v.literal("manufacturer"),
      v.literal("distributor"),
      v.literal("delivery"),
      v.literal("vertical"),
    )),
    defaultAccountingMethod: v.union(v.literal("cash"), v.literal("accrual")),
    accountingMethods: v.optional(v.array(v.union(v.literal("cash"), v.literal("accrual")))),
    status: v.union(v.literal("onboarding"), v.literal("active"), v.literal("inactive")),
    // Sandbox trial mode fields
    sandboxMode: v.optional(v.boolean()),
    sandboxExpiresAt: v.optional(v.number()),
    sandboxCreatedAt: v.optional(v.number()),
    // §471(c) election tracking
    section471cElected: v.optional(v.boolean()),
    section471cElectionId: v.optional(v.id("section471cElections")),
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
    description: v.optional(v.string()),
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
    closeOwner: v.optional(v.string()),
    closeWindowDays: v.optional(v.number()),
    lockedAt: v.optional(v.string()),
    taskSummary: v.optional(
      v.object({
        completed: v.number(),
        total: v.number(),
      })
    ),
    blockers: v.optional(v.array(v.string())),
    highlights: v.optional(v.array(v.string())),
  }).index("by_company", ["companyId"]).index("by_company_label", ["companyId", "label"]),

  transactions: defineTable({
    /** Contestable positions carried to the handoff gate (e.g. 471(c) reclass). */
    warnings: v.optional(v.array(v.object({ code: v.string(), message: v.string() }))),
    requiresAcknowledgement: v.optional(v.boolean()),
    acknowledgedAt: v.optional(v.number()),
    acknowledgedBy: v.optional(v.string()),

    companyId: v.id("cannabisCompanies"),
    periodId: v.optional(v.id("reportingPeriods")),
    locationId: v.optional(v.id("cannabisLocations")),
    importJobId: v.optional(v.id("importJobs")),
    importRowId: v.optional(v.id("importJobRows")),
    transactionDate: v.string(),
    source: v.union(v.literal("manual"), v.literal("csv_import"), v.literal("metrc_import"), v.literal("pos_import"), v.literal("system")),
    sourceLabel: v.optional(v.string()),
    memo: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("posted"), v.literal("needs_review")),
    workflowStatus: v.optional(v.union(v.literal("unposted"), v.literal("in_review"), v.literal("ready_to_post"), v.literal("posted"))),
    reviewState: v.optional(v.union(v.literal("ready"), v.literal("needs_mapping"), v.literal("drafted"), v.literal("posted"))),
    postedDate: v.optional(v.string()),
    counterpartyId: v.optional(v.id("counterparties")),
    externalRef: v.optional(v.string()),
    reference: v.optional(v.string()),
    amount: v.optional(v.number()),
    direction: v.optional(v.union(v.literal("inflow"), v.literal("outflow"))),
    activity: v.optional(v.union(v.literal("retail"), v.literal("manufacturing"), v.literal("distribution"), v.literal("admin"))),
    journalHint: v.optional(v.string()),
    readyForManualEntry: v.optional(v.boolean()),
    needsReceipt: v.optional(v.boolean()),
  }).index("by_company", ["companyId"]).index("by_company_date", ["companyId", "transactionDate"]).index("by_company_external_ref", ["companyId", "externalRef"]),

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
    method: v.union(
      v.literal("square_footage"),
      v.literal("labor"),
      v.literal("custom"),
      // Flat methods: a fixed percentage, or a fixed dollar amount treated as
      // COGS-eligible. Both are permitted but carry low confidence, because a
      // flat figure has no measured basis behind it — which is what an audit
      // examines. See Reg. 1.471-11 and CCA 201504011, which contemplate
      // measured bases such as direct labor hours or machine hours.
      v.literal("flat_percentage"),
      v.literal("flat_amount"),
    ),
    effectiveFrom: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive")),
  }).index("by_company", ["companyId"]),

  cogsAllocations: defineTable({
    /** Contestable positions raised by the allocation engine. */
    warnings: v.optional(v.array(v.object({ code: v.string(), message: v.string() }))),
    requiresAcknowledgement: v.optional(v.boolean()),
    acknowledgedAt: v.optional(v.number()),
    acknowledgedBy: v.optional(v.string()),
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
    mergedFrom: v.optional(v.array(v.id("inventoryBatches"))),
    lastMergedAt: v.optional(v.number()),
  }).index("by_company", ["companyId"]).index("by_packageTag", ["packageTag"]).index("by_company_packageTag", ["companyId", "packageTag"]),

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
  }).index("by_company", ["companyId"]).index("by_company_name", ["companyId", "name"]),

  cashReconciliations: defineTable({
    companyId: v.id("cannabisCompanies"),
    periodId: v.optional(v.id("reportingPeriods")),
    cashAccountId: v.id("cashAccounts"),
    expectedAmount: v.number(),
    actualAmount: v.number(),
    varianceAmount: v.number(),
    status: v.union(v.literal("open"), v.literal("investigating"), v.literal("resolved")),
    workflowStatus: v.optional(v.union(v.literal("balanced"), v.literal("investigating"), v.literal("exception"), v.literal("ready_to_post"))),
    externalRef: v.optional(v.string()),
    locationId: v.optional(v.id("cannabisLocations")),
    accountType: v.optional(v.union(v.literal("drawer"), v.literal("vault"), v.literal("bank_clearing"), v.literal("bank"))),
    lastCountedAt: v.optional(v.string()),
    owner: v.optional(v.string()),
    sourceContext: v.optional(v.array(v.string())),
    sourceBreakdown: v.optional(
      v.array(
        v.object({
          label: v.string(),
          source: v.string(),
          amount: v.number(),
        })
      )
    ),
    varianceDrivers: v.optional(
      v.array(
        v.object({
          title: v.string(),
          impactAmount: v.number(),
          confidenceLabel: v.string(),
          note: v.string(),
        })
      )
    ),
    investigationNotes: v.optional(v.array(v.string())),
    relatedTransactionRefs: v.optional(
      v.array(
        v.object({
          transactionRef: v.string(),
          label: v.string(),
          amount: v.number(),
          note: v.string(),
        })
      )
    ),
    nextSteps: v.optional(v.array(v.string())),
    actions: v.optional(
      v.array(
        v.object({
          title: v.string(),
          owner: v.string(),
          status: v.union(v.literal("done"), v.literal("in_progress"), v.literal("todo")),
        })
      )
    ),
  }).index("by_company", ["companyId"]).index("by_company_status", ["companyId", "status"]).index("by_company_external_ref", ["companyId", "externalRef"]),

  taxProfiles: defineTable({
    companyId: v.id("cannabisCompanies"),
    state: v.string(),
    primaryJurisdictionId: v.optional(v.id("taxJurisdictions")), // state-level jurisdiction
    nexusStates: v.optional(v.array(v.string())), // ["CO", "CA"] — states where company has nexus
    filingCalendar: v.optional(v.record(v.string(), v.string())), // e.g. {"CO-excise": "monthly", "CO-sales": "monthly"}
    taxTypesEnabled: v.optional(v.array(v.id("taxTypes"))), // which tax types this company collects
    isPrimary: v.boolean(),
  }).index("by_company", ["companyId"]),



  // ─── TAX ENGINE ──────────────────────────────────────────────────────
  taxJurisdictions: defineTable({
    companyId: v.optional(v.id("cannabisCompanies")), // null = system-wide (admin-managed)
    stateCode: v.string(),
    jurisdictionName: v.string(),
    jurisdictionLevel: v.union(v.literal("state"), v.literal("county"), v.literal("city"), v.literal("special")),
    filingFrequency: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("annually")),
    nexusThreshold: v.optional(v.number()), // dollar threshold for nexus
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_company", ["companyId"]).index("by_state_code", ["stateCode"]).index("by_jurisdiction_level", ["jurisdictionLevel"]),

  taxTypes: defineTable({
    code: v.string(), // "excise", "sales", "income"
    name: v.string(),
    description: v.optional(v.string()),
    calculationBasis: v.union(v.literal("percentage"), v.literal("fixed")),
    appliesToProductCategories: v.array(v.string()), // ["*"] or ["flower", "concentrate", ...]
    isIncludedInPrice: v.boolean(), // false = added at checkout
  }).index("by_code", ["code"]),

  taxRates: defineTable({
    jurisdictionId: v.id("taxJurisdictions"),
    taxTypeId: v.id("taxTypes"),
    rate: v.number(),
    rateType: v.union(v.literal("percentage"), v.literal("fixed_amount")),
    effectiveFrom: v.number(),
    effectiveTo: v.optional(v.number()),
    productCategoryFilter: v.optional(v.string()),
    notes: v.optional(v.string()),
    // Rate currency tracking. Rates are maintained manually against published
    // state guidance; these fields make staleness visible rather than silent.
    // A filing computed from an unverified or stale rate should be flagged.
    lastVerifiedAt: v.optional(v.number()),
    verifiedBy: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
  }).index("by_jurisdiction", ["jurisdictionId"]).index("by_tax_type", ["taxTypeId"]).index("by_effective_dates", ["effectiveFrom", "effectiveTo"]),

  taxCalculations: defineTable({
    companyId: v.id("cannabisCompanies"),
    transactionId: v.optional(v.id("transactions")),
    journalEntryId: v.optional(v.id("transactions")),
    jurisdictionId: v.id("taxJurisdictions"),
    taxTypeId: v.id("taxTypes"),
    taxableAmount: v.number(),
    taxAmount: v.number(),
    calculationMethod: v.string(), // "manual_rate"
    calculatedAt: v.number(),
    periodStart: v.number(),
    periodEnd: v.number(),
    isPosted: v.boolean(),
    postedAt: v.optional(v.number()),
  }).index("by_company", ["companyId"]).index("by_transaction", ["transactionId"]).index("by_period", ["periodStart", "periodEnd"]),
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
    // NEW: source tracking for deduplication and traceability
    sourceType: v.optional(v.string()),
    sourceId: v.optional(v.string()),
    dueAt: v.optional(v.number()),
  }).index("by_company", ["companyId"]).index("by_company_dueAt", ["companyId", "dueAt"]).index("by_company_resolvedAt", ["companyId", "resolvedAt"]),

  complianceDocuments: defineTable({
    companyId: v.id("cannabisCompanies"),
    type: v.string(),
    title: v.string(),
    storageId: v.optional(v.string()),
    periodLabel: v.optional(v.string()),
    generatedAt: v.number(),
  }).index("by_company", ["companyId"]),

  contactSubmissions: defineTable({
    name: v.string(),
    email: v.string(),
    company: v.optional(v.string()),
    phone: v.optional(v.string()),
    message: v.string(),
    inquiryType: v.string(),
    operatorType: v.optional(v.string()),
    state: v.optional(v.string()),
    clientCount: v.optional(v.string()),
    status: v.string(),
    createdAt: v.number(),
  }).index("by_email", ["email"]).index("by_status", ["status"]).index("by_created", ["createdAt"]),

  section471cElections: defineTable({
    companyId: v.id("cannabisCompanies"),
    elected: v.boolean(),
    electionDate: v.optional(v.string()),
    taxYear: v.optional(v.number()),
    priorYear1: v.number(),
    priorYear1Receipts: v.number(),
    priorYear2: v.number(),
    priorYear2Receipts: v.number(),
    priorYear3: v.number(),
    priorYear3Receipts: v.number(),
    averageGrossReceipts: v.number(),
    eligible: v.boolean(),
    notes: v.optional(v.string()),
    electedBy: v.optional(v.string()),
  }).index("by_company", ["companyId"]),

  importMappingProfiles: defineTable({
    companyId: v.id("cannabisCompanies"),
    profileKey: v.string(),
    sourceSystem: v.string(),
    name: v.string(),
    description: v.string(),
    amountStrategy: v.union(v.literal("single_signed"), v.literal("split_debit_credit")),
    fieldMappings: v.record(
      v.string(),
      v.union(
        v.literal("date"),
        v.literal("postedDate"),
        v.literal("description"),
        v.literal("reference"),
        v.literal("amount"),
        v.literal("debit"),
        v.literal("credit"),
        v.literal("location"),
        v.literal("memo"),
        v.literal("ignore")
      )
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_company", ["companyId"]).index("by_company_profile_key", ["companyId", "profileKey"]),

  importJobs: defineTable({
    companyId: v.id("cannabisCompanies"),
    periodId: v.optional(v.id("reportingPeriods")),
    importMappingProfileId: v.optional(v.id("importMappingProfiles")),
    selectedProfileSnapshot: v.optional(v.object({
      id: v.string(),
      name: v.string(),
      description: v.string(),
      amountStrategy: v.union(v.literal("single_signed"), v.literal("split_debit_credit")),
      fieldMappings: v.record(
        v.string(),
        v.union(
          v.literal("date"),
          v.literal("postedDate"),
          v.literal("description"),
          v.literal("reference"),
          v.literal("amount"),
          v.literal("debit"),
          v.literal("credit"),
          v.literal("location"),
          v.literal("memo"),
          v.literal("ignore")
        )
      ),
    })),
    effectiveMappingsSnapshot: v.optional(v.record(
      v.string(),
      v.union(
        v.literal("date"),
        v.literal("postedDate"),
        v.literal("description"),
        v.literal("reference"),
        v.literal("amount"),
        v.literal("debit"),
        v.literal("credit"),
        v.literal("location"),
        v.literal("memo"),
        v.literal("ignore")
      )
    )),
    sourceSystem: v.string(),
    sourceFileName: v.string(),
    sourceOriginalFileName: v.string(),
    sourceContentType: v.optional(v.string()),
    sourceDelimiter: v.string(),
    sourceFileSizeBytes: v.number(),
    sourceChecksum: v.optional(v.string()),
    uploadedAt: v.number(),
    uploadedBy: v.string(),
    status: v.union(
      v.literal("uploaded"),
      v.literal("mapped"),
      v.literal("validated"),
      v.literal("partially_promoted"),
      v.literal("promoted"),
      v.literal("failed")
    ),
    rowCount: v.number(),
    promotedRowCount: v.number(),
    validationSummary: v.object({
      ready: v.number(),
      warning: v.number(),
      error: v.number(),
    }),
    columns: v.array(
      v.object({
        key: v.string(),
        label: v.string(),
        suggestedTarget: v.union(
          v.literal("date"),
          v.literal("postedDate"),
          v.literal("description"),
          v.literal("reference"),
          v.literal("amount"),
          v.literal("debit"),
          v.literal("credit"),
          v.literal("location"),
          v.literal("memo"),
          v.literal("ignore")
        ),
        required: v.optional(v.boolean()),
        sampleValues: v.array(v.string()),
      })
    ),
    notes: v.optional(v.string()),
    externalRef: v.optional(v.string()),
  }).index("by_company", ["companyId"]).index("by_company_status", ["companyId", "status"]).index("by_company_external_ref", ["companyId", "externalRef"]),

  importJobRows: defineTable({
    importJobId: v.id("importJobs"),
    rowNumber: v.number(),
    rowKey: v.string(),
    rawValues: v.record(v.string(), v.string()),
    normalizedValues: v.optional(v.record(v.string(), v.string())),
    transactionDate: v.optional(v.string()),
    postedDate: v.optional(v.string()),
    description: v.string(),
    reference: v.string(),
    amount: v.optional(v.number()),
    debit: v.optional(v.number()),
    credit: v.optional(v.number()),
    locationName: v.optional(v.string()),
    memo: v.optional(v.string()),
    sourceAccountName: v.string(),
    suggestedDebitAccountCode: v.string(),
    suggestedCreditAccountCode: v.string(),
    confidence: v.number(),
    status: v.union(v.literal("ready"), v.literal("warning"), v.literal("error")),
    validationIssues: v.array(v.string()),
    promotedTransactionId: v.optional(v.id("transactions")),
    promotedAt: v.optional(v.number()),
  }).index("by_job", ["importJobId"]).index("by_job_row_key", ["importJobId", "rowKey"]),

  auditTrailEvents: defineTable({
    companyId: v.id("cannabisCompanies"),
    entityType: v.union(
      v.literal("transaction"),
      v.literal("allocation"),
      v.literal("reconciliation"),
      v.literal("reporting_period"),
      v.literal("import_job"),
      v.literal("packet"),
      v.literal("system"),
    ),
    entityId: v.string(),
    action: v.string(),
    actor: v.string(),
    actorRole: v.optional(v.string()),
    reason: v.optional(v.string()),
    beforeState: v.optional(v.string()),
    afterState: v.optional(v.string()),
    metadata: v.optional(v.record(v.string(), v.string())),
    timestamp: v.number(),
  }).index("by_company", ["companyId"]).index("by_company_entity", ["companyId", "entityType", "entityId"]).index("by_company_timestamp", ["companyId", "timestamp"]),

  overrideDecisions: defineTable({
    companyId: v.id("cannabisCompanies"),
    allocationId: v.optional(v.id("cogsAllocations")),
    transactionId: v.optional(v.id("transactions")),
    periodId: v.optional(v.id("reportingPeriods")),
    decisionType: v.union(
      v.literal("recommendation"),
      v.literal("override"),
      v.literal("approval"),
      v.literal("support_request"),
      v.literal("policy_exception"),
    ),
    actor: v.string(),
    actorRole: v.optional(v.string()),
    reason: v.string(),
    fromBasis: v.optional(v.string()),
    toBasis: v.optional(v.string()),
    originalDeductibleAmount: v.number(),
    originalNondeductibleAmount: v.number(),
    revisedDeductibleAmount: v.number(),
    revisedNondeductibleAmount: v.number(),
    evidence: v.optional(v.array(v.string())),
    resultingPolicyTrail: v.optional(v.string()),
    timestamp: v.number(),
  }).index("by_company", ["companyId"]).index("by_company_allocation", ["companyId", "allocationId"]).index("by_company_timestamp", ["companyId", "timestamp"]),

  packetGenerationRecords: defineTable({
    companyId: v.id("cannabisCompanies"),
    periodId: v.optional(v.id("reportingPeriods")),
    bundleId: v.string(),
    bundleName: v.string(),
    action: v.union(v.literal("assembled"), v.literal("refreshed"), v.literal("queued"), v.literal("sent"), v.literal("dry_run")),
    actor: v.string(),
    actorRole: v.optional(v.string()),
    exportFormats: v.array(v.string()),
    includedSchedules: v.array(v.string()),
    coverMemoMode: v.optional(v.string()),
    checklistSnapshot: v.array(v.object({
      title: v.string(),
      status: v.string(),
      owner: v.string(),
    })),
    detail: v.optional(v.string()),
    timestamp: v.number(),
    }).index("by_company", ["companyId"]).index("by_company_bundle", ["companyId", "bundleId"]).index("by_company_timestamp", ["companyId", "timestamp"]),

  users: defineTable({
    clerkId: v.optional(v.string()),
    email: v.string(),
    name: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    companyId: v.optional(v.id("cannabisCompanies")),
    role: v.optional(v.union(
      v.literal("owner"),
      v.literal("controller"),
      v.literal("accountant"),
      v.literal("viewer"),
      v.literal("patient"),
      v.literal("provider"),
      v.literal("admin")
    )),
    status: v.optional(v.union(v.literal("active"), v.literal("invited"), v.literal("deactivated"))),
    isActive: v.optional(v.boolean()),
    isVerified: v.optional(v.boolean()),
    onboardingComplete: v.optional(v.boolean()),
    dateOfBirth: v.optional(v.string()),
    medicalHistory: v.optional(v.string()),
    currentMedications: v.optional(v.string()),
    allergies: v.optional(v.string()),
    bio: v.optional(v.string()),
    npi: v.optional(v.string()),
    licenseState: v.optional(v.string()),
    specialty: v.optional(v.string()),
    lastLoginAt: v.optional(v.number()),
  }).index("by_clerk_id", ["clerkId"]).index("by_company", ["companyId"]).index("by_email", ["email"]),

  integrationConfigs: defineTable({
    companyId: v.id("cannabisCompanies"),
    provider: v.union(v.literal("quickbooks"), v.literal("metrc"), v.literal("dutchie"), v.literal("square"), v.literal("toast"), v.literal("treez")),
    realmId: v.optional(v.string()),
    accessToken: v.string(),
    refreshToken: v.string(),
    accessTokenExpiresAt: v.number(),
    refreshTokenExpiresAt: v.number(),
    apiSecret: v.optional(v.string()),
    // POS-specific IDs
    posLocationId: v.optional(v.string()),
    restaurantId: v.optional(v.string()),
    // Metrc-specific fields (optional — null for QBO)
    integratorKey: v.optional(v.string()),
    userKey: v.optional(v.string()),
    licenseNumber: v.optional(v.string()),
    metrcState: v.optional(v.string()),
    status: v.union(v.literal("connected"), v.literal("error"), v.literal("disconnected")),
    connectedAt: v.number(),
    updatedAt: v.number(),
  }).index("by_company", ["companyId"]).index("by_company_provider", ["companyId", "provider"]),

  // ─── LABOR TIME TRACKING ──────────────────────────────────────────
  // Tracks employee time by activity classification for 280E allocation.
  // Production activities = capitalizable (COGS). Non-production = 280E limited.
  laborTimeEntries: defineTable({
    companyId: v.id("cannabisCompanies"),
    employeeName: v.string(),
    employeeId: v.optional(v.string()), // Gusto/payroll external ref
    locationId: v.optional(v.id("cannabisLocations")),
    workDate: v.string(), // YYYY-MM-DD
    totalHours: v.number(),
    // Activity breakdown — what the employee did
    productionHours: v.number(), // Direct: growing, trimming, packaging, extraction, QC
    nonProductionHours: v.number(), // Indirect: admin, sales, compliance, cleaning
    // Activity detail
    activities: v.array(v.object({
      category: v.string(), // "cultivation", "harvest", "extraction", "packaging", "qc_testing", "inventory", "admin", "sales", "compliance", "maintenance", "training", "other"
      hours: v.number(),
      description: v.optional(v.string()),
      isProduction: v.boolean(), // TRUE = capitalizable under 280E
    })),
    // Allocation result
    productionRatio: v.number(), // productionHours / totalHours (0-1)
    // Source
    source: v.union(v.literal("manual"), v.literal("gusto_import"), v.literal("deputy"), v.literal("tanda")),
    externalRef: v.optional(v.string()),
    // Review
    reviewStatus: v.union(v.literal("draft"), v.literal("submitted"), v.literal("approved"), v.literal("flagged")),
    reviewedBy: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_company", ["companyId"])
    .index("by_company_date", ["companyId", "workDate"])
    .index("by_company_employee", ["companyId", "employeeName"])
    .index("by_company_status", ["companyId", "reviewStatus"]),

  // ─── PRODUCTION COST QUALIFICATIONS ───────────────────────────────
  // Tracks which costs qualify as direct production COGS under 280E.
  // Each entry classifies a cost category and documents the reasoning.
  productionCostQualifications: defineTable({
    companyId: v.id("cannabisCompanies"),
    costCategory: v.string(), // Matches chart of accounts code
    costName: v.string(),
    // 280E classification
    classification: v.union(
      v.literal("direct_production"),    // Clearly COGS: raw materials, direct labor
      v.literal("indirect_production"),  // Allocable: facility costs, production supervision
      v.literal("non_production"),       // Nondeductible: admin, marketing, sales
      v.literal("mixed"),                // Needs allocation (square footage, labor hours)
      v.literal("pending_review"),       // Not yet classified
    ),
    // What makes it qualify
    qualificationFactors: v.array(v.object({
      factor: v.string(),        // e.g., "Directly tied to inventory transformation"
      weight: v.number(),        // 0-1 importance
      evidence: v.string(),      // Why this factor applies
    })),
    // Allocation method if mixed
    allocationMethod: v.optional(v.union(
      v.literal("square_footage"),
      v.literal("labor_hours"),
      v.literal("revenue_mix"),
      v.literal("direct_tracing"),
      v.literal("not_applicable"),
    )),
    // 280E reasoning
    reasoning: v.string(),       // Full explanation of why this classification
    precedentCitation: v.optional(v.string()), // Tax court case or IRS guidance
    // AI confidence
    aiConfidence: v.optional(v.number()), // 0-1
    aiReasoning: v.optional(v.string()),
    // Review
    status: v.union(v.literal("draft"), v.literal("approved"), v.literal("overridden")),
    approvedBy: v.optional(v.string()),
    approvedAt: v.optional(v.number()),
    overrideReason: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_company", ["companyId"])
    .index("by_company_classification", ["companyId", "classification"])
    .index("by_company_category", ["companyId", "costCategory"]),

  // ─── ONBOARDING PROGRESS ─────────────────────────────────────────────
  // Tracks user progress through guided tours and onboarding steps.
  onboardingProgress: defineTable({
    userId: v.string(),
    tourId: v.string(),
    status: v.union(v.literal("not_started"), v.literal("in_progress"), v.literal("completed")),
    currentStep: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    startedAt: v.optional(v.number()),
  }).index("by_user_tour", ["userId", "tourId"]),

  // ─── AUTOMATION RUN LOG ───────────────────────────────────────────
  // Tracks each automation run for audit and debugging.
  automationRuns: defineTable({
    companyId: v.id("cannabisCompanies"),
    runType: v.union(
      v.literal("auto_approve"),
      v.literal("batch_approve"),
      v.literal("cogs_calculate"),
      v.literal("full_suite"),
      v.literal("scheduled"),
    ),
    triggeredBy: v.string(), // "system", "controller", "cron"
    startedAt: v.number(),
    completedAt: v.number(),
    agentsRun: v.number(),
    agentsSucceeded: v.number(),
    totalAlerts: v.number(),
    totalApproved: v.number(),
    results: v.array(v.object({
      agentId: v.string(),
      agentName: v.string(),
      alertCount: v.number(),
      details: v.array(v.string()),
      status: v.union(v.literal("success"), v.literal("error")),
    })),
    status: v.union(v.literal("completed"), v.literal("partial"), v.literal("failed")),
  }).index("by_company", ["companyId"])
    .index("by_company_type", ["companyId", "runType"]),

  /**
   * Added 2026-08-03. These tables were written to by live code but were never
   * declared in the schema. Convex enforces schemaValidation by default, so
   * every insert failed — which is a third, independent reason the audit trail
   * has never worked, and why CPA handoff has never produced a packet.
   */
  auditLogs: defineTable({
    action: v.string(),
    entity: v.string(),
    entityId: v.string(),
    userId: v.id("users"),
    companyId: v.id("cannabisCompanies"),
    timestamp: v.number(),
    changes: v.array(
      v.object({ field: v.string(), oldValue: v.any(), newValue: v.any() })
    ),
    metadata: v.optional(v.record(v.string(), v.any())),
  })
    .index("by_company", ["companyId"])
    .index("by_entity", ["entity", "entityId"])
    .index("by_company_timestamp", ["companyId", "timestamp"]),

  accountingAuditEvents: defineTable({
    companyId: v.id("cannabisCompanies"),
    periodId: v.optional(v.id("reportingPeriods")),
    exportPacketRunId: v.optional(v.id("exportPacketRuns")),
    category: v.string(),
    entityId: v.optional(v.string()),
    entityLabel: v.optional(v.string()),
    action: v.string(),
    detail: v.optional(v.string()),
    actor: v.optional(v.string()),
    source: v.optional(v.string()),
    occurredAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_company_category", ["companyId", "category"]),

  exportPacketRuns: defineTable({
    companyId: v.id("cannabisCompanies"),
    periodId: v.optional(v.id("reportingPeriods")),
    bundleId: v.string(),
    bundleName: v.string(),
    periodLabel: v.string(),
    recipient: v.string(),
    owner: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("generated"),
      v.literal("sent"),
      v.literal("held")
    ),
    selectedFormats: v.array(v.string()),
    selectedSchedules: v.array(v.string()),
    selectedChecklistTitles: v.array(v.string()),
    coverMemoMode: v.union(
      v.literal("controller_summary"),
      v.literal("cpa_handoff"),
      v.literal("open_items")
    ),
    includeDeliveryNotes: v.boolean(),
    generatedBy: v.string(),
    generatedAt: v.number(),
    detail: v.string(),
    blockers: v.array(v.string()),
    /** Typed confirmation of contestable positions at handoff. */
    acknowledgedAt: v.optional(v.number()),
    acknowledgedBy: v.optional(v.string()),
    acknowledgedWarnings: v.optional(
      v.array(
        v.object({
          code: v.string(),
          message: v.string(),
          sourceId: v.optional(v.string()),
        })
      )
    ),
  })
    .index("by_company", ["companyId"])
    .index("by_company_period", ["companyId", "periodLabel"]),

  /**
   * Added 2026-08-03. Like the three above, these were written to by live code
   * but never declared, so every insert failed under Convex schemaValidation.
   * business.ts is the internal revenue/CRM layer — leads, customers, invoices,
   * revenue events and daily metrics. None of it has ever persisted anything.
   *
   * Field shapes are derived from the actual insert call sites, not invented.
   * Most fields are optional because the call sites are inconsistent: invoices
   * alone is inserted with four different shapes. That inconsistency is worth
   * resolving separately — a permissive schema unblocks the writes but does not
   * make the data coherent.
   */
  leads: defineTable({
    email: v.string(),
    companyName: v.optional(v.string()),
    contactName: v.optional(v.string()),
    phone: v.optional(v.string()),
    operatorType: v.optional(v.string()),
    state: v.optional(v.string()),
    monthlyRevenueRange: v.optional(v.string()),
    bookkeepingMethod: v.optional(v.string()),
    painPoints: v.optional(v.array(v.string())),
    acquisitionSource: v.optional(v.string()),
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    referrer: v.optional(v.string()),
    status: v.optional(v.string()),
    firstTouchAt: v.optional(v.number()),
    lastTouchAt: v.optional(v.number()),
    touchCount: v.optional(v.number()),
    createdAt: v.optional(v.number()),
  }).index("by_email", ["email"]).index("by_status", ["status"]),

  customers: defineTable({
    clerkUserId: v.optional(v.string()),
    companyName: v.optional(v.string()),
    dbaName: v.optional(v.string()),
    operatorType: v.optional(v.string()),
    primaryState: v.optional(v.string()),
    states: v.optional(v.array(v.string())),
    taxIdLast4: v.optional(v.string()),
    contactName: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    tier: v.optional(v.string()),
    billingCycle: v.optional(v.string()),
    status: v.optional(v.string()),
    monthlyRecurringRevenue: v.optional(v.number()),
    annualContractValue: v.optional(v.number()),
    seats: v.optional(v.number()),
    additionalLicenses: v.optional(v.number()),
    trialStartsAt: v.optional(v.number()),
    currentPeriodStartsAt: v.optional(v.number()),
    currentPeriodEndsAt: v.optional(v.number()),
    activatedAt: v.optional(v.number()),
    canceledAt: v.optional(v.number()),
    churnedAt: v.optional(v.number()),
    acquisitionSource: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  }).index("by_status", ["status"]).index("by_clerk_user", ["clerkUserId"]),

  invoices: defineTable({
    customerId: v.optional(v.id("customers")),
    invoiceNumber: v.optional(v.string()),
    stripeInvoiceId: v.optional(v.string()),
    periodStart: v.optional(v.number()),
    periodEnd: v.optional(v.number()),
    subtotalCents: v.optional(v.number()),
    taxCents: v.optional(v.number()),
    totalCents: v.optional(v.number()),
    amountCents: v.optional(v.number()),
    currency: v.optional(v.string()),
    status: v.optional(v.string()),
    paymentMethodType: v.optional(v.string()),
    paidAt: v.optional(v.number()),
    lineItems: v.optional(v.array(v.any())),
    description: v.optional(v.string()),
    quantity: v.optional(v.number()),
    unitPriceCents: v.optional(v.number()),
    paymentIntentId: v.optional(v.string()),
    generatedAt: v.optional(v.number()),
    createdAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  }).index("by_customer", ["customerId"]).index("by_status", ["status"]),

  revenueEvents: defineTable({
    customerId: v.optional(v.id("customers")),
    eventType: v.optional(v.string()),
    amountCents: v.optional(v.number()),
    recognizedAt: v.optional(v.number()),
    servicePeriodStart: v.optional(v.number()),
    servicePeriodEnd: v.optional(v.number()),
    memo: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    createdBy: v.optional(v.string()),
  }).index("by_customer", ["customerId"]).index("by_recognized", ["recognizedAt"]),

  dailyMetrics: defineTable({
    date: v.string(),
    mrrCents: v.optional(v.number()),
    arrCents: v.optional(v.number()),
    newCustomers: v.optional(v.number()),
    netRetentionPercentage: v.optional(v.number()),
    activeCustomers: v.optional(v.number()),
    churnedCustomers: v.optional(v.number()),
    expansionMrrCents: v.optional(v.number()),
    grossChurnCents: v.optional(v.number()),
    cacCents: v.optional(v.number()),
    quickRatio: v.optional(v.number()),
    ltvCents: v.optional(v.number()),
    mrrByTier: v.optional(v.record(v.string(), v.number())),
    mrrByState: v.optional(v.record(v.string(), v.number())),
    recordedAt: v.optional(v.number()),
  }).index("by_date", ["date"]),

  organizationCompanies: defineTable({
    clerkOrgId: v.string(),
    companyId: v.optional(v.id("cannabisCompanies")),
    role: v.optional(v.string()),
    invitedAt: v.optional(v.number()),
    joinedAt: v.optional(v.number()),
  }).index("by_org", ["clerkOrgId"]).index("by_company", ["companyId"]),
});
