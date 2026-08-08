/**
 * Sandbox environment seed data — dispensary scenario (Colorado)
 * Creates a fully-populated demo tenant for new customer signups.
 *
 * Run: npx convex run --once createSandboxTenant
 */


/**
 * DEMO SCENARIO: "Green Cross Dispensary" — Denver, CO
 * - Single retail location (3000 sq ft)
 * - 100+ SKUs across flower, edibles, concentrates, topicals, accessories
 * - 6 months of activity (Jan–Jun 2025)
 * - Metrc-connected (dummy package tags, simulated sync disabled in sandbox)
 * - Tax: CO Excise 15%, CO Sales 5% — fully calculated
 * - COGS: FIFO costing, monthly allocations
 * - Section 471c election active (retailer, reclassifiable % 40%)
 */

export const createSandboxTenant = async (ctx: any, {
  userId,
  organizationId,
  businessType = "dispensary",
}: {
  userId: string;
  organizationId?: string;
  businessType?: "dispensary" | "cultivator" | "manufacturer";
}) => {
  /*
   * The company ID is the one Convex returns, not a generated UUID.
   *
   * This read `const companyId = uuidv4()` and then discarded the ID that
   * ctx.db.insert actually returned. Every child record — users, locations,
   * accounts, transactions, everything — was written with `companyId` set to a
   * UUID belonging to no row in the database.
   *
   * Convex validates v.id("cannabisCompanies") and would have rejected the
   * first of them. Had it not, the tenant would have been created and then been
   * completely unreachable: the company exists, and nothing points at it.
   */
  // ─── 1. Create Company ──────────────────────────────────────────────────
  const companyId = await ctx.db.insert("cannabisCompanies", {
    name: businessType === "dispensary" ? "Green Cross Dispensary" :
          businessType === "cultivator" ? "High Plains Cultivation" :
          "Elevation Extracts",
    slug: `demo-${Date.now()}`,
    timezone: "America/Denver",
    states: ["CO"],
    operatorType: businessType,
    primaryOperatorType: businessType,
    defaultAccountingMethod: "accrual",
    accountingMethods: ["cash", "accrual"],
    status: "active",

    /*
     * Measured bases. Without these the 280E engine correctly refuses every
     * reclassification — "this business has no square footage on file" — and a
     * prospect's demo would consist of the product declining to do the one
     * thing they came to see.
     *
     * These are the figures the engine divides to produce a defensible ratio,
     * and they are what the support schedule cites. 5,200 of 8,000 sq ft gives
     * 65% of occupancy costs inventoriable; 2,100 of 3,200 paid hours gives
     * 65.6% of labour.
     */
    inventoryRole: "producer",
    productionSqFt: 5_200,
    totalSqFt: 8_000,
    productionHours: 2_100,
    totalHours: 3_200,

    // sandbox fields
    sandboxMode: true,
    sandboxCreatedAt: Date.now(),
    sandboxExpiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000, // 14 days
  });

  // ─── 2. Company Admin User ─────────────────────────────────────────────
  await ctx.db.insert("users", {
    clerkId: userId,
    email: `demo-${Date.now()}@tranquillo.demo`,
    name: "Demo Operator",
    companyId,
    role: "admin",
  });

  // ─── 3. Clerk Org Bridge ────────────────────────────────────────────────
  if (organizationId) {
    await ctx.db.insert("organizationCompanies", {
      clerkOrgId: organizationId,
      companyId,
      role: "owner",
    });
  }

  // ─── 4. Location ─────────────────────────────────────────────────────────
  const location = await ctx.db.insert("cannabisLocations", {
    companyId,
    name: "Denver Retail Storefront",
    licenseNumber: "CO-RTL-2025-DEMO001",
    state: "CO",
    city: "Denver",
    isPrimary: true,
    squareFootage: 3000,
  });

  // ─── 5. Metrc License (dummy, sandbox ignores API) ───────────────────────
  await ctx.db.insert("cannabisLicenses", {
    companyId,
    locationId: location,
    licenseType: "Retail",
    state: "CO",
    licenseNumber: "CO-RTL-2025-DEMO001",
    // Schema fields are issuedAt/expiresAt as epoch ms, and status is required.
    // The seed passed issueDate/expiryDate as date strings — neither field
    // exists — and omitted status entirely.
    status: "active",
    issuedAt: new Date("2025-01-01").getTime(),
    // Deliberately inside the compliance alert window, so a prospect sees the
    // licence-expiry warning fire on real data rather than wondering whether
    // that part of the product works.
    expiresAt: Date.now() + 45 * 24 * 60 * 60 * 1000,
  });

  // ─── 6. Chart of Accounts (cannabis-specific) ───────────────────────────
  await seedChartOfAccounts(ctx, companyId);

  // ─── 7. Inventory: 100+ Products + Batches ──────────────────────────────
  await seedProductsAndInventory(ctx, companyId, location);

  // ─── 8. Counterparties (vendors + customers) ────────────────────────────
  await seedCounterparties(ctx, companyId);

  // ─── 9. Sales Transactions (100) ─────────────────────────────────────────
  await seedSales(ctx, companyId, location);

  // ─── 10. Vendor Invoices (COGS layers) ───────────────────────────────────
  await seedInvoices(ctx, companyId, location);

  // ─── 11. Journal Entries (auto-generated by tax/COGS engine) ────────────
  await seedJournalEntries(ctx, companyId);

  // ─── 12. Tax Profile & Rates ─────────────────────────────────────────────
  await seedTaxProfile(ctx, companyId);

  // ─── 13. Section 471(c) Election ────────────────────────────────────────
  await seedSection471c(ctx, companyId);

  // ─── 14. Reporting Periods (Jan–Jun 2025) ───────────────────────────────
  await seedReportingPeriods(ctx, companyId);

  // ─── 15. Cash Accounts ───────────────────────────────────────────────────
  await seedCashAccounts(ctx, companyId, location);

  // ─── 16. Integration Config (Metrc dummy) ───────────────────────────────
  await ctx.db.insert("integrationConfigs", {
    companyId,
    provider: "metrc",
    realmId: "sandbox-co",
    accessToken: "sandbox-dummy-token",
    refreshToken: "sandbox-dummy-refresh",
    // status, connectedAt, updatedAt and both token expiries are required and
    // were all missing; lastSyncAt and syncSchedule are not schema fields.
    accessTokenExpiresAt: Date.now() + 60 * 60 * 1000,
    refreshTokenExpiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    status: "disconnected",
    connectedAt: Date.now(),
    updatedAt: Date.now(),
  });

  // ─── 17. Allocation policy ───────────────────────────────────────────────
  /*
   * A sandbox with no policy shows "No active policy — nothing is governing how
   * shared costs split right now" on the allocations page, which is an accurate
   * message and a poor first impression. Square footage is the right default
   * here: the company has measured floor area on file, and it is the most
   * defensible basis available.
   */
  await ctx.db.insert("allocationPolicies", {
    companyId,
    name: "Facility costs by production area",
    method: "square_footage",
    effectiveFrom: "2025-01-01",
    status: "active",
  });

  // ─── 18. Run the 280E engine over the seeded books ──────────────────────
  await runReclassification(ctx, companyId);

  return { companyId };
};

/**
 * Put the seeded books through the actual 280E engine.
 *
 * Without this the sandbox loads data and stops. A prospect would sign in to
 * 154 transactions and find every allocation page empty — the books present,
 * the product absent. What they came to evaluate is the reclassification, and
 * it would never have run.
 *
 * The seed writes journals already marked posted, which bypasses the trigger in
 * transactions.postTransaction. So the engine is invoked directly here, on the
 * same code path a real posting takes.
 *
 * Nothing is precomputed. The percentages, the journals and the substantiation
 * a prospect sees are produced by the engine at seed time from the measurements
 * on the company record — which is the whole point. A demo of hardcoded results
 * would prove nothing, and this codebase has enough of those already.
 */
async function runReclassification(ctx: any, companyId: string) {
  const { apply471cReclassificationInline } = await import("../lib/reclassificationInline");

  const journals = await ctx.db
    .query("transactions")
    .withIndex("by_company", (q: any) => q.eq("companyId", companyId))
    .collect();

  let applied = 0;
  let declined = 0;

  for (const txn of journals) {
    // Skip anything the engine itself generated.
    if (txn.sourceLabel === "471c_reclassification") continue;

    const result: any = await apply471cReclassificationInline(ctx, txn._id);
    if (result?.applied) applied++;
    else if (result?.skipped?.length) declined++;
  }

  return { applied, declined };
}

// ═══════════════════════════════════════════════════════════════════════════
//  Seeder functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Chart of accounts for a sandbox tenant.
 *
 * THIS DID NOT WORK. Four separate defects, none of which could surface because
 * nothing ever called this function.
 *
 * 1. `category` used "income" and "expense". The schema union is
 *    asset | liability | equity | revenue | cogs | opex. Fourteen of the
 *    eighteen accounts carried a value the schema rejects, so Convex refused
 *    the very first insert — after the company row had already been written,
 *    leaving an orphaned sandbox tenant with no chart of accounts and no
 *    rollback.
 *
 * 2. `taxTreatment` is required by the schema and was omitted entirely.
 *
 * 3. `type` was passed and is not a schema field at all.
 *
 * The first was hidden by `category: acct.category as any`. The other two were
 * hidden because this function takes `ctx: any`, which turns every db call into
 * an untyped one. Three suppressions, one dead feature.
 *
 * 4. The codes disagreed with the allocation engine. 4400 was "Professional
 *    Services" and 4500 "Supplies & Packaging", but the engine reads 4400 as
 *    meals and entertainment and 4500 as lobbying — both permanently
 *    non-inventoriable under Reg. 1.471. A prospect's packaging costs would
 *    have been refused as if they were lobbying expenditure. Renumbered to
 *    codes that mean what they say.
 *
 * Categories and tax treatments are now the ones the 280E engine actually
 * reads: only `cogs` and `opex` accounts carry cost, and `taxTreatment`
 * "nondeductible" is what marks a cost as a reclassification candidate.
 */
async function seedChartOfAccounts(ctx: any, companyId: string) {
  const coa: Array<{
    code: string;
    name: string;
    category: "asset" | "liability" | "equity" | "revenue" | "cogs" | "opex";
    taxTreatment: "deductible" | "cogs" | "nondeductible";
  }> = [
    { code: "1000", name: "Cash", category: "asset", taxTreatment: "deductible" },
    { code: "1010", name: "Cash — Vault", category: "asset", taxTreatment: "deductible" },
    { code: "1200", name: "Inventory — Cannabis", category: "asset", taxTreatment: "cogs" },
    { code: "1300", name: "Prepaid Expenses", category: "asset", taxTreatment: "deductible" },
    { code: "2000", name: "Accounts Payable", category: "liability", taxTreatment: "deductible" },
    { code: "2100", name: "Sales Tax Payable", category: "liability", taxTreatment: "deductible" },
    { code: "2200", name: "Excise Tax Payable", category: "liability", taxTreatment: "deductible" },
    { code: "3000", name: "Member Equity", category: "equity", taxTreatment: "deductible" },
    { code: "4000", name: "Sales Revenue", category: "revenue", taxTreatment: "deductible" },
    { code: "4010", name: "Excise Tax Revenue", category: "revenue", taxTreatment: "deductible" },

    // Already COGS. Not reclassified — it is the destination, not a candidate.
    { code: "4100", name: "COGS — Cost of Goods Sold", category: "cogs", taxTreatment: "cogs" },
    { code: "4110", name: "COGS — 280E Reclassification", category: "cogs", taxTreatment: "cogs" },

    // Nondeductible under 280E alone; reclassification candidates given a
    // measured basis. Labour follows hours, occupancy follows square footage.
    { code: "4200", name: "Labor Expense", category: "opex", taxTreatment: "nondeductible" },
    { code: "4210", name: "Rent Expense", category: "opex", taxTreatment: "nondeductible" },
    { code: "4220", name: "Utilities", category: "opex", taxTreatment: "nondeductible" },
    { code: "4230", name: "Supplies & Packaging", category: "opex", taxTreatment: "nondeductible" },

    // Never inventoriable, whatever the basis. The engine declines these by
    // code and explains why — worth having in the demo, because watching the
    // product refuse a cost is more convincing than watching it accept one.
    { code: "4300", name: "Marketing & Advertising", category: "opex", taxTreatment: "nondeductible" },
    { code: "4310", name: "Professional Services — Selling", category: "opex", taxTreatment: "nondeductible" },
  ];

  for (const acct of coa) {
    await ctx.db.insert("chartOfAccounts", {
      companyId,
      code: acct.code,
      name: acct.name,
      category: acct.category,
      taxTreatment: acct.taxTreatment,
      isActive: true,
    });
  }
}

async function seedProductsAndInventory(
  ctx: any,
  companyId: string,
  locationId: string
) {
  // 30 Flower SKUs
  const flowerSkus = Array.from({ length: 30 }, (_, i) => ({
    sku: `FLW-${String(i + 1).padStart(3, "0")}`,
    name: `Premium Flower — ${["Blue Dream", "Girl Scout Cookies", "Gorilla Glue", "Jack Herer", "Pineapple Express", "Sour Diesel", "OG Kush", "Northern Lights", "Wedding Cake", "Gelato"][i % 10]} ${i + 1}g`,
    category: "flower",
    unitOfMeasure: "gram",
  }));

  // 20 Edible SKUs
  const edibleSkus = Array.from({ length: 20 }, (_, i) => ({
    sku: `EDB-${String(i + 1).padStart(3, "0")}`,
    name: `Gummy — ${["Sour Worms", "Peach Rings", "Watermelon", "Mixed Berry", "Citrus Burst"][i % 5]} ${(i + 1) * 10}mg`,
    category: "edibles",
    unitOfMeasure: "each",
  }));

  // 20 Concentrate SKUs
  const concentrateSkus = Array.from({ length: 20 }, (_, i) => ({
    sku: `CON-${String(i + 1).padStart(3, "0")}`,
    name: ` concentrates — ${["Shatter", "Wax", "Live Resin", "Distillate"][i % 4]} ${(i + 1) * 0.5}g`,
    category: "concentrates",
    unitOfMeasure: "gram",
  }));

  // 10 Topical SKUs
  const topicalSkus = Array.from({ length: 10 }, (_, i) => ({
    sku: `TOP-${String(i + 1).padStart(3, "0")}`,
    name: `Topical Cream — ${["Pain Relief", "Anti-Inflammatory", "Recovery"][i % 3]} ${30 + i * 5}ml`,
    category: "topicals",
    unitOfMeasure: "ml",
  }));

  // 20 Accessory SKUs (non-cannabis)
  const accessorySkus = Array.from({ length: 20 }, (_, i) => ({
    sku: `ACC-${String(i + 1).padStart(3, "0")}`,
    name: `Vape Pen — ${["Battery", "Charger", "Cartridge", "Case"][i % 4]} #${i + 1}`,
    category: "accessories",
    unitOfMeasure: "each",
  }));

  const allProducts = [...flowerSkus, ...edibleSkus, ...concentrateSkus, ...topicalSkus, ...accessorySkus];

  // Insert all products
  const productIds: string[] = [];
  for (const p of allProducts) {
    const id = await ctx.db.insert("products", {
      companyId,
      sku: p.sku,
      name: p.name,
      category: p.category,
      unitOfMeasure: p.unitOfMeasure,
      // Schema field is `active`, not `isActive`. metrcPackageId is not a
      // products field at all.
      active: true,
    });
    productIds.push(id);
  }

  // Create inventory batches (FIFO layers) — one per product
  for (const productId of productIds) {
    await ctx.db.insert("inventoryBatches", {
      companyId,
      productId,
      locationId,
      packageTag: `SANDBOX-${productId.slice(0, 8)}`,
      quantityOnHand: Math.floor(Math.random() * 50) + 10,
      // Schema calls this costBasis; receivedAt is not a field. `source` is
      // required and was missing.
      costBasis: Math.round((Math.random() * 20 + 5) * 100) / 100,
      source: "manual",
    });
  }
}

async function seedCounterparties(ctx: any, companyId: string) {
  // Vendors
  const vendors = [
    "Green Source Supply",
    "CannaCraft Distributors",
    "Elevated Extracts",
    "Golden Triangle Farm",
    "Rocky Mountain Rec",
  ];
  for (const v of vendors) {
    await ctx.db.insert("counterparties", {
      companyId,
      name: v,
      type: "vendor",
    });
  }

  // Customers (walk-ins — for sales demo)
  for (let i = 1; i <= 20; i++) {
    await ctx.db.insert("counterparties", {
      companyId,
      name: `Walk-in Customer #${i}`,
      type: "customer",
    });
  }
}

async function seedSales(ctx: any, companyId: string, locationId: string) {
  // Generate 100 sales across Jan–Jun 2025
  const products = await ctx.db.query("products").filter(q => q.eq(q.field("companyId"), companyId)).collect();

  for (let i = 0; i < 100; i++) {
    const saleDate = randomDate(new Date("2025-01-01"), new Date("2025-06-30"));
    const product = products[Math.floor(Math.random() * products.length)];
    const unitPrice = Math.floor(Math.random() * 80) + 20; // $20–100 retail
    const quantity = Math.floor(Math.random() * 3) + 1;
    const subtotal = unitPrice * quantity;
    const taxAmount = subtotal * 0.15 + subtotal * 0.05; // CO excise + sales

    const transaction = await ctx.db.insert("transactions", {
      companyId,
      locationId,
      transactionDate: saleDate.toISOString().split("T")[0],
      memo: `Sale #${1000 + i} — ${product.name}`,
      amount: subtotal + taxAmount,
      source: "pos_import",
      status: "posted",
      workflowStatus: "posted",
    });

    await ctx.db.insert("transactionLines", {
      transactionId: transaction,
      accountId: await lookupAccountId(ctx, companyId, "4000"), // Sales Revenue
      credit: subtotal,
    });

    // Tax breakdown
    await ctx.db.insert("transactionLines", {
      transactionId: transaction,
      accountId: await lookupAccountId(ctx, companyId, "4010"), // Excise Tax Rev
      credit: Math.round(subtotal * 0.15 * 100) / 100,
    });
    await ctx.db.insert("transactionLines", {
      transactionId: transaction,
      accountId: await lookupAccountId(ctx, companyId, "2100"), // Sales Tax Payable
      credit: Math.round(subtotal * 0.05 * 100) / 100,
    });

    await ctx.db.insert("transactionLines", {
      transactionId: transaction,
      accountId: await lookupAccountId(ctx, companyId, "1000"), // Cash
      debit: Math.round((subtotal + taxAmount) * 100) / 100,
    });
  }
}

async function seedInvoices(ctx: any, companyId: string, locationId: string) {
  // Vendor purchase invoices with FIFO-relevant unit costs
  const vendors = await ctx.db.query("counterparties")
    .filter(q => q.eq(q.field("companyId"), companyId))
    .filter(q => q.eq(q.field("type"), "vendor"))
    .collect();

  const products = await ctx.db.query("products").filter(q => q.eq(q.field("companyId"), companyId)).collect();

  for (let i = 0; i < 50; i++) {
    const invoiceDate = randomDate(new Date("2025-01-01"), new Date("2025-06-30"));
    const vendor = vendors[Math.floor(Math.random() * vendors.length)];
    const product = products[Math.floor(Math.random() * products.length)];
    const quantity = Math.floor(Math.random() * 20) + 1;
    const unitCost = Math.random() * 15 + 3; // $3–18 wholesale

    const transaction = await ctx.db.insert("transactions", {
      companyId,
      locationId,
      transactionDate: invoiceDate.toISOString().split("T")[0],
      memo: `Invoice #${5000 + i} — ${vendor.name}`,
      amount: Math.round(quantity * unitCost * 100) / 100,
      source: "manual",
      status: "posted",
      workflowStatus: "posted",
    });

    await ctx.db.insert("transactionLines", {
      transactionId: transaction,
      accountId: await lookupAccountId(ctx, companyId, "2000"), // AP
      credit: Math.round(quantity * unitCost * 100) / 100,
    });

    await ctx.db.insert("transactionLines", {
      transactionId: transaction,
      accountId: await lookupAccountId(ctx, companyId, "1200"), // Inventory
      debit: Math.round(quantity * unitCost * 100) / 100,
    });

    // Update batch quantity
    const batches = await ctx.db.query("inventoryBatches")
      .filter(q => q.eq(q.field("companyId"), companyId))
      .filter(q => q.eq(q.field("productId"), product))
      .collect();
    if (batches.length > 0) {
      const batch = batches[0];
      await ctx.db.patch(batch._id, { quantityOnHand: batch.quantityOnHand + quantity });
    }
  }
}

async function seedJournalEntries(ctx: any, companyId: string) {
  /*
   * One accrual per month, chosen so the demo shows the 280E engine making
   * three different kinds of decision rather than four of the same one:
   *
   *   rent (4210)      — reclassified on square footage, 65%
   *   labour (4200)    — reclassified on hours, 65.6%
   *   utilities (4220) — occupancy, follows square footage
   *   marketing (4300) — refused outright, and the engine says why
   *
   * The refusal matters more than the acceptances. A prospect evaluating a
   * 280E product has usually been sold optimistic reclassification before;
   * watching this one decline a cost it cannot defend is the differentiator.
   *
   * 4400 was referenced here and no longer exists — it was "Professional
   * Services" in a slot the engine reads as meals and entertainment.
   */
  /*
   * Every month gets the full set, including the last.
   *
   * The accruals previously stopped in April while the reporting periods ran to
   * June — and getCurrentPeriod returns the most recent open one. So a prospect
   * landed on June, opened the support schedule, and found it empty. The
   * flagship page of the product, blank, on a demo built to sell it.
   *
   * Each month now exercises all four outcomes: two measured reclassifications,
   * one account with no basis configured, and one refused as a matter of law.
   */
  const monthEnds = [
    "2025-01-31", "2025-02-28", "2025-03-31",
    "2025-04-30", "2025-05-31", "2025-06-30",
  ];

  const entries = monthEnds.flatMap((date) => [
    { date, desc: "Monthly accrual — rent", debit: "4210", credit: "2000", amount: 3_500 },
    { date, desc: "Monthly accrual — production labour", debit: "4200", credit: "2000", amount: 18_400 },
    { date, desc: "Monthly accrual — utilities", debit: "4220", credit: "2000", amount: 1_200 },
    { date, desc: "Monthly accrual — marketing", debit: "4300", credit: "2000", amount: 2_500 },
  ]);

  for (const e of entries) {
    const txn = await ctx.db.insert("transactions", {
      companyId,
      transactionDate: e.date,
      // Schema fields are memo/amount; description and totalAmount do not
      // exist, and source is required.
      memo: e.desc,
      amount: e.amount,
      source: "manual",
      status: "posted",
      workflowStatus: "posted",
    });

    await ctx.db.insert("transactionLines", {
      transactionId: txn,
      accountId: await lookupAccountId(ctx, companyId, e.debit),
      debit: e.amount,
    });
    await ctx.db.insert("transactionLines", {
      transactionId: txn,
      accountId: await lookupAccountId(ctx, companyId, e.credit),
      credit: e.amount,
    });
  }
}

async function seedTaxProfile(ctx: any, companyId: string) {
  // Get CO state jurisdiction
  const jur = await ctx.db.query("taxJurisdictions")
    .filter(q => q.eq(q.field("stateCode"), "CO"))
    .first();

  await ctx.db.insert("taxProfiles", {
    companyId,
    state: "CO",
    primaryJurisdictionId: jur?._id,
    nexusStates: ["CO"],
    // Keys must be "<STATE>-<taxType>" — tax.ts reads filingCalendar["CO-excise"].
    // These were previously "excise"/"sales", so every lookup missed and silently
    // fell back to "monthly".
    filingCalendar: { "CO-excise": "quarterly", "CO-sales": "monthly" },
    // taxTypesEnabled was { excise: true, sales: true }, but the schema declares
    // v.array(v.id("taxTypes")) — an object would fail validation. Omitted: it is
    // optional, and seeding real taxTypes ids would require looking them up.
    isPrimary: true, // required by the schema, and was missing
  });
}

async function seedSection471c(ctx: any, companyId: string) {
  await ctx.db.insert("section471cElections", {
    companyId,
    elected: true,
    electionDate: "2025-01-01",
    taxYear: 2025,
    /*
     * The receipts figures were missing entirely, along with
     * averageGrossReceipts and eligible — which are exactly the fields the
     * 471(c) status panel reads. The election would have been unreadable even
     * if the insert had succeeded.
     *
     * reclassifiablePct, capitalizationThreshold, capitalizationPolicyDescription
     * and uczMidpoint are not schema fields. reclassifiablePct in particular was
     * another flat 40% — the same invented constant removed from the engine and
     * from the support schedule page.
     */
    priorYear1: 2024,
    priorYear1Receipts: 4_100_000,
    priorYear2: 2023,
    priorYear2Receipts: 3_650_000,
    priorYear3: 2022,
    priorYear3Receipts: 3_200_000,
    averageGrossReceipts: (4_100_000 + 3_650_000 + 3_200_000) / 3,
    // Comfortably under the IRC 448(c) threshold, so a sandbox tenant is
    // genuinely eligible rather than being told so.
    eligible: true,
    electedBy: "sandbox",
    notes: "Sandbox demo election",
  });
}

async function seedReportingPeriods(ctx: any, companyId: string) {
  const periods = [
    { label: "Jan 2025", start: "2025-01-01", end: "2025-01-31", status: "closed" },
    { label: "Feb 2025", start: "2025-02-01", end: "2025-02-28", status: "closed" },
    { label: "Mar 2025", start: "2025-03-01", end: "2025-03-31", status: "closed" },
    { label: "Apr 2025", start: "2025-04-01", end: "2025-04-30", status: "open" },
    { label: "May 2025", start: "2025-05-01", end: "2025-05-31", status: "open" },
    { label: "Jun 2025", start: "2025-06-01", end: "2025-06-30", status: "open" },
  ];

  for (const p of periods) {
    await ctx.db.insert("reportingPeriods", {
      companyId,
      label: p.label,
      startDate: p.start,
      endDate: p.end,
      status: p.status as any,
    });
  }
}

async function seedCashAccounts(ctx: any, companyId: string, locationId: string) {
  await ctx.db.insert("cashAccounts", {
    companyId,
    locationId,
    name: "Main Vault",
    type: "vault",
    active: true,
  });

  await ctx.db.insert("cashAccounts", {
    companyId,
    locationId,
    name: "POS Cash Drawer",
    type: "drawer",
    active: true,
  });

  await ctx.db.insert("cashAccounts", {
    companyId,
    locationId: null,
    name: "Bank — Chase",
    type: "bank_clearing",
    active: true,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
//  Helpers
// ═══════════════════════════════════════════════════════════════════════════

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function lookupAccountId(ctx: any, companyId: string, code: string): Promise<string> {
  const acct = await ctx.db.query("chartOfAccounts")
    .filter(q => q.eq(q.field("companyId"), companyId))
    .filter(q => q.eq(q.field("code"), code))
    .first();
  if (!acct) throw new Error(`Account ${code} not found`);
  return acct._id;
}

export default createSandboxTenant;

