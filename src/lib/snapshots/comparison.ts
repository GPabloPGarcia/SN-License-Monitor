import type { LicenseWeeklySnapshot } from "@prisma/client";
import type { LicenseWeeklyComparison } from "@/types/snapshots";

function delta(current: number | null | undefined, previous: number | null | undefined) {
  if (current === null || current === undefined || previous === null || previous === undefined) {
    return null;
  }

  return Math.round((current - previous) * 100) / 100;
}

export function compareLicenseSnapshots(
  current: LicenseWeeklySnapshot | null | undefined,
  previous: LicenseWeeklySnapshot | null | undefined
): LicenseWeeklyComparison {
  return {
    currentUsagePercent: current?.usagePercent ?? current?.licenseUsagePercent ?? null,
    previousUsagePercent: previous?.usagePercent ?? previous?.licenseUsagePercent ?? null,
    usageDelta: delta(
      current?.usagePercent ?? current?.licenseUsagePercent,
      previous?.usagePercent ?? previous?.licenseUsagePercent
    ),
    currentAllocated: current?.allocatedCount ?? current?.licenseAllocated ?? null,
    previousAllocated: previous?.allocatedCount ?? previous?.licenseAllocated ?? null,
    allocatedDelta: delta(
      current?.allocatedCount ?? current?.licenseAllocated,
      previous?.allocatedCount ?? previous?.licenseAllocated
    ),
    currentPurchased: current?.purchasedCount ?? current?.licenseCount ?? null,
    previousPurchased: previous?.purchasedCount ?? previous?.licenseCount ?? null,
    purchasedDelta: delta(
      current?.purchasedCount ?? current?.licenseCount,
      previous?.purchasedCount ?? previous?.licenseCount
    ),
    currentRisk: current?.riskLevel ?? null,
    previousRisk: previous?.riskLevel ?? null,
    riskChanged: Boolean(current && previous && current.riskLevel !== previous.riskLevel)
  };
}

export function compareInstanceSnapshots(
  current: LicenseWeeklySnapshot[],
  previous: LicenseWeeklySnapshot[]
) {
  const average = (items: LicenseWeeklySnapshot[]) => {
    const values = items
      .map((item) => item.licenseUsagePercent ?? item.usagePercent)
      .filter((value): value is number => value !== null && value !== undefined);

    if (values.length === 0) {
      return null;
    }

    return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100;
  };

  const currentAverageUsage = average(current);
  const previousAverageUsage = average(previous);
  const currentCritical = current.filter((item) => item.riskLevel === "CRITICAL").length;
  const previousCritical = previous.filter((item) => item.riskLevel === "CRITICAL").length;
  const currentAbove90 = current.filter(
    (item) => (item.usagePercent ?? item.licenseUsagePercent ?? 0) >= 90
  ).length;
  const previousAbove90 = previous.filter(
    (item) => (item.usagePercent ?? item.licenseUsagePercent ?? 0) >= 90
  ).length;
  const currentAbove100 = current.filter(
    (item) => (item.usagePercent ?? item.licenseUsagePercent ?? 0) >= 100
  ).length;
  const previousAbove100 = previous.filter(
    (item) => (item.usagePercent ?? item.licenseUsagePercent ?? 0) >= 100
  ).length;

  return {
    currentAverageUsage,
    previousAverageUsage,
    averageUsageDelta: delta(currentAverageUsage, previousAverageUsage),
    currentCritical,
    previousCritical,
    criticalDelta: currentCritical - previousCritical,
    currentAbove90,
    previousAbove90,
    above90Delta: currentAbove90 - previousAbove90,
    currentAbove100,
    previousAbove100,
    above100Delta: currentAbove100 - previousAbove100
  };
}
