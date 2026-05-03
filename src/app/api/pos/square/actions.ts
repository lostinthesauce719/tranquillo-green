"use server";

import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
import { anyApi } from "convex/server";
import { SquareClient } from "@/lib/integrations/square/client";

import type { SquarePayment } from "@/lib/integrations/square/client";

export async function connectSquare(
  input: {
    companyId: string;
    accessToken?: string;
    refreshToken?: string;
    merchantId?: string;
    locationId?: string;
    expiresAt?: number;
    refreshExpiresAt?: number;
    sandbox?: boolean;
  }
): Promise<{ success: boolean; error?: string; storeName?: string }> {
  // Use sandbox mode when tokens are missing or explicitly flagged
  if (input.sandbox || !input.accessToken) {
    try {
      const convex = await getAuthenticatedConvexClient();
      if (!convex) throw new Error("Convex client unavailable");
      await convex.mutation(
        (anyApi as any).integrationConfigs.upsertSquareConfig,
        {
          companyId: input.companyId,
          accessToken: input.accessToken || "demo_token",
          refreshToken: input.refreshToken || "",
          accessTokenExpiresAt: input.expiresAt || 0,
          refreshTokenExpiresAt: input.refreshExpiresAt || 0,
          realmId: input.merchantId,
          locationId: input.locationId,
        }
      );
    } catch (e) {
      console.error("Failed to save demo Square config", e);
    }
    return { success: true, storeName: "Demo Store (Sandbox)" };
  }

  // Real OAuth credentials: validate by fetching locations
  try {
    const client = new SquareClient({
      accessToken: input.accessToken!,
      environment: "production",
      locationId: input.locationId,
    });

    const locations = await client.listLocations();
    const primary = locations[0];
    const storeName = primary?.name || "Square Store";

    const convex = await getAuthenticatedConvexClient();
    if (!convex) throw new Error("Convex client unavailable");
    await convex.mutation(
      (anyApi as any).integrationConfigs.upsertSquareConfig,
      {
        companyId: input.companyId,
        accessToken: input.accessToken,
        refreshToken: input.refreshToken ?? "",
        accessTokenExpiresAt: input.expiresAt ?? 0,
        refreshTokenExpiresAt: input.refreshExpiresAt ?? 0,
        realmId: input.merchantId,
        locationId: input.locationId ?? primary?.id,
      }
    );

    return { success: true, storeName };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Sync recent Square payments into the ledger.
 * Creates GL transactions (pos_import) and basic line entries:
 *   - Debit cash / credit revenue for each order/line item.
 */
export async function syncSquare(
  input: {
    companyId: string;
    beginTime?: string;
    endTime?: string;
    sandbox?: boolean;
    accessToken?: string; // override for testing
    locationId?: string;
  }
): Promise<{
  success: boolean;
  transactionsCreated?: number;
  errors?: string[];
  message?: string;
}> {
  const companyId = input.companyId;
  const convex = await getAuthenticatedConvexClient();
  if (!convex) return { success: false, errors: ["Convex client unavailable"] };

  // Parse date range
  const begin = input.beginTime ? new Date(input.beginTime) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const end = input.endTime ? new Date(input.endTime) : new Date();

  // Get Square config (tokens + location)
  const configs = await convex.query(
    (anyApi as any).integrationConfigs.getSquareConfigsInternal,
    { companyId }
  );
  let config = configs[0];

  let client: SquareClient;

  if (input.accessToken) {
    // Override credentials (useful for demo or testing)
    client = new SquareClient({
      accessToken: input.accessToken,
      environment: input.sandbox ? "sandbox" : "production",
      locationId: input.locationId || config?.posLocationId,
    });
  } else if (config) {
    // Assume sandbox if token looks like demo token; otherwise production
    const isDemo = config.accessToken.startsWith("demo") || config.accessToken.length < 20;
    client = new SquareClient({
      accessToken: config.accessToken,
      environment: isDemo ? "sandbox" : "production",
      locationId: config.posLocationId,
    });
  } else {
    return { success: false, errors: ["No Square configuration found. Please connect Square first."] };
  }

  // In sandbox or demo token mode, return deterministic mock payments
  if (input.sandbox || client["accessToken"].startsWith("demo")) {
    const payments = await SquareClient.demoPayments();
    return await processSquarePayments(convex, companyId, payments);
  }

  const payments = await client.listRecentPayments(begin, end);
  return await processSquarePayments(convex, companyId, payments);
}

/**
 * Process Square payment objects and create GL transactions.
 */
async function processSquarePayments(
  convex: any,
  companyId: string,
  payments: SquarePayment[]
): Promise<{ success: boolean; transactionsCreated: number; errors: string[] }> {
  const errors: string[] = [];

  // Resolve chart accounts
  const chart = await convex.query((anyApi as any).chartOfAccounts.listByCompany, {
    companyId,
  });
  const codeToAccountId = new Map<string, string>();
  chart.forEach((acct: any) => codeToAccountId.set(acct.code, acct._id));

  const getAccountId = (code: string) => codeToAccountId.get(code) || null;

  // Default codes from seeded chart (these should exist on every company)
  const CASH_CODE = "1010";
  const REVENUE_CODE = "4010";

  // Get default location (first)
  const locations = await convex.query((anyApi as any).cannabisLocations.listByCompany, {
    companyId,
  });
  const defaultLocationId = locations[0]?._id;

  // Get open reporting period
  const periods = await convex.query((anyApi as any).reportingPeriods.listByCompany, {
    companyId,
  });
  const openPeriod = periods.find((p: any) => p.status === "open") || periods[0];
  const periodId = openPeriod?._id;

  let createdCount = 0;

  for (const payment of payments as any[]) {
    const createdAt = new Date(payment.createdAt);
    const dateStr = createdAt.toISOString().split("T")[0];
    const externalRef = `square:${payment.id}`;
    const amountCents = payment.amountMoney.amount;
    const amount = amountCents / 100; // USD

    // Split items
    const order = payment.order;
    const lineItems = order?.lineItems || [];

    if (lineItems.length === 0) {
      // No items: treat whole amount as one revenue transaction
      const txId = await createTransaction(convex, anyApi, {
        companyId,
        periodId,
        locationId: defaultLocationId,
        date: dateStr,
        amount,
        direction: "inflow",
        activity: "retail" as const,
        source: "pos_import" as const,
        sourceLabel: "Square",
        externalRef,
        reference: payment.note || "",
        memo: `Square payment ${payment.id}`,
        lines: [
          { accountCode: CASH_CODE, debit: amount, credit: 0, memo: "Cash receipt" },
          { accountCode: REVENUE_CODE, debit: 0, credit: amount, memo: "Sales revenue" },
        ],
        getAccountId,
      });
      if (txId) createdCount++;
    } else {
      // Create one transaction per line item (proportional to item amount)
      for (const item of lineItems) {
        const qty = parseFloat(item.quantity) || 1;
        const unitPrice = (item.basePriceMoney?.amount || 0) / 100;
        let itemAmount = qty * unitPrice;
        if (item.modifiers) {
          for (const mod of item.modifiers) {
            itemAmount += (mod.basePriceMoney?.amount || 0) / 100;
          }
        }

        const lineRef = `${externalRef}:${item.uid}`;
        const txId = await createTransaction(convex, anyApi, {
          companyId,
          periodId,
          locationId: defaultLocationId,
          date: dateStr,
          amount: itemAmount,
          direction: "inflow",
          activity: "retail" as const,
          source: "pos_import" as const,
          sourceLabel: "Square",
          externalRef: lineRef,
          reference: item.name,
          memo: `Square sale – ${item.name} ×${qty}`,
          lines: [
            { accountCode: CASH_CODE, debit: itemAmount, credit: 0 },
            { accountCode: REVENUE_CODE, debit: 0, credit: itemAmount },
          ],
          getAccountId,
        });
        if (txId) createdCount++;
      }
    }
  }

  return { success: true, transactionsCreated: createdCount, errors: [] };
}

/**
 * Helper to create a transaction header and its lines.
 */
async function createTransaction(
  convex: any,
  anyApi: any,
  {
    companyId,
    periodId,
    locationId,
    date,
    amount,
    direction,
    activity,
    source,
    sourceLabel,
    externalRef,
    reference,
    memo,
    lines,
    getAccountId,
  }: {
    companyId: string;
    periodId?: string;
    locationId?: string;
    date: string; // YYYY-MM-DD
    amount: number;
    direction: "inflow" | "outflow";
    activity: "retail" | "manufacturing" | "distribution" | "admin";
    source: string;
    sourceLabel?: string;
    externalRef: string;
    reference?: string;
    memo?: string;
    lines: Array<{ accountCode: string; debit: number; credit: number; memo?: string }>;
    getAccountId: (code: string) => string | null;
  }
): Promise<string | null> {
  const tx = await convex.mutation(
    (anyApi as any).transactions.upsert,
    {
      companyId,
      periodId,
      locationId,
      transactionDate: date,
      source,
      sourceLabel,
      memo,
      status: "posted" as const,
      workflowStatus: "posted" as const,
      externalRef,
      reference,
      amount,
      direction,
      activity,
    }
  );

  if (!tx) return null;

  // Build transaction lines referencing chart accounts
  const lineInputs = lines
    .map((l) => {
      const accountId = getAccountId(l.accountCode);
      if (!accountId) {
        console.error(`Account code ${l.accountCode} not found`);
        return null;
      }
      return {
        accountId,
        debit: l.debit || undefined,
        credit: l.credit || undefined,
        locationId,
        memo: l.memo,
      };
    })
    .filter(Boolean) as any[];

  if (lineInputs.length > 0) {
    await convex.mutation(
      (anyApi as any).transactionLines.replaceForTransaction,
      {
        transactionId: tx._id,
        lines: lineInputs,
      }
    );
  }

  return tx._id;
}

/**
 * Get Square connection status for UI.
 */
export async function getSquareStatus(companyId: string) {
  const convex = await getAuthenticatedConvexClient();
  if (!convex) return { connected: false };
  const configs = await convex.query(
    (anyApi as any).integrationConfigs.getSquareConfigsInternal,
    { companyId }
  );
  const config = configs[0];
  if (!config) return { connected: false, status: "not_connected" };
  return {
    connected: true,
    status: config.status,
    connectedAt: config.connectedAt,
    locationId: config.posLocationId,
    needsRefresh: config.accessTokenExpiresAt < Date.now() + 5 * 60 * 1000,
  };
}

/**
 * Disconnect Square configuration.
 */
export async function disconnectSquare(companyId: string) {
  const convex = await getAuthenticatedConvexClient();
  if (!convex) return { success: false };
  await convex.mutation(
    (anyApi as any).integrationConfigs.disconnectSquare,
    { companyId }
  );
  return { success: true };
}
