import { v } from "convex/values";
import { authMutation, authQuery, requireCompanyAccessById } from "./lib/withAuth";

/**
 * Audit Trail — Log and query system events for compliance and debugging.
 *
 * Captures user actions, data modifications, and system events with full context.
 */

// ─── SCHEMA ───────────────────────────────────────────────────────────────
const auditSchema = {
  action: v.string(), // e.g., "user.created", "transaction.posted"
  entity: v.string(), // e.g., "users", "transactions"
  entityId: v.string(), // ID of the affected record
  userId: v.id("users"), // who performed the action
  companyId: v.id("cannabisCompanies"), // company context
  timestamp: v.number(), // epoch ms — v.number() takes no options argument
  changes: v.array(
    v.object({
      field: v.string(),
      oldValue: v.any(),
      newValue: v.any(),
    })
  ),
  metadata: v.record(v.string(), v.any()), // additional context (IP, user agent, etc.)
  ipAddress: v.optional(v.string()),
  userAgent: v.optional(v.string()),
  clientUrl: v.optional(v.string()),
};

// ─── MUTATIONS ─────────────────────────────────────────────────────────────

/**
 * Log an audit event.
 * This is the primary way to record system events.
 *
 * @param args - Audit record details
 */
/**
 * Plain helper holding the actual audit-write logic.
 *
 * Two call sites in this file previously did `await logAuditEvent(ctx, {...})`,
 * calling the registered Convex mutation as if it were a function. Registered
 * functions are not callable that way — those paths could never have run, which
 * is part of why audit logging has never worked.
 *
 * Shared logic belongs in a plain function that both the exported mutation and
 * internal callers use.
 */
async function writeAuditEvent(
  ctx: any,
  {
    action,
    entity,
    entityId,
    changes,
    metadata,
    ipAddress,
    userAgent,
    clientUrl,
  }: {
    action: string;
    entity: string;
    entityId: string;
    changes: Array<{ field: string; oldValue: any; newValue: any }>;
    // Optional: logDataChange and logDataMutation both accept an optional
    // metadata argument and pass it straight through.
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    clientUrl?: string;
  }
) {
  {
    const identity = await ctx.auth.getUserIdentity();
    const user = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("Authenticated user not found in system");
    }

    const companyId = user.companyId; // All actions are within a company context

    const auditId = await ctx.db.insert("auditLogs", {
      action,
      entity,
      entityId,
      userId: user._id,
      companyId,
      timestamp: Date.now(),
      changes,
      metadata: {
        ...metadata,
        ipAddress,
        userAgent,
        clientUrl,
      },
    });

    return await ctx.db.get(auditId);
  }
}

/** Public mutation wrapper around writeAuditEvent. */
export const logAuditEvent = authMutation({
  args: {
    action: v.string(),
    entity: v.string(),
    entityId: v.string(),
    changes: v.array(
      v.object({
        field: v.string(),
        oldValue: v.any(),
        newValue: v.any(),
      })
    ),
    metadata: v.record(v.string(), v.any()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    clientUrl: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => writeAuditEvent(ctx, args),
});

/**
 * Log a generic data mutation with before/after values.
 * Convenience wrapper for common CRUD operations.
 */
export const logDataChange = authMutation({
  args: {
    action: v.union(v.literal("create"), v.literal("update"), v.literal("delete")),
    entity: v.string(),
    entityId: v.string(),
    oldValues: v.optional(v.record(v.string(), v.any())),
    newValues: v.optional(v.record(v.string(), v.any())),
    metadata: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (ctx, { action, entity, entityId, oldValues, newValues, metadata }) => {
    const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];
    if (oldValues && newValues) {
      // Compare two objects and build change list
      for (const key of Object.keys({ ...oldValues, ...newValues })) {
        const oldVal = oldValues?.[key];
        const newVal = newValues?.[key];
        if (oldVal !== newVal) {
          changes.push({ field: key, oldValue: oldVal, newValue: newVal });
        }
      }
    } else if (newValues) {
      changes.push({ field: "data", oldValue: null, newValue: newValues });
    }

    return await writeAuditEvent(
      ctx,
      {
        action: `${entity}.${action}`,
        entity,
        entityId,
        changes,
        metadata,
      }
    );
  },
});

// ─── QUERIES ───────────────────────────────────────────────────────────────

/**
 * Query audit logs with filters.
 *
 * @param args - Filter parameters
 */
export const queryAuditLogs = authQuery({
  args: {
    entity: v.optional(v.string()),
    entityId: v.optional(v.string()),
    action: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    /*
     * REQUIRED. This was optional, and that made it the widest hole in the API.
     *
     * The withAuth wrapper scopes a request by reading companyId out of it —
     * so when companyId was absent there was nothing to scope, and the handler
     * only filtered by company `if (companyId)`. Calling queryAuditLogs({})
     * therefore returned the audit log for every company on the platform:
     * who did what, to which records, when, across every tenant.
     *
     * An optional tenant filter on a query that spans tenants is not a filter.
     * It is a default of "everything".
     */
    companyId: v.id("cannabisCompanies"),
    start: v.optional(v.number()),
    end: v.optional(v.number()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, { entity, entityId, action, userId, companyId, start, end, limit = 100, offset = 0 }, identity) => {
    await requireCompanyAccessById(ctx, identity, companyId);

    // Applied first and unconditionally. Every other filter narrows within this
    // company; none of them can widen past it.
    let q = ctx.db.query("auditLogs").filter(q => q.eq(q.field("companyId"), companyId));

    if (entity) q = q.filter(q => q.eq(q.field("entity"), entity));
    if (entityId) q = q.filter(q => q.eq(q.field("entityId"), entityId));
    if (action) q = q.filter(q => q.eq(q.field("action"), action));
    // userId narrows to one actor, but only among this company's own entries.
    if (userId) q = q.filter(q => q.eq(q.field("userId"), userId));
    if (start) q = q.filter(q => q.gte(q.field("timestamp"), start));
    if (end) q = q.filter(q => q.lt(q.field("timestamp"), end));

    return await q
      .orderBy("timestamp", "desc")
      .limit(limit)
      .offset(offset)
      .collect();
  },
});

/**
 * Get recent activity for a company (dashboard feed).
 *
 * @param args - companyId, limit
 */
export const getRecentActivity = authQuery({
  args: {
    companyId: v.id("cannabisCompanies"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { companyId, limit = 50 }) => {
    return await ctx.db
      .query("auditLogs")
      .filter(q => q.eq(q.field("companyId"), companyId))
      .orderBy("timestamp", "desc")
      .limit(limit)
      .collect();
  },
});

/**
 * Get audit log count by entity type.
 */
export const getAuditStats = authQuery({
  args: {
    companyId: v.id("cannabisCompanies"),
    start: v.optional(v.number()),
    end: v.optional(v.number()),
  },
  handler: async (ctx, { companyId, start, end }) => {
    let q = ctx.db.query("auditLogs").filter(q => q.eq(q.field("companyId"), companyId));
    if (start) q = q.filter(q => q.gte(q.field("timestamp"), start));
    if (end) q = q.filter(q => q.lt(q.field("timestamp"), end));

    const records = await q.collect();

    const stats: Array<{ entity: string; count: number }> = [];
    const counts: Record<string, number> = {};
    for (const r of records) {
      counts[r.entity] = (counts[r.entity] || 0) + 1;
    }
    for (const [entity, count] of Object.entries(counts)) {
      stats.push({ entity, count });
    }

    return stats;
  },
});

// ─── HELPERS FOR OTHER MODULES ────────────────────────────────────────────

/**
 * Create an audit log entry from a Convex mutation with automatic before/after diff.
 * Usage: await auditFromMutation(ctx, { action, entity, entityId, oldRecord, newRecord, metadata })
 */
export const auditFromMutation = async (
  ctx: any,
  {
    action,
    entity,
    entityId,
    oldRecord,
    newRecord,
    metadata,
  }: {
    action: string;
    entity: string;
    entityId: string;
    oldRecord?: Record<string, any>;
    newRecord?: Record<string, any>;
    metadata?: Record<string, any>;
  }
) => {
  const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];
  if (oldRecord && newRecord) {
    for (const key of Object.keys({ ...oldRecord, ...newRecord })) {
      const oldVal = oldRecord[key];
      const newVal = newRecord[key];
      if (oldVal !== newVal) {
        changes.push({ field: key, oldValue: oldVal, newValue: newVal });
      }
    }
  } else if (newRecord) {
    changes.push({ field: "data", oldValue: null, newValue: newRecord });
  }

  return await writeAuditEvent(ctx, {
    action,
    entity,
    entityId,
    changes,
    metadata,
  });
};