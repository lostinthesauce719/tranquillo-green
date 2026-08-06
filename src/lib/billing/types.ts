import "server-only";

/**
 * Provider-agnostic billing contract.
 *
 * Cannabis-adjacent businesses get dropped by mainstream card processors with
 * little notice, so the processor is treated as a swappable component rather
 * than a hard dependency. Everything above this interface — routes, UI, Convex
 * mutations — is written against these types, not against any one vendor's SDK.
 */

export type BillingCycle = "monthly" | "quarterly" | "annually";

export interface CheckoutRequest {
  billingCycle: BillingCycle;
  customerId?: string;
  customerEmail?: string;
  companyName?: string;
  successUrl: string;
  cancelUrl: string;
}

export type CheckoutResult =
  /** Provider hosts a payment page; send the browser there. */
  | { kind: "redirect"; url: string }
  /** No card rail: the request is recorded and a human follows up to invoice. */
  | { kind: "invoice_requested"; reference: string; message: string };

/**
 * Normalized subscription lifecycle events. Providers translate their own
 * webhook payloads into these so downstream handling never branches on vendor.
 */
export type BillingEvent =
  | { type: "subscription_activated"; customerId?: string; subscriptionId: string }
  | {
      type: "payment_succeeded";
      subscriptionId: string;
      amount: number;
      invoiceId?: string;
      periodStart?: number;
      periodEnd?: number;
    }
  | { type: "subscription_cancelled"; subscriptionId: string }
  | { type: "ignored"; raw: string };

export interface BillingProvider {
  /** Stable identifier, surfaced in errors and logs. */
  readonly id: string;
  /** Whether required credentials are present. */
  isConfigured(): boolean;
  createCheckout(request: CheckoutRequest): Promise<CheckoutResult>;
  /**
   * Verifies the signature and returns a normalized event.
   * Must throw when the signature is absent or invalid — an unverified webhook
   * is an unauthenticated request that can mutate subscription state.
   */
  parseWebhook(rawBody: string, headers: Headers): Promise<BillingEvent>;
}
