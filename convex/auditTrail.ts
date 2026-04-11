import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

// ─── AUDIT TRAIL EVENTS ───────────────────────────────────────────────

export const recordEvent = mutationGeneric({
  args: {
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
  },
  handler: async (ctx: any, args: any) => {
    const eventId = await ctx.db.insert("auditTrailEvents", {
      ...args,
      timestamp: Date.now(),
    });
    return eventId;
  },
});

export const getEventsByEntity = queryGeneric({
  args: {
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
  },
  handler: async (ctx: any, args: any) => {
    return await ctx.db
      .query("auditTrailEvents")
      .withIndex("by_company_entity", (q: any) =>
        q.eq("companyId", args.companyId).eq("entityType", args.entityType).eq("entityId", args.entityId),
      )
      .order("desc")
      .collect();
  },
});

export const getRecentEvents = queryGeneric({
  args: {
    companyId: v.id("cannabisCompanies"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx: any, args: any) => {
    return await ctx.db
      .query("auditTrailEvents")
      .withIndex("by_company_timestamp", (q: any) => q.eq("companyId", args.companyId))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const getEventsByCompany = queryGeneric({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (ctx: any, args: any) => {
    return await ctx.db
      .query("auditTrailEvents")
      .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
      .order("desc")
      .collect();
  },
});

// ─── OVERRIDE DECISIONS ────────────────────────────────────────────────

export const recordOverride = mutationGeneric({
  args: {
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
  },
  handler: async (ctx: any, args: any) => {
    const decisionId = await ctx.db.insert("overrideDecisions", {
      ...args,
      timestamp: Date.now(),
    });

    // Also record as an audit trail event
    const deductibleShift = args.revisedDeductibleAmount - args.originalDeductibleAmount;
    const nondeductibleShift = args.revisedNondeductibleAmount - args.originalNondeductibleAmount;
    await ctx.db.insert("auditTrailEvents", {
      companyId: args.companyId,
      entityType: "allocation",
      entityId: args.allocationId ?? args.transactionId ?? "unknown",
      action: `${args.decisionType}_recorded`,
      actor: args.actor,
      actorRole: args.actorRole,
      reason: args.reason,
      beforeState: `deductible:${args.originalDeductibleAmount}/nondeductible:${args.originalNondeductibleAmount}`,
      afterState: `deductible:${args.revisedDeductibleAmount}/nondeductible:${args.revisedNondeductibleAmount}`,
      metadata: {
        decisionType: args.decisionType,
        deductibleShift: String(deductibleShift),
        nondeductibleShift: String(nondeductibleShift),
      },
      timestamp: Date.now(),
    });

    return decisionId;
  },
});

export const getOverridesByAllocation = queryGeneric({
  args: {
    companyId: v.id("cannabisCompanies"),
    allocationId: v.id("cogsAllocations"),
  },
  handler: async (ctx: any, args: any) => {
    return await ctx.db
      .query("overrideDecisions")
      .withIndex("by_company_allocation", (q: any) =>
        q.eq("companyId", args.companyId).eq("allocationId", args.allocationId),
      )
      .order("desc")
      .collect();
  },
});

export const getRecentOverrides = queryGeneric({
  args: {
    companyId: v.id("cannabisCompanies"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx: any, args: any) => {
    return await ctx.db
      .query("overrideDecisions")
      .withIndex("by_company_timestamp", (q: any) => q.eq("companyId", args.companyId))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const getOverridesByCompany = queryGeneric({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (ctx: any, args: any) => {
    return await ctx.db
      .query("overrideDecisions")
      .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
      .order("desc")
      .collect();
  },
});

// ─── PACKET GENERATION RECORDS ─────────────────────────────────────────

export const recordPacketGeneration = mutationGeneric({
  args: {
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
  },
  handler: async (ctx: any, args: any) => {
    const recordId = await ctx.db.insert("packetGenerationRecords", {
      ...args,
      timestamp: Date.now(),
    });

    // Also record as an audit trail event
    await ctx.db.insert("auditTrailEvents", {
      companyId: args.companyId,
      entityType: "packet",
      entityId: args.bundleId,
      action: `packet_${args.action}`,
      actor: args.actor,
      actorRole: args.actorRole,
      reason: args.detail,
      afterState: `${args.exportFormats.length} formats, ${args.includedSchedules.length} schedules`,
      metadata: {
        bundleName: args.bundleName,
        action: args.action,
        scheduleCount: String(args.includedSchedules.length),
        formatCount: String(args.exportFormats.length),
      },
      timestamp: Date.now(),
    });

    return recordId;
  },
});

export const getPacketRecordsByBundle = queryGeneric({
  args: {
    companyId: v.id("cannabisCompanies"),
    bundleId: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    return await ctx.db
      .query("packetGenerationRecords")
      .withIndex("by_company_bundle", (q: any) =>
        q.eq("companyId", args.companyId).eq("bundleId", args.bundleId),
      )
      .order("desc")
      .collect();
  },
});

export const getRecentPacketRecords = queryGeneric({
  args: {
    companyId: v.id("cannabisCompanies"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx: any, args: any) => {
    return await ctx.db
      .query("packetGenerationRecords")
      .withIndex("by_company_timestamp", (q: any) => q.eq("companyId", args.companyId))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const getPacketRecordsByCompany = queryGeneric({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (ctx: any, args: any) => {
    return await ctx.db
      .query("packetGenerationRecords")
      .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
      .order("desc")
      .collect();
  },
});
