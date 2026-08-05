/**
 * 471(c) reclassification basis resolution.
 *
 * WHAT THIS REPLACES
 *
 * reclassificationInline.ts carried a hardcoded table:
 *
 *   dispensary:   { "4210": 0.45, "4200": 0.55 }
 *   cultivator:   { "4210": 0.45, "4200": 0.55 }   // identical
 *   manufacturer: { "4210": 0.45, "4200": 0.55 }   // identical
 *   ...
 *   defaultPct = 0.4                                // ANY other account
 *
 * Three problems:
 *
 *  1. The percentages were identical for every operator type, so the table only
 *     looked like configuration. A cultivator's rent is grow space; a
 *     dispensary's is retail floor. They cannot produce the same figure.
 *  2. `reclassifiablePct` was read from the election record, but that field does
 *     not exist in the schema — so the 40% default applied to EVERY nondeductible
 *     account not explicitly listed, including advertising and selling costs,
 *     which are not inventoriable under 1.471-3 or 1.471-11 by any reading.
 *  3. Nothing was recorded about why. An audit turns on substantiation, and the
 *     one path that most needed an evidence trail had none.
 *
 * WHAT THIS DOES INSTEAD
 *
 * Resolves a percentage from measured operational data — the bases CCA 201504011
 * and Reg. 1.471-11 actually contemplate (direct labour hours, square footage).
 * Where no measurement exists, it reclassifies NOTHING and says precisely which
 * measurement is missing.
 *
 * The product goal is to reduce reliance on an outside accountant. That is met
 * by carrying the expertise — telling the operator what to measure and why —
 * not by guessing on their behalf and hoping the guess survives examination.
 */

/** Accounts that can never be inventoried, whatever the basis. */
export const NEVER_INVENTORIABLE_CODES: Record<string, string> = {
  "4300": "Advertising and marketing",
  "4310": "Selling expense",
  "4400": "Meals and entertainment",
  "4500": "Lobbying and political",
  "4600": "Fines and penalties",
};

export type BasisKind = "square_footage" | "labor_hours" | "operator_declared";

export interface MeasuredBasis {
  /** Which measurement drives this account's reclassification. */
  kind: BasisKind;
  /** Resolved fraction 0..1. */
  ratio: number;
  /** Plain-language account of how the ratio was derived, for the support file. */
  explanation: string;
  /** Values the ratio came from, retained as evidence. */
  inputs: Record<string, number>;
}

export interface BasisRefusal {
  reason: string;
  /** What the operator must supply to proceed. Written for a non-accountant. */
  whatToDo: string;
}

export type BasisResolution =
  | { ok: true; basis: MeasuredBasis }
  | { ok: false; refusal: BasisRefusal };

export interface CompanyMeasurements {
  /** Square footage used for production/cultivation, and total occupied. */
  productionSqFt?: number;
  totalSqFt?: number;
  /** Hours on production/inventory tasks, and total paid hours. */
  productionHours?: number;
  totalHours?: number;
  /**
   * Per-account overrides the operator or their accountant entered explicitly,
   * keyed by account code, expressed 0..1. Always accompanied by a note.
   */
  declaredRatios?: Record<string, { ratio: number; note?: string }>;
}

/**
 * Which measurement an account's cost should follow.
 *
 * OCCUPANCY — 4210–4212 (rent), 4220–4222 (utilities)
 *
 * Utilities were added on 2026-08-05 at the operator's direction, and it is a
 * tax position rather than a code fix, so the reasoning belongs here.
 *
 * Reg. 1.471-11(c)(2) enumerates the indirect production costs a taxpayer using
 * full absorption must include in inventoriable costs, and lists utilities in
 * the same category as rent. Both are costs of holding and running the
 * production space, so both scale with how much of that space is production —
 * which is what the square-footage ratio measures. Allocating utilities on a
 * different basis from the rent of the same building would be harder to defend
 * than allocating them the same way.
 *
 * This is still a position, not a certainty. A cultivator whose lighting and
 * HVAC load is overwhelmingly in the grow rooms is arguably under-allocating on
 * floor area; one with heavy front-of-house climate control is over-allocating.
 * An operator who can meter production space separately has a better basis than
 * this and should use it — declaredRatios exists for exactly that, and the
 * support schedule prints whichever was used.
 *
 * PAYROLL — 4200–4202, follows hours worked.
 */
export function basisKindForAccount(accountCode: string): BasisKind | null {
  // Occupancy costs follow floor area: rent and utilities alike.
  if (["4210", "4211", "4212", "4220", "4221", "4222"].includes(accountCode)) {
    return "square_footage";
  }
  // Payroll costs follow hours worked.
  if (["4200", "4201", "4202"].includes(accountCode)) return "labor_hours";
  return null;
}

/**
 * Resolve the reclassifiable fraction for one account.
 *
 * Returns a refusal rather than a fallback percentage. A missing measurement
 * means "we do not know", and the honest answer to "how much of this rent is
 * inventoriable" is not 45%.
 */
export function resolveBasis(
  accountCode: string,
  accountName: string,
  m: CompanyMeasurements
): BasisResolution {
  if (NEVER_INVENTORIABLE_CODES[accountCode]) {
    return {
      ok: false,
      refusal: {
        reason:
          `${accountName} (${accountCode}) is a selling or administrative cost. ` +
          "It is not inventoriable under Reg. 1.471-3 or 1.471-11 regardless of " +
          "the allocation basis used.",
        whatToDo:
          "Leave this cost as nondeductible. If you believe it is genuinely a " +
          "production cost, recode it to the correct account rather than " +
          "reclassifying it.",
      },
    };
  }

  // An explicit, documented figure from the operator takes precedence.
  const declared = m.declaredRatios?.[accountCode];
  if (declared) {
    if (declared.ratio < 0 || declared.ratio > 1) {
      return {
        ok: false,
        refusal: {
          reason: `The declared ratio for ${accountCode} is ${declared.ratio}, outside 0–1.`,
          whatToDo: "Enter a percentage between 0 and 100.",
        },
      };
    }
    return {
      ok: true,
      basis: {
        kind: "operator_declared",
        ratio: declared.ratio,
        explanation:
          `${(declared.ratio * 100).toFixed(1)}% of ${accountName} treated as ` +
          `inventoriable, as entered for this business` +
          (declared.note ? `: ${declared.note}` : ". No supporting note was recorded."),
        inputs: { declaredRatio: declared.ratio },
      },
    };
  }

  const kind = basisKindForAccount(accountCode);
  if (!kind) {
    return {
      ok: false,
      refusal: {
        reason:
          `No allocation basis is configured for ${accountName} (${accountCode}).`,
        whatToDo:
          "Set a percentage for this account in your allocation settings, with a " +
          "note explaining how you arrived at it — or leave it nondeductible.",
      },
    };
  }

  if (kind === "square_footage") {
    const prod = m.productionSqFt;
    const total = m.totalSqFt;
    if (!prod || !total || total <= 0) {
      return {
        ok: false,
        refusal: {
          reason:
            `${accountName} follows floor area, but this business has no square ` +
            "footage on file.",
          whatToDo:
            "Enter your production/cultivation square footage and your total " +
            "occupied square footage in company settings. Measure from your lease " +
            "or a floor plan and keep it — this is the evidence behind the number.",
        },
      };
    }
    const ratio = Math.max(0, Math.min(prod / total, 1));
    return {
      ok: true,
      basis: {
        kind,
        ratio,
        explanation:
          `${prod.toLocaleString()} sq ft of production space out of ` +
          `${total.toLocaleString()} sq ft total = ${(ratio * 100).toFixed(1)}% ` +
          `of ${accountName} treated as inventoriable.`,
        inputs: { productionSqFt: prod, totalSqFt: total },
      },
    };
  }

  const prodH = m.productionHours;
  const totalH = m.totalHours;
  if (!prodH || !totalH || totalH <= 0) {
    return {
      ok: false,
      refusal: {
        reason:
          `${accountName} follows hours worked, but this business has no labour ` +
          "hours on file.",
        whatToDo:
          "Record production hours and total paid hours for the period. Timesheets " +
          "or payroll exports are the usual source, and are what supports the " +
          "figure if it is ever questioned.",
      },
    };
  }
  const ratio = Math.max(0, Math.min(prodH / totalH, 1));
  return {
    ok: true,
    basis: {
      kind: "labor_hours",
      ratio,
      explanation:
        `${prodH.toLocaleString()} production hours out of ` +
        `${totalH.toLocaleString()} total paid hours = ${(ratio * 100).toFixed(1)}% ` +
        `of ${accountName} treated as inventoriable.`,
      inputs: { productionHours: prodH, totalHours: totalH },
    },
  };
}

/**
 * The one genuinely contested choice, written for an operator rather than a
 * practitioner. Surfaced at filing and CPA handoff so the decision is informed
 * and recorded — this is the position, not the arithmetic.
 */
export const SECTION_471C_POSITION_EXPLAINER = {
  code: "section_471c_position",
  headline:
    "Reclassifying indirect costs under a 471(c) election is a contested position.",
  plainEnglish:
    "Electing 471(c) lets a smaller business follow its own books for inventory, " +
    "and many cannabis operators use it to treat more costs as inventory — which " +
    "reduces tax, because cost of goods sold is not a deduction that 280E can " +
    "disallow. The IRS disagrees with this reading. In CCA 201504011 it stated " +
    "that a 280E taxpayer must use the inventory rules as they stood in 1982, " +
    "decades before 471(c) existed. Practitioners still take the position and it " +
    "has not been settled in court. Taking it is reasonable and common; it is not " +
    "risk-free, and it may be examined.",
  ifYouProceed:
    "Keep the measurements behind every allocation, apply the method consistently " +
    "year to year, and expect to explain it. This software retains the basis and " +
    "inputs for each reclassification so that record exists.",
  sources: [
    "IRS CCA 201504011 — https://www.irs.gov/pub/irs-wd/201504011.pdf",
    "IRC 471(c) — https://www.law.cornell.edu/uscode/text/26/471",
    "Reg. 1.471-11 (full absorption) — https://www.law.cornell.edu/cfr/text/26/1.471-11",
  ],
} as const;
