
/**
 * Square POS Integration Client
 *
 * Supports sandbox and production environments. Includes demo mode fallback
 * for local development without live API credentials.
 */

export type SquarePayment = {
  id: string;
  amountMoney: { amount: number; currency: string };
  createdAt: string;
  note?: string;
  orderId?: string;
  order?: {
    id: string;
    referenceId?: string;
    lineItems?: Array<{
      uid: string;
      name: string;
      quantity: string;
      basePriceMoney: { amount: number; currency: string };
      modifiers?: Array<{ name: string; basePriceMoney?: { amount: number } }>;
    }>;
  };
};

export type SquareLocation = {
  id: string;
  name: string;
};

export class SquareClient {
  private accessToken: string;
  private baseUrl: string;
  private locationId?: string;

  constructor({
    accessToken,
    environment = "sandbox",
    locationId,
  }: {
    accessToken: string;
    environment?: "production" | "sandbox";
    locationId?: string;
  }) {
    this.accessToken = accessToken;
    this.baseUrl =
      environment === "production"
        ? "https://connect.squareup.com"
        : "https://connect.squareupsandbox.com";
    this.locationId = locationId;
  }

  private async fetch(path: string, params?: Record<string, string>): Promise<any> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
    }

    const res = await fetch(url.toString(), {
      headers: {
        "Square-Version": "2024-09-18",
        "Authorization": `Bearer ${this.accessToken}`,
      },
    });

    const body = await res.json();

    if (!res.ok) {
      throw new Error(
        `Square API error ${res.status}: ${body.errors?.[0]?.detail || JSON.stringify(body)}`
      );
    }

    return body;
  }

  async listLocations(): Promise<SquareLocation[]> {
    const response = await fetch("/v2/locations");
    const result = await response.json();
    return result.locations;
  }

  /**
   * Fetch recent payments. Optionally filter by time range and location.
   * Pass include=order to retrieve order line items.
   */
  async listRecentPayments(beginTime?: Date, endTime?: Date): Promise<SquarePayment[]> {
    const params: Record<string, string> = {
      include: "order",
      sort_order: "ASC",
    };
    if (this.locationId) params["location_id"] = this.locationId;
    if (beginTime) params["begin_time"] = beginTime.toISOString();
    if (endTime) params["end_time"] = endTime.toISOString();

    const response = await fetch("/v2/payments", params);
    const result = await response.json();
    return result.payments;
  }

  /**
   * Demo mode — returns deterministic mock transactions for UI testing.
   */
  static async demoPayments(): Promise<SquarePayment[]> {
    // Mock two payments representing typical cannabis retail sales
    const baseTime = new Date(Date.now() - 12 * 60 * 60 * 1000); // 12 hrs ago
    const time2 = new Date(Date.now() - 6 * 60 * 60 * 1000); // 6 hrs ago

    const mockItems = [
      {
        uid: "li_1",
        name: "Blue Dream - 3.5g",
        quantity: "1",
        basePriceMoney: { amount: 4500, currency: "USD" },
        modifiers: [{ name: "Pre-roll", basePriceMoney: { amount: 200 } }],
      },
      {
        uid: "li_2",
        name: "Gummy Edibles - 100mg",
        quantity: "2",
        basePriceMoney: { amount: 3000, currency: "USD" },
        modifiers: [],
      },
    ];

    return [
      {
        id: "demo_payment_1001",
        amountMoney: { amount: 10700, currency: "USD" },
        createdAt: baseTime.toISOString(),
        note: "Customer: walk-in — ID verified",
        orderId: "demo_order_1001",
        order: {
          id: "demo_order_1001",
          referenceId: "",
          lineItems: mockItems,
        },
      },
      {
        id: "demo_payment_1002",
        amountMoney: { amount: 4500, currency: "USD" },
        createdAt: time2.toISOString(),
        note: "Customer: John Doe — medical",
        orderId: "demo_order_1002",
        order: {
          id: "demo_order_1002",
          referenceId: "",
          lineItems: [
            {
              uid: "li_3",
              name: "Vape Pen - 1g",
              quantity: "1",
              basePriceMoney: { amount: 4500, currency: "USD" },
            },
          ],
        },
      },
    ];
  }

  static async demoLocations(): Promise<SquareLocation[]> {
    return [
      { id: "demo_loc_main", name: "Main Store - Denver" },
      { id: "demo_loc_branch", name: "North Branch" },
    ];
  }
}
