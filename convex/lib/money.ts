/**
 * Money handling for tax amounts.
 *
 * WHY THIS EXISTS
 *
 * tax.ts computed `taxableAmount * rate` as an unrounded float, stored it as a
 * float, and accumulated with `totalTax +=`. Filings need cent precision, and
 * float error compounds across a period. Meanwhile business.ts already stored
 * money as integer cents — the billing layer had the right convention and the
 * tax layer did not.
 *
 * THE RULES, AND WHERE THEY COME FROM
 *
 * 1. Integer minor units. Cents are stored as integers. A cent is the smallest
 *    unit that can actually change hands, so it is the natural atom.
 *
 * 2. Round half UP, not half-to-even. The IRS states the method directly:
 *    drop amounts under 50 cents, increase 50–99 cents to the next dollar —
 *    "$2.50 becomes $3". Banker's rounding (round-half-to-even) is the IEEE
 *    default and a common instinct, but it would send 2.50 to 2 and contradict
 *    that example. For anything touching a return, banker's is wrong.
 *
 * 3. Round once, at the point money changes hands. The IRS is explicit for
 *    return preparation: "If two or more amounts are added to figure the amount
 *    to enter on a line, include cents when adding the amounts and round off
 *    only the total." So intermediate sums are never re-rounded.
 *
 *    For excise and sales tax there is a stronger reason than convention: the
 *    tax was actually collected from a customer in whole cents at the register.
 *    The liability is not a figure to re-derive at filing time — it is the sum
 *    of what was charged. Computing it differently from the POS means the
 *    filing will not tie to the register, and reconciling to POS and Metrc is
 *    a core promise of this product.
 *
 * Sources:
 *   Rounding off to whole dollars — IRS Form 1040 / 1040-NR instructions
 *   Instructions for Form 1042 (2025), Instructions for Form 8725 (12/2025)
 */

/** A monetary amount in integer cents. Never a float. */
export type Cents = number;

export class MoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MoneyError";
  }
}

/**
 * Round to the nearest cent, halves away from zero.
 *
 * Math.round() is half-UP toward positive infinity, so it rounds -2.5 to -2
 * rather than -3 — asymmetric for negatives. Tax amounts should be
 * symmetric: a refund of 2.5 cents and a charge of 2.5 cents round by the same
 * magnitude.
 */
export function roundToCents(amount: number): Cents {
  if (!Number.isFinite(amount)) {
    throw new MoneyError(`Cannot round a non-finite amount: ${amount}`);
  }
  const scaled = amount * 100;
  // Nudge by an epsilon proportional to the value before rounding. Without it
  // 1.005 * 100 is 100.49999999999999 in binary floating point and rounds down,
  // which is the classic cent-off bug.
  const nudged =
    scaled >= 0
      ? Math.floor(scaled + 0.5 + Number.EPSILON * Math.abs(scaled))
      : Math.ceil(scaled - 0.5 - Number.EPSILON * Math.abs(scaled));
  return nudged;
}

/** Apply a rate to a base amount, returning whole cents. */
export function applyRate(baseAmount: number, rate: number): Cents {
  if (!Number.isFinite(baseAmount) || !Number.isFinite(rate)) {
    throw new MoneyError(
      `Cannot apply rate ${rate} to amount ${baseAmount}: both must be finite.`
    );
  }
  return roundToCents(baseAmount * rate);
}

/** Convert a decimal amount (e.g. 1999.99) to cents. */
export function toCents(amount: number): Cents {
  return roundToCents(amount);
}

/** Convert cents back to a decimal amount, for display only. */
export function fromCents(cents: Cents): number {
  return cents / 100;
}

/**
 * Sum cents. Trivial, but named so that call sites read as "sum stored amounts"
 * rather than "recompute" — integer addition is exact, so no rounding occurs.
 */
export function sumCents(values: Cents[]): Cents {
  let total = 0;
  for (const v of values) {
    if (!Number.isInteger(v)) {
      throw new MoneyError(
        `sumCents received ${v}, which is not an integer. Amounts must be ` +
          `converted with toCents() before being summed.`
      );
    }
    total += v;
  }
  return total;
}

/**
 * Round cents to whole dollars for a federal return.
 *
 * Per the IRS: drop under 50 cents, increase 50–99 to the next dollar. Apply
 * this ONLY to a final total — never to intermediate amounts that will be added
 * together, since the instructions require cents to be retained while adding.
 */
export function toWholeDollars(cents: Cents): number {
  if (!Number.isInteger(cents)) {
    throw new MoneyError(
      `toWholeDollars expects integer cents, received ${cents}.`
    );
  }
  const sign = cents < 0 ? -1 : 1;
  const abs = Math.abs(cents);
  return sign * Math.floor((abs + 50) / 100);
}

/** Format cents for display, e.g. 15012 -> "$150.12". */
export function formatCents(cents: Cents, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(fromCents(cents));
}
