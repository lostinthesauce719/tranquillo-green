'use client';

/**
 * Convex client singleton
 * Central place to create and configure the Convex client.
 */

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const getUrl = () => {
  if (typeof window !== "undefined") return window.location.origin;
  // SSR or during initial render: use env var (for Vercel/production)
  if (process.env.NEXT_PUBLIC_CONVEX_URL) return process.env.NEXT_PUBLIC_CONVEX_URL;
  // Local dev fallback
  return "http://localhost:3001";
};

const convex = new ConvexReactClient(getUrl());

export { convex };

/**
 * Provider wrapper for the app root.
 */
export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
