import "server-only";

import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import fs from "fs";
import { homedir } from "os";

const CONVEX_JWT_TEMPLATE = process.env.CLERK_CONVEX_JWT_TEMPLATE?.trim() || "convex";

export function getConvexUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  if (!url || !/^https?:\/\//.test(url)) {
    return null;
  }
  return url;
}

export async function withTimeout<T>(promise: Promise<T>, timeoutMs = 5000): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`Timed out after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}

export function getConvexClient(): ConvexHttpClient | null {
  const url = getConvexUrl();
  if (!url) {
    return null;
  }
  return new ConvexHttpClient(url);
}

export async function getClerkConvexToken(): Promise<string | null> {
  try {
    const authState = auth();
    if (!authState.userId) {
      return null;
    }

    return (await authState.getToken({ template: CONVEX_JWT_TEMPLATE })) ?? null;
  } catch {
    return null;
  }
}

export async function getAuthenticatedConvexClient(): Promise<ConvexHttpClient | null> {
  const client = getConvexClient();
  if (!client) {
    return null;
  }

  const token = await getClerkConvexToken();
  if (token) {
    client.setAuth(token);
    return client;
  }

  // No Clerk token — fall back to Convex CLI server token for server-side actions
  // Priority: CONVEX_SERVER_KEY env, then ~/.convex/config.json accessToken (CLI auth)
  let serverToken = process.env.CONVEX_SERVER_KEY;
  if (!serverToken) {
    try {
      const homedirPath = homedir();
      const configPath = `${homedirPath}/.convex/config.json`;
      const raw = await fs.promises.readFile(configPath, "utf-8");
      const cfg = JSON.parse(raw);
      serverToken = cfg?.accessToken;
    } catch (e) {
      // ignore
    }
  }
  if (serverToken) {
    client.setAuth(serverToken);
    return client;
  }

  return null;
}

export async function getConvexContext(companySlug: string) {
  const client = await getAuthenticatedConvexClient();
  if (!client) {
    return null;
  }

  const company = await withTimeout(
    client.query((anyApi as any).cannabisCompanies.getBySlug, { slug: companySlug }),
  );
  if (!company) {
    return null;
  }

  return { client, company };
}
