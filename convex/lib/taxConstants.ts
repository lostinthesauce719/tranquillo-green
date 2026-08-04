/**
 * Effective-dated federal tax constants.
 *
 * WHY THIS FILE EXISTS
 *
 * section471c.ts hardcoded a $25,000,000 gross receipts threshold. That figure
 * was correct for tax year 2018 and has been inflation-adjusted every year
 * since under IRC 448(c)(4). By 2026 it is $32,000,000 — so the hardcoded value
 * was denying the 471(c) election to every operator between $25M and $32M, and
 * telling them they were ineligible when they were not.
 *
 * Constants that change annually must be data with a year and a source, never a
 * literal buried in a handler. Each entry below carries the Revenue Procedure it
 * came from so a reviewer can verify it without trusting this file.
 *
 * MAINTENANCE
 * The IRS publishes inflation adjustments each autumn for the following year.
 * Add the new entry when it is published; do not extrapolate. If a year is
 * missing, the lookup says so rather than guessing — a wrong threshold silently
 * changes who qualifies for an election.
 */

export interface ThresholdEntry {
  /** Tax years *beginning in* this calendar year. */
  year: number;
  amount: number;
  /** Where this figure was published. */
  source: string;
  sourceUrl?: string;
}

/**
 * IRC 448(c) gross receipts test. Referenced by 471(c) for the small business
 * inventory election, and by 263A and 163(j) for their own small-taxpayer
 * exceptions.
 */
export const GROSS_RECEIPTS_THRESHOLDS: ThresholdEntry[] = [
  { year: 2018, amount: 25_000_000, source: "TCJA / Rev. Proc. 2017-58" },
  { year: 2019, amount: 26_000_000, source: "Rev. Proc. 2018-57" },
  { year: 2020, amount: 26_000_000, source: "Rev. Proc. 2019-44" },
  { year: 2021, amount: 26_000_000, source: "Rev. Proc. 2020-45" },
  { year: 2022, amount: 27_000_000, source: "Rev. Proc. 2021-45" },
  { year: 2023, amount: 29_000_000, source: "Rev. Proc. 2022-38" },
  { year: 2024, amount: 30_000_000, source: "Rev. Proc. 2023-34" },
  { year: 2025, amount: 31_000_000, source: "Rev. Proc. 2024-40" },
  {
    year: 2026,
    amount: 32_000_000,
    source: "Rev. Proc. 2025-32",
    sourceUrl: "https://www.irs.gov/pub/irs-drop/rp-25-32.pdf",
  },
];

export class ThresholdUnavailableError extends Error {
  constructor(year: number) {
    super(
      `No published IRC 448(c) gross receipts threshold on file for tax year ${year}. ` +
        `The IRS publishes inflation adjustments each autumn for the following year. ` +
        `Add the figure to convex/lib/taxConstants.ts with its Revenue Procedure ` +
        `rather than estimating it — an incorrect threshold changes who qualifies ` +
        `for the 471(c) election.`
    );
    this.name = "ThresholdUnavailableError";
  }
}

/**
 * Threshold for a given tax year.
 *
 * Refuses rather than extrapolating. Getting this wrong in either direction is
 * harmful: too low denies a valid election, too high asserts an invalid one.
 */
export function grossReceiptsThreshold(taxYear: number): ThresholdEntry {
  const exact = GROSS_RECEIPTS_THRESHOLDS.find((t) => t.year === taxYear);
  if (exact) return exact;

  // Years before the TCJA rule existed are a different regime entirely.
  const earliest = GROSS_RECEIPTS_THRESHOLDS[0];
  if (taxYear < earliest.year) {
    throw new Error(
      `Tax year ${taxYear} predates the IRC 448(c) small business threshold ` +
        `introduced by the TCJA for years beginning after 2017.`
    );
  }

  throw new ThresholdUnavailableError(taxYear);
}

/** The most recent year on file — used to warn that constants may be stale. */
export function latestThresholdYear(): number {
  return GROSS_RECEIPTS_THRESHOLDS[GROSS_RECEIPTS_THRESHOLDS.length - 1].year;
}

/**
 * True when the table has not been updated for the year in question, meaning a
 * maintainer needs to add the newly published figure.
 */
export function thresholdsAreStale(currentYear: number): boolean {
  return currentYear > latestThresholdYear();
}
