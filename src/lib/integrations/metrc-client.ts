"use server-only";

/**
 * Metrc (California) API client.
 * Handles Basic Auth, package pulls, inventory sync, and reconciliation.
 *
 * Metrc uses API keys (vendor_key:user_key) via HTTP Basic Auth.
 * NOT OAuth — simpler but keys must be kept secure.
 */

const METRC_BASE_URL_SANDBOX = "https://sandbox-api-ca.metrc.com";
const METRC_BASE_URL_PROD = "https://api-ca.metrc.com";

// ─── TYPES ────────────────────────────────────────────────────────

export type MetrcConfig = {
  integratorKey: string;
  userKey: string;
  licenseNumber: string;
  sandbox: boolean;
};

export type MetrcPackage = {
  Id: number;
  PackageId: string;
  Tag: string;
  Label: string;
  Item?: {
    Id: number;
    Name: string;
    ProductCategoryName: string;
    ProductCategoryType: string;
    UnitOfMeasureName: string;
  };
  Quantity: number;
  UnitOfMeasureName: string;
  PackagedDate: string;
  IsFinished: boolean;
  IsOnHold: boolean;
  ArchivedDate?: string;
  LocationName?: string;
  LocationTypeName?: string;
};

export type MetrcHarvest = {
  Id: number;
  Name: string;
  HarvestType: string;
  HarvestStartDate: string;
  HarvestEndDate?: string;
  TotalWasteWeight?: number;
  TotalWetWeight?: number;
  TotalDryWeight?: number;
  TotalRestoredWeight?: number;
};

export type MetrcTransfer = {
  Id: number;
  ShipmentLicenseType: string;
  ShipperFacilityLicenseNumber: string;
  ShipperFacilityName: string;
  ReceiverFacilityLicenseNumber: string;
  ReceiverFacilityName: string;
  DeliveryId: number;
  DeliveryPackageCount: number;
  CreatedDateTime: string;
  ReceivedDateTime?: string;
  DeliveryStatus: string;
};

export type MetrcSale = {
  Id: number;
  ReceiptNumber: number;
  SalesDateTime: string;
  TotalPackages: number;
  TotalPrice: number;
  Transactions: Array<{
    PackageLabel: string;
    Quantity: number;
    UnitOfMeasure: string;
    TotalPrice: number;
  }>;
};

export type MetrcSyncResult = {
  success: boolean;
  source: "metrc" | "demo";
  packages: number;
  movements: number;
  discrepancies: Array<{
    packageTag: string;
    metrcQty: number;
    bookQty: number;
    variance: number;
    type: "over" | "short";
  }>;
  details: string[];
  error?: string;
};

// ─── AUTH ──────────────────────────────────────────────────────────

function getAuthHeader(config: MetrcConfig): string {
  return Buffer.from(`${config.integratorKey}:${config.userKey}`).toString("base64");
}

function getBaseUrl(config: MetrcConfig): string {
  return config.sandbox ? METRC_BASE_URL_SANDBOX : METRC_BASE_URL_PROD;
}

async function metrcFetch<T>(
  config: MetrcConfig,
  path: string,
  params?: Record<string, string>
): Promise<T> {
  const url = new URL(`${getBaseUrl(config)}${path}`);
  // Always include licenseNumber
  url.searchParams.set("licenseNumber", config.licenseNumber);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Basic ${getAuthHeader(config)}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Metrc API error ${res.status}: ${body}`);
  }

  return res.json();
}

// ─── API CALLS ────────────────────────────────────────────────────

export async function fetchPackages(config: MetrcConfig, lastModifiedStart?: string): Promise<MetrcPackage[]> {
  const params: Record<string, string> = {};
  if (lastModifiedStart) {
    params.lastModifiedStart = lastModifiedStart;
  }
  const response = await metrcFetch<{ Data: MetrcPackage[] }>(config, "/packages/v2", params);
  return response.Data ?? [];
}

export async function fetchActivePackages(config: MetrcConfig): Promise<MetrcPackage[]> {
  const packages = await fetchPackages(config);
  return packages.filter((p) => !p.IsFinished && !p.ArchivedDate);
}

export async function fetchHarvests(config: MetrcConfig, lastModifiedStart?: string): Promise<MetrcHarvest[]> {
  const params: Record<string, string> = {};
  if (lastModifiedStart) {
    params.lastModifiedStart = lastModifiedStart;
  }
  const response = await metrcFetch<{ Data: MetrcHarvest[] }>(config, "/harvests/v2", params);
  return response.Data ?? [];
}

export async function fetchTransfers(config: MetrcConfig, lastModifiedStart?: string): Promise<MetrcTransfer[]> {
  const params: Record<string, string> = {};
  if (lastModifiedStart) {
    params.lastModifiedStart = lastModifiedStart;
  }
  const response = await metrcFetch<{ Data: MetrcTransfer[] }>(config, "/transfers/v2", params);
  return response.Data ?? [];
}

export async function fetchSales(config: MetrcConfig, salesDateStart?: string, salesDateEnd?: string): Promise<MetrcSale[]> {
  const params: Record<string, string> = {};
  if (salesDateStart) params.salesDateStart = salesDateStart;
  if (salesDateEnd) params.salesDateEnd = salesDateEnd;
  const response = await metrcFetch<{ Data: MetrcSale[] }>(config, "/sales/v2/receipts", params);
  return response.Data ?? [];
}

// ─── VALIDATION ───────────────────────────────────────────────────

export async function validateConnection(config: MetrcConfig): Promise<{ valid: boolean; facilityName?: string; error?: string }> {
  try {
    // Try to fetch a single package to validate credentials
    const packages = await fetchPackages(config);
    return {
      valid: true,
      facilityName: packages[0]?.LocationName ?? "Connected",
    };
  } catch (e: any) {
    return {
      valid: false,
      error: e.message,
    };
  }
}

// ─── DEMO FALLBACK ────────────────────────────────────────────────

export function getDemoMetrcPackages(): MetrcPackage[] {
  return [
    {
      Id: 1,
      PackageId: "PKG-001",
      Tag: "1A4060300001C10000010012",
      Label: "OG Kush Flower 3.5g",
      Item: { Id: 1, Name: "OG Kush Flower 3.5g", ProductCategoryName: "Flower", ProductCategoryType: "Cannabis", UnitOfMeasureName: "Grams" },
      Quantity: 420,
      UnitOfMeasureName: "Grams",
      PackagedDate: "2026-03-15",
      IsFinished: false,
      IsOnHold: false,
      LocationName: "Oakland Flagship Retail",
      LocationTypeName: "Retail",
    },
    {
      Id: 2,
      PackageId: "PKG-002",
      Tag: "1A4060300001C10000010018",
      Label: "OG Kush Flower 3.5g",
      Item: { Id: 1, Name: "OG Kush Flower 3.5g", ProductCategoryName: "Flower", ProductCategoryType: "Cannabis", UnitOfMeasureName: "Grams" },
      Quantity: 115,
      UnitOfMeasureName: "Grams",
      PackagedDate: "2026-03-20",
      IsFinished: false,
      IsOnHold: false,
      LocationName: "Oakland Flagship Retail",
      LocationTypeName: "Retail",
    },
    {
      Id: 3,
      PackageId: "PKG-003",
      Tag: "1A4060300001C30000030078",
      Label: "GSC Live Resin Cart 1g",
      Item: { Id: 3, Name: "GSC Live Resin Cart 1g", ProductCategoryName: "Vape Cartridges", ProductCategoryType: "Cannabis", UnitOfMeasureName: "Eaches" },
      Quantity: 560,
      UnitOfMeasureName: "Eaches",
      PackagedDate: "2026-03-10",
      IsFinished: false,
      IsOnHold: false,
      LocationName: "Richmond Manufacturing Hub",
      LocationTypeName: "Manufacturing",
    },
    {
      Id: 4,
      PackageId: "PKG-004",
      Tag: "1A4060300001C50000050112",
      Label: "Blue Dream BHO Shatter 1g",
      Item: { Id: 5, Name: "Blue Dream BHO Shatter 1g", ProductCategoryName: "Concentrate", ProductCategoryType: "Cannabis", UnitOfMeasureName: "Grams" },
      Quantity: 95,
      UnitOfMeasureName: "Grams",
      PackagedDate: "2026-03-25",
      IsFinished: false,
      IsOnHold: false,
      LocationName: "Richmond Manufacturing Hub",
      LocationTypeName: "Manufacturing",
    },
    {
      Id: 5,
      PackageId: "PKG-005",
      Tag: "1A4060300001C10000060130",
      Label: "Pink Panties Flower 7g",
      Item: { Id: 6, Name: "Pink Panties Flower 7g", ProductCategoryName: "Flower", ProductCategoryType: "Cannabis", UnitOfMeasureName: "Grams" },
      Quantity: 220,
      UnitOfMeasureName: "Grams",
      PackagedDate: "2026-04-01",
      IsFinished: false,
      IsOnHold: false,
      LocationName: "Oakland Flagship Retail",
      LocationTypeName: "Retail",
    },
  ];
}

export function getDemoDiscrepancies(): MetrcSyncResult["discrepancies"] {
  return [
    { packageTag: "1A4060300001C10000010012", metrcQty: 420, bookQty: 418, variance: 2, type: "short" },
    { packageTag: "1A4060300001C10000010018", metrcQty: 115, bookQty: 112, variance: 3, type: "short" },
    { packageTag: "1A4060300001C10000060130", metrcQty: 220, bookQty: 224, variance: 4, type: "over" },
  ];
}
