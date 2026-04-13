import "server-only";

/**
 * QuickBooks Online (QBO) API client.
 * Handles OAuth2 token exchange, token refresh, and basic API calls.
 */

const QBO_BASE_URL_SANDBOX = "https://sandbox-quickbooks.api.intuit.com";
const QBO_BASE_URL_PROD = "https://quickbooks.api.intuit.com";
const OAUTH_BASE_URL = "https://appcenter.intuit.com/connect/oauth2";
const TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
  x_refresh_token_expires_in: number;
};

export type QBOTokens = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number; // epoch ms
  refreshTokenExpiresAt: number; // epoch ms
  realmId: string;
};

function getEnv(key: string): string {
  const v = process.env[key]?.trim();
  if (!v) throw new Error(`Missing env: ${key}`);
  return v;
}

function getBaseUrl(): string {
  const sandbox = process.env.QBO_SANDBOX?.trim() === "true";
  return sandbox ? QBO_BASE_URL_SANDBOX : QBO_BASE_URL_PROD;
}

function getBasicAuth(): string {
  const id = getEnv("QBO_CLIENT_ID");
  const secret = getEnv("QBO_CLIENT_SECRET");
  return Buffer.from(`${id}:${secret}`).toString("base64");
}

/**
 * Generate the Intuit authorization URL.
 * Scopes: accounting + payment
 */
export function getAuthorizationUrl(state: string): string {
  const clientId = getEnv("QBO_CLIENT_ID");
  const redirectUri = getEnv("QBO_REDIRECT_URI");
  const scopes = [
    "com.intuit.quickbooks.accounting",
    "com.intuit.quickbooks.payment",
  ];

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes.join(" "),
    state,
  });

  return `${OAUTH_BASE_URL}?${params.toString()}`;
}

/**
 * Exchange an authorization code for tokens.
 */
export async function exchangeCodeForTokens(
  code: string,
  realmId: string,
): Promise<QBOTokens> {
  const redirectUri = getEnv("QBO_REDIRECT_URI");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${getBasicAuth()}`,
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`QBO token exchange failed (${res.status}): ${text}`);
  }

  const data: TokenResponse = await res.json();
  return tokensFromResponse(data, realmId);
}

/**
 * Refresh an expired access token.
 */
export async function refreshAccessToken(
  refreshToken: string,
  realmId: string,
): Promise<QBOTokens> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${getBasicAuth()}`,
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`QBO token refresh failed (${res.status}): ${text}`);
  }

  const data: TokenResponse = await res.json();
  return tokensFromResponse(data, realmId);
}

function tokensFromResponse(data: TokenResponse, realmId: string): QBOTokens {
  const now = Date.now();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    accessTokenExpiresAt: now + data.expires_in * 1000,
    refreshTokenExpiresAt: now + data.x_refresh_token_expires_in * 1000,
    realmId,
  };
}

/**
 * Make an authenticated GET request to the QBO API.
 * Auto-refreshes tokens if expired (returns the refreshed tokens alongside data).
 */
export async function qboGet<T>(
  path: string,
  tokens: QBOTokens,
): Promise<{ data: T; tokens: QBOTokens }> {
  let currentTokens = tokens;

  // Refresh if expired (with 60s buffer)
  if (currentTokens.accessTokenExpiresAt < Date.now() + 60_000) {
    currentTokens = await refreshAccessToken(
      currentTokens.refreshToken,
      currentTokens.realmId,
    );
  }

  const url = `${getBaseUrl()}/v3/company/${currentTokens.realmId}/${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${currentTokens.accessToken}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`QBO API error (${res.status}): ${text}`);
  }

  const data = (await res.json()) as T;
  return { data, tokens: currentTokens };
}

/**
 * Fetch the company info for the connected realm.
 */
export async function getCompanyInfo(tokens: QBOTokens) {
  return qboGet<{ CompanyInfo: { CompanyName: string; LegalName: string } }>(
    "companyinfo/" + tokens.realmId,
    tokens,
  );
}

/**
 * Fetch the chart of accounts from QBO.
 */
export async function getAccounts(tokens: QBOTokens) {
  return qboGet<{ QueryResponse: { Account: Array<Record<string, unknown>> } }>(
    "query?select * from Account",
    tokens,
  );
}
