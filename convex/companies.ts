import { mutationGeneric } from "convex/server";
import { v } from "convex/values";

export const updateCompany = mutationGeneric({
  args: {
    companyId: v.id("cannabisCompanies"),
    operatorType: v.optional(v.union(
      v.literal("dispensary"),
      v.literal("cultivator"),
      v.literal("manufacturer"),
      v.literal("distributor"),
      v.literal("vertical"),
    )),
    defaultAccountingMethod: v.optional(v.union(v.literal("cash"), v.literal("accrual"))),
    state: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const { companyId, ...updates } = args;

    const company = await ctx.db.get(companyId);
    if (!company) throw new Error("Company not found");

    const changed: string[] = [];
    const patch: Record<string, any> = {};

    if (updates.operatorType && updates.operatorType !== company.operatorType) {
      patch.operatorType = updates.operatorType;
      changed.push(`operator type: ${company.operatorType} → ${updates.operatorType}`);
    }
    if (updates.defaultAccountingMethod && updates.defaultAccountingMethod !== company.defaultAccountingMethod) {
      patch.defaultAccountingMethod = updates.defaultAccountingMethod;
      changed.push(`accounting method: ${company.defaultAccountingMethod} → ${updates.defaultAccountingMethod}`);
    }
    if (updates.state && updates.state !== company.state) {
      patch.state = updates.state;
      changed.push(`state: ${company.state} → ${updates.state}`);
    }

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(companyId, patch);

      // Audit trail
      await ctx.db.insert("auditTrailEvents", {
        companyId,
        entityType: "system",
        entityId: companyId,
        action: "company_updated",
        actor: "System",
        reason: changed.join(", "),
        beforeState: JSON.stringify({
          operatorType: company.operatorType,
          accountingMethod: company.defaultAccountingMethod,
          state: company.state,
        }),
        afterState: JSON.stringify({
          operatorType: patch.operatorType ?? company.operatorType,
          accountingMethod: patch.defaultAccountingMethod ?? company.defaultAccountingMethod,
          state: patch.state ?? company.state,
        }),
        timestamp: Date.now(),
      });
    }

    return await ctx.db.get(companyId);
  },
});
