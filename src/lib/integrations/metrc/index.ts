/**
 * Metrc Integration — Public API
 *
 * Provides seed-to-sale tracking via the Metrc API.
 *
 * Usage:
 *   import { MetrcClient, MetrcApiError } from "@/lib/integrations/metrc";
 *   const metrc = new MetrcClient({ vendorKey: '...', userKey: '...', state: 'co' });
 *   const packages = await metrc.getPackages('LIC-00001');
 */

// Client
export { MetrcClient } from "./client";

// Types
export type {
  MetrcClientConfig,
  MetrcPackage,
  MetrcPlant,
  MetrcReceipt,
  MetrcTransaction,
  MetrcLocation,
  CreatePackagePayload,
  MetrcMetaData,
  MetrcError,
} from "./types";

// Error class
export { MetrcApiError } from "./types";
