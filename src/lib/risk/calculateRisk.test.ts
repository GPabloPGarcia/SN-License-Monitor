import { describe, it, expect } from "vitest";
import { calculateRisk } from "./calculateRisk";

describe("calculateRisk", () => {
  describe("expired license", () => {
    it("should return CRITICAL when license is expired", () => {
      const result = calculateRisk({ expired: true });
      expect(result.riskLevel).toBe("CRITICAL");
      expect(result.riskReason).toBe("Licenca expirada.");
    });

    it("should prioritize expired status over other factors", () => {
      const result = calculateRisk({
        expired: true,
        usagePercent: 50,
        daysToExpire: 100
      });
      expect(result.riskLevel).toBe("CRITICAL");
      expect(result.riskReason).toBe("Licenca expirada.");
    });
  });

  describe("usage percent thresholds", () => {
    it("should return CRITICAL when usage >= 100%", () => {
      const result = calculateRisk({ usagePercent: 100 });
      expect(result.riskLevel).toBe("CRITICAL");
      expect(result.riskReason).toBe("Uso igual ou superior a 100%.");
    });

    it("should return CRITICAL when usage > 100%", () => {
      const result = calculateRisk({ usagePercent: 150 });
      expect(result.riskLevel).toBe("CRITICAL");
      expect(result.riskReason).toBe("Uso igual ou superior a 100%.");
    });

    it("should return HIGH when usage >= 90% but < 100%", () => {
      const result = calculateRisk({ usagePercent: 90 });
      expect(result.riskLevel).toBe("HIGH");
      expect(result.riskReason).toBe("Uso igual ou superior a 90%.");
    });

    it("should return HIGH when usage >= 95% but < 100%", () => {
      const result = calculateRisk({ usagePercent: 95 });
      expect(result.riskLevel).toBe("HIGH");
      expect(result.riskReason).toBe("Uso igual ou superior a 90%.");
    });

    it("should return MEDIUM when usage >= 75% but < 90%", () => {
      const result = calculateRisk({ usagePercent: 75 });
      expect(result.riskLevel).toBe("MEDIUM");
      expect(result.riskReason).toBe("Uso igual ou superior a 75%.");
    });

    it("should return MEDIUM when usage >= 80% but < 90%", () => {
      const result = calculateRisk({ usagePercent: 80 });
      expect(result.riskLevel).toBe("MEDIUM");
      expect(result.riskReason).toBe("Uso igual ou superior a 75%.");
    });

    it("should return LOW when usage < 75%", () => {
      const result = calculateRisk({ usagePercent: 74.99 });
      expect(result.riskLevel).toBe("LOW");
    });

    it("should return LOW when usage is 0%", () => {
      const result = calculateRisk({ usagePercent: 0 });
      expect(result.riskLevel).toBe("LOW");
    });
  });

  describe("days to expire thresholds", () => {
    it("should return HIGH when days to expire <= 30", () => {
      const result = calculateRisk({ daysToExpire: 30 });
      expect(result.riskLevel).toBe("HIGH");
      expect(result.riskReason).toBe("Vencimento em ate 30 dias.");
    });

    it("should return HIGH when days to expire < 30", () => {
      const result = calculateRisk({ daysToExpire: 15 });
      expect(result.riskLevel).toBe("HIGH");
      expect(result.riskReason).toBe("Vencimento em ate 30 dias.");
    });

    it("should return MEDIUM when days to expire between 30 and 90", () => {
      const result = calculateRisk({ daysToExpire: 60 });
      expect(result.riskLevel).toBe("MEDIUM");
      expect(result.riskReason).toBe("Vencimento em ate 90 dias.");
    });

    it("should return MEDIUM when days to expire == 90", () => {
      const result = calculateRisk({ daysToExpire: 90 });
      expect(result.riskLevel).toBe("MEDIUM");
      expect(result.riskReason).toBe("Vencimento em ate 90 dias.");
    });

    it("should return LOW when days to expire > 90", () => {
      const result = calculateRisk({ daysToExpire: 91 });
      expect(result.riskLevel).toBe("LOW");
      expect(result.riskReason).toBe("Sem sinais relevantes de risco.");
    });

    it("should return CRITICAL when days to expire is negative (already expired)", () => {
      const result = calculateRisk({ daysToExpire: -10 });
      expect(result.riskLevel).toBe("HIGH");
      expect(result.riskReason).toBe("Vencimento em ate 30 dias.");
    });
  });

  describe("null and undefined values", () => {
    it("should ignore null expired value", () => {
      // 80% >= 75% → MEDIUM, proving that null expired is treated as false
      const result = calculateRisk({ expired: null, usagePercent: 80 });
      expect(result.riskLevel).toBe("MEDIUM");
    });

    it("should ignore undefined expired value", () => {
      // 80% >= 75% → MEDIUM, proving that undefined expired is treated as false
      const result = calculateRisk({ expired: undefined, usagePercent: 80 });
      expect(result.riskLevel).toBe("MEDIUM");
    });

    it("should ignore null usagePercent", () => {
      const result = calculateRisk({ usagePercent: null, daysToExpire: 60 });
      expect(result.riskLevel).toBe("MEDIUM");
    });

    it("should ignore undefined usagePercent", () => {
      const result = calculateRisk({ usagePercent: undefined, daysToExpire: 60 });
      expect(result.riskLevel).toBe("MEDIUM");
    });

    it("should return LOW when all values are null", () => {
      const result = calculateRisk({
        expired: null,
        usagePercent: null,
        daysToExpire: null
      });
      expect(result.riskLevel).toBe("LOW");
      expect(result.riskReason).toBe("Sem sinais relevantes de risco.");
    });

    it("should return LOW when no input is provided", () => {
      const result = calculateRisk({});
      expect(result.riskLevel).toBe("LOW");
      expect(result.riskReason).toBe("Sem sinais relevantes de risco.");
    });
  });

  describe("priority of factors", () => {
    it("should prioritize usage percent over days to expire", () => {
      const result = calculateRisk({
        usagePercent: 95,
        daysToExpire: 100
      });
      expect(result.riskLevel).toBe("HIGH");
      expect(result.riskReason).toBe("Uso igual ou superior a 90%.");
    });

    it("should consider days to expire when usage is not available", () => {
      const result = calculateRisk({
        usagePercent: null,
        daysToExpire: 60
      });
      expect(result.riskLevel).toBe("MEDIUM");
      expect(result.riskReason).toBe("Vencimento em ate 90 dias.");
    });
  });
});
