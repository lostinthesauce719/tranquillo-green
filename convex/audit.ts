import { v } from "convex/values";
import { authMutation, authQuery } from "./lib/withAuth";

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
  timestamp: v.number({ required: true }), // epoch ms
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
  handler: async (ctx, {
    action,
    entity,
    entityId,
    changes,
    metadata,
    ipAddress,
    userAgent,
    clientUrl,
  }) => {
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
  },
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
    const changes = [];
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

    return await logAuditEvent(
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
    companyId: v.optional(v.id("cannabisCompanies")),
    start: v.optional(v.number()),
    end: v.optional(v.number()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, { entity, entityId, action, userId, companyId, start, end, limit = 100, offset = 0 }) => {
    let q = ctx.db.query("auditLogs");

    if (entity) q = q.filter(q => q.eq(q.field("entity"), entity));
    if (entityId) q = q.filter(q => q.eq(q.field("entityId"), entityId));
    if (action) q = q.filter(q => q.eq(q.field("action"), action));
    if (userId) q = q.filter(q => q.eq(q.field("userId"), userId));
    if (companyId) q = q.filter(q => q.eq(q.field("companyId"), companyId));
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

  return await logAuditEvent(ctx, {
    action,
    entity,
    entityId,
    changes,
    metadata,
  });
};