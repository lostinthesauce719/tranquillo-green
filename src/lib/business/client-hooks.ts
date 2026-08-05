/**
 * Client-side business operations (no codegen dependency)
 * Uses direct convex client calls — works even before _generated/api exists.
 */

"use client";

import { useCallback } from "react";
import { convex } from "@/lib/convex/client";

// ─── LEAD CAPTURE ───────────────────────────────────────────────────────────
export function useLeadCapture() {
  return useCallback(
    async (data: Record<string, any>) => {
      try {
        const result = await (convex as any).mutation("business/captureLead" as any, {
          companyName: data.companyName,
          contactName: data.contactName,
          email: data.email,
          phone: data.phone || null,
          operatorType: data.operatorType,
          state: data.state,
          monthlyRevenueRange: data.monthlyRevenueRange || null,
          bookkeepingMethod: data.bookkeepingMethod || null,
          painPoints: data.painPoints || [],
          acquisitionSource: data.acquisitionSource || "landing_page",
          utmSource: data.utm_source || null,
          utmMedium: data.utm_medium || null,
          utmCampaign: data.utm_campaign || null,
          referrer: data.referrer || null,
        });
        return result;
      } catch (error) {
        console.error("Lead capture failed:", error);
        throw error;
      }
    },
    [],
  );
}

// ─── PROPOSAL GENERATION ────────────────────────────────────────────────────
export function useGenerateProposal() {
  return useCallback(
    async (leadId: string) => {
      try {
        return await (convex as any).query("business/generateProposal" as any, { leadId });
      } catch (error) {
        console.error("Proposal generation failed:", error);
        throw error;
      }
    },
    [],
  );
}

// ─── TRIAL START ─────────────────────────────────────────────────────────────
export function useStartTrial() {
  return useCallback(
    async (leadId: string, tier: string, billingCycle: string) => {
      try {
        return await (convex as any).mutation("business/startTrial" as any, {
          leadId,
          selectedTier: tier,
          billingCycle,
        });
      } catch (error) {
        console.error("Trial start failed:", error);
        throw error;
      }
    },
    [],
  );
}

// ─── ACTIVATE SUBSCRIPTION ───────────────────────────────────────────────────
export function useActivateSubscription() {
  return useCallback(
    async (customerId: string, billingCycle: string) => {
      try {
        return await (convex as any).mutation("business/activateSubscription" as any, {
          customerId,
          billingCycle,
        });
      } catch (error) {
        console.error("Subscription activation failed:", error);
        throw error;
      }
    },
    [],
  );
}

// ─── FETCH CUSTOMER ──────────────────────────────────────────────────────────
export function useCustomer() {
  return useCallback(
    async (customerId: string) => {
      try {
        return await (convex as any).query("business/getCustomer" as any, { customerId });
      } catch (error) {
        console.error("Fetch customer failed:", error);
        return null;
      }
    },
    [],
  );
}

// ─── FETCH ACTIVE CUSTOMERS ──────────────────────────────────────────────────
export function useActiveCustomers() {
  return useCallback(async () => {
    try {
      return await (convex as any).query("business/listActiveCustomers", {});
    } catch (error) {
      console.error("Fetch customers failed:", error);
      return [];
    }
  }, []);
}

// ─── FETCH DAILY METRICS ─────────────────────────────────────────────────────
export function useDailyMetrics(days: number = 30) {
  return useCallback(async () => {
    try {
      return await (convex as any).query("business/getDailyMetrics" as any, { days });
    } catch (error) {
      console.error("Fetch metrics failed:", error);
      return [];
    }
  }, [days]);
}

// ─── FETCH ALL CUSTOMERS ─────────────────────────────────────────────────────
export function useAllCustomers() {
  return useCallback(async () => {
    try {
      // Use the type-safe Convex API from the generated types
      return await (convex as any).query("business/listCustomers", {});
    } catch (error) {
      console.error("Fetch all customers failed:", error);
      return [];
    }
  }, []);
}

// ─── FETCH ALL LEADS ─────────────────────────────────────────────────────────
export function useAllLeads() {
  return useCallback(async () => {
    try {
      return await (convex as any).query("business/listLeads", {});
    } catch (error) {
      console.error("Fetch all leads failed:", error);
      return [];
    }
  }, []);
}

// ─── FETCH DAILY METRICS (CHART DATA) ─────────────────────────────────────────
export function useFetchDailyMetrics(days: number = 30) {
  return useCallback(async () => {
    try {
      return await (convex as any).query("business/getDailyMetrics" as any, { days });
    } catch (error) {
      console.error("Fetch daily metrics failed:", error);
      return [];
    }
  }, [days]);
}

// ─── FETCH MRR BY TIER ─────────────────────────────────────────────────────────
export function useFetchMrrByTier() {
  return useCallback(async () => {
    try {
      return await (convex as any).query("business/getMrrByTier" as any, {});
    } catch (error) {
      console.error("Fetch MRR by tier failed:", error);
      return [];
    }
  }, []);
}

// ─── FETCH MRR BY STATE ─────────────────────────────────────────────────────────
export function useFetchMrrByState(limit: number = 10) {
  return useCallback(async () => {
    try {
      return await (convex as any).query("business/getMrrByState" as any, { limit });
    } catch (error) {
      console.error("Fetch MRR by state failed:", error);
      return [];
    }
  }, [limit]);
}

// ─── FETCH CUSTOMER GROWTH ──────────────────────────────────────────────────────
export function useFetchCustomerGrowth(days: number = 30) {
  return useCallback(async () => {
    try {
      return await (convex as any).query("business/getCustomerGrowth" as any, { days });
    } catch (error) {
      console.error("Fetch customer growth failed:", error);
      return [];
    }
  }, [days]);
}
