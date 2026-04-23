/**
 * Metrc (Marijuana Enforcement Tracking Reporting Compliance) API types.
 *
 * Metrc is the seed-to-sale tracking system mandated in 24+ US cannabis states.
 * These types cover the subset of endpoints used by Tranquillo Green.
 */

// ---------------------------------------------------------------------------
// Common
// ---------------------------------------------------------------------------

/** Every Metrc resource is identified by an opaque numeric Id. */
export interface MetrcId {
  Id: number;
}

/** Shared metadata attached to most API resources. */
export interface MetrcMetaData {
  LastModified: string; // ISO 8601
}

/** Standard error payload returned by Metrc on failure. */
export interface MetrcError {
  Message: string;
  IsRecordValid?: boolean;
  Errors?: Array<{
    Field: string;
    Message: string;
  }>;
}

// ---------------------------------------------------------------------------
// Packages
// ---------------------------------------------------------------------------

export interface MetrcPackage extends MetrcId {
  Label: string;
  PackageType: string | null;
  SourcePackageLabels: string | null;
  LocationName: string;
  LocationTypeName: string | null;
  Quantity: number;
  UnitOfMeasureName: string;
  UnitOfMeasureAbbreviation: string;
  PackagedByFacilityLicenseNumber: string | null;
  PackagedByFacilityName: string | null;
  ProductName: string;
  ProductCategoryName: string;
  ItemStrainName: string | null;
  ItemServingSize: string | null;
  ItemSupplyDurationDays: number | null;
  ItemUnitCbdContent: number | null;
  ItemUnitCbdContentUnitOfMeasureName: string | null;
  ItemUnitCbdPercent: number | null;
  ItemUnitThcContent: number | null;
  ItemUnitThcContentUnitOfMeasureName: string | null;
  ItemUnitThcPercent: number | null;
  ItemUnitVolume: number | null;
  ItemUnitVolumeUnitOfMeasureName: string | null;
  ItemUnitWeight: number | null;
  ItemUnitWeightUnitOfMeasureName: string | null;
  IsProductionBatch: boolean;
  ProductionBatchNumber: string | null;
  IsTradeSample: boolean;
  IsDonation: boolean;
  IsTestingSample: boolean;
  ProductRequiresRemediation: boolean;
  ContainsRemediatedProduct: boolean;
  RemediationDate: string | null;
  ReceivedDateTime: string | null;
  FinishedDate: string | null;
  ExpirationDate: string | null;
  ArchivedDate: string | null;
  InitialLabTestingState: string;
  LabTestingState: string;
  LabTestingStateDate: string | null;
  LabTestResultDocumentUrl: string | null;
  ItemFromIsOwnFacility: boolean;
  SourceHarvests: MetrcId[] | null;
  SourcePackageLabelsArray: string[] | null;
}

export interface CreatePackagePayload {
  Tag: string;
  Item: string;
  Quantity: number;
  UnitOfMeasure: string;
  IsProductionBatch?: boolean;
  ProductionBatchNumber?: string;
  IsTradeSample?: boolean;
  ProductRequiresRemediation?: boolean;
  ActualDate?: string;
  ExpirationDate?: string;
  SellByDate?: string;
  UseByDate?: string;
  Note?: string;
}

// ---------------------------------------------------------------------------
// Plants
// ---------------------------------------------------------------------------

export interface MetrcPlant extends MetrcId {
  Label: string;
  State: string; // e.g. "Vegetative", "Flowering"
  GrowthPhase: string;
  PlantAddedToLicenseDate: string;
  VegetativeDate: string | null;
  FloweringDate: string | null;
  HarvestedDate: string | null;
  DestroyedDate: string | null;
  DestroyedNote: string | null;
  DestroyedByUserName: string | null;
  LocationName: string;
  LocationTypeName: string | null;
  StrainName: string;
  StrainId: number;
  PatientLicenseNumber: string | null;
  IsOnHoldForRemediation: boolean;
  RemediationDate: string | null;
  HarvestCount: number;
  Harvested: boolean;
  ArchivedDate: string | null;
  LastModified: string;
}

// ---------------------------------------------------------------------------
// Rooms / Locations
// ---------------------------------------------------------------------------

export interface MetrcLocation extends MetrcId {
  Name: string;
  LocationTypeName: string;
  ForHarvests: boolean;
  ForPackages: boolean;
  ForPlants: boolean;
  ForPlantBatches: boolean;
  IsDefault: boolean;
  Location: {
    Id: number;
    Name: string;
  } | null;
}

// ---------------------------------------------------------------------------
// Sales
// ---------------------------------------------------------------------------

export interface MetrcReceipt extends MetrcId {
  SalesDateTime: string;
  SalesCustomerType: string | null;
  PatientLicenseNumber: string | null;
  CaregiverLicenseNumber: string | null;
  IdentificationMethod: string | null;
  PatientLocation: string | null;
  TotalPackages: number;
  Total: number;
  TransactionType: string;
  Transactions: MetrcTransaction[];
  IsFinal: boolean;
  ReceiptNumber: number;
  ArchivedDate: string | null;
}

export interface MetrcTransaction extends MetrcId {
  PackageLabel: string;
  PackageId: number;
  ProductName: string;
  ProductCategoryName: string;
  Quantity: number;
  UnitOfMeasureName: string;
  TotalPrice: number;
  SalesDeliveryState: string | null;
}

// ---------------------------------------------------------------------------
// API Response Wrappers
// ---------------------------------------------------------------------------

/** Metrc list endpoints return an object with a single array key. */
export type MetrcListResponse<T> = {
  [K in string]: T[];
};

// ---------------------------------------------------------------------------
// Client Config
// ---------------------------------------------------------------------------

export interface MetrcClientConfig {
  /** Metrc API Vendor Integrator key (used as Basic Auth username). */
  vendorKey: string;

  /** Metrc API User key (used as Basic Auth password). */
  userKey: string;

  /** Two-letter state abbreviation, e.g. "ca", "co", "mi". */
  state: string;

  /** Override base URL (e.g. for proxying or local testing). */
  baseUrl?: string;
}

// ---------------------------------------------------------------------------
// Custom Error
// ---------------------------------------------------------------------------

export class MetrcApiError extends Error {
  public readonly statusCode: number;
  public readonly body: unknown;

  constructor(statusCode: number, message: string, body?: unknown) {
    super(message);
    this.name = "MetrcApiError";
    this.statusCode = statusCode;
    this.body = body;
  }
}
