/**
 * Prospect walkthrough — the sandbox path, end to end.
 *
 * A prospect clicks "create sandbox company" and lands in the dashboard. This
 * drives that path against real module code and asserts what they would see on
 * each page they open.
 *
 * WHY IT EXISTS
 *
 * The sandbox feature was fully built and had never run once. createSandboxTenant,
 * a 500-line seed, expiry banners and an upgrade path all existed; nothing
 * invoked them, and the seed carried six schema violations plus a company ID it
 * discarded. It could not have worked if anything had.
 *
 * That is the pattern this codebase keeps producing: a complete-looking feature
 * with no execution path. This test is the execution path.
 *
 * Run: npm run walkthrough:prospect
 */

import { TestDb, makeCtx, call } from "../convex/harness";
import { createSandboxTenant } from "../../convex/seed/sandboxSeed";
import { getSupportSchedule, getAllocationSummary } from "../../convex/allocationEngine";
import { listByCompany as listAllocations } from "../../convex/cogsAllocations";
import { getSandboxStatus } from "../../convex/sandbox";
import { getElection } from "../../convex/section471c";
import { listByCompany as listPolicies } from "../../convex/allocationPolicies";
import { getUnresolvedAlerts } from "../../convex/compliance";
import { getCurrentPeriod } from "../../convex/reportingPeriods";

type Finding = { severity: "works" | "friction" | "broken"; step: string; detail: string };
const findings: Finding[] = [];
const ok = (s: string, d: string) => { findings.push({ severity: "works", step: s, detail: d }); console.log(`  ✓ ${s} — ${d}`); };
const friction = (s: string, d: string) => { findings.push({ severity: "friction", step: s, detail: d }); console.log(`  ~ ${s} — ${d}`); };
const broken = (s: string, d: string) => { findings.push({ severity: "broken", step: s, detail: d }); console.log(`  ✗ ${s} — ${d}`); };

async function attempt(step: string, fn: () => Promise<string>) {
  try { ok(step, await fn()); } catch (e: any) { broken(step, e?.message ?? String(e)); }
}

const usd = (n: number) => (n ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD" });

async function main() {
  console.log("\nPROSPECT WALKTHROUGH — sandbox path");
  console.log("Someone evaluating Tranquillo Green clicks 'create sandbox company'\n");

  const db = new TestDb({});
  const ctx = makeCtx(db, { clerkId: "clerk_prospect" });

  console.log("STEP 1 — Create the sandbox");
  let companyId = "";
  await attempt("sandbox company created", async () => {
    const res: any = await createSandboxTenant(ctx, {
      userId: "clerk_prospect",
      businessType: "dispensary",
    });
    companyId = res.companyId;
    if (!companyId) throw new Error("no companyId returned");
    const c = await db.get(companyId);
    return `${c.name} — ${c.productionSqFt}/${c.totalSqFt} sq ft, ${c.inventoryRole}`;
  });
  if (!companyId) { report(); return; }

  await attempt("books are populated", async () => {
    const t = db.rows("transactions").length;
    const l = db.rows("transactionLines").length;
    const a = db.rows("chartOfAccounts").length;
    if (t === 0 || a === 0) throw new Error("empty books");
    return `${t} transactions, ${l} lines, ${a} accounts, ${db.rows("products").length} products`;
  });

  console.log("\nSTEP 2 — The banner that tells them it's a demo");
  await attempt("sandbox status is reported", async () => {
    const s: any = await call(getSandboxStatus, ctx, { companyId });
    if (!s.isSandbox) throw new Error("tenant is not flagged as sandbox");
    if (s.isExpired) throw new Error("brand new sandbox reports as expired");
    return `flagged sandbox, ${s.daysRemaining} days remaining`;
  });

  console.log("\nSTEP 3 — Landing in the dashboard shell");
  await attempt("active period resolves", async () => {
    const p: any = await call(getCurrentPeriod, ctx, { companyId });
    if (!p) throw new Error("no open period — the sidebar chip would be blank");
    return `${p.label} (${p.status})`;
  });

  await attempt("status bar has something true to say", async () => {
    const alerts: any = await call(getUnresolvedAlerts, ctx, { companyId });
    // Either state is honest. What matters is that it is computed.
    return alerts.length > 0
      ? `${alerts.length} unresolved compliance alert(s)`
      : "no open alerts — bar stays hidden";
  });

  console.log("\nSTEP 4 — 280E allocations, the page they came for");
  await attempt("471(c) election is readable", async () => {
    const e: any = await call(getElection, ctx, { companyId });
    if (!e) throw new Error("no election — the status panel would say 'none on file'");
    if (e.averageGrossReceipts == null) throw new Error("election has no receipts, panel cannot render");
    return `elected ${e.elected}, eligible ${e.eligible}, avg receipts ${usd(e.averageGrossReceipts)}`;
  });

  await attempt("the engine actually ran", async () => {
    const s: any = await call(getAllocationSummary, ctx, { companyId });
    if (s.allocationCount === 0) {
      throw new Error("zero allocations — every 280E page would be empty");
    }
    return `${s.allocationCount} allocations, ${usd(s.totalDeductible)} COGS / ${usd(s.totalNondeductible)} nondeductible`;
  });

  await attempt("every allocation carries its measurement", async () => {
    const rows: any = await call(listAllocations, ctx, { companyId });
    const bare = rows.filter((r: any) => !r.basisExplanation);
    if (bare.length > 0) throw new Error(`${bare.length} allocation(s) with no stated basis`);
    return rows[0].basisExplanation;
  });

  console.log("\nSTEP 5 — The support schedule");
  await attempt("schedule builds and reconciles", async () => {
    const period: any = await call(getCurrentPeriod, ctx, { companyId });
    const rep: any = await call(getSupportSchedule, ctx, { companyId, periodLabel: period.label });
    // An empty schedule reconciles trivially, so "reconciles" alone proves
    // nothing. The first version of this check passed on zero rows and hid the
    // fact that a prospect lands on a period with no activity in it.
    if (rep.rows.length === 0) {
      throw new Error(
        `no rows in ${period.label} — the prospect lands on this period and the ` +
        `support schedule, the page the product is sold on, is blank`
      );
    }
    if (!rep.reconciliation.reconciles) throw new Error("schedule does not tie to its allocations");
    return `${rep.rows.length} row(s) in ${period.label}, ${usd(rep.summary.totalDeductible)} COGS, reconciles`;
  });

  console.log("\nSTEP 6 — What the engine refused, and why");
  await attempt("refusals reach the operator", async () => {
    const skips = db.rows("transactions").flatMap((t: any) =>
      (t.reclassificationSkips ?? []).map((s: any) => `${s.accountCode}: ${s.reason}`)
    );
    if (skips.length === 0) {
      throw new Error("nothing was refused — a demo where everything reclassifies is a red flag");
    }
    return skips[0];
  });

  console.log("\nSTEP 7 — Gaps a prospect would hit");
  const policies: any = await call(listPolicies, ctx, { companyId });
  if (policies.length === 0) {
    friction("no allocation policy seeded", "the policies page shows 'no active policy' on a fresh sandbox");
  } else {
    ok("allocation policy present", `${policies.length} policy/policies`);
  }

  report();
}

function report() {
  const w = findings.filter(f => f.severity === "works").length;
  const f = findings.filter(f => f.severity === "friction").length;
  const b = findings.filter(f => f.severity === "broken").length;
  console.log("\n" + "─".repeat(72));
  console.log(`RESULT: ${w} worked · ${f} friction · ${b} broken`);
  console.log("─".repeat(72) + "\n");
  if (b > 0) {
    console.log("BROKEN");
    findings.filter(x => x.severity === "broken").forEach(x => console.log(`  ✗ ${x.step}\n      ${x.detail}`));
    console.log("");
  }
  if (f > 0) {
    console.log("FRICTION");
    findings.filter(x => x.severity === "friction").forEach(x => console.log(`  ~ ${x.step}\n      ${x.detail}`));
    console.log("");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
