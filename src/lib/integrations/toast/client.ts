
/**
 * Toast POS Integration Client
 *
 * Toast provides a restaurant management platform. The API uses OAuth2
 * with a restaurantId prefix for all endpoints.
 *
 * Docs: https://developer.toasttab.com/docs
 */

export type ToastOrder = {
  id: string;
  createdAt: string;
  total: number;
  subtotal: number;
  taxAmount: number;
  businessDate: string;
  diningOption: string;
  payments: Array<{
    amount: number;
    type: string;
    status: string;
  }>;
  lineItems: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    modifiers?: Array<{
      name: string;
      price: number;
    }>;
  }>;
};

export type ToastRestaurant = {
  id: string;
  name: string;
};

export class ToastClient {
  private authToken: string;
  private restaurantId: string;
  private baseUrl: string;

  constructor({
    authToken,
    restaurantId,
    environment = "sandbox",
  }: {
    authToken: string;
    restaurantId: string;
    environment?: "production" | "sandbox";
  }) {
    this.authToken = authToken;
    this.restaurantId = restaurantId;
    this.baseUrl =
      environment === "production"
        ? "https://toasttab.com"
        : "https://sandbox-api.toast.com";
  }

  private async fetch(path: string): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      headers: {
        "Toast-Platform-Version": "2",
        Authorization: `Bearer ${this.authToken}`,
      },
    });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(`Toast API error ${res.status}: ${JSON.stringify(body)}`);
    }
    return body;
  }

  /**
   * Fetch orders with filtering. Toast requires full history pagination;
   * client should request only recent orders typically (last 24h) by time.
   */
  async listRecentOrders(beginTime?: Date, endTime?: Date): Promise<ToastOrder[]> {
    const params = new URLSearchParams();
    if (beginTime) params.append("startDate", beginTime.toISOString());
    if (endTime) params.append("endDate", endTime.toISOString());
    // Example endpoint might be /api/v2/orders?restaurantId=...
    const path = `/api/v2/orders?${params.toString()}`;
    const response = await fetch(path);
    const result = await response.json();
    return result.orders;
  }

  /**
   * Demo mode provides deterministic orders and line items for testing.
   */
  static async demoOrders(): Promise<ToastOrder[]> {
    const base = new Date(Date.now() - 8 * 60 * 60 * 1000);
    return [
      {
        id: "demo_toast_order_1",
        createdAt: base.toISOString(),
        total: 8500,
        subtotal: 8000,
        taxAmount: 500,
        businessDate: base.toISOString().split("T")[0],
        diningOption: "SHOP",
        payments: [{ amount: 8500, type: "CREDIT", status: "CAPTURED" }],
        lineItems: [
          {
            id: "li_t_1",
            name: "Blue Dream - 1/8 oz",
            quantity: 1,
            price: 5000,
            modifiers: [{ name: "extra tax", price: 0 }],
          },
          {
            id: "li_t_2",
            name: "Hemp Gummies",
            quantity: 2,
            price: 1500,
          },
        ],
      },
    ];
  }

  static async demoRestaurantInfo(): Promise<ToastRestaurant> {
    return { id: "demo_rest_nyc", name: "Green Leaf Dispensary NYC" };
  }
}
