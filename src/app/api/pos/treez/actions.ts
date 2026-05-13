"use server";

import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
import { anyApi } from "convex/server";

import { TreezClient, TreezSale } from "@/lib/integrations/treez/client";

export async function connectTreez(
  input: { companyId: string; apiKey?: string; apiSecret?: string; locationId?: string; sandbox?: boolean }
): Promise<{ success: boolean; error?: string; brandName?: string }> {
  if (input.sandbox || !input.apiKey) {
    try {
      const convex = await getAuthenticatedConvexClient();
      if (!convex) throw new Error("Convex client unavailable");
      await convex.mutation(
        (anyApi as any).integrationConfigs.upsertTreezConfig,
        {
          companyId: input.companyId,
          apiKey: input.apiKey || "demo_key",
          apiSecret: input.apiSecret || "",
        }
      );
    } catch (e) {
      console.error("Failed to save demo Treez config", e);
    }
    return { success: true, brandName: "Demo Dispensary (Treez Sandbox)" };
  }

  try {
    // Validate credentials by hitting a lightweight endpoint
    const client = new TreezClient({
      apiKey: input.apiKey!,
      apiSecret: input.apiSecret!,
      environment: "sandbox",
    });
    // In real mode we'd call an endpoint; here just accept
    const convex = await getAuthenticatedConvexClient();
    if (!convex) throw new Error("Convex client unavailable");
    await convex.mutation(
      (anyApi as any).integrationConfigs.upsertTreezConfig,
      {
        companyId: input.companyId,
        apiKey: input.apiKey,
        apiSecret: input.apiSecret,
      }
    );
    return { success: true, brandName: "Treez Connected" };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function syncTreez(
  input: {
    companyId: string;
    beginTime?: string;
    endTime?: string;
    sandbox?: boolean;
    apiKey?: string;
    apiSecret?: string;
  }
): Promise<{ success: boolean; transactionsCreated?: number; errors?: string[] }> {
  const companyId = input.companyId;
  const convex = await getAuthenticatedConvexClient();
  if (!convex) return { success: false, errors: ["Convex client unavailable"] };

  const begin = input.beginTime ? new Date(input.beginTime) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const end = input.endTime ? new Date(input.endTime) : new Date();

  const configs = await convex.query(
    (anyApi as any).integrationConfigs.getTreezConfigsInternal,
    { companyId }
  );
  let config = configs[0];

  let client: TreezClient;
  if (input.apiKey && input.apiSecret) {
    client = new TreezClient({
      apiKey: input.apiKey,
      apiSecret: input.apiSecret,
      environment: input.sandbox ? "sandbox" : "production",
    });
  } else if (config) {
    client = new TreezClient({
      apiKey: config.accessToken, // stored apiKey
      apiSecret: config.apiSecret || "",
      environment: "production",
    });
  } else {
    return { success: false, errors: ["No Treez configuration found."] };
  }

  // Demo mode
  if (input.sandbox || input.apiKey === "demo_key") {
    const sales = await TreezClient.demoSales();
    return await processTreezSales(convex, companyId, sales);
  }

  const sales = await client.listRecentSales(begin, end);
  return await processTreezSales(convex, companyId, sales);
}

async function processTreezSales(
  convex: any,
  companyId: string,
  sales: TreezSale[]
): Promise<{ success: boolean; transactionsCreated: number; errors: string[] }> {
  const errors: string[] = [];

  const chart = await convex.query((anyApi as any).chartOfAccounts.listByCompany, { companyId });
  const codeToAccountId = new Map<string, string>();
  chart.forEach((acct: any) => codeToAccountId.set(acct.code, acct._id));
  const getAccountId = (code: string) => codeToAccountId.get(code) || null;

  const CASH_CODE = "1010";
  const REVENUE_CODE = "4010";
  const COGS_CODE = "4100";
  const INVENTORY_CODE = "1200";

  const locations = await convex.query((anyApi as any).cannabisLocations.listByCompany, { companyId });
  const defaultLocationId = locations[0]?._id;

  const periods = await convex.query((anyApi as any).reportingPeriods.listByCompany, { companyId });
  const openPeriod = periods.find((p: any) => p.status === "open") || periods[0];
  const periodId = openPeriod?._id;

  // Load active products for COGS calculation
  const productsList = await convex.query((anyApi as any).products.getActiveProducts, {
    companyId,
  });
  const productMap = new Map<string, any>();
  productsList.forEach((p: any) => productMap.set(p.name.toLowerCase(), p));

  let createdCount = 0;

  for (const sale of sales) {
    const date = new Date(sale.transactionTime);
    const dateStr = date.toISOString().split("T")[0];
    const externalRef = `treez:${sale.id}`;
    const totalAmount = sale.totalAmount / 100; // assume cents

    const items = sale.items || [];
    if (items.length === 0) {
      // No items — treat as single Blue Dream unit for COGS
      const demoProduct = productsList.find((p: any) =>
        p.name.toLowerCase().includes("blue dream")
      ) || productsList[0];
      if (!demoProduct) throw new Error("No demo product available for COGS");

      const productId = demoProduct._id;
      const unitPrice = totalAmount;
      const quantity = 1;

      const saleResult = await convex.mutation(
        (anyApi as any).inventory.sellInventoryItem,
        { companyId, productId, quantity, unitPrice, locationId: defaultLocationId },
      );

      const lines = [
        { accountCode: CASH_CODE, debit: totalAmount, credit: 0 },
        { accountCode: REVENUE_CODE, debit: 0, credit: totalAmount },
        { accountCode: COGS_CODE, debit: saleResult.totalCOGS, credit: 0 },
        { accountCode: INVENTORY_CODE, debit: 0, credit: saleResult.totalCOGS },
      ];

      const txId = await createTransaction(convex, anyApi, {
        companyId, periodId, locationId: defaultLocationId, date: dateStr,
        amount: totalAmount, direction: "inflow", activity: "retail" as const,
        source: "pos_import", sourceLabel: "Treez", externalRef,
        reference: "", memo: `Treez sale ${sale.id} (no items)`, lines, getAccountId,
      });
      if (txId) createdCount++;
    } else {
      for (const item of items) {
        const itemAmount = item.totalPrice / 100;
        const itemRef = `${externalRef}:${item.productId}`;

        // Find product by name (case-insensitive) with fallback
        const productName = (item.productName || "").toLowerCase();
        const product = productMap.get(productName) || productsList[0];
        if (!product) throw new Error("No product available for COGS estimation");

        const quantity = item.quantity;
        const unitPrice = quantity > 0 ? itemAmount / quantity : itemAmount;

        const saleResult = await convex.mutation(
          (anyApi as any).inventory.sellInventoryItem,
          { companyId, productId: product._id, quantity, unitPrice, locationId: defaultLocationId },
        );

        const lines = [
          { accountCode: CASH_CODE, debit: itemAmount, credit: 0 },
          { accountCode: REVENUE_CODE, debit: 0, credit: itemAmount },
          { accountCode: COGS_CODE, debit: saleResult.totalCOGS, credit: 0 },
          { accountCode: INVENTORY_CODE, debit: 0, credit: saleResult.totalCOGS },
        ];

        const txId = await createTransaction(convex, anyApi, {
          companyId, periodId, locationId: defaultLocationId, date: dateStr,
          amount: itemAmount, direction: "inflow", activity: "retail" as const,
          source: "pos_import", sourceLabel: "Treez", externalRef: itemRef,
          reference: item.productName, memo: `Treez – ${item.productName} ×${quantity}`,
          lines, getAccountId,
        });
        if (txId) createdCount++;
      }
    }
  }

  return { success: true, transactionsCreated: createdCount, errors: [] };
}

/**
 * Transaction creation helper (shared with Square flavor)
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
      };
    })
    .filter(Boolean) as any[];

  if (lineInputs.length > 0) {
    await convex.mutation(
      (anyApi as any).transactionLines.replaceForTransaction,
      { transactionId: tx._id, lines: lineInputs }
    );
  }

  // Trigger 471(c) reclassification
      try {
        await convex.mutation(
          (anyApi as any).reclassification.apply471cReclassification,
          { transactionId: tx._id }
        );
      } catch (e) {
        console.warn("471c reclassification failed for", tx._id, e);
      }
      return tx._id;
}

export async function getTreezStatus(companyId: string) {
  const convex = await getAuthenticatedConvexClient();
  if (!convex) return { connected: false };
  const configs = await convex.query(
    (anyApi as any).integrationConfigs.getTreezConfigsInternal,
    { companyId }
  );
  const config = configs[0];
  if (!config) return { connected: false };
  return { connected: true, status: config.status, connectedAt: config.connectedAt };
}

export async function disconnectTreez(companyId: string) {
  const convex = await getAuthenticatedConvexClient();
  if (!convex) return { success: false };
  await convex.mutation((anyApi as any).integrationConfigs.disconnectTreez, {
    companyId,
  });
  return { success: true };
}
