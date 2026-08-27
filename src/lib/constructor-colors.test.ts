import { describe, it, expect } from "vitest";
import { getConstructorColor } from "./constructor-colors";

describe("getConstructorColor", () => {
  it("returns the known hex color for a current-grid constructor", () => {
    expect(getConstructorColor("ferrari")).toBe("#E8002D");
    expect(getConstructorColor("mercedes")).toBe("#27F4D2");
  });

  it("returns a neutral fallback color for an unknown constructorId", () => {
    expect(getConstructorColor("some_future_team")).toBe("#9CA3AF");
  });
});
