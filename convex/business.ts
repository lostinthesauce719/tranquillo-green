/**
 * Tranquillo Green — Business API
 *
 * Core revenue operations: lead capture → proposal → trial → subscription.
 * These are the actual money-making endpoints.
 */

import { mutationGeneric, queryGeneric } from "convex/server";
import { authQuery, authMutation } from "./lib/withAuth";
import { v } from "convex/values";
import {
  PRICING_TIERS,
  BillingCycle,
  calculateMonthlyRevenue,
} from "../src/lib/business/revenue-engine";
import { emailNotifications } from "./middleware/emailNotifications";

// ─── LEAD CAPTURE ───────────────────────────────────────────────────────────
/**
 * Capture a sales lead from the website form.
 * In production: triggers Slack alert to sales team, enriches with Clearbit/Hunter.
 */
export const captureLead = authMutation({
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
  handler: async (ctx, args) => {
    // Prevent duplicate leads
    const existing = await ctx.db
      .query("leads")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      // Update touch count and last touch
      await ctx.db.patch(existing._id, {
        lastTouchAt: Date.now(),
        touchCount: (existing.touchCount || 0) + 1,
        notes: `Updated info: ${args.companyName}`,
      });
      return { leadId: existing._id, isNew: false };
    }

    // Calculate lead score (simple heuristic — production would use ML model)
    const score = calculateLeadScore(args);

    const leadId = await ctx.db.insert("leads", {
      email: args.email,
      companyName: args.companyName,
      contactName: args.contactName,
      phone: args.phone,
      operatorType: args.operatorType,
      state: args.state,
      monthlyRevenueRange: args.monthlyRevenueRange,
      bookkeepingMethod: args.bookkeepingMethod,
      painPoints: args.painPoints,
      score,
      acquisitionSource: args.acquisitionSource,
      utmSource: args.utmSource,
      utmMedium: args.utmMedium,
      utmCampaign: args.utmCampaign,
      referrer: args.referrer,
      status: "new",
      firstTouchAt: Date.now(),
      lastTouchAt: Date.now(),
      touchCount: 1,
      createdAt: Date.now(),
    });

    // Trigger email notification to sales team (fire-and-forget)
    void emailNotifications.captureLead({
      companyName: args.companyName,
      contactName: args.contactName,
      email: args.email,
      phone: args.phone,
      operatorType: args.operatorType,
      state: args.state,
      monthlyRevenueRange: args.monthlyRevenueRange,
      painPoints: args.painPoints,
      score,
    }).catch((err) => console.error("Failed to send lead notification email:", err));

    // In production: trigger webhook/Slack notification here
    console.log(`New lead captured: ${args.email} (score: ${score})`);

    return { leadId, isNew: true };
  },
});

// ─── CONTACT FORM SUBMISSION ────────────────────────────────────────────────
export const submitContactForm = authMutation({
  args: {
    name: v.string(),
    email: v.string(),
    company: v.optional(v.string()),
    phone: v.optional(v.string()),
    message: v.string(),
    inquiryType: v.union(v.literal("demo"), v.literal("cpa"), v.literal("general")),
    operatorType: v.optional(v.string()),
    state: v.optional(v.string()),
    clientCount: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const submissionId = await ctx.db.insert("contactSubmissions", {
      name: args.name,
      email: args.email,
      company: args.company,
      phone: args.phone,
      message: args.message,
      inquiryType: args.inquiryType,
      operatorType: args.operatorType,
      state: args.state,
      clientCount: args.clientCount,
      status: "new",
      createdAt: Date.now(),
    });

    console.log(`[CONTACT] New ${args.inquiryType} submission from ${args.email}`);
    return { submissionId, success: true };
  },
});

function calculateLeadScore(args: {
  operatorType: string;
  state: string;
  monthlyRevenueRange?: string;
  painPoints: string[];
}): number {
  let score = 50; // base

  // Operator type: dispensary and vertical = higher (more complex compliance needs)
  if (["dispensary", "vertical"].includes(args.operatorType)) score += 15;

  // State: CA, CO, NV, OR = mature markets (more need for compliance)
  const highValueStates = ["CA", "CO", "NV", "OR", "WA", "MI", "MA", "IL"];
  if (highValueStates.includes(args.state)) score += 10;

  // Revenue: higher revenue = more to spend
  if (args.monthlyRevenueRange === "1m-5m" || args.monthlyRevenueRange === ">5m") score += 15;

  // Pain points: explicit pain = higher intent
  score += Math.min(args.painPoints.length * 5, 15);

  // UTM source: direct traffic lower than paid/partner
  // (simplified — production would look at utm_medium)

  return Math.min(score, 98); // cap at 98 (reserve 2 for "obviously qualified")
}

// ─── PROPOSAL GENERATION ───────────────────────────────────────────────────
/**
 * Generate a personalized proposal for a lead.
 * Returns pricing, tier recommendation, and ROI estimate.
 */
export const generateProposal = authQuery({
  args: {
    leadId: v.id("leads"),
  },
  handler: async (ctx, args) => {
    const lead = await ctx.db.get("leads", args.leadId);
    if (!lead) throw new Error("Lead not found");

    // Tier recommendation logic
    let recommendedTier: keyof typeof PRICING_TIERS = "DISPENSARY";

    if (lead.operatorType === "cultivator") recommendedTier = "CULTIVATOR";
    else if (lead.operatorType === "manufacturer") recommendedTier = "MANUFACTURER";

    // Revenue-based adjustment
    const rev = lead.monthlyRevenueRange;
    if (rev === "1m-5m" || rev === ">5m") {
      if (recommendedTier === "DISPENSARY") recommendedTier = "ENTERPRISE";
    }

    // State-based multi-entity likelihood
    const multiStateLikely = ["CA", "CO", "OR"].includes(lead.state);
    if (multiStateLikely && recommendedTier === "DISPENSARY") {
      recommendedTier = "ENTERPRISE";
    }

    const pricing = PRICING_TIERS[recommendedTier];

    // Calculate ROI (very simplified)
    const estimatedMonthlySavings =
      (lead.painPoints.includes("280E deduction uncertainty") ? 3000 : 0) +
      (lead.painPoints.includes("Cash reconciliation takes too long") ? 1500 : 0) +
      (lead.painPoints.includes("CPA asks for same docs repeatedly") ? 1000 : 0);

    const monthlyCost = pricing.basePrice;
    const roi = ((estimatedMonthlySavings - monthlyCost) / monthlyCost) * 100;

    // First-year value (includes implementation)
    const firstYearValue = estimatedMonthlySavings * 12;

    return {
      recommendedTier,
      pricing: {
        basePrice: pricing.basePrice,
        annualPrice: Math.round(pricing.basePrice * 12 * pricing.annualDiscount),
        includedLicenses: pricing.includedLicenses,
        additionalLicensePrice: pricing.additionalLicensePrice,
      },
      contractTerms: {
        minimumCommitment: "12 months",
        cancellation: "30-day notice",
        implementationFee: 0, // waived for first 10 customers
        supportTier: "email",
      },
      roi: {
        estimatedMonthlySavings,
        paybackMonths: monthlyCost > 0 ? Math.round(monthlyCost / (estimatedMonthlySavings / 12)) : 0,
        firstYearValue,
        percentReturn: Math.round(roi),
      },
      includedFeatures: pricing.features,
      expoAt: Date.now(),
    };
  },
});

// ─── TRIAL START ────────────────────────────────────────────────────────────
/**
 * Convert a lead to a trial customer.
 * Provisions sandbox environment, seeds demo data, sends welcome email.
 */
export const startTrial = authMutation({
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
  handler: async (ctx, args) => {
    const lead = await ctx.db.get("leads", args.leadId);
    if (!lead) throw new Error("Lead not found");

    const now = Date.now();
    const trialEndsAt = now + 14 * 24 * 60 * 60 * 1000; // 14 days

    // Create customer record
    const tierKey = args.selectedTier.toUpperCase() as keyof typeof PRICING_TIERS;
    const billingCycleUpper = args.billingCycle.toUpperCase() as any;
    const monthlyPrice = calculateMonthlyRevenue(tierKey, billingCycleUpper);

    const customerId = await ctx.db.insert("customers", {
      clerkUserId: null, // will be set upon sign-up
      companyName: lead.companyName,
      dbaName: null,
      operatorType: lead.operatorType,
      primaryState: lead.state,
      states: [lead.state],
      taxIdLast4: null,
      contactName: lead.contactName,
      contactEmail: lead.email,
      contactPhone: lead.phone,
      tier: tierKey,
      billingCycle: billingCycleUpper,
      status: "trial",
      monthlyRecurringRevenue: monthlyPrice,
      annualContractValue: 0, // not yet contracted
      seats: 1,
      additionalLicenses: 0,
      trialStartsAt: now,
      trialEndsAt,
      currentPeriodStartsAt: now,
      currentPeriodEndsAt: now + 30 * 24 * 60 * 60 * 1000,
      activatedAt: null,
      canceledAt: null,
      churnedAt: null,
      acquisitionSource: lead.acquisitionSource,
      assignedTo: null,
      notes: `Converted from lead ${args.leadId}`,
      tags: ["trial", lead.operatorType, lead.state],
    });

    // Mark lead as converted
    await ctx.db.patch(args.leadId, {
      status: "trial_started",
      convertedToCustomerId: customerId,
    });

    // Create first invoice (trial = $0)
    await ctx.db.insert("invoices", {
      customerId,
      invoiceNumber: `INV-${customerId.slice(0, 8).toUpperCase()}-TRIAL`,
      periodStart: now,
      periodEnd: trialEndsAt,
      subtotalCents: 0,
      taxCents: 0,
      totalCents: 0,
      currency: "USD",
      status: "paid",
      paymentMethodType: null,
      paidAt: now,
      lineItems: [
        {
          description: "14-day free trial",
          quantity: 1,
          unitPriceCents: 0,
          amountCents: 0,
        },
      ],
      paymentIntentId: null,
      generatedAt: now,
      notes: "Trial period — no charge",
    });

    // Send trial welcome email (fire-and-forget)
    const pricing = PRICING_TIERS[tierKey];
    void emailNotifications.startTrial({
      companyName: lead.companyName,
      contactName: lead.contactName,
      contactEmail: lead.email,
      tier: args.selectedTier,
      tierDisplayName: pricing.name,
      monthlyPrice: pricing.basePrice,
      trialEndsAt,
      portalUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.tranquillogreen.com"}/dashboard?trial=${customerId}`,
    }).catch((err) => console.error("Failed to send trial welcome email:", err));

    return {
      customerId,
      trialEndsAt,
      portalUrl: `/dashboard?trial=${customerId}`,
    };
  },
});

// ─── ACTIVATE SUBSCRIPTION ─────────────────────────────────────────────────
/**
 * Convert trial to paid subscription.
 * Generates first invoice, sets up recurring billing.
 */
export const activateSubscription = authMutation({
  args: {
    customerId: v.id("customers"),
    paymentMethodId: v.string(), // Stripe payment method ID
    billingCycle: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("annually")),
  },
  handler: async (ctx, args) => {
    const customer = await ctx.db.get("customers", args.customerId);
    if (!customer) throw new Error("Customer not found");
    if (customer.status !== "trial") throw new Error("Customer not in trial");

    const now = Date.now();
    const billingCycleUpper = args.billingCycle.toUpperCase() as any;
    const monthlyPrice = calculateMonthlyRevenue(
      customer.tier,
      billingCycleUpper,
      customer.additionalLicenses,
      customer.seats - 1,
    );

    // Calculate period dates
    const periodStart = now;
    let periodEnd: number;
    if (billingCycleUpper === "MONTHLY") periodEnd = now + 30 * 24 * 60 * 60 * 1000;
    else if (billingCycleUpper === "QUARTERLY")
      periodEnd = now + 90 * 24 * 60 * 60 * 1000;
    else periodEnd = now + 365 * 24 * 60 * 60 * 1000;

    // Create invoice
    const invoiceId = await ctx.db.insert("invoices", {
      customerId: args.customerId,
      invoiceNumber: `INV-${args.customerId.slice(0, 8).toUpperCase()}-${Date.now()}`,
      periodStart,
      periodEnd,
      subtotalCents: monthlyPrice * 100,
      taxCents: 0, // TODO: tax calculation based on state
      totalCents: monthlyPrice * 100,
      currency: "USD",
      status: "open",
      paymentMethodType: "card",
      paidAt: null,
      lineItems: [
        {
          description: `${customer.tier.charAt(0).toUpperCase() + customer.tier.slice(1)} subscription`,
          quantity: 1,
          unitPriceCents: monthlyPrice * 100,
          amountCents: monthlyPrice * 100,
        },
      ],
      paymentIntentId: null,
      generatedAt: now,
      notes: `First billing cycle — ${args.billingCycle}`,
    });

    // Update customer
    await ctx.db.patch(args.customerId, {
      status: "active",
      billingCycle: args.billingCycle,
      activatedAt: now,
      currentPeriodStartsAt: periodStart,
      currentPeriodEndsAt: periodEnd,
    });

    // Record revenue event (for accounting)
    await ctx.db.insert("revenueEvents", {
      customerId: args.customerId,
      invoiceId,
      eventType: "contract_signed",
      amountCents: monthlyPrice * 100,
      recognizedAt: now,
      servicePeriodStart: periodStart,
      servicePeriodEnd: periodEnd,
      memo: "Subscription activation",
      createdAt: now,
      createdBy: "system",
    });

    return { invoiceId, monthlyPrice, periodEnd };
  },
});

// ─── DAILY METRICS AGGREGATION ─────────────────────────────────────────────
/**
 * Compute daily business snapshot (for executive dashboard).
 * Run via cron job each night at midnight.
 */
export const computeDailyMetrics = authMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const today = new Date(now).toISOString().slice(0, 10);

    // All active customers
    const activeCustomers = await ctx.db
      .query("customers")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // MRR = sum of monthly recurring revenue
    const mrrCents = activeCustomers.reduce((sum, c) => sum + c.monthlyRecurringRevenue * 100, 0);

    // ARR = 12 × MRR
    const arrCents = mrrCents * 12;

    // Active customer count
    const activeCount = activeCustomers.length;

    // New customers this month
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const newCustomers = activeCustomers.filter((c) => (c.activatedAt || 0) > thirtyDaysAgo).length;

    // Churned this month (status = churned AND churnedAt within last 30d)
    const churnedCustomers = await ctx.db
      .query("customers")
      .withIndex("by_status", (q) => q.eq("status", "churned"))
      .collect();

    // The 30-day filter the comment above describes was never written, and the
    // variable it should have produced (recentChurns) was referenced further
    // down without ever being defined — a ReferenceError at runtime, hidden by
    // @ts-nocheck. Every churn ever recorded would otherwise be counted as
    // "this month".
    const recentChurns = churnedCustomers.filter(
      (c: any) => (c.churnedAt || 0) > thirtyDaysAgo
    ).length;

    // ... rest of the function
    // Net retention (simplified — production would cohort-analyze)
    // TODO: implement cohort-based NRR
    const netRetentionPercentage = 105; // placeholder, assume slight expansion

    await ctx.db.insert("dailyMetrics", {
      date: today,
      mrrCents,
      arrCents,
      activeCustomers: activeCount,
      newCustomers,
      churnedCustomers: recentChurns,
      expansionMrrCents: 0,
      grossChurnCents: 0,
      netRetentionPercentage,
      cacCents: 0,
      quickRatio: 0,
      ltvCents: 0,
      mrrByTier: [0, 0, 0, 0], // TODO: segment
      mrrByState: [],
      recordedAt: now,
    });

    return { date: today };
  },
});

// ─── LIST ALL CUSTOMERS ─────────────────────────────────────────────────────
export const listCustomers = authQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("customers").order("desc", "createdAt").collect();
  },
});

// ─── LIST ALL LEADS ─────────────────────────────────────────────────────────
export const listLeads = authQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("leads").order("desc", "createdAt").collect();
  },
});

// ─── DAILY METRICS QUERY ─────────────────────────────────────────────────────
/**
 * Fetch historical daily metrics for dashboard charts.
 * Returns last N days of MRR, customer counts, and growth metrics.
 */
export const getDailyMetrics = authQuery({
  args: {
    days: v.optional(v.number()), // default 30
  },
  handler: async (ctx, args) => {
    const days = args.days ?? 30;
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    // Fetch metrics from the last N days, ordered by date ascending
    const metrics = await ctx.db
      .query("dailyMetrics")
      .withIndex("by_date", (q) => q.ge("date", cutoffDate))
      .order("asc", "date")
      .collect();

    return metrics;
  },
});

// ─── MRR BY TIER ─────────────────────────────────────────────────────────────
/**
 * Aggregate active customer MRR by pricing tier.
 * Used for donut/bar breakdown chart.
 */
export const getMrrByTier = authQuery({
  args: {},
  handler: async (ctx) => {
    const activeCustomers = await ctx.db
      .query("customers")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Group MRR by tier
    const tierMap: Record<string, number> = {};
    for (const c of activeCustomers) {
      const tier = (c.tier as string) || "UNKNOWN";
      tierMap[tier] = (tierMap[tier] || 0) + c.monthlyRecurringRevenue;
    }

    // Convert to array sorted by MRR descending
    const result = Object.entries(tierMap)
      .map(([tier, mrr]) => ({ tier, mrrCents: mrr * 100 }))
      .sort((a, b) => b.mrrCents - a.mrrCents);

    return result;
  },
});

// ─── MRR BY STATE ─────────────────────────────────────────────────────────────
/**
 * Aggregate active customer MRR by primary state.
 * Returns top N states for geographic breakdown.
 */
export const getMrrByState = authQuery({
  args: {
    limit: v.optional(v.number()), // default top 10
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    const activeCustomers = await ctx.db
      .query("customers")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Group MRR by state
    const stateMap: Record<string, number> = {};
    for (const c of activeCustomers) {
      const state = c.primaryState || "UNKNOWN";
      stateMap[state] = (stateMap[state] || 0) + c.monthlyRecurringRevenue;
    }

    // Sort and take top N
    const result = Object.entries(stateMap)
      .map(([state, mrr]) => ({ state, mrrCents: mrr * 100 }))
      .sort((a, b) => b.mrrCents - a.mrrCents)
      .slice(0, limit);

    return result;
  },
});

// ─── CUSTOMER GROWTH TIMELINE ─────────────────────────────────────────────────
/**
 * Daily new vs churned customers over time.
 * Used in area chart for acquisition velocity.
 */
export const getCustomerGrowth = authQuery({
  args: {
    days: v.optional(v.number()), // default 30
  },
  handler: async (ctx, args) => {
    const days = args.days ?? 30;
    const cutoffMs = Date.now() - days * 24 * 60 * 60 * 1000;

    // Get activations (activatedAt within period)
    const activeInPeriod = await ctx.db
      .query("customers")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Build daily buckets
    const buckets: Record<
      string,
      { date: string; newCount: number; churnedCount: number }
    > = {};

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateKey = d.toISOString().slice(0, 10);
      buckets[dateKey] = { date: dateKey, newCount: 0, churnedCount: 0 };
    }

    for (const c of activeInPeriod) {
      if (c.activatedAt && c.activatedAt > cutoffMs) {
        const dateKey = new Date(c.activatedAt).toISOString().slice(0, 10);
        if (buckets[dateKey]) buckets[dateKey].newCount += 1;
      }
      if (c.churnedAt && c.churnedAt > cutoffMs) {
        const dateKey = new Date(c.churnedAt).toISOString().slice(0, 10);
        if (buckets[dateKey]) buckets[dateKey].churnedCount += 1;
      }
    }

    return Object.values(buckets).sort((a, b) => a.date.localeCompare(b.date));
  },
});

// ─── STRIPE: MARK SUBSCRIPTION ACTIVE ──────────────────────────────────────
export const markSubscriptionActive = authMutation({
  args: {
    customerId: v.id("customers"),
    stripeSubscriptionId: v.string(),
  },
  handler: async (ctx, args) => {
    const customer = await ctx.db.get("customers", args.customerId);
    if (!customer) throw new Error("Customer not found");

    await ctx.db.patch("customers", args.customerId, {
      stripeSubscriptionId: args.stripeSubscriptionId,
      status: "active",
      activatedAt: Date.now(),
      cancelAtPeriodEnd: false,
      currentPeriodStart: Date.now(),
      // Rough estimate: subscription likely starts now, set end based on billingCycle
      currentPeriodEnd:
        customer.billingCycle === "ANNUALLY"
          ? Date.now() + 365 * 24 * 60 * 60 * 1000
          : customer.billingCycle === "QUARTERLY"
            ? Date.now() + 90 * 24 * 60 * 60 * 1000
            : Date.now() + 30 * 24 * 60 * 60 * 1000,
    });

    // Create first invoice record
    await ctx.db.insert("invoices", {
      customerId: args.customerId,
      stripeInvoiceId: `initial_${args.stripeSubscriptionId}`,
      amountCents: Math.round(customer.monthlyRecurringRevenue),
      status: "paid",
      periodStart: Date.now(),
      periodEnd:
        customer.billingCycle === "ANNUALLY"
          ? Date.now() + 365 * 24 * 60 * 60 * 1000
          : customer.billingCycle === "QUARTERLY"
            ? Date.now() + 90 * 24 * 60 * 60 * 1000
            : Date.now() + 30 * 24 * 60 * 60 * 1000,
      createdAt: Date.now(),
    });
  },
});

// ─── STRIPE: RECORD PAYMENT ────────────────────────────────────────────────
export const recordPayment = authMutation({
  args: {
    stripeSubscriptionId: v.string(),
    amount: v.number(),
    invoiceId: v.string(),
    periodStart: v.number(),
    periodEnd: v.number(),
  },
  handler: async (ctx, args) => {
    // Find customer by stripeSubscriptionId
    const customers = await ctx.db
      .query("customers").filter(q => q.eq("stripeSubscriptionId", args.stripeSubscriptionId))
      .first();
    if (!customers) throw new Error("Customer not found");

    const customerId = customers._id;

    await ctx.db.insert("invoices", {
      customerId,
      stripeInvoiceId: args.invoiceId,
      amountCents: args.amount,
      status: "paid",
      periodStart: args.periodStart,
      periodEnd: args.periodEnd,
      createdAt: Date.now(),
    });

    await ctx.db.patch("customers", customerId, {
      currentPeriodStart: args.periodStart,
      currentPeriodEnd: args.periodEnd,
    });
  },
});

// ─── STRIPE: MARK CUSTOMER CHURNED ────────────────────────────────────────
export const markCustomerChurned = authMutation({
  args: { stripeSubscriptionId: v.string() },
  handler: async (ctx, args) => {
    const customers = await ctx.db
      .query("customers").filter(q => q.eq("stripeSubscriptionId", args.stripeSubscriptionId))
      .first();
    if (!customers) throw new Error("Customer not found");

    await ctx.db.patch("customers", customers._id, {
      status: "churned",
      cancelAtPeriodEnd: true,
    });
  },
});
