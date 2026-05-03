
/**
 * Treez POS Integration Client
 *
 * Treez provides seed-to-sale and retail solutions for cannabis businesses.
 * This client focuses on retail transaction retrieval.
 *
 * Reference: https://docs.treez.io/api
 */

export type TreezSale = {
  id: string;
  transactionTime: string;
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
  status: string;
  locationId: string;
  locationName?: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    categoryName: string;
  }>;
  payments: Array<{
    type: string;
    amount: number;
  }>;
};

export class TreezClient {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;

  constructor({
    apiKey,
    apiSecret,
    environment = "sandbox",
  }: {
    apiKey: string;
    apiSecret: string;
    environment?: "production" | "sandbox";
  }) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseUrl =
      environment === "production"
        ? "https://api.treez.io"
        : "https://sandbox-api.treez.io";
    // Treez may use Basic Auth or Bearer token; we'll use Bearer for now.
  }

  private async fetch(path: string, params?: Record<string, string>): Promise<any> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
    }

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(`Treez API error ${res.status}: ${JSON.stringify(body)}`);
    }
    return body;
  }

  /**
   * Get recent completed sales transactions.
   * Treez typically uses /sales endpoint.
   */
  async listRecentSales(beginTime?: Date, endTime?: Date): Promise<TreezSale[]> {
    const params: Record<string, string> = { status: "completed" };
    if (beginTime) params["beginTime"] = beginTime.toISOString();
    if (endTime) params["endTime"] = endTime.toISOString();

    // Hypothetical endpoint
    const response = await fetch("/api/v1/sales", params);
    const result = await response.json();
    return result.sales;
  }

  /**
   * Demo mode returns deterministic mock sales.
   */
  static async demoSales(): Promise<TreezSale[]> {
    const base = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return [
      {
        id: "demo_treez_sale_1",
        transactionTime: base.toISOString(),
        totalAmount: 12000,
        subtotal: 11320,
        taxAmount: 680,
        status: "completed",
        locationId: "demo_loc_1",
        locationName: "San Francisco - Mission",
        items: [
          {
            productId: "prod_flower_1",
            productName: "Sour Diesel - 3.5g",
            quantity: 1,
            unitPrice: 6000,
            totalPrice: 6000,
            categoryName: "Flower",
          },
          {
            productId: "prod_edible_1",
            productName: "THC Gummies - 200mg",
            quantity: 1,
            unitPrice: 4000,
            totalPrice: 4000,
            categoryName: "Edibles",
          },
        ],
        payments: [{ type: "CASH", amount: 12000 }],
      },
    ];
  }

  static async demoLocations(): Promise<Array<{ id: string; name: string }>> {
    return [{ id: "demo_loc_1", name: "San Francisco - Mission" }];
  }
}
