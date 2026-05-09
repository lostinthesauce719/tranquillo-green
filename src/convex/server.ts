/**
 * Convex server-side barrel — re-exports from convex/server
 * plus internal seeding utilities.
 */
export {
  db,
  query,
  mutation,
  action,
  httpAction,
  schedulerAction,
  identifier,
  plainClient,
  client,
  compute,
  crypto,
  random,
  log,
  useQuery,
  useMutation,
  useAction,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  unstable_ctx,
  getQuery,
  getMutation,
  // getAction, // Removed: not an export from convex/server
  // ... plus any others you need
} from "convex/server";

/**
 * Internal DB access for seed/migration scripts.
 * Only available in server context during convex dev / seed operations.
 */
export const internal = (await import("convex/server")).internal;
