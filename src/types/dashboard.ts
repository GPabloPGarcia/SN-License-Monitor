import type { CollectorStatus, RiskLevel } from "@prisma/client";

export type KpiCard = {
  label: string;
  value: string | number;
  helper?: string;
};

export type RiskCount = {
  riskLevel: RiskLevel;
  total: number;
};

export type GeneralDashboardSummary = {
  activeClients: number;
  activeInstances: number;
  currentWeekLicenses: number;
  criticalLicenses: number;
  highRiskLicenses: number;
  above90: number;
  above100: number;
  expiring30: number;
  lastGeneralRun: {
    status: CollectorStatus;
    startedAt: string;
    finishedAt: string | null;
  } | null;
  riskByInstance: Array<Record<string, string | number>>;
  averageUsageByInstance: Array<{ instance: string; usagePercent: number }>;
  topUsage: Array<{ id: string; name: string; instance: string; usagePercent: number }>;
  weeklyComparison: {
    currentCritical: number;
    previousCritical: number;
    criticalDelta: number;
    currentAverageUsage: number | null;
    previousAverageUsage: number | null;
    averageUsageDelta: number | null;
    currentAbove90: number;
    previousAbove90: number;
    above90Delta: number;
    currentAbove100: number;
    previousAbove100: number;
    above100Delta: number;
  };
};
