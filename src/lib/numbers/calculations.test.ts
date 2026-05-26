import { describe, it, expect } from "vitest";
import { calculateUsage, toNumber, toBoolean } from "./calculations";

describe("toNumber", () => {
  describe("number inputs", () => {
    it("should return the same number if valid", () => {
      expect(toNumber(42)).toBe(42);
      expect(toNumber(0)).toBe(0);
      expect(toNumber(-5)).toBe(-5);
      expect(toNumber(3.14)).toBe(3.14);
    });

    it("should return null for Infinity", () => {
      expect(toNumber(Infinity)).toBeNull();
      expect(toNumber(-Infinity)).toBeNull();
    });

    it("should return null for NaN", () => {
      expect(toNumber(NaN)).toBeNull();
    });
  });

  describe("string inputs", () => {
    it("should parse valid numeric strings", () => {
      expect(toNumber("42")).toBe(42);
      expect(toNumber("0")).toBe(0);
      expect(toNumber("-5")).toBe(-5);
      expect(toNumber("3.14")).toBe(3.14);
    });

    it("should handle strings with whitespace", () => {
      expect(toNumber("  42  ")).toBe(42);
      expect(toNumber("\t100\n")).toBe(100);
    });

    it("should replace comma with period for decimal separator", () => {
      expect(toNumber("3,14")).toBe(3.14);
      expect(toNumber("1,5")).toBe(1.5);
    });

    it("should return null for unavailable keywords", () => {
      expect(toNumber("n/a")).toBeNull();
      expect(toNumber("N/A")).toBeNull();
      expect(toNumber("unavailable")).toBeNull();
      expect(toNumber("UNAVAILABLE")).toBeNull();
      expect(toNumber("")).toBeNull();
    });

    it("should return null for non-numeric strings", () => {
      expect(toNumber("abc")).toBeNull();
      expect(toNumber("42abc")).toBeNull();
      expect(toNumber("abc42")).toBeNull();
    });
  });

  describe("null and undefined inputs", () => {
    it("should return null for null input", () => {
      expect(toNumber(null)).toBeNull();
    });

    it("should return null for undefined input", () => {
      expect(toNumber(undefined)).toBeNull();
    });
  });

  describe("other types", () => {
    it("should return null for object input", () => {
      expect(toNumber({})).toBeNull();
      expect(toNumber({ value: 42 })).toBeNull();
    });

    it("should return null for array input", () => {
      expect(toNumber([])).toBeNull();
      expect(toNumber([42])).toBeNull();
    });

    it("should return null for boolean input", () => {
      expect(toNumber(true)).toBeNull();
      expect(toNumber(false)).toBeNull();
    });
  });
});

describe("calculateUsage", () => {
  describe("valid inputs", () => {
    it("should calculate usage correctly", () => {
      const result = calculateUsage(50, 100);
      expect(result.allocated).toBe(50);
      expect(result.purchased).toBe(100);
      expect(result.available).toBe(50);
      expect(result.usagePercent).toBe(50);
      expect(result.isOver).toBe(false);
    });

    it("should calculate usage at 100%", () => {
      const result = calculateUsage(100, 100);
      expect(result.allocated).toBe(100);
      expect(result.purchased).toBe(100);
      expect(result.available).toBe(0);
      expect(result.usagePercent).toBe(100);
      expect(result.isOver).toBe(false);
    });

    it("should calculate usage over 100%", () => {
      const result = calculateUsage(120, 100);
      expect(result.allocated).toBe(120);
      expect(result.purchased).toBe(100);
      expect(result.available).toBe(-20);
      expect(result.usagePercent).toBe(120);
      expect(result.isOver).toBe(true);
    });

    it("should handle decimal values", () => {
      const result = calculateUsage(33.33, 100);
      expect(result.allocated).toBe(33.33);
      expect(result.purchased).toBe(100);
      expect(result.usagePercent).toBe(33.33);
    });

    it("should handle high precision decimals", () => {
      const result = calculateUsage(66.6666, 100);
      expect(result.usagePercent).toBe(66.67);
    });
  });

  describe("zero purchased", () => {
    it("should return null usagePercent when purchased is 0", () => {
      const result = calculateUsage(0, 0);
      expect(result.allocated).toBe(0);
      expect(result.purchased).toBe(0);
      expect(result.usagePercent).toBeNull();
      expect(result.available).toBe(0);
    });

    it("should return null usagePercent when purchased is 0 but allocated is not", () => {
      const result = calculateUsage(50, 0);
      expect(result.allocated).toBe(50);
      expect(result.purchased).toBe(0);
      expect(result.usagePercent).toBeNull();
      expect(result.available).toBe(-50);
      expect(result.isOver).toBe(true);
    });
  });

  describe("null or invalid inputs", () => {
    it("should return null values when allocated is null", () => {
      const result = calculateUsage(null, 100);
      expect(result.allocated).toBeNull();
      expect(result.purchased).toBe(100);
      expect(result.available).toBeNull();
      expect(result.usagePercent).toBeNull();
      expect(result.isOver).toBe(false);
    });

    it("should return null values when purchased is null", () => {
      const result = calculateUsage(50, null);
      expect(result.allocated).toBe(50);
      expect(result.purchased).toBeNull();
      expect(result.available).toBeNull();
      expect(result.usagePercent).toBeNull();
      expect(result.isOver).toBe(false);
    });

    it("should return null values when both are null", () => {
      const result = calculateUsage(null, null);
      expect(result.allocated).toBeNull();
      expect(result.purchased).toBeNull();
      expect(result.available).toBeNull();
      expect(result.usagePercent).toBeNull();
      expect(result.isOver).toBe(false);
    });

    it("should handle string inputs that can be converted", () => {
      const result = calculateUsage("50", "100");
      expect(result.allocated).toBe(50);
      expect(result.purchased).toBe(100);
      expect(result.usagePercent).toBe(50);
    });

    it("should handle 'unavailable' strings", () => {
      const result = calculateUsage("unavailable", 100);
      expect(result.allocated).toBeNull();
      expect(result.purchased).toBe(100);
      expect(result.usagePercent).toBeNull();
    });
  });
});

describe("toBoolean", () => {
  describe("boolean inputs", () => {
    it("should return true for true", () => {
      expect(toBoolean(true)).toBe(true);
    });

    it("should return false for false", () => {
      expect(toBoolean(false)).toBe(false);
    });
  });

  describe("number inputs", () => {
    it("should return true for 1", () => {
      expect(toBoolean(1)).toBe(true);
    });

    it("should return false for 0", () => {
      expect(toBoolean(0)).toBe(false);
    });

    it("should return false for other numbers", () => {
      expect(toBoolean(2)).toBe(false);
      expect(toBoolean(-1)).toBe(false);
      expect(toBoolean(100)).toBe(false);
    });
  });

  describe("string inputs", () => {
    it("should return true for truthy string values", () => {
      expect(toBoolean("true")).toBe(true);
      expect(toBoolean("TRUE")).toBe(true);
      expect(toBoolean("True")).toBe(true);
      expect(toBoolean("1")).toBe(true);
      expect(toBoolean("yes")).toBe(true);
      expect(toBoolean("YES")).toBe(true);
      expect(toBoolean("y")).toBe(true);
      expect(toBoolean("Y")).toBe(true);
    });

    it("should handle strings with whitespace", () => {
      expect(toBoolean("  true  ")).toBe(true);
      expect(toBoolean("\t1\n")).toBe(true);
    });

    it("should return false for falsy string values", () => {
      expect(toBoolean("false")).toBe(false);
      expect(toBoolean("FALSE")).toBe(false);
      expect(toBoolean("0")).toBe(false);
      expect(toBoolean("no")).toBe(false);
      expect(toBoolean("n")).toBe(false);
    });

    it("should return false for other strings", () => {
      expect(toBoolean("maybe")).toBe(false);
      expect(toBoolean("")).toBe(false);
      expect(toBoolean("random")).toBe(false);
    });
  });

  describe("other types", () => {
    it("should return false for null", () => {
      expect(toBoolean(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(toBoolean(undefined)).toBe(false);
    });

    it("should return false for objects", () => {
      expect(toBoolean({})).toBe(false);
      expect(toBoolean({ value: true })).toBe(false);
    });

    it("should return false for arrays", () => {
      expect(toBoolean([])).toBe(false);
      expect(toBoolean([true])).toBe(false);
    });
  });
});
