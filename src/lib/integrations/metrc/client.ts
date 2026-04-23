/**
 * Metrc API Client
 *
 * Provides typed access to the Metrc seed-to-sale tracking API.
 * Uses Basic Auth (vendorKey + userKey) and supports both sandbox
 * and production environments.
 *
 * Usage:
 *   const metrc = new MetrcClient({ vendorKey: '...', userKey: '...', state: 'co' });
 *   const packages = await metrc.getPackages('LIC-00001');
 *   const health = await metrc.testConnection('LIC-00001');
 */

import type {
  MetrcClientConfig,
  MetrcPackage,
  MetrcPlant,
  MetrcReceipt,
  MetrcLocation,
  CreatePackagePayload,
} from "./types";
import { MetrcApiError } from "./types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 1000;

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export class MetrcClient {
  private readonly vendorKey: string;
  private readonly userKey: string;
  private readonly baseUrl: string;
  private readonly maxRetries: number;

  constructor(config: MetrcClientConfig) {
    this.vendorKey = config.vendorKey;
    this.userKey = config.userKey;
    this.maxRetries = DEFAULT_MAX_RETRIES;

    if (config.baseUrl) {
      this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    } else {
      this.baseUrl = `https://api-${config.state}.metrc.com`;
    }
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /** List active packages for a given license number. */
  async getPackages(licenseNumber: string): Promise<MetrcPackage[]> {
    return this.request<MetrcPackage[]>(
      "GET",
      "/packages/v2/active",
      { licenseNumber }
    );
  }

  /** List plants in the vegetative (or optionally a specific room) phase. */
  async getPlants(licenseNumber: string, room?: string): Promise<MetrcPlant[]> {
    const params: Record<string, string> = { licenseNumber };
    if (room) params.room = room;
    return this.request<MetrcPlant[]>("GET", "/plants/v2/vegetative", params);
  }

  /**
   * Fetch sales receipts, optionally filtered by date range.
   *
   * @param licenseNumber  Required license number.
   * @param startDate      ISO 8601 start date (YYYY-MM-DD). Defaults to 2 weeks ago.
   * @param endDate        ISO 8601 end date (YYYY-MM-DD). Defaults to now.
   */
  async getSalesReceipts(
    licenseNumber: string,
    startDate?: string,
    endDate?: string
  ): Promise<MetrcReceipt[]> {
    const params: Record<string, string> = { licenseNumber };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return this.request<MetrcReceipt[]>("GET", "/sales/v2/receipts", params);
  }

  /** Create a new package (harvest package or processing package). */
  async createPackage(
    licenseNumber: string,
    payload: CreatePackagePayload
  ): Promise<void> {
    await this.request<void>(
      "POST",
      "/packages/v2/create",
      { licenseNumber },
      [payload]
    );
  }

  /** List rooms/locations configured in Metrc for a license. */
  async getRooms(licenseNumber: string): Promise<MetrcLocation[]> {
    return this.request<MetrcLocation[]>("GET", "/locations/v2", {
      licenseNumber,
    });
  }

  /**
   * Health check — fetches packages (up to 1) to confirm credentials work.
   * Returns true on success, throws on failure.
   */
  async testConnection(licenseNumber: string): Promise<boolean> {
    // We only need to confirm the API responds with 200.
    await this.request<unknown[]>("GET", "/packages/v2/active", {
      licenseNumber,
      pageNumber: "1",
      pageSize: "1",
    });
    return true;
  }

  // -------------------------------------------------------------------------
  // HTTP layer
  // -------------------------------------------------------------------------

  private authHeader(): string {
    // btoa is available in browsers and in Node 16+ / atob environments.
    // For older Node the project polyfills may already handle this; if not
    // Buffer is available as a fallback.
    if (typeof btoa === "function") {
      return `Basic ${btoa(`${this.vendorKey}:${this.userKey}`)}`;
    }
    // Node.js fallback
    return `Basic ${Buffer.from(`${this.vendorKey}:${this.userKey}`).toString("base64")}`;
  }

  /**
   * Core request method with retry-on-429 and comprehensive error handling.
   */
  private async request<T>(
    method: "GET" | "POST" | "PATCH" | "DELETE",
    path: string,
    params?: Record<string, string>,
    body?: unknown
  ): Promise<T> {
    const url = new URL(path, this.baseUrl);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }

    let lastError: MetrcApiError | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await fetch(url.toString(), {
          method,
          headers: {
            Authorization: this.authHeader(),
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: body !== undefined ? JSON.stringify(body) : undefined,
        });

        // 429 — rate-limited, back off and retry
        if (response.status === 429) {
          const retryAfter = response.headers.get("Retry-After");
          const delay = retryAfter
            ? parseInt(retryAfter, 10) * 1000
            : DEFAULT_RETRY_DELAY_MS * (attempt + 1);
          await sleep(delay);
          continue;
        }

        // Any non-2xx is an error
        if (!response.ok) {
          const errorBody = await safeJson(response);
          throw new MetrcApiError(
            response.status,
            `Metrc API error ${response.status}: ${extractErrorMessage(errorBody)}`,
            errorBody
          );
        }

        // 204 No Content or empty body
        if (response.status === 204) {
          return undefined as T;
        }

        return (await response.json()) as T;
      } catch (err) {
        if (err instanceof MetrcApiError) {
          // Only retry 5xx errors; 4xx are client errors
          if (err.statusCode >= 500) {
            lastError = err;
            await sleep(DEFAULT_RETRY_DELAY_MS * (attempt + 1));
            continue;
          }
          throw err;
        }
        // Network / fetch errors — retry
        if (attempt < this.maxRetries - 1) {
          await sleep(DEFAULT_RETRY_DELAY_MS * (attempt + 1));
          continue;
        }
        throw err;
      }
    }

    throw lastError ?? new Error("MetrcClient: max retries exceeded");
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return await response.text().catch(() => null);
  }
}

function extractErrorMessage(body: unknown): string {
  if (!body) return "Unknown error";
  if (typeof body === "string") return body;
  if (typeof body === "object" && body !== null) {
    const obj = body as Record<string, unknown>;
    if (typeof obj.Message === "string") return obj.Message;
    if (typeof obj.message === "string") return obj.message;
  }
  return JSON.stringify(body);
}
