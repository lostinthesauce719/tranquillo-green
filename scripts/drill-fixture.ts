/**
 * Generates a schema-valid synthetic snapshot for the restore drill.
 *
 *   npx tsx scripts/drill-fixture.ts --out drill-source.ndjson
 *
 * Deliberately not random junk: every document has to satisfy Convex's real
 * schema validators on insert, and the set is chosen to exercise the shapes
 * that make restore hard — a deep reference chain (company → period →
 * transaction → line → account), an array of references, self-consistent
 * double-entry amounts, and optional-reference fields left unset.
 *
 * Contains no real data of any kind.
 */

import { writeFileSync } from "node:fs";

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i === -1 ? undefined : process.argv[i + 1];
}

const now = Date.now();
const docs: Array<Record<string, any>> = [];

/* ── company ─────────────────────────────────────────────────────── */
docs.push({
  _table: "cannabisCompanies",
  _id: "src_company_1",
  name: "Drill Cultivation Co",
  slug: "drill-cultivation-co",
  timezone: "America/Denver",
  states: ["CO"],
  operatorType: "vertical",
  defaultAccountingMethod: "accrual",
  status: "active",
});

/* ── locations ───────────────────────────────────────────────────── */
docs.push({
  _table: "cannabisLocations",
  _id: "src_loc_1",
  companyId: "src_company_1",
  name: "Denver Grow",
  licenseNumber: "402R-00001",
  state: "CO",
  city: "Denver",
  isPrimary: true,
  squareFootage: 12000,
});
docs.push({
  _table: "cannabisLocations",
  _id: "src_loc_2",
  companyId: "src_company_1",
  name: "Boulder Retail",
  licenseNumber: "402R-00002",
  state: "CO",
  city: "Boulder",
  isPrimary: false,
});

/* ── chart of accounts ───────────────────────────────────────────── */
const accounts: Array<[string, string, string, string, string]> = [
  ["src_acct_cash", "1010", "Operating Cash", "asset", "deductible"],
  ["src_acct_inv", "1125", "Inventory - Finished Goods", "asset", "cogs"],
  ["src_acct_ap", "2010", "Accounts Payable", "liability", "deductible"],
  ["src_acct_equity", "3010", "Members' Equity", "equity", "deductible"],
  ["src_acct_rev", "4010", "Retail Cannabis Sales", "revenue", "nondeductible"],
  ["src_acct_cogs", "5010", "Cost of Goods Sold - Flower", "cogs", "cogs"],
  ["src_acct_opex", "6210", "Marketing and Promotions", "opex", "nondeductible"],
];
for (const [id, code, name, category, taxTreatment] of accounts) {
  docs.push({
    _table: "chartOfAccounts",
    _id: id,
    companyId: "src_company_1",
    code,
    name,
    category,
    isActive: true,
    taxTreatment,
  });
}

/* ── reporting period ────────────────────────────────────────────── */
docs.push({
  _table: "reportingPeriods",
  _id: "src_period_1",
  companyId: "src_company_1",
  label: "2026-07",
  startDate: "2026-07-01",
  endDate: "2026-07-31",
  status: "review",
  taskSummary: { completed: 4, total: 9 },
  blockers: ["Cash reconciliation open"],
});

/* ── transactions + balanced lines ───────────────────────────────── */
// Sale: debit cash, credit revenue. Purchase: debit inventory, credit AP.
const entries: Array<{
  txn: string;
  date: string;
  memo: string;
  status: string;
  location?: string;
  lines: Array<{ id: string; account: string; debit?: number; credit?: number }>;
}> = [
  {
    txn: "src_txn_1",
    date: "2026-07-03",
    memo: "Retail sales — week 1",
    status: "posted",
    location: "src_loc_2",
    lines: [
      { id: "src_line_1", account: "src_acct_cash", debit: 42500 },
      { id: "src_line_2", account: "src_acct_rev", credit: 42500 },
    ],
  },
  {
    txn: "src_txn_2",
    date: "2026-07-11",
    memo: "Nutrient purchase",
    status: "posted",
    location: "src_loc_1",
    lines: [
      { id: "src_line_3", account: "src_acct_inv", debit: 8100 },
      { id: "src_line_4", account: "src_acct_ap", credit: 8100 },
    ],
  },
  {
    txn: "src_txn_3",
    date: "2026-07-18",
    memo: "COGS recognition",
    status: "posted",
    lines: [
      { id: "src_line_5", account: "src_acct_cogs", debit: 19750 },
      { id: "src_line_6", account: "src_acct_inv", credit: 19750 },
    ],
  },
  {
    // Unposted on purpose: statements must exclude it, and restore must
    // still carry it across.
    txn: "src_txn_4",
    date: "2026-07-29",
    memo: "Draft marketing accrual",
    status: "draft",
    lines: [
      { id: "src_line_7", account: "src_acct_opex", debit: 3300 },
      { id: "src_line_8", account: "src_acct_ap", credit: 3300 },
    ],
  },
];

for (const entry of entries) {
  docs.push({
    _table: "transactions",
    _id: entry.txn,
    companyId: "src_company_1",
    periodId: "src_period_1",
    ...(entry.location ? { locationId: entry.location } : {}),
    transactionDate: entry.date,
    source: "manual",
    memo: entry.memo,
    status: entry.status,
  });
  for (const line of entry.lines) {
    docs.push({
      _table: "transactionLines",
      _id: line.id,
      transactionId: entry.txn,
      accountId: line.account,
      ...(line.debit !== undefined ? { debit: line.debit } : {}),
      ...(line.credit !== undefined ? { credit: line.credit } : {}),
    });
  }
}

/* ── allocation referencing a transaction ────────────────────────── */
docs.push({
  _table: "cogsAllocations",
  _id: "src_alloc_1",
  companyId: "src_company_1",
  transactionId: "src_txn_3",
  basisType: "square_footage",
  deductibleAmount: 14200,
  nondeductibleAmount: 5550,
  reviewStatus: "needs_review",
});

/* ── products + inventory batches, including an array of references ─ */
docs.push({
  _table: "products",
  _id: "src_prod_1",
  companyId: "src_company_1",
  sku: "FL-BD-1G",
  name: "Blue Dream 1g",
  category: "flower",
  unitOfMeasure: "g",
  active: true,
});
docs.push({
  _table: "inventoryBatches",
  _id: "src_batch_1",
  companyId: "src_company_1",
  productId: "src_prod_1",
  locationId: "src_loc_1",
  packageTag: "1A4060300003F1000000101",
  quantityOnHand: 400,
  costBasis: 1200,
  source: "manual",
});
docs.push({
  _table: "inventoryBatches",
  _id: "src_batch_2",
  companyId: "src_company_1",
  productId: "src_prod_1",
  locationId: "src_loc_1",
  packageTag: "1A4060300003F1000000102",
  quantityOnHand: 250,
  costBasis: 780,
  source: "manual",
});
docs.push({
  _table: "inventoryBatches",
  _id: "src_batch_3",
  companyId: "src_company_1",
  productId: "src_prod_1",
  locationId: "src_loc_1",
  packageTag: "1A4060300003F1000000103",
  quantityOnHand: 650,
  costBasis: 1980,
  source: "manual",
  // The array-of-references case.
  mergedFrom: ["src_batch_1", "src_batch_2"],
  lastMergedAt: now,
});

/* ── metrc reconciliation ────────────────────────────────────────── */
docs.push({
  _table: "metrcPackages",
  _id: "src_pkg_1",
  companyId: "src_company_1",
  packageLabel: "1A4060300003F1000000101",
  product: "Blue Dream 1g",
  uom: "g",
  metrcQty: 400,
  bookQty: 397.5,
  status: "variance",
  source: "manual",
  lastSyncAt: now,
  createdAt: now,
  updatedAt: now,
});

/* ── employees ───────────────────────────────────────────────────── */
docs.push({
  _table: "employees",
  _id: "src_emp_1",
  companyId: "src_company_1",
  name: "Drill Trimmer",
  role: "Trimmer",
  payRate: 21,
  hoursPerPeriod: 160,
  allocation: 100,
  active: true,
  createdAt: now,
  updatedAt: now,
});

/* ── audit events referencing a transaction ──────────────────────── */
docs.push({
  _table: "auditTrailEvents",
  _id: "src_audit_1",
  companyId: "src_company_1",
  entityType: "transaction",
  entityId: "src_txn_3",
  action: "transaction_posted",
  actor: "drill@example.test",
  reason: "Posted during drill fixture generation",
  timestamp: now,
});

/* ── emit ────────────────────────────────────────────────────────── */
const tables = new Map<string, number>();
for (const doc of docs) tables.set(doc._table, (tables.get(doc._table) ?? 0) + 1);

const header = {
  _meta: "tranquillo-green-backup",
  version: 1,
  startedAt: new Date().toISOString(),
  convexUrl: "https://drill-fixture.local",
  tables: Array.from(tables.entries()).map(([table, documents]) => ({ table, documents })),
  totalDocuments: docs.length,
};

const out = arg("--out") ?? "drill-source.ndjson";
writeFileSync(out, [JSON.stringify(header), ...docs.map((d) => JSON.stringify(d))].join("\n") + "\n");

console.log(`Wrote ${out}`);
console.log(`  ${docs.length} documents across ${tables.size} tables`);
console.log(`  tables: ${Array.from(tables.keys()).join(", ")}`);
