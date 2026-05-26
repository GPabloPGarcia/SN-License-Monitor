import { describe, it, expect } from "vitest";
import { calculateDaysToExpire, parseServiceNowDate, getWeekReference, getPreviousWeekReference } from "./weeks";

describe("parseServiceNowDate", () => {
  describe("valid date strings", () => {
    it("should parse ISO 8601 dates", () => {
      const result = parseServiceNowDate("2024-12-25T10:30:00");
      expect(result).toEqual(new Date("2024-12-25T10:30:00"));
    });

    it("should parse date strings without time", () => {
      const result = parseServiceNowDate("2024-12-25");
      expect(result).toEqual(new Date("2024-12-25T00:00:00"));
    });

    it("should parse dates with timezone info", () => {
      const result = parseServiceNowDate("2024-12-25T10:30:00Z");
      expect(result?.toISOString()).toContain("2024-12-25T10:30:00");
    });

    it("should handle various date formats", () => {
      const result = parseServiceNowDate("2024-01-01");
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(0);
      expect(result?.getDate()).toBe(1);
    });
  });

  describe("invalid inputs", () => {
    it("should return null for null", () => {
      expect(parseServiceNowDate(null)).toBeNull();
    });

    it("should return null for undefined", () => {
      expect(parseServiceNowDate(undefined)).toBeNull();
    });

    it("should return null for empty string", () => {
      expect(parseServiceNowDate("")).toBeNull();
    });

    it("should return null for whitespace only", () => {
      expect(parseServiceNowDate("   ")).toBeNull();
      expect(parseServiceNowDate("\t")).toBeNull();
    });

    it("should return null for invalid date strings", () => {
      expect(parseServiceNowDate("not-a-date")).toBeNull();
      expect(parseServiceNowDate("2024-13-32")).toBeNull();
      expect(parseServiceNowDate("invalid")).toBeNull();
    });

    it("should return null for non-string types", () => {
      expect(parseServiceNowDate(123)).toBeNull();
      expect(parseServiceNowDate({})).toBeNull();
      expect(parseServiceNowDate([])).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("should handle leap year dates", () => {
      const result = parseServiceNowDate("2024-02-29");
      expect(result?.toISOString()).toContain("2024-02-29");
    });

    it("should handle year boundaries", () => {
      const result = parseServiceNowDate("2024-12-31T23:59:59");
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(11);
      expect(result?.getDate()).toBe(31);
    });
  });
});

describe("calculateDaysToExpire", () => {
  describe("with Date objects", () => {
    it("should calculate days until future date", () => {
      const now = new Date("2024-01-01");
      const expireDate = new Date("2024-01-11");
      const result = calculateDaysToExpire(expireDate, now);
      expect(result).toBe(10);
    });

    it("should return 0 for same day", () => {
      const now = new Date("2024-01-01");
      const result = calculateDaysToExpire(now, now);
      expect(result).toBe(0);
    });

    it("should return negative for past dates", () => {
      const now = new Date("2024-01-10");
      const pastDate = new Date("2024-01-01");
      const result = calculateDaysToExpire(pastDate, now);
      expect(result).toBe(-9);
    });

    it("should handle large date differences", () => {
      const now = new Date("2024-01-01T00:00:00");
      const futureDate = new Date("2025-01-01T00:00:00");
      // 2024 is a leap year → 366 calendar days from Jan 1 2024 to Jan 1 2025
      const result = calculateDaysToExpire(futureDate, now);
      expect(result).toBe(366);
    });
  });

  describe("with date strings", () => {
    it("should parse and calculate days for valid strings", () => {
      // Use local midnight (T00:00:00) so both dates are interpreted consistently
      const now = new Date("2024-01-01T00:00:00");
      const result = calculateDaysToExpire("2024-01-11", now);
      expect(result).toBe(10);
    });

    it("should handle ISO format strings", () => {
      const now = new Date("2024-01-01T00:00:00");
      const result = calculateDaysToExpire("2024-01-11T00:00:00", now);
      expect(result).toBe(10);
    });
  });

  describe("null and invalid inputs", () => {
    it("should return null for null endDate", () => {
      const now = new Date("2024-01-01");
      const result = calculateDaysToExpire(null, now);
      expect(result).toBeNull();
    });

    it("should return null for undefined endDate", () => {
      const now = new Date("2024-01-01");
      const result = calculateDaysToExpire(undefined, now);
      expect(result).toBeNull();
    });

    it("should return null for invalid date string", () => {
      const now = new Date("2024-01-01");
      const result = calculateDaysToExpire("invalid-date", now);
      expect(result).toBeNull();
    });

    it("should return null for empty string", () => {
      const now = new Date("2024-01-01");
      const result = calculateDaysToExpire("", now);
      expect(result).toBeNull();
    });
  });

  describe("default now parameter", () => {
    it("should use current date when now is not provided", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const result = calculateDaysToExpire(futureDate);
      expect(result).toBe(10);
    });
  });

  describe("edge cases", () => {
    it("should handle dates across month boundaries", () => {
      const now = new Date("2024-01-25");
      const futureDate = new Date("2024-02-05");
      const result = calculateDaysToExpire(futureDate, now);
      expect(result).toBe(11);
    });

    it("should handle leap year transitions", () => {
      const now = new Date("2024-02-25");
      const futureDate = new Date("2024-03-05");
      const result = calculateDaysToExpire(futureDate, now);
      expect(result).toBe(9);
    });
  });
});

describe("getWeekReference", () => {
  it("should return string in yyyy-MM-dd format", () => {
    const date = new Date("2024-01-08"); // Monday
    const result = getWeekReference(date);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("should return Monday of the week", () => {
    // Use local midnight to avoid UTC-to-local shifts that could move the date to Sunday
    const monday = new Date("2024-01-08T12:00:00");
    const result = getWeekReference(monday);
    expect(result).toBe("2024-01-08");
  });

  it("should return Monday for dates in the middle of week", () => {
    const wednesday = new Date("2024-01-10");
    const result = getWeekReference(wednesday);
    expect(result).toBe("2024-01-08");
  });

  it("should return Monday for dates at end of week", () => {
    const sunday = new Date("2024-01-14");
    const result = getWeekReference(sunday);
    expect(result).toBe("2024-01-08");
  });

  it("should use current date when not provided", () => {
    const result = getWeekReference();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("getPreviousWeekReference", () => {
  it("should return previous Monday", () => {
    const currentMonday = new Date("2024-01-15T12:00:00");
    const result = getPreviousWeekReference(currentMonday);
    expect(result).toBe("2024-01-08");
  });

  it("should return correct week reference for mid-week dates", () => {
    const wednesday = new Date("2024-01-10T12:00:00");
    const result = getPreviousWeekReference(wednesday);
    expect(result).toBe("2024-01-01");
  });

  it("should handle month boundaries", () => {
    const firstWeekOfFeb = new Date("2024-02-05T12:00:00");
    const result = getPreviousWeekReference(firstWeekOfFeb);
    expect(result).toBe("2024-01-29");
  });

  it("should use current date when not provided", () => {
    const result = getPreviousWeekReference();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("should return week from exactly 7 days ago", () => {
    const date = new Date("2024-01-15");
    const current = getWeekReference(date);
    const previous = getPreviousWeekReference(date);
    const daysDiff = (new Date(current).getTime() - new Date(previous).getTime()) / (1000 * 60 * 60 * 24);
    expect(daysDiff).toBe(7);
  });
});
