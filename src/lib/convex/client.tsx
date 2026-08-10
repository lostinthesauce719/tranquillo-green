'use client';

/**
 * Convex client + provider.
 *
 * Mounted once at the app root (src/app/layout.tsx) so any client component can
 * use `useQuery` / `useMutation`. Auth is bridged from Clerk via
 * ConvexProviderWithClerk, so authenticated queries carry the user's identity.
 */

import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";
import { ReactNode } from "react";

// Always the Convex deployment URL — never the web origin. This is inlined at
// build time from the deployment's env; it must be set for the client to reach
// the backend.
const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL ?? "http://localhost:3001";

const convex = new ConvexReactClient(convexUrl);

export { convex };

/**
 * Provider wrapper for the app root. Bridges Clerk auth into Convex so
 * authenticated `useQuery`/`useMutation` calls work.
 */
export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth as unknown as never}>
      {children}
    </ConvexProviderWithClerk>
  );
}
