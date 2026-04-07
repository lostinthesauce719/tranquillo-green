import "server-only";

import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";

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

export async function getConvexContext(companySlug: string) {
  const client = getConvexClient();
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
