import assert from "node:assert";
import { describe, it } from "node:test";

describe("smoke", () => {
  it("sanity", () => {
    assert.strictEqual(1, 1);
  });
});
