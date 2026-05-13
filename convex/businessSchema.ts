/**
 * Simplified business schema — just the tables we need right now
 * to make lead capture and customer tracking real.
 */

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Business tables embedded directly (no external file dependency for now)
  customers: defineTable({
    clerkUserId: v.optional(v.string()),
    companyName: v.string(),
    operatorType: v.string(),
    primaryState: v.string(),
    contactName: v.string(),
    contactEmail: v.string(),
    tier: v.string(),
    billingCycle: v.string(),
    status: v.string(),
    monthlyRecurringRevenue: v.number(),
    trialStartsAt: v.optional(v.number()),
    trialEndsAt: v.optional(v.number()),
    activatedAt: v.optional(v.number()),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_clerk_user", ["clerkUserId"])
    .index("by_status", ["status"]),

  leads: defineTable({
    email: v.string(),
    companyName: v.string(),
    contactName: v.string(),
    operatorType: v.string(),
    state: v.string(),
    score: v.number(),
    status: v.string(),
    convertedToCustomerId: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_email", ["email"]).index("by_status", ["status"]),

  invoices: defineTable({
    customerId: v.id("customers"),
    invoiceNumber: v.string(),
    periodStart: v.number(),
    periodEnd: v.number(),
    totalCents: v.number(),
    status: v.string(),
    paidAt: v.optional(v.number()),
    lineItems: v.array(v.object({
      description: v.string(),
      quantity: v.number(),
      unitPriceCents: v.number(),
    })),
    generatedAt: v.number(),
  }).index("by_customer", ["customerId"]),

  // Daily metrics for dashboard
  dailyMetrics: defineTable({
    date: v.string(),
    mrrCents: v.number(),
    activeCustomers: v.number(),
    newCustomers: v.number(),
    churnedCustomers: v.number(),
    netRetentionPercentage: v.number(),
    recordedAt: v.number(),
  }).index("by_date", ["date"]),
});
