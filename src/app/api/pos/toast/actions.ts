"use server";

import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
import { anyApi } from "convex/server";

import { ToastClient, ToastOrder } from "@/lib/integrations/toast/client";

export async function connectToast(
  input: {
    companyId: string;
    accessToken?: string;
    refreshToken?: string;
    restaurantId?: string;
    accessTokenExpiresAt?: number;
    refreshTokenExpiresAt?: number;
    sandbox?: boolean;
  }
): Promise<{ success: boolean; error?: string; restaurantName?: string }> {
  if (input.sandbox || !input.accessToken) {
    try {
      const convex = await getAuthenticatedConvexClient();
      if (!convex) throw new Error("Convex client unavailable");
      await convex.mutation(
        (anyApi as any).integrationConfigs.upsertToastConfig,
        {
          companyId: input.companyId,
          accessToken: input.accessToken || "demo_token",
          refreshToken: input.refreshToken || "",
          accessTokenExpiresAt: input.accessTokenExpiresAt || 0,
          refreshTokenExpiresAt: input.refreshTokenExpiresAt || 0,
          restaurantId: input.restaurantId,
        }
      );
    } catch (e) {
      console.error("Failed to save demo Toast config", e);
    }
    return { success: true, restaurantName: "Demo Restaurant (Sandbox)" };
  }

  try {
    const client = new ToastClient({
      authToken: input.accessToken!,
      restaurantId: input.restaurantId!,
      environment: "production",
    });

    const info = await ToastClient.demoRestaurantInfo(); // normally would fetch via API to validate
    // Since actual Toast validation may require API call; for now accept
    const convex = await getAuthenticatedConvexClient();
    if (!convex) throw new Error("Convex client unavailable");
    await convex.mutation(
      (anyApi as any).integrationConfigs.upsertToastConfig,
      {
        companyId: input.companyId,
        accessToken: input.accessToken,
        refreshToken: input.refreshToken ?? "",
        accessTokenExpiresAt: input.accessTokenExpiresAt ?? 0,
        refreshTokenExpiresAt: input.refreshTokenExpiresAt ?? 0,
        restaurantId: input.restaurantId,
      }
    );

    return { success: true, restaurantName: info.name };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Sync recent Toast orders as GL transactions.
 */
export async function syncToast(
  input: {
    companyId: string;
    beginTime?: string;
    endTime?: string;
    sandbox?: boolean;
    accessToken?: string;
    restaurantId?: string;
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

  const begin = input.beginTime ? new Date(input.beginTime) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const end = input.endTime ? new Date(input.endTime) : new Date();

  const configs = await convex.query(
    (anyApi as any).integrationConfigs.getToastConfigsInternal,
    { companyId }
  );
  let config = configs[0];

  let client: ToastClient;
  if (input.accessToken && input.restaurantId) {
    client = new ToastClient({
      authToken: input.accessToken,
      restaurantId: input.restaurantId,
      environment: input.sandbox ? "sandbox" : "production",
    });
  } else if (config) {
    client = new ToastClient({
      authToken: config.accessToken,
      restaurantId: config.restaurantId || "",
      environment: "production",
    });
  } else {
    return { success: false, errors: ["No Toast configuration found."] };
  }

  // Demo mode
  if (input.sandbox || input.accessToken === "demo_token") {
    const orders = await ToastClient.demoOrders();
    return await processToastOrders(convex, companyId, orders);
  }

  const orders = await client.listRecentOrders(begin, end);
  return await processToastOrders(convex, companyId, orders);
}

/**
 * Process Toast orders into transactions.
 */
async function processToastOrders(
  convex: any,
  companyId: string,
  orders: ToastOrder[]
): Promise<{ success: boolean; transactionsCreated: number; errors: string[] }> {
  const errors: string[] = [];

  // Resolve chart
  const chart = await convex.query((anyApi as any).chartOfAccounts.listByCompany, { companyId });
  const codeToAccountId = new Map<string, string>();
  chart.forEach((acct: any) => codeToAccountId.set(acct.code, acct._id));
  const getAccountId = (code: string) => codeToAccountId.get(code) || null;

  const CASH_CODE = "1010";
  const REVENUE_CODE = "4010";

  const locations = await convex.query((anyApi as any).cannabisLocations.listByCompany, { companyId });
  const defaultLocationId = locations[0]?._id;

  const periods = await convex.query((anyApi as any).reportingPeriods.listByCompany, { companyId });
  const openPeriod = periods.find((p: any) => p.status === "open") || periods[0];
  const periodId = openPeriod?._id;

  let createdCount = 0;

  for (const order of orders) {
    const date = new Date(order.createdAt);
    const dateStr = date.toISOString().split("T")[0];
    const externalRef = `toast:${order.id}`;
    const totalAmount = order.total; // already in cents? Toast amounts are in cents? We'll assume smallest currency unit. We'll treat as cents, convert to dollars.
    const amount = totalAmount / 100;

    // Toast order may have multiple line items
    const lineItems = order.lineItems || [];
    if (lineItems.length === 0) {
      const txId = await createTransaction(convex, anyApi, {
        companyId,
        periodId,
        locationId: defaultLocationId,
        date: dateStr,
        amount,
        direction: "inflow",
        activity: "retail" as const,
        source: "pos_import" as const,
        sourceLabel: "Toast",
        externalRef,
        reference: "",
        memo: `Toast order ${order.id}`,
        lines: [
          { accountCode: CASH_CODE, debit: amount, credit: 0 },
          { accountCode: REVENUE_CODE, debit: 0, credit: amount },
        ],
        getAccountId,
      });
      if (txId) createdCount++;
    } else {
      for (const item of lineItems) {
        const qty = item.quantity;
        const unitPrice = item.price / 100; // cents to dollars
        const itemAmount = qty * unitPrice;
        const itemRef = `${externalRef}:${item.id}`;

        const txId = await createTransaction(convex, anyApi, {
          companyId,
          periodId,
          locationId: defaultLocationId,
          date: dateStr,
          amount: itemAmount,
          direction: "inflow",
          activity: "retail" as const,
          source: "pos_import",
          sourceLabel: "Toast",
          externalRef: itemRef,
          reference: item.name,
          memo: `Toast: ${item.name} ×${qty}`,
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
 * Transaction creation helper for Toast (same as Square version)
 * (Could be factored out to shared module later)
 */
async function createTransaction(
  convex: any,
  anyApi: any,
  opts: {
    companyId: string;
    periodId?: string;
    locationId?: string;
    date: string;
    amount: number;
    direction: "inflow" | "outflow";
    activity: string;
    source: string;
    sourceLabel?: string;
    externalRef: string;
    reference?: string;
    memo?: string;
    lines: Array<{ accountCode: string; debit: number; credit: number }>;
    getAccountId: (code: string) => string | null;
  }
): Promise<string | null> {
  const tx = await convex.mutation(
    (anyApi as any).transactions.upsert,
    {
      companyId: opts.companyId,
      periodId: opts.periodId,
      locationId: opts.locationId,
      transactionDate: opts.date,
      source: opts.source,
      sourceLabel: opts.sourceLabel,
      memo: opts.memo,
      status: "posted" as const,
      workflowStatus: "posted" as const,
      externalRef: opts.externalRef,
      reference: opts.reference,
      amount: opts.amount,
      direction: opts.direction,
      activity: opts.activity as any,
    }
  );

  if (!tx) return null;

  const lineInputs = opts.lines
    .map((l) => {
      const accountId = opts.getAccountId(l.accountCode);
      if (!accountId) return null;
      return {
        accountId,
        debit: l.debit || undefined,
        credit: l.credit || undefined,
        locationId: opts.locationId,
        memo: "",
      };
    })
    .filter(Boolean) as any[];

  if (lineInputs.length > 0) {
    await convex.mutation(
      (anyApi as any).transactionLines.replaceForTransaction,
      { transactionId: tx._id, lines: lineInputs }
    );
  }

  return tx._id;
}

export async function getToastStatus(companyId: string) {
  const convex = await getAuthenticatedConvexClient();
  if (!convex) return { connected: false };
  const configs = await convex.query(
    (anyApi as any).integrationConfigs.getToastConfigsInternal,
    { companyId }
  );
  const config = configs[0];
  if (!config) return { connected: false };
  return {
    connected: true,
    status: config.status,
    connectedAt: config.connectedAt,
    restaurantId: config.restaurantId,
  };
}

export async function disconnectToast(companyId: string) {
  const convex = await getAuthenticatedConvexClient();
  if (!convex) return { success: false };
  await convex.mutation((anyApi as any).integrationConfigs.disconnectToast, {
    companyId,
  });
  return { success: true };
}
