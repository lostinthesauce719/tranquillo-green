import "server-only";

import type { BillingProvider } from "./types";
import { stripeProvider } from "./stripe-provider";
import { invoiceProvider } from "./invoice-provider";

export * from "./types";

const PROVIDERS: Record<string, BillingProvider> = {
  stripe: stripeProvider,
  invoice: invoiceProvider,
};

/**
 * Resolves the active billing provider from BILLING_PROVIDER.
 *
 * Defaults to "invoice" rather than a card processor: for a cannabis-adjacent
 * business, invoice/ACH is the rail least likely to be withdrawn, and a wrong
 * default should fail toward "a human sends a bill" rather than toward a
 * processor that may terminate the account.
 *
 * Swapping processors is a config change plus one new file implementing
 * BillingProvider — no route or UI changes.
 */
export function getBillingProvider(): BillingProvider {
  const configured = process.env.BILLING_PROVIDER?.trim().toLowerCase() || "invoice";
  const provider = PROVIDERS[configured];

  if (!provider) {
    throw new Error(
      `Unknown BILLING_PROVIDER "${configured}". Available: ${Object.keys(PROVIDERS).join(", ")}.`,
    );
  }
  return provider;
}

export function listBillingProviders(): string[] {
  return Object.keys(PROVIDERS);
}
