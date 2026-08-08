// ---------------------------------------------------------------------------
// Tranquillo Green – Inventory Demo Data
// ---------------------------------------------------------------------------

export type ProductCategory = 'flower' | 'concentrate' | 'edible' | 'topical' | 'pre-roll';

export type ComplianceStatus = 'compliant' | 'pending_review' | 'non_compliant';

export interface DemoProduct {
  sku: string;
  name: string;
  category: ProductCategory;
  unitOfMeasure: string;
  active: boolean;
  complianceStatus: ComplianceStatus;
}

export type BatchStatus = 'in_stock' | 'low_stock' | 'depleted' | 'quarantined';
export type BatchSource = 'metrc_import' | 'csv_import' | 'manual';

export interface DemoInventoryBatch {
  packageTag: string;
  productSku: string;
  locationName: string;
  quantityOnHand: number;
  costBasis: number;
  source: BatchSource;
  lastSyncedAt: string;
  status: BatchStatus;
}

export type MovementType = 'receive' | 'sale' | 'adjustment' | 'waste' | 'transfer';

export interface DemoInventoryMovement {
  batchPackageTag: string;
  movementType: MovementType;
  quantity: number;
  movementDate: string;
  reference: string;
}

export type SyncStatus = 'synced' | 'pending' | 'error';

export interface DemoMetrcSyncStatus {
  locationName: string;
  lastSyncAt: string;
  status: SyncStatus;
  recordsProcessed: number;
  nextScheduledSync: string;
}

// ---------------------------------------------------------------------------
// Products (~8)
// ---------------------------------------------------------------------------

export const demoProducts: DemoProduct[] = [
  { sku: 'FLW-OGK-01', name: 'OG Kush – Premium Flower',       category: 'flower',      unitOfMeasure: 'grams',  active: true,  complianceStatus: 'compliant' },
  { sku: 'FLW-BDP-02', name: 'Blue Dream – Popcorn Buds',      category: 'flower',      unitOfMeasure: 'grams',  active: true,  complianceStatus: 'compliant' },
  { sku: 'CON-LRE-01', name: 'Live Resin – Mango Haze 1g',     category: 'concentrate', unitOfMeasure: 'units',  active: true,  complianceStatus: 'compliant' },
  { sku: 'CON-DST-02', name: 'Distillate Cartridge – Gelato',   category: 'concentrate', unitOfMeasure: 'units',  active: true,  complianceStatus: 'pending_review' },
  { sku: 'EDI-GUM-01', name: 'Watermelon Gummies 10pk 100mg',   category: 'edible',      unitOfMeasure: 'units',  active: true,  complianceStatus: 'compliant' },
  { sku: 'EDI-CHO-02', name: 'Dark Chocolate Bar 50mg',         category: 'edible',      unitOfMeasure: 'units',  active: false, complianceStatus: 'non_compliant' },
  { sku: 'TOP-BLM-01', name: 'CBD Recovery Balm 2oz',           category: 'topical',     unitOfMeasure: 'units',  active: true,  complianceStatus: 'compliant' },
  { sku: 'PRE-OGK-01', name: 'OG Kush Pre-Roll 1g (5-pack)',   category: 'pre-roll',    unitOfMeasure: 'packs',  active: true,  complianceStatus: 'compliant' },
];

// ---------------------------------------------------------------------------
// Batches (~12) across 2 locations
// ---------------------------------------------------------------------------

export const demoBatches: DemoInventoryBatch[] = [
  // ── Richmond Manufacturing Hub ──────────────────────────────────────────
  { packageTag: '1A40060000001B1000001234', productSku: 'FLW-OGK-01', locationName: 'Richmond Manufacturing Hub', quantityOnHand: 4800,  costBasis: 14400.00, source: 'metrc_import', lastSyncedAt: '2026-04-06T14:32:00Z', status: 'in_stock' },
  { packageTag: '1A40060000001B1000001235', productSku: 'FLW-BDP-02', locationName: 'Richmond Manufacturing Hub', quantityOnHand: 2200,  costBasis: 5500.00,  source: 'metrc_import', lastSyncedAt: '2026-04-06T14:32:00Z', status: 'in_stock' },
  { packageTag: '1A40060000001B1000001236', productSku: 'CON-LRE-01', locationName: 'Richmond Manufacturing Hub', quantityOnHand: 340,   costBasis: 6120.00,  source: 'metrc_import', lastSyncedAt: '2026-04-06T14:32:00Z', status: 'in_stock' },
  { packageTag: '1A40060000001B1000001237', productSku: 'CON-DST-02', locationName: 'Richmond Manufacturing Hub', quantityOnHand: 18,    costBasis: 270.00,   source: 'csv_import',   lastSyncedAt: '2026-04-05T09:15:00Z', status: 'low_stock' },
  { packageTag: '1A40060000001B1000001238', productSku: 'EDI-GUM-01', locationName: 'Richmond Manufacturing Hub', quantityOnHand: 600,   costBasis: 3000.00,  source: 'metrc_import', lastSyncedAt: '2026-04-06T14:32:00Z', status: 'in_stock' },
  { packageTag: '1A40060000001B1000001239', productSku: 'EDI-CHO-02', locationName: 'Richmond Manufacturing Hub', quantityOnHand: 0,     costBasis: 0,        source: 'manual',       lastSyncedAt: '2026-03-28T11:00:00Z', status: 'depleted' },
  { packageTag: '1A40060000001B100000123A', productSku: 'TOP-BLM-01', locationName: 'Richmond Manufacturing Hub', quantityOnHand: 45,    costBasis: 562.50,   source: 'metrc_import', lastSyncedAt: '2026-04-06T14:32:00Z', status: 'quarantined' },

  // ── Oakland Dispensary ──────────────────────────────────────────────────
  { packageTag: '1A40060000002C2000005501', productSku: 'FLW-OGK-01', locationName: 'Oakland Dispensary', quantityOnHand: 920,   costBasis: 2760.00,  source: 'metrc_import', lastSyncedAt: '2026-04-06T15:01:00Z', status: 'in_stock' },
  { packageTag: '1A40060000002C2000005502', productSku: 'PRE-OGK-01', locationName: 'Oakland Dispensary', quantityOnHand: 150,   costBasis: 2250.00,  source: 'metrc_import', lastSyncedAt: '2026-04-06T15:01:00Z', status: 'in_stock' },
  { packageTag: '1A40060000002C2000005503', productSku: 'EDI-GUM-01', locationName: 'Oakland Dispensary', quantityOnHand: 12,    costBasis: 60.00,    source: 'csv_import',   lastSyncedAt: '2026-04-05T18:45:00Z', status: 'low_stock' },
  { packageTag: '1A40060000002C2000005504', productSku: 'CON-LRE-01', locationName: 'Oakland Dispensary', quantityOnHand: 88,    costBasis: 1584.00,  source: 'metrc_import', lastSyncedAt: '2026-04-06T15:01:00Z', status: 'in_stock' },
  { packageTag: '1A40060000002C2000005505', productSku: 'FLW-BDP-02', locationName: 'Oakland Dispensary', quantityOnHand: 0,     costBasis: 0,        source: 'metrc_import', lastSyncedAt: '2026-04-06T15:01:00Z', status: 'depleted' },
];

// ---------------------------------------------------------------------------
// Movements (~15)
// ---------------------------------------------------------------------------

export const demoMovements: DemoInventoryMovement[] = [
  { batchPackageTag: '1A40060000001B1000001234', movementType: 'receive',    quantity:  5000, movementDate: '2026-03-25T08:00:00Z', reference: 'PO-2026-0041' },
  { batchPackageTag: '1A40060000001B1000001234', movementType: 'transfer',   quantity:  -920, movementDate: '2026-04-01T10:30:00Z', reference: 'TRF-0098 → Oakland' },
  { batchPackageTag: '1A40060000002C2000005501', movementType: 'receive',    quantity:   920, movementDate: '2026-04-01T14:15:00Z', reference: 'TRF-0098 from Richmond' },
  { batchPackageTag: '1A40060000001B1000001235', movementType: 'receive',    quantity:  2500, movementDate: '2026-03-27T09:00:00Z', reference: 'PO-2026-0043' },
  { batchPackageTag: '1A40060000001B1000001235', movementType: 'waste',      quantity:  -300, movementDate: '2026-04-03T16:00:00Z', reference: 'QA-FAIL-0012' },
  { batchPackageTag: '1A40060000001B1000001236', movementType: 'receive',    quantity:   400, movementDate: '2026-03-28T07:30:00Z', reference: 'PO-2026-0044' },
  { batchPackageTag: '1A40060000001B1000001236', movementType: 'sale',       quantity:   -60, movementDate: '2026-04-04T11:20:00Z', reference: 'INV-2026-1102' },
  { batchPackageTag: '1A40060000002C2000005502', movementType: 'receive',    quantity:   200, movementDate: '2026-04-02T08:00:00Z', reference: 'PO-2026-0047' },
  { batchPackageTag: '1A40060000002C2000005502', movementType: 'sale',       quantity:   -50, movementDate: '2026-04-05T13:45:00Z', reference: 'INV-2026-1210' },
  { batchPackageTag: '1A40060000001B1000001238', movementType: 'receive',    quantity:   600, movementDate: '2026-03-30T10:00:00Z', reference: 'PO-2026-0045' },
  { batchPackageTag: '1A40060000002C2000005503', movementType: 'receive',    quantity:    80, movementDate: '2026-04-01T09:00:00Z', reference: 'TRF-0099 from Richmond' },
  { batchPackageTag: '1A40060000002C2000005503', movementType: 'sale',       quantity:   -68, movementDate: '2026-04-05T17:30:00Z', reference: 'INV-2026-1215' },
  { batchPackageTag: '1A40060000001B100000123A', movementType: 'receive',    quantity:    45, movementDate: '2026-04-02T07:00:00Z', reference: 'PO-2026-0046' },
  { batchPackageTag: '1A40060000001B100000123A', movementType: 'adjustment', quantity:     0, movementDate: '2026-04-04T09:00:00Z', reference: 'QA-HOLD-0003 quarantine' },
  { batchPackageTag: '1A40060000002C2000005505', movementType: 'sale',       quantity:  -140, movementDate: '2026-04-06T12:00:00Z', reference: 'INV-2026-1220' },
];

// ---------------------------------------------------------------------------
// Metrc Sync Statuses
// ---------------------------------------------------------------------------

export const demoSyncStatuses: DemoMetrcSyncStatus[] = [
  {
    locationName: 'Richmond Manufacturing Hub',
    lastSyncAt: '2026-04-06T14:32:00Z',
    status: 'synced',
    recordsProcessed: 1247,
    nextScheduledSync: '2026-04-06T20:00:00Z',
  },
  {
    locationName: 'Oakland Dispensary',
    lastSyncAt: '2026-04-06T15:01:00Z',
    status: 'pending',
    recordsProcessed: 863,
    nextScheduledSync: '2026-04-06T21:00:00Z',
  },
];

// ---------------------------------------------------------------------------
// Summary helper
// ---------------------------------------------------------------------------

export interface InventorySummary {
  totalProducts: number;
  totalBatches: number;
  totalUnitsOnHand: number;
  totalCostBasis: number;
  driftPercent: number;
  lowStockCount: number;
  quarantinedCount: number;
}

export function summarizeInventory(): InventorySummary {
  const totalProducts = demoProducts.filter((p) => p.active).length;
  const totalBatches = demoBatches.length;
  const totalUnitsOnHand = demoBatches.reduce((s, b) => s + b.quantityOnHand, 0);
  const totalCostBasis = demoBatches.reduce((s, b) => s + b.costBasis, 0);
  const lowStockCount = demoBatches.filter((b) => b.status === 'low_stock').length;
  const quarantinedCount = demoBatches.filter((b) => b.status === 'quarantined').length;

  // Simulated drift: difference between METRC expected vs local count (demo: 1.3%)
  const driftPercent = 1.3;

  return {
    totalProducts,
    totalBatches,
    totalUnitsOnHand,
    totalCostBasis,
    driftPercent,
    lowStockCount,
    quarantinedCount,
  };
}
