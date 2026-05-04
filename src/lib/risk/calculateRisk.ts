import type { RiskLevel } from "@prisma/client";

type RiskInput = {
  expired?: boolean | null;
  usagePercent?: number | null;
  daysToExpire?: number | null;
};

export function calculateRisk(snapshot: RiskInput): {
  riskLevel: RiskLevel;
  riskReason: string;
} {
  if (snapshot.expired === true) {
    return {
      riskLevel: "CRITICAL",
      riskReason: "Licenca expirada."
    };
  }

  if (snapshot.usagePercent !== null && snapshot.usagePercent !== undefined) {
    if (snapshot.usagePercent >= 100) {
      return {
        riskLevel: "CRITICAL",
        riskReason: "Uso igual ou superior a 100%."
      };
    }

    if (snapshot.usagePercent >= 90) {
      return {
        riskLevel: "HIGH",
        riskReason: "Uso igual ou superior a 90%."
      };
    }

    if (snapshot.usagePercent >= 75) {
      return {
        riskLevel: "MEDIUM",
        riskReason: "Uso igual ou superior a 75%."
      };
    }
  }

  if (snapshot.daysToExpire !== null && snapshot.daysToExpire !== undefined) {
    if (snapshot.daysToExpire <= 30) {
      return {
        riskLevel: "HIGH",
        riskReason: "Vencimento em ate 30 dias."
      };
    }

    if (snapshot.daysToExpire <= 90) {
      return {
        riskLevel: "MEDIUM",
        riskReason: "Vencimento em ate 90 dias."
      };
    }
  }

  return {
    riskLevel: "LOW",
    riskReason: "Sem sinais relevantes de risco."
  };
}
