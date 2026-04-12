import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

// ─── LOCATIONS ──────────────────────────────────────────────────────

export const listByCompany = queryGeneric({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (ctx: any, args: any) => {
    return await ctx.db
      .query("cannabisLocations")
      .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
      .collect();
  },
});

export const addLocation = mutationGeneric({
  args: {
    companyId: v.id("cannabisCompanies"),
    name: v.string(),
    licenseNumber: v.string(),
    state: v.string(),
    city: v.string(),
    isPrimary: v.boolean(),
    squareFootage: v.optional(v.number()),
  },
  handler: async (ctx: any, args: any) => {
    // If this is primary, unset other primary locations
    if (args.isPrimary) {
      const existing = await ctx.db
        .query("cannabisLocations")
        .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
        .collect();
      for (const loc of existing) {
        if (loc.isPrimary) {
          await ctx.db.patch(loc._id, { isPrimary: false });
        }
      }
    }

    const locationId = await ctx.db.insert("cannabisLocations", args);

    // Audit trail
    await ctx.db.insert("auditTrailEvents", {
      companyId: args.companyId,
      entityType: "system",
      entityId: locationId,
      action: "location_added",
      actor: "System",
      reason: `Added location: ${args.name} in ${args.city}, ${args.state}`,
      afterState: JSON.stringify(args),
      timestamp: Date.now(),
    });

    return await ctx.db.get(locationId);
  },
});

export const updateLocation = mutationGeneric({
  args: {
    locationId: v.id("cannabisLocations"),
    name: v.optional(v.string()),
    licenseNumber: v.optional(v.string()),
    state: v.optional(v.string()),
    city: v.optional(v.string()),
    isPrimary: v.optional(v.boolean()),
    squareFootage: v.optional(v.number()),
  },
  handler: async (ctx: any, args: any) => {
    const { locationId, ...updates } = args;
    const location = await ctx.db.get(locationId);
    if (!location) throw new Error("Location not found");

    // If setting as primary, unset others
    if (updates.isPrimary) {
      const existing = await ctx.db
        .query("cannabisLocations")
        .withIndex("by_company", (q: any) => q.eq("companyId", location.companyId))
        .collect();
      for (const loc of existing) {
        if (loc.isPrimary && loc._id !== locationId) {
          await ctx.db.patch(loc._id, { isPrimary: false });
        }
      }
    }

    await ctx.db.patch(locationId, updates);

    await ctx.db.insert("auditTrailEvents", {
      companyId: location.companyId,
      entityType: "system",
      entityId: locationId,
      action: "location_updated",
      actor: "System",
      reason: `Updated location: ${location.name}`,
      beforeState: JSON.stringify(location),
      afterState: JSON.stringify({ ...location, ...updates }),
      timestamp: Date.now(),
    });

    return await ctx.db.get(locationId);
  },
});

export const deleteLocation = mutationGeneric({
  args: { locationId: v.id("cannabisLocations") },
  handler: async (ctx: any, args: any) => {
    const location = await ctx.db.get(args.locationId);
    if (!location) throw new Error("Location not found");

    await ctx.db.delete(args.locationId);

    await ctx.db.insert("auditTrailEvents", {
      companyId: location.companyId,
      entityType: "system",
      entityId: args.locationId,
      action: "location_deleted",
      actor: "System",
      reason: `Deleted location: ${location.name} in ${location.city}, ${location.state}`,
      beforeState: JSON.stringify(location),
      timestamp: Date.now(),
    });

    return { ok: true };
  },
});
