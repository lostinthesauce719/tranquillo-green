/**
 * Operator walkthrough — a full month for one fictional cannabis business.
 *
 * PURPOSE
 *
 * Every other test in this repo exercises one module. This drives a complete
 * month through all of them in sequence, the way a customer would: onboard,
 * set up a chart of accounts, elect 471(c), post a month of transactions,
 * allocate them under 280E, calculate tax, check the liability, and hand off a
 * packet to a CPA.
 *
 * Integration is where this codebase has historically failed — modules that
 * each looked fine but had never been run against one another.
 *
 * WHAT THIS DOES AND DOES NOT COVER
 *
 * Covers: the real Convex module code, called in a realistic order, with
 * realistic data, against the same database double the unit tests use.
 *
 * Does NOT cover: the browser, Clerk sign-in, the Next.js pages, or the actual
 * cloud deployment. A green run here means the backend logic composes; it does
 * not mean an operator can click through it.
 *
 * Run: npm run walkthrough
 */

import { TestDb, makeCtx, call } from "../convex/harness";

import { createCompany } from "../../convex/onboarding";
import { bulkUpsert as upsertAccounts } from "../../convex/chartOfAccounts";
import { create as createPeriod } from "../../convex/reportingPeriods";
import { recordElection, testEligibility } from "../../convex/section471c";
import { createManualJournal, postTransaction } from "../../convex/transactions";
import { create as createPolicy } from "../../convex/allocationPolicies";
import { allocateTransaction } from "../../convex/allocationEngine";
import { calculateTax, getTaxLiability } from "../../convex/tax";
import { createRun } from "../../convex/exportPackets";
import { apply471cReclassificationInline } from "../../convex/lib/reclassificationInline";
import { fromCents } from "../../convex/lib/money";

/* ─── Reporting ──────────────────────────────────────────────────────────── */

type Finding = { severity: "works" | "friction" | "broken"; step: string; detail: string };
const findings: Finding[] = [];
const ok = (step: string, detail: string) => {
  findings.push({ severity: "works", step, detail });
  console.log(`  ✓ ${step} — ${detail}`);
};
const friction = (step: string, detail: string) => {
  findings.push({ severity: "friction", step, detail });
  console.log(`  ~ ${step} — ${detail}`);
};
const broken = (step: string, detail: string) => {
  findings.push({ severity: "broken", step, detail });
  console.log(`  ✗ ${step} — ${detail}`);
};

async function attempt(step: string, fn: () => Promise<string>) {
  try {
    ok(step, await fn());
  } catch (e: any) {
    broken(step, e?.message ?? String(e));
  }
}

/* ─── The business ───────────────────────────────────────────────────────── */

const CLERK_ID = "clerk_verdant_owner";
const MARCH_1 = new Date(2026, 2, 1).getTime();
const MARCH_31 = new Date(2026, 3, 0).getTime();
const d = (day: number) => `2026-03-${String(day).padStart(2, "0")}`;

async function main() {
  console.log("\nVERDANT HOLLOW CULTIVATION & RETAIL, LLC");
  console.log("Colorado vertical operator — cultivation + dispensary");
  console.log("March 2026\n");

  const db = new TestDb({
    // A Clerk user exists after sign-in but has no company yet.
    users: [{ _id: "user_owner", clerkId: CLERK_ID, companyId: undefined, role: "owner" }],
    taxJurisdictions: [
      { _id: "jur_co", stateCode: "CO", jurisdictionName: "Colorado", companyId: null },
    ],
    taxTypes: [
      {
        _id: "tt_excise",
        code: "excise",
        name: "Cannabis Excise Tax",
        calculationBasis: "percentage",
        appliesToProductCategories: ["*"],
      },
      {
        _id: "tt_sales",
        code: "sales",
        name: "CO State Sales Tax",
        calculationBasis: "percentage",
        appliesToProductCategories: ["*"],
      },
    ],
    taxRates: [
      {
        jurisdictionId: "jur_co",
        taxTypeId: "tt_excise",
        rate: 0.15,
        rateType: "percentage",
        effectiveFrom: new Date(2025, 0, 1).getTime(),
        effectiveTo: null,
        lastVerifiedAt: new Date(2026, 0, 1).getTime(),
        sourceUrl: "https://tax.colorado.gov/marijuana-taxes",
      },
      {
        jurisdictionId: "jur_co",
        taxTypeId: "tt_sales",
        rate: 0.029,
        rateType: "percentage",
        effectiveFrom: new Date(2025, 0, 1).getTime(),
        effectiveTo: null,
        lastVerifiedAt: new Date(2026, 0, 1).getTime(),
      },
    ],
  });

  const ctx = makeCtx(db, { clerkId: CLERK_ID });

  /* ── 1. Onboarding ─────────────────────────────────────────────────────── */
  console.log("STEP 1 — Sign up and create the company");

  let companyId = "";
  await attempt("create company with measured bases", async () => {
    const res = await call(createCompany, ctx, {
      name: "Verdant Hollow Cultivation & Retail, LLC",
      states: ["CO"],
      operatorTypes: ["vertical", "cultivator", "dispensary"],
      accountingMethods: ["accrual"],
      inventoryRole: "producer",
      productionSqFt: 5200,
      totalSqFt: 8000,
      productionHours: 2100,
      totalHours: 3200,
      timezone: "America/Denver",
    });
    companyId = res?.companyId ?? db.rows("cannabisCompanies")[0]?._id;
    if (!companyId) throw new Error("no companyId returned");
    const c = await db.get(companyId);
    return `${c.name}, ${c.inventoryRole}, ${c.productionSqFt}/${c.totalSqFt} sq ft (${((c.productionSqFt / c.totalSqFt) * 100).toFixed(1)}% production)`;
  });

  if (!companyId) {
    console.log("\nCannot continue without a company.\n");
    return report();
  }

  // A tax profile is needed before tax can be calculated. Onboarding creates one.
  const profile = db.rows("taxProfiles")[0];
  if (profile) {
    ok("tax profile auto-created", `state ${profile.state}, calendar ${JSON.stringify(profile.filingCalendar)}`);
    if (!profile.primaryJurisdictionId) {
      friction(
        "tax profile has no jurisdiction",
        "onboarding does not link the CO jurisdiction, so calculateTax cannot resolve a rate without an explicit jurisdictionId"
      );
      await db.patch(profile._id, { primaryJurisdictionId: "jur_co", taxTypesEnabled: ["tt_excise", "tt_sales"] });
    }
  } else {
    broken("tax profile", "onboarding created no taxProfiles row");
  }

  /* ── 2. Chart of accounts ──────────────────────────────────────────────── */
  console.log("\nSTEP 2 — Set up the chart of accounts");

  const ACCOUNTS = [
    { code: "1000", name: "Cash", category: "asset", taxTreatment: "deductible" },
    { code: "1200", name: "Inventory", category: "asset", taxTreatment: "cogs" },
    { code: "2000", name: "Accounts Payable", category: "liability", taxTreatment: "deductible" },
    { code: "4000", name: "Retail Revenue", category: "revenue", taxTreatment: "deductible" },
    { code: "4110", name: "COGS — 280E Reclassification", category: "cogs", taxTreatment: "cogs" },
    { code: "4200", name: "Labor Expense", category: "opex", taxTreatment: "nondeductible" },
    { code: "4210", name: "Rent Expense", category: "opex", taxTreatment: "nondeductible" },
    { code: "4300", name: "Advertising", category: "opex", taxTreatment: "nondeductible" },
    { code: "5000", name: "Cost of Goods Sold", category: "cogs", taxTreatment: "cogs" },
  ];

  await attempt("bulk create 9 accounts", async () => {
    await call(upsertAccounts, ctx, {
      companyId,
      accounts: ACCOUNTS.map((a) => ({ ...a, isActive: true })),
    });
    return `${db.rows("chartOfAccounts").length} accounts created`;
  });

  const acct = (code: string) =>
    db.rows("chartOfAccounts").find((a: any) => a.code === code)?._id;

  /* ── 3. Reporting period ───────────────────────────────────────────────── */
  console.log("\nSTEP 3 — Open the March period");

  let periodId = "";
  await attempt("open March 2026", async () => {
    const res = await call(createPeriod, ctx, {
      companyId,
      label: "2026-03",
      startDate: "2026-03-01",
      endDate: "2026-03-31",
      status: "open",
      closeOwner: "Dana Ruiz",
    });
    periodId = res?._id ?? res ?? db.rows("reportingPeriods")[0]?._id;
    return `period ${db.rows("reportingPeriods")[0]?.label} open`;
  });

  /* ── 4. 471(c) election ────────────────────────────────────────────────── */
  console.log("\nSTEP 4 — Check and record the 471(c) election");

  await attempt("test eligibility", async () => {
    const res = await call(testEligibility, ctx, {
      companyId,
      priorYear1: 2023,
      priorYear1Receipts: 4_100_000,
      priorYear2: 2024,
      priorYear2Receipts: 5_400_000,
      priorYear3: 2025,
      priorYear3Receipts: 6_800_000,
    });
    return `avg $${res.averageGrossReceipts.toLocaleString()} vs $${res.threshold.toLocaleString()} (${res.thresholdSource}) — ${res.eligible ? "eligible" : "NOT eligible"}`;
  });

  await attempt("record the election", async () => {
    await call(recordElection, ctx, {
      companyId,
      taxYear: 2026,
      priorYear1: 2023,
      priorYear1Receipts: 4_100_000,
      priorYear2: 2024,
      priorYear2Receipts: 5_400_000,
      priorYear3: 2025,
      priorYear3Receipts: 6_800_000,
      notes: "Elected on timely filed 2026 return.",
      electedBy: "Dana Ruiz",
    });
    return "471(c) election recorded";
  });

  /* ── 5. A month of transactions ────────────────────────────────────────── */
  console.log("\nSTEP 5 — Post March transactions");

  const JOURNALS = [
    { day: 3, ref: "BILL-3011", memo: "Nutrients and growing media", debit: "5000", credit: "2000", amount: 12_400 },
    { day: 5, ref: "RENT-03", memo: "March facility rent", debit: "4210", credit: "1000", amount: 18_500 },
    { day: 12, ref: "PAY-0312", memo: "Payroll — cultivation and retail", debit: "4200", credit: "1000", amount: 47_200 },
    { day: 18, ref: "ADV-221", memo: "Billboard campaign", debit: "4300", credit: "1000", amount: 6_800 },
    { day: 24, ref: "BILL-3044", memo: "Packaging supplies", debit: "5000", credit: "2000", amount: 3_950 },
  ];

  const journalIds: string[] = [];
  for (const j of JOURNALS) {
    await attempt(`post ${j.ref} ($${j.amount.toLocaleString()})`, async () => {
      const res = await call(createManualJournal, ctx, {
        companyId,
        periodId: periodId || undefined,
        transactionDate: d(j.day),
        reference: j.ref,
        memo: j.memo,
        lines: [
          { accountId: acct(j.debit), debit: j.amount, credit: 0 },
          { accountId: acct(j.credit), debit: 0, credit: j.amount },
        ],
      });
      const id = res?.transactionId ?? res?._id ?? res;
      if (typeof id === "string") journalIds.push(id);
      return `${j.memo}`;
    });
  }

  /* ── 5b. Post the journals ─────────────────────────────────────────────── */
  console.log("\nSTEP 5b — Post the journals");

  for (const txnId of journalIds) {
    const txn = await db.get(txnId);
    await attempt(`post ${txn?.reference}`, async () => {
      const res: any = await call(postTransaction, ctx, { companyId, transactionId: txnId });
      if (!res?.posted) throw new Error("not posted");
      return `status now ${(await db.get(txnId)).status}`;
    });
  }

  /* ── 6. 471(c) reclassification ────────────────────────────────────────── */
  console.log("\nSTEP 6 — 471(c) reclassification on nondeductible costs");

  for (const txnId of journalIds) {
    const txn = await db.get(txnId);
    if (!txn) continue;
    try {
      const res: any = await apply471cReclassificationInline(ctx, txnId);
      if (res.applied) {
        ok(
          `reclassified ${txn.reference}`,
          res.basis
            .map((b: any) => `${b.accountCode}: ${b.explanation}`)
            .join(" | ")
        );
      } else if (res.skipped?.length) {
        for (const s of res.skipped) {
          friction(`skipped ${txn.reference} acct ${s.accountCode}`, s.reason);
        }
      }
    } catch (e: any) {
      broken(`reclassify ${txn.reference}`, e?.message ?? String(e));
    }
  }

  /* ── 7. COGS allocation ────────────────────────────────────────────────── */
  console.log("\nSTEP 7 — Allocate costs under 280E");

  let policyId = "";
  await attempt("create a square-footage allocation policy", async () => {
    const res = await call(createPolicy, ctx, {
      companyId,
      name: "Facility costs by production area",
      method: "square_footage",
      effectiveFrom: "2026-01-01",
      status: "active",
    });
    policyId = res?._id ?? res ?? db.rows("allocationPolicies")[0]?._id;
    return "policy active";
  });

  const company = await db.get(companyId);
  for (const txnId of journalIds.slice(0, 3)) {
    const txn = await db.get(txnId);
    await attempt(`allocate ${txn?.reference}`, async () => {
      await call(allocateTransaction, ctx, {
        companyId,
        transactionId: txnId,
        policyId,
        basisDetails: {
          productionSqFt: company.productionSqFt,
          totalSqFt: company.totalSqFt,
        },
      });
      const a = db.rows("cogsAllocations").find((x: any) => x.transactionId === txnId);
      if (!a) throw new Error("no allocation recorded");
      return `COGS $${a.deductibleAmount.toLocaleString()} / non-COGS $${a.nondeductibleAmount.toLocaleString()}${a.warnings?.length ? ` — ${a.warnings.length} warning(s)` : ""}`;
    });
  }

  /* ── 8. Retail sales and tax ───────────────────────────────────────────── */
  console.log("\nSTEP 8 — Calculate tax on March retail sales");

  const SALES = [412.5, 88.99, 1_240.0, 76.25, 2_015.75, 33.4];
  let taxRuns = 0;
  for (const amount of SALES) {
    try {
      await call(calculateTax, ctx, {
        companyId,
        transactionAmount: amount,
        productCategory: "flower",
        jurisdictionId: "jur_co",
        taxTypeCodes: ["tt_excise", "tt_sales"],
        transactionDate: new Date(2026, 2, 15).getTime(),
      });
      taxRuns++;
    } catch (e: any) {
      broken(`tax on $${amount}`, e?.message ?? String(e));
      break;
    }
  }
  if (taxRuns === SALES.length) {
    const rows = db.rows("taxCalculations");
    const total = rows.reduce((s: number, r: any) => s + r.taxAmountCents, 0);
    ok(
      "tax calculated on all sales",
      `${rows.length} calculations, $${fromCents(total).toFixed(2)} total, all integer cents: ${rows.every((r: any) => Number.isInteger(r.taxAmountCents))}`
    );
  }

  await attempt("March tax liability", async () => {
    const liab = await call(getTaxLiability, ctx, {
      companyId,
      periodStart: MARCH_1,
      periodEnd: MARCH_31,
    });
    if (liab.byJurisdiction.length === 0) throw new Error("no liability returned for the period");
    const j = liab.byJurisdiction[0];
    return `${j.name}: $${fromCents(j.totalCents).toFixed(2)} across ${j.byTaxType.length} tax types (grand total $${fromCents(liab.grandTotalCents).toFixed(2)})`;
  });

  /* ── 9. CPA handoff ────────────────────────────────────────────────────── */
  console.log("\nSTEP 9 — Hand off to the CPA");

  const packet = {
    companyId,
    periodId: periodId || undefined,
    bundleId: "cpa-march-2026",
    bundleName: "March 2026 CPA packet",
    periodLabel: "2026-03",
    recipient: "Alvarez & Chen CPAs",
    owner: "Dana Ruiz",
    status: "generated" as const,
    selectedFormats: ["csv", "pdf"],
    selectedSchedules: ["280e-allocation", "tax-liability", "trial-balance"],
    selectedChecklistTitles: ["Bank reconciliation", "Metrc reconciliation"],
    coverMemoMode: "cpa_handoff" as const,
    includeDeliveryNotes: true,
    generatedBy: "Dana Ruiz",
    detail: "March close packet",
    blockers: [],
  };

  let gateFired = false;
  try {
    await call(createRun, ctx, packet);
    friction(
      "packet generated with no confirmation",
      "expected the gate to stop this — the 471(c) reclassification is a contested position"
    );
  } catch (e: any) {
    if (/understand/i.test(e.message)) {
      gateFired = true;
      ok("gate refused the packet", e.message.split("\n")[0]);
    } else {
      broken("CPA packet", e?.message ?? String(e));
    }
  }

  if (gateFired) {
    await attempt("wrong phrase is rejected", async () => {
      try {
        await call(createRun, ctx, { ...packet, acknowledgement: "understood" });
        throw new Error("'understood' was accepted — it should not be");
      } catch (e: any) {
        if (/understand/i.test(e.message)) return "'understood' correctly rejected";
        throw e;
      }
    });

    await attempt("packet generated after confirmation", async () => {
      await call(createRun, ctx, { ...packet, acknowledgement: "understand" });
      const run = db.rows("exportPacketRuns")[0];
      if (!run) throw new Error("no packet run recorded");
      if (!run.acknowledgedBy) throw new Error("acknowledgement not recorded on the run");
      return `packet recorded, confirmed by ${run.acknowledgedBy}, ${run.acknowledgedWarnings?.length ?? 0} position(s) affirmed`;
    });
  }

  /* ── 10. Verify the numbers, not just that it ran ──────────────────────── */
  console.log("\nSTEP 10 — Check the arithmetic");

  const reclassTxns = db.rows("transactions").filter((t: any) => t.sourceLabel === "471c_reclassification");
  if (reclassTxns.length === 0) {
    broken("471(c) reclassification produced nothing", "rent and labour are the costs this exists to treat");
  } else {
    for (const rt of reclassTxns) {
      const lines = db.rows("transactionLines").filter((l: any) => l.transactionId === rt._id && l.credit > 0);
      for (const l of lines) {
        ok(`reclassified $${l.credit.toLocaleString()}`, l.basisExplanation ?? "(no basis recorded)");
      }
    }
  }

  // Rent: 18,500 at 5,200/8,000 sq ft = 65% -> 12,025 inventoriable.
  const rentReclass = db.rows("transactionLines").find(
    (l: any) => l.basisKind === "square_footage" && l.credit > 0
  );
  if (rentReclass) {
    const expected = Math.round(18_500 * (5200 / 8000) * 100) / 100;
    if (Math.abs(rentReclass.credit - expected) < 0.01) {
      ok("rent reclassification is arithmetically right", `$${rentReclass.credit.toLocaleString()} = 18,500 x 65%`);
    } else {
      broken("rent reclassification wrong", `got $${rentReclass.credit}, expected $${expected}`);
    }
  }

  // Labour: 47,200 at 2,100/3,200 hours = 65.625% -> 30,975.
  const laborReclass = db.rows("transactionLines").find(
    (l: any) => l.basisKind === "labor_hours" && l.credit > 0
  );
  if (laborReclass) {
    const expected = Math.round(47_200 * (2100 / 3200) * 100) / 100;
    if (Math.abs(laborReclass.credit - expected) < 0.01) {
      ok("labour reclassification is arithmetically right", `$${laborReclass.credit.toLocaleString()} = 47,200 x 65.625%`);
    } else {
      broken("labour reclassification wrong", `got $${laborReclass.credit}, expected $${expected}`);
    }
  }

  // Advertising must never be reclassified, whatever the basis.
  const advReclass = db.rows("transactionLines").find((l: any) => l.basisExplanation?.includes("Advertising"));
  if (advReclass) {
    broken("advertising was reclassified", "a selling cost is not inventoriable under 1.471-3 or 1.471-11");
  } else {
    ok("advertising correctly left alone", "selling costs are never inventoriable");
  }

  // Every reclassification journal must balance.
  for (const rt of reclassTxns) {
    const lines = db.rows("transactionLines").filter((l: any) => l.transactionId === rt._id);
    const dr = lines.reduce((s: number, l: any) => s + (l.debit ?? 0), 0);
    const cr = lines.reduce((s: number, l: any) => s + (l.credit ?? 0), 0);
    if (Math.abs(dr - cr) > 0.01) {
      broken(`reclassification journal unbalanced`, `debits ${dr} vs credits ${cr}`);
    }
  }
  ok("all reclassification journals balance", `${reclassTxns.length} journal(s) checked`);

  // Allocation totals must equal the underlying expense.
  for (const a of db.rows("cogsAllocations")) {
    const txn = await db.get(a.transactionId);
    const lines = db.rows("transactionLines").filter((l: any) => l.transactionId === a.transactionId);
    let expense = 0;
    for (const l of lines) {
      const acct = await db.get(l.accountId);
      if (acct && (acct.category === "cogs" || acct.category === "opex")) {
        expense += (l.debit ?? 0) - (l.credit ?? 0);
      }
    }
    const allocated = a.deductibleAmount + a.nondeductibleAmount;
    if (Math.abs(allocated - expense) > 0.01) {
      broken(`allocation for ${txn?.reference} does not tie`, `allocated ${allocated} vs expense ${expense}`);
    }
  }
  ok("all allocations tie to their expense", `${db.rows("cogsAllocations").length} allocation(s) checked`);

  report();
}

function report() {
  const works = findings.filter((f) => f.severity === "works").length;
  const fric = findings.filter((f) => f.severity === "friction");
  const brk = findings.filter((f) => f.severity === "broken");

  console.log("\n" + "─".repeat(72));
  console.log(`RESULT: ${works} worked · ${fric.length} friction · ${brk.length} broken`);
  console.log("─".repeat(72));

  if (brk.length) {
    console.log("\nBROKEN");
    for (const f of brk) console.log(`  ✗ ${f.step}\n      ${f.detail}`);
  }
  if (fric.length) {
    console.log("\nFRICTION");
    for (const f of fric) console.log(`  ~ ${f.step}\n      ${f.detail}`);
  }
  console.log();
  if (brk.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error("\nWalkthrough aborted:", e);
  process.exitCode = 1;
});
