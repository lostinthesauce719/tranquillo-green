/**
 * Money handling — tests.
 *
 * Tax amounts were unrounded floats accumulated with `+=`. These pin the rules:
 * integer cents, half-up rounding per the IRS method, and rounding only where
 * money actually changes hands.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  roundToCents,
  applyRate,
  toCents,
  fromCents,
  sumCents,
  toWholeDollars,
  formatCents,
  MoneyError,
} from "../lib/money";

/* ─── Rounding ───────────────────────────────────────────────────────────── */

describe("roundToCents", () => {
  it("rounds to whole cents", () => {
    assert.equal(roundToCents(1.234), 123);
    assert.equal(roundToCents(1.235), 124);
    assert.equal(roundToCents(0), 0);
  });

  it("rounds halves UP, matching the IRS method — not banker's rounding", () => {
    // The IRS states "$2.50 becomes $3". Banker's rounding (half-to-even) is
    // the IEEE default and a natural instinct, but it would give 2 here.
    assert.equal(roundToCents(0.025), 3, "2.5 cents must round to 3, not 2");
    assert.equal(roundToCents(0.035), 4, "3.5 cents must round to 4");
    assert.equal(roundToCents(0.045), 5, "4.5 cents must round to 5, not 4");
  });

  it("rounds negative halves away from zero, symmetrically", () => {
    // Math.round(-2.5) is -2 — it rounds toward positive infinity. A refund and
    // a charge of the same size should round by the same magnitude.
    assert.equal(roundToCents(-0.025), -3);
    assert.equal(roundToCents(-0.045), -5);
  });

  it("survives the classic binary floating point traps", () => {
    // 1.005 * 100 is 100.49999999999999 in IEEE 754, so a naive Math.round
    // gives 100 rather than 101 — the canonical cent-off bug.
    assert.equal(roundToCents(1.005), 101);
    assert.equal(roundToCents(1.015), 102);
    assert.equal(roundToCents(8.575), 858);
    assert.equal(roundToCents(0.1 + 0.2), 30); // 0.30000000000000004
  });

  it("refuses non-finite input rather than producing NaN cents", () => {
    assert.throws(() => roundToCents(Number.NaN), MoneyError);
    assert.throws(() => roundToCents(Number.POSITIVE_INFINITY), MoneyError);
  });

  it("always returns an integer", () => {
    for (const v of [1.005, 1999.99 * 0.029, 0.1 + 0.2, -3.456, 12345.678]) {
      assert.ok(Number.isInteger(roundToCents(v)), `${v} produced a non-integer`);
    }
  });
});

/* ─── Rate application ───────────────────────────────────────────────────── */

describe("applyRate", () => {
  it("applies a percentage rate and returns whole cents", () => {
    assert.equal(applyRate(1000, 0.15), 15000); // $150.00
    assert.equal(applyRate(1000, 0.029), 2900); // $29.00
  });

  it("rounds the awkward case that motivated this module", () => {
    // 1999.99 * 0.029 = 57.99971 — previously stored unrounded.
    assert.equal(applyRate(1999.99, 0.029), 5800); // $58.00
  });

  it("handles a zero rate and a zero base", () => {
    assert.equal(applyRate(1000, 0), 0);
    assert.equal(applyRate(0, 0.15), 0);
  });

  it("refuses non-finite inputs", () => {
    assert.throws(() => applyRate(1000, Number.NaN), MoneyError);
    assert.throws(() => applyRate(Number.NaN, 0.15), MoneyError);
  });
});

/* ─── Summation ──────────────────────────────────────────────────────────── */

describe("sumCents", () => {
  it("sums exactly, with no drift", () => {
    // The point of integer cents: this is exact where floats are not.
    const many = Array.from({ length: 1000 }, () => 10);
    assert.equal(sumCents(many), 10_000);
  });

  it("does not accumulate float error across a period", () => {
    // 10,000 transactions of $0.10 tax. In floats, 0.1 summed 10,000 times
    // drifts; in cents it cannot.
    const cents = Array.from({ length: 10_000 }, () => 10);
    assert.equal(sumCents(cents), 100_000); // exactly $1,000.00

    const floats = Array.from({ length: 10_000 }, () => 0.1);
    const floatTotal = floats.reduce((a, b) => a + b, 0);
    assert.notEqual(floatTotal, 1000, "float sum drifts — this is the bug");
  });

  it("refuses non-integer input rather than silently rounding", () => {
    // Catches a caller that skipped toCents().
    assert.throws(() => sumCents([100, 50.5]), MoneyError);
  });

  it("sums an empty list to zero", () => {
    assert.equal(sumCents([]), 0);
  });
});

/* ─── Whole dollars, for the federal return ──────────────────────────────── */

describe("toWholeDollars", () => {
  it("drops amounts under 50 cents", () => {
    assert.equal(toWholeDollars(139), 1); // $1.39 -> $1
    assert.equal(toWholeDollars(149), 1);
  });

  it("increases 50 to 99 cents to the next dollar", () => {
    assert.equal(toWholeDollars(250), 3, "the IRS example: $2.50 becomes $3");
    assert.equal(toWholeDollars(199), 2);
    assert.equal(toWholeDollars(150), 2);
  });

  it("handles negatives symmetrically", () => {
    assert.equal(toWholeDollars(-250), -3);
    assert.equal(toWholeDollars(-139), -1);
  });

  it("refuses non-integer cents", () => {
    assert.throws(() => toWholeDollars(150.5), MoneyError);
  });

  it("rounding the total differs from rounding each part — which is why order matters", () => {
    // The IRS requires cents to be retained while adding, and the total rounded
    // once. Three amounts of $0.40: rounded individually they vanish; summed
    // first they become $1.
    const parts = [40, 40, 40];
    const roundedEach = parts.reduce((sum, c) => sum + toWholeDollars(c), 0);
    const roundedTotal = toWholeDollars(sumCents(parts));
    assert.equal(roundedEach, 0);
    assert.equal(roundedTotal, 1);
    assert.notEqual(roundedEach, roundedTotal);
  });
});

/* ─── Conversion and display ─────────────────────────────────────────────── */

describe("conversion", () => {
  it("round-trips through cents", () => {
    for (const v of [0, 1.5, 1999.99, 12345.67]) {
      assert.equal(fromCents(toCents(v)), v);
    }
  });

  it("formats cents for display", () => {
    assert.equal(formatCents(15012), "$150.12");
    assert.equal(formatCents(0), "$0.00");
    assert.equal(formatCents(-2500), "-$25.00");
  });
});

/* ─── The property that matters for a filing ─────────────────────────────── */

describe("filing arithmetic", () => {
  it("a period total is the exact sum of what was charged", () => {
    // Each transaction's tax was rounded at the register. The liability is the
    // sum of those charged amounts, not a re-derivation from gross receipts —
    // which is what makes the filing tie to the POS.
    const sales = [19.99, 45.5, 132.75, 8.25, 1999.99];
    const rate = 0.029;

    const charged = sales.map((s) => applyRate(s, rate));
    const liability = sumCents(charged);

    // Recomputing from the gross total gives a different answer.
    const grossTotal = sales.reduce((a, b) => a + b, 0);
    const rederived = applyRate(grossTotal, rate);

    assert.equal(liability, charged.reduce((a, b) => a + b, 0));
    assert.ok(
      Math.abs(liability - rederived) <= sales.length,
      "the two methods differ by at most a cent per line — which is why the " +
        "charged amounts are authoritative"
    );
  });
});
