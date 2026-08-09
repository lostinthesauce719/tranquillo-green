import { authMutation, authQuery, requireIdentity, requireCompanyAccessById } from "./lib/withAuth";
import { v } from "convex/values";

export const listByCompany = authQuery({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    await requireCompanyAccessById(ctx, identity, args.companyId);
    return (
      await ctx.db
        .query("employees")
        .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
        .collect()
    ).filter((e: any) => e.active);
  },
});

export const addEmployee = authMutation({
  args: {
    companyId: v.id("cannabisCompanies"),
    name: v.string(),
    role: v.string(),
    payRate: v.number(),
    hoursPerPeriod: v.number(),
    allocation: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    await requireCompanyAccessById(ctx, identity, args.companyId);
    if (args.allocation < 0 || args.allocation > 100) {
      throw new Error("Allocation must be between 0 and 100.");
    }
    if (args.payRate < 0 || args.hoursPerPeriod < 0) {
      throw new Error("Pay rate and hours must be non-negative.");
    }
    const now = Date.now();
    return await ctx.db.insert("employees", {
      companyId: args.companyId,
      name: args.name.trim(),
      role: args.role.trim(),
      payRate: args.payRate,
      hoursPerPeriod: args.hoursPerPeriod,
      allocation: args.allocation,
      active: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateEmployee = authMutation({
  args: {
    employeeId: v.id("employees"),
    name: v.optional(v.string()),
    role: v.optional(v.string()),
    payRate: v.optional(v.number()),
    hoursPerPeriod: v.optional(v.number()),
    allocation: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const { employeeId, ...updates } = args;
    const employee = await ctx.db.get(employeeId);
    if (!employee) throw new Error("Employee not found.");
    await requireCompanyAccessById(ctx, identity, employee.companyId);
    if (updates.allocation !== undefined && (updates.allocation < 0 || updates.allocation > 100)) {
      throw new Error("Allocation must be between 0 and 100.");
    }
    const patch = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined),
    );
    await ctx.db.patch(employeeId, { ...patch, updatedAt: Date.now() });
    return await ctx.db.get(employeeId);
  },
});

export const removeEmployee = authMutation({
  args: { employeeId: v.id("employees") },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const employee = await ctx.db.get(args.employeeId);
    if (!employee) throw new Error("Employee not found.");
    await requireCompanyAccessById(ctx, identity, employee.companyId);
    // Soft delete so historical labor allocation stays reconstructable.
    await ctx.db.patch(args.employeeId, { active: false, updatedAt: Date.now() });
    return args.employeeId;
  },
});
