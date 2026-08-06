import { authMutation, authQuery, requireCompanyAccessById, requireCurrentUserRecord } from "./lib/withAuth";
import { v } from "convex/values";

type FeedItem = {
  id: string;
  kind: "alert" | "activity";
  severity: "info" | "warning" | "critical";
  title: string;
  body: string;
  href: string;
  createdAt: number;
  readAt: number | null;
};

/**
 * getFeed: Composes the notification feed live from unresolved compliance
 * alerts and recent audit events, joined with the caller's read/dismiss state.
 */
export const getFeed = authQuery({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (ctx, args, identity) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);
    const user = await requireCurrentUserRecord(ctx, identity);

    const [alerts, events, states] = await Promise.all([
      ctx.db
        .query("complianceAlerts")
        .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
        .collect(),
      ctx.db
        .query("auditTrailEvents")
        .withIndex("by_company_timestamp", (q: any) => q.eq("companyId", args.companyId))
        .order("desc")
        .take(25),
      ctx.db
        .query("notificationStates")
        .withIndex("by_user", (q: any) => q.eq("userId", user._id))
        .collect(),
    ]);

    const stateBySource = new Map<string, any>(states.map((s: any) => [s.sourceId, s]));

    const categoryHref: Record<string, string> = {
      license: "/dashboard/compliance",
      tax: "/dashboard/compliance",
      reconciliation: "/dashboard/reconciliations",
      allocation: "/dashboard/allocations",
    };

    const items: FeedItem[] = [];

    for (const alert of alerts) {
      if (alert.resolvedAt) continue;
      const state = stateBySource.get(alert._id);
      if (state?.dismissedAt) continue;
      items.push({
        id: alert._id,
        kind: "alert",
        severity: alert.severity,
        title: alert.title,
        body: alert.body,
        href: categoryHref[alert.category] ?? "/dashboard/compliance",
        createdAt: alert._creationTime,
        readAt: state?.readAt ?? null,
      });
    }

    for (const event of events) {
      const state = stateBySource.get(event._id);
      if (state?.dismissedAt) continue;
      items.push({
        id: event._id,
        kind: "activity",
        severity: "info",
        title: (event.action ?? "activity").replace(/_/g, " "),
        body: event.reason ?? `${event.entityType} ${event.entityId}`.trim(),
        href: "/dashboard/settings/audit-log",
        createdAt: event.timestamp ?? event._creationTime,
        readAt: state?.readAt ?? null,
      });
    }

    items.sort((a, b) => b.createdAt - a.createdAt);
    return {
      items: items.slice(0, 50),
      unreadCount: items.filter((i) => !i.readAt).length,
    };
  },
});

async function upsertState(
  ctx: any,
  userId: string,
  sourceId: string,
  patch: { readAt?: number; dismissedAt?: number },
) {
  const existing = await ctx.db
    .query("notificationStates")
    .withIndex("by_user_source", (q: any) => q.eq("userId", userId).eq("sourceId", sourceId))
    .unique();
  if (existing) {
    await ctx.db.patch(existing._id, patch);
  } else {
    await ctx.db.insert("notificationStates", { userId, sourceId, ...patch });
  }
}

export const markRead = authMutation({
  args: { sourceIds: v.array(v.string()) },
  handler: async (ctx, args, identity) => {
    const user = await requireCurrentUserRecord(ctx, identity);
    const now = Date.now();
    for (const sourceId of args.sourceIds.slice(0, 100)) {
      await upsertState(ctx, user._id, sourceId, { readAt: now });
    }
    return { ok: true };
  },
});

export const dismiss = authMutation({
  args: { sourceId: v.string() },
  handler: async (ctx, args, identity) => {
    const user = await requireCurrentUserRecord(ctx, identity);
    const now = Date.now();
    await upsertState(ctx, user._id, args.sourceId, { readAt: now, dismissedAt: now });
    return { ok: true };
  },
});
