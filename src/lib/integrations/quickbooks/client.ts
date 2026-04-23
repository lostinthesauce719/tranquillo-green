/**
 * QuickBooks Online API client.
 *
 * Handles OAuth2 token management, journal entry creation,
 * and account synchronization with the QBO API.
 */

import type { QBOAccount, QBOJournalEntry, QBOBatchRequest, QBOBatchResponse, QBOCompanyInfo } from "./types";

const QBO_BASE_URL = "https://quickbooks.api.intuit.com";
const QBO_SANDBOX_URL = "https://sandbox-quickbooks.api.intuit.com";

export interface QBOClientConfig {
  clientId: string;
  clientSecret: string;
  realmId: string; // Company ID in QBO
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: number; // Unix timestamp
  sandbox?: boolean;
}

export interface QBOTokenRefreshResult {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export class QBOClient {
  private config: QBOClientConfig;
  private baseUrl: string;

  constructor(config: QBOClientConfig) {
    this.config = config;
    this.baseUrl = config.sandbox ? QBO_SANDBOX_URL : QBO_BASE_URL;
  }

  /** Check if access token needs refresh */
  get isTokenExpired(): boolean {
    return Date.now() >= this.config.tokenExpiresAt - 60_000; // 1 min buffer
  }

  /** Refresh the OAuth2 access token */
  async refreshAccessToken(): Promise<QBOTokenRefreshResult> {
    const response = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: this.config.refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`QBO token refresh failed: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();

    this.config.accessToken = data.access_token;
    this.config.refreshToken = data.refresh_token;
    this.config.tokenExpiresAt = Date.now() + data.expires_in * 1000;

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: this.config.tokenExpiresAt,
    };
  }

  /** Ensure we have a valid token before making API calls */
  private async ensureToken(): Promise<void> {
    if (this.isTokenExpired) {
      await this.refreshAccessToken();
    }
  }

  /** Make an authenticated API call to QBO */
  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    await this.ensureToken();

    const url = `${this.baseUrl}/v3/company/${this.config.realmId}/${path}`;
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`QBO API error: ${response.status} ${error}`);
    }

    return response.json();
  }

  /** Get company info */
  async getCompanyInfo(): Promise<QBOCompanyInfo> {
    const result = await this.request<{ CompanyInfo: QBOCompanyInfo }>("GET", "companyinfo/1");
    return result.CompanyInfo;
  }

  /** List chart of accounts */
  async listAccounts(): Promise<QBOAccount[]> {
    const result = await this.request<{ QueryResponse: { Account?: QBOAccount[] } }>(
      "GET",
      "query?query=SELECT * FROM Account"
    );
    return result.QueryResponse.Account ?? [];
  }

  /** Create journal entries in batch (max 30 per batch) */
  async createJournalEntries(entries: QBOJournalEntry[]): Promise<QBOBatchResponse> {
    // QBO batch limit is 30 items
    const chunks = chunkArray(entries, 30);
    const allResponses: QBOBatchResponse["BatchItemResponse"] = [];

    for (const chunk of chunks) {
      const batchRequest: QBOBatchRequest = {
        BatchItemRequest: chunk.map((entry, i) => ({
          bId: `entry_${Date.now()}_${i}`,
          operation: "create",
          JournalEntry: entry,
        })),
      };

      const response = await this.request<QBOBatchResponse>("POST", "batch", batchRequest);
      allResponses.push(...response.BatchItemResponse);
    }

    return { BatchItemResponse: allResponses };
  }

  /** Create a QBOClient from environment variables + token state */
  static fromEnv(opts: { realmId: string; accessToken: string; refreshToken: string; tokenExpiresAt: number }): QBOClient {
    return new QBOClient({
      clientId: process.env.QBO_CLIENT_ID ?? "",
      clientSecret: process.env.QBO_CLIENT_SECRET ?? "",
      realmId: opts.realmId,
      accessToken: opts.accessToken,
      refreshToken: opts.refreshToken,
      tokenExpiresAt: opts.tokenExpiresAt,
      sandbox: process.env.QBO_SANDBOX === "true",
    });
  }

  /** Generate OAuth2 authorization URL */
  static getAuthorizationUrl(clientId: string, redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "com.intuit.quickbooks.accounting",
      state,
    });
    return `https://appcenter.intuit.com/connect/oauth2?${params}`;
  }

  /** Exchange authorization code for tokens */
  static async exchangeCodeForTokens(
    clientId: string,
    clientSecret: string,
    code: string,
    redirectUri: string
  ): Promise<QBOTokenRefreshResult> {
    const response = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`QBO auth code exchange failed: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
  }
}

/** Split array into chunks of given size */
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
