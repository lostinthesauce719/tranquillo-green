/**
 * Tranquillo Green — Business API Interface
 *
 * Type-safe API definitions for Convex server functions.
 * Mirror of convex/business.ts, exposed to client via generated types.
 */

import { defineApp } from "convex/server";
import { v } from "convex/values";

export const api = defineApp({
  // Leads
  captureLead: {
    args: {
      companyName: v.string(),
      contactName: v.string(),
      email: v.string(),
      phone: v.optional(v.string()),
      operatorType: v.string(),
      state: v.string(),
      monthlyRevenueRange: v.optional(v.string()),
      bookkeepingMethod: v.optional(v.string()),
      painPoints: v.array(v.string()),
      acquisitionSource: v.string(),
      utmSource: v.optional(v.string()),
      utmMedium: v.optional(v.string()),
      utmCampaign: v.optional(v.string()),
      referrer: v.optional(v.string()),
    },
    returns: {
      leadId: v.string(),
      isNew: v.boolean(),
    },
  },

  // Proposal
  generateProposal: {
    args: {
      leadId: v.id("leads"),
    },
    returns: {
      recommendedTier: v.union(
        v.literal("dispensary"),
        v.literal("cultivator"),
        v.literal("manufacturer"),
        v.literal("enterprise"),
      ),
      pricing: {
        basePrice: v.number(),
        annualPrice: v.number(),
        includedLicenses: v.number(),
        additionalLicensePrice: v.number(),
      },
      contractTerms: {
        minimumCommitment: v.string(),
        cancellation: v.string(),
        implementationFee: v.number(),
        supportTier: v.string(),
      },
      roi: {
        estimatedMonthlySavings: v.number(),
        paybackMonths: v.number(),
        firstYearValue: v.number(),
        percentReturn: v.number(),
      },
      includedFeatures: v.array(v.string()),
      expoAt: v.number(),
    },
  },

  // Trial
  startTrial: {
    args: {
      leadId: v.id("leads"),
      selectedTier: v.union(
        v.literal("dispensary"),
        v.literal("cultivator"),
        v.literal("manufacturer"),
        v.literal("enterprise"),
      ),
      billingCycle: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("annually")),
    },
    returns: {
      customerId: v.string(),
      trialEndsAt: v.number(),
      portalUrl: v.string(),
    },
  },

  // Subscription activation
  activateSubscription: {
    args: {
      customerId: v.id("customers"),
      billingCycle: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("annually")),
    },
    returns: {
      invoiceId: v.string(),
      monthlyPrice: v.number(),
      periodEnd: v.number(),
    },
  },

  // Queries
  getCustomer: {
    args: {
      customerId: v.id("customers"),
    },
    returns: v.optional(
      v.object({
        _id: v.id("customers"),
        clerkUserId: v.optional(v.string()),
        companyName: v.string(),
        dbaName: v.optional(v.string()),
        operatorType: v.any(),
        primaryState: v.string(),
        states: v.array(v.string()),
        taxIdLast4: v.optional(v.string()),
        contactName: v.string(),
        contactEmail: v.string(),
        contactPhone: v.optional(v.string()),
        tier: v.any(),
        billingCycle: v.any(),
        status: v.any(),
        monthlyRecurringRevenue: v.number(),
        annualContractValue: v.number(),
        seats: v.number(),
        additionalLicenses: v.number(),
        trialStartsAt: v.optional(v.number()),
        trialEndsAt: v.optional(v.number()),
        activatedAt: v.optional(v.number()),
        canceledAt: v.optional(v.number()),
        churnedAt: v.optional(v.number()),
        acquisitionSource: v.string(),
        assignedTo: v.optional(v.string()),
        notes: v.optional(v.string()),
        tags: v.array(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
      }),
    ),
  },

  listActiveCustomers: {
    args: {},
    returns: v.array(
      v.object({
        _id: v.id("customers"),
        companyName: v.string(),
        tier: v.any(),
        monthlyRecurringRevenue: v.number(),
        contactEmail: v.string(),
        activatedAt: v.optional(v.number()),
      }),
    ),
  },

  getDailyMetrics: {
    args: {
      days: v.optional(v.number()),
    },
    returns: v.array(
      v.object({
        _id: v.id("dailyMetrics"),
        date: v.string(),
        mrrCents: v.number(),
        arrCents: v.number(),
        activeCustomers: v.number(),
        newCustomers: v.number(),
        churnedCustomers: v.number(),
        netRetentionPercentage: v.number(),
        recordedAt: v.number(),
      }),
    ),
  },
  getMrrByTier: {
    args: {},
    returns: v.array(
      v.object({
        tier: v.string(),
        mrrCents: v.number(),
      })
    ),
  },
  getMrrByState: {
    args: {
      limit: v.optional(v.number()),
    },
    returns: v.array(
      v.object({
        state: v.string(),
        mrrCents: v.number(),
      })
    ),
  },
  getCustomerGrowth: {
    args: {
      days: v.optional(v.number()),
    },
    returns: v.array(
      v.object({
        date: v.string(),
        newCount: v.number(),
        churnedCount: v.number(),
      })
    ),
  },
});
