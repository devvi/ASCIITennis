import { describe, it, expect } from "vitest";
import { add } from "../src/math.js";

describe("add", () => {
  it("adds two positive numbers", () => {
    expect(add(2, 3)).toBe(5);
  });

  it("adds positive and negative numbers", () => {
    expect(add(5, -3)).toBe(2);
  });

  it("adds zero", () => {
    expect(add(0, 0)).toBe(0);
    expect(add(7, 0)).toBe(7);
    expect(add(0, 7)).toBe(7);
  });
});
