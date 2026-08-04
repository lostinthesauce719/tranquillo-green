/**
 * 471(c) reclassification basis — tests.
 *
 * These replace the hardcoded rent 45% / labour 55% table (with a 40% catch-all)
 * that generated tax positions from unsourced numbers.
 *
 * The governing principle: a missing measurement means "we do not know", and the
 * honest answer to "how much of this rent is inventoriable" is not a guess. The
 * engine reclassifies nothing and says what to record instead.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  resolveBasis,
  basisKindForAccount,
  NEVER_INVENTORIABLE_CODES,
  SECTION_471C_POSITION_EXPLAINER,
  type CompanyMeasurements,
} from "../lib/reclassificationBasis";
import {
  grossReceiptsThreshold,
  thresholdsAreStale,
  latestThresholdYear,
  ThresholdUnavailableError,
} from "../lib/taxConstants";

/* ─── Account routing ────────────────────────────────────────────────────── */

describe("basisKindForAccount", () => {
  it("routes occupancy costs to floor area", () => {
    assert.equal(basisKindForAccount("4210"), "square_footage");
  });

  it("routes payroll costs to hours worked", () => {
    assert.equal(basisKindForAccount("4200"), "labor_hours");
  });

  it("has no basis for an unmapped account", () => {
    // Previously these silently received the 40% catch-all.
    assert.equal(basisKindForAccount("4999"), null);
  });
});

/* ─── Measured bases ─────────────────────────────────────────────────────── */

const MEASURED: CompanyMeasurements = {
  productionSqFt: 6000,
  totalSqFt: 10000,
  productionHours: 1200,
  totalHours: 2000,
};

describe("resolveBasis — measured", () => {
  it("derives rent from floor area", () => {
    const r = resolveBasis("4210", "Rent Expense", MEASURED);
    assert.ok(r.ok);
    if (!r.ok) return;
    assert.equal(r.basis.ratio, 0.6);
    assert.equal(r.basis.kind, "square_footage");
    assert.match(r.basis.explanation, /6,000 sq ft.*10,000 sq ft.*60\.0%/);
    assert.deepEqual(r.basis.inputs, { productionSqFt: 6000, totalSqFt: 10000 });
  });

  it("derives labour from hours worked", () => {
    const r = resolveBasis("4200", "Labor Expense", MEASURED);
    assert.ok(r.ok);
    if (!r.ok) return;
    assert.equal(r.basis.ratio, 0.6);
    assert.equal(r.basis.kind, "labor_hours");
    assert.match(r.basis.explanation, /1,200 production hours.*2,000 total/);
  });

  it("records the inputs, not just the answer", () => {
    // Substantiation is the entire point: an examiner asks how the figure was
    // reached, and the inputs must be on file.
    const r = resolveBasis("4200", "Labor Expense", MEASURED);
    assert.ok(r.ok);
    if (!r.ok) return;
    assert.deepEqual(r.basis.inputs, { productionHours: 1200, totalHours: 2000 });
  });

  it("clamps a production area exceeding the total", () => {
    const r = resolveBasis("4210", "Rent", { productionSqFt: 50000, totalSqFt: 10000 });
    assert.ok(r.ok);
    if (!r.ok) return;
    assert.equal(r.basis.ratio, 1);
  });
});

/* ─── Refusals ───────────────────────────────────────────────────────────── */

describe("resolveBasis — refuses rather than guessing", () => {
  it("refuses rent when no square footage is on file", () => {
    const r = resolveBasis("4210", "Rent Expense", {});
    assert.equal(r.ok, false);
    if (r.ok) return;
    assert.match(r.refusal.reason, /no square\s+footage on file/);
    assert.match(r.refusal.whatToDo, /square footage/i);
  });

  it("refuses labour when no hours are on file", () => {
    const r = resolveBasis("4200", "Labor Expense", {});
    assert.equal(r.ok, false);
    if (r.ok) return;
    assert.match(r.refusal.whatToDo, /timesheets|payroll/i);
  });

  it("refuses an unmapped account instead of applying 40%", () => {
    // The single most damaging line of the old implementation:
    //   const pct = pctMap[acctCode] ?? defaultPct;   // 0.4
    const r = resolveBasis("4999", "Misc Expense", MEASURED);
    assert.equal(r.ok, false);
    if (r.ok) return;
    assert.match(r.refusal.reason, /No allocation basis is configured/);
  });

  it("refuses categorically non-inventoriable costs even with measurements", () => {
    // Advertising is a selling cost. No allocation basis makes it inventoriable
    // under 1.471-3 or 1.471-11 — yet it previously received 40%.
    for (const code of Object.keys(NEVER_INVENTORIABLE_CODES)) {
      const r = resolveBasis(code, NEVER_INVENTORIABLE_CODES[code], MEASURED);
      assert.equal(r.ok, false, `${code} must never be inventoriable`);
      if (r.ok) continue;
      assert.match(r.refusal.reason, /not inventoriable/);
    }
  });

  it("refuses a zero total area rather than dividing by zero", () => {
    const r = resolveBasis("4210", "Rent", { productionSqFt: 100, totalSqFt: 0 });
    assert.equal(r.ok, false);
  });
});

/* ─── Operator-declared figures ──────────────────────────────────────────── */

describe("resolveBasis — operator declared", () => {
  it("uses an explicitly entered percentage with its note", () => {
    const r = resolveBasis("4999", "Utilities", {
      declaredRatios: { "4999": { ratio: 0.3, note: "metered sub-panel on grow room" } },
    });
    assert.ok(r.ok);
    if (!r.ok) return;
    assert.equal(r.basis.ratio, 0.3);
    assert.equal(r.basis.kind, "operator_declared");
    assert.match(r.basis.explanation, /metered sub-panel/);
  });

  it("flags an entered percentage with no supporting note", () => {
    const r = resolveBasis("4999", "Utilities", {
      declaredRatios: { "4999": { ratio: 0.3 } },
    });
    assert.ok(r.ok);
    if (!r.ok) return;
    assert.match(r.basis.explanation, /No supporting note was recorded/);
  });

  it("rejects a declared ratio outside 0..1", () => {
    const r = resolveBasis("4999", "Utilities", {
      declaredRatios: { "4999": { ratio: 1.4 } },
    });
    assert.equal(r.ok, false);
  });

  it("a declared figure cannot resurrect a non-inventoriable account", () => {
    const r = resolveBasis("4300", "Advertising", {
      declaredRatios: { "4300": { ratio: 0.9, note: "we think it's production" } },
    });
    assert.equal(r.ok, false, "category rules outrank an operator override");
  });
});

/* ─── The contested position, explained ──────────────────────────────────── */

describe("SECTION_471C_POSITION_EXPLAINER", () => {
  it("states plainly that the position is contested", () => {
    assert.match(SECTION_471C_POSITION_EXPLAINER.headline, /contested/i);
    assert.match(SECTION_471C_POSITION_EXPLAINER.plainEnglish, /IRS disagrees/i);
  });

  it("names the specific IRS guidance", () => {
    assert.match(SECTION_471C_POSITION_EXPLAINER.plainEnglish, /CCA 201504011/);
    assert.ok(
      SECTION_471C_POSITION_EXPLAINER.sources.some((s) => s.includes("irs.gov")),
      "must cite a primary source the operator can read"
    );
  });

  it("avoids jargon a non-accountant would stumble on", () => {
    // The product exists to reduce reliance on an outside accountant, so the
    // explanation has to be usable by the operator.
    const text = SECTION_471C_POSITION_EXPLAINER.plainEnglish;
    for (const jargon of ["absorption", "capitalis", "capitaliz", "nondeductib"]) {
      assert.ok(
        !text.toLowerCase().includes(jargon),
        `plain-English explanation should avoid "${jargon}"`
      );
    }
  });
});

/* ─── Inflation-adjusted thresholds ──────────────────────────────────────── */

describe("grossReceiptsThreshold", () => {
  it("returns the 2026 figure of $32M", () => {
    // section471c.ts hardcoded 25,000,000 — the 2018 figure — denying the
    // election to every operator between $25M and $32M.
    const t = grossReceiptsThreshold(2026);
    assert.equal(t.amount, 32_000_000);
    assert.match(t.source, /Rev\. Proc\. 2025-32/);
  });

  it("returns the correct historical figures", () => {
    assert.equal(grossReceiptsThreshold(2018).amount, 25_000_000);
    assert.equal(grossReceiptsThreshold(2022).amount, 27_000_000);
    assert.equal(grossReceiptsThreshold(2024).amount, 30_000_000);
  });

  it("carries a citation for every year on file", () => {
    for (let y = 2018; y <= latestThresholdYear(); y++) {
      assert.ok(
        grossReceiptsThreshold(y).source.length > 0,
        `${y} must cite where its figure came from`
      );
    }
  });

  it("refuses an unpublished future year rather than extrapolating", () => {
    // A guessed threshold silently changes who qualifies for an election.
    assert.throws(
      () => grossReceiptsThreshold(latestThresholdYear() + 1),
      ThresholdUnavailableError
    );
  });

  it("explains how to fix a missing year", () => {
    try {
      grossReceiptsThreshold(latestThresholdYear() + 1);
      assert.fail("should have thrown");
    } catch (e: any) {
      assert.match(e.message, /taxConstants\.ts/);
      assert.match(e.message, /Revenue Procedure/);
    }
  });

  it("rejects years before the rule existed", () => {
    assert.throws(() => grossReceiptsThreshold(2015), /predates/);
  });

  it("reports staleness so constants get maintained", () => {
    assert.equal(thresholdsAreStale(latestThresholdYear()), false);
    assert.equal(thresholdsAreStale(latestThresholdYear() + 1), true);
  });
});
