import type { LicenseWeeklySnapshot, RiskLevel } from "@prisma/client";
import { getPreviousWeekReference, getWeekReference } from "@/lib/dates/weeks";
import { prisma } from "@/lib/prisma/client";
import {
  compareInstanceSnapshots,
  compareLicenseSnapshots
} from "@/lib/snapshots/comparison";

const riskOrder: Record<RiskLevel, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1
};

function usageOf(snapshot: LicenseWeeklySnapshot) {
  return snapshot.usagePercent ?? snapshot.licenseUsagePercent ?? null;
}

function averageUsage(snapshots: LicenseWeeklySnapshot[]) {
  const values = snapshots
    .map(usageOf)
    .filter((value): value is number => value !== null && value !== undefined);

  if (values.length === 0) {
    return null;
  }

  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100;
}

function countAbove(snapshots: LicenseWeeklySnapshot[], threshold: number) {
  return snapshots.filter((snapshot) => (usageOf(snapshot) ?? 0) >= threshold).length;
}

function weekLabel(weekReference: string) {
  return weekReference.slice(5);
}

function groupByWeek<T extends { weekReference: string }>(items: T[]) {
  return items.reduce<Record<string, T[]>>((groups, item) => {
    groups[item.weekReference] ??= [];
    groups[item.weekReference].push(item);
    return groups;
  }, {});
}

export class DashboardService {
  static async getGeneralSummary() {
    const weekReference = getWeekReference();
    const previousWeekReference = getPreviousWeekReference();

    const [
      activeClients,
      activeInstances,
      currentSnapshots,
      previousSnapshots,
      lastGeneralRun
    ] = await Promise.all([
      prisma.client.count({ where: { active: true } }),
      prisma.serviceNowInstance.count({
        where: { active: true, client: { active: true } }
      }),
      prisma.licenseWeeklySnapshot.findMany({
        where: { weekReference },
        include: { instance: true }
      }),
      prisma.licenseWeeklySnapshot.findMany({
        where: { weekReference: previousWeekReference }
      }),
      prisma.collectorRun.findFirst({
        where: { scope: "GENERAL" },
        orderBy: { startedAt: "desc" }
      })
    ]);

    const instances = Array.from(
      new Map(currentSnapshots.map((snapshot) => [snapshot.instanceId, snapshot.instance.name]))
    );

    const riskByInstance = instances.map(([instanceId, instance]) => {
      const snapshots = currentSnapshots.filter((snapshot) => snapshot.instanceId === instanceId);
      return {
        instance,
        LOW: snapshots.filter((snapshot) => snapshot.riskLevel === "LOW").length,
        MEDIUM: snapshots.filter((snapshot) => snapshot.riskLevel === "MEDIUM").length,
        HIGH: snapshots.filter((snapshot) => snapshot.riskLevel === "HIGH").length,
        CRITICAL: snapshots.filter((snapshot) => snapshot.riskLevel === "CRITICAL").length
      };
    });

    const averageUsageByInstance = instances.map(([instanceId, instance]) => ({
      instance,
      usagePercent:
        averageUsage(currentSnapshots.filter((snapshot) => snapshot.instanceId === instanceId)) ?? 0
    }));

    const weeklyComparison = compareInstanceSnapshots(currentSnapshots, previousSnapshots);

    return {
      activeClients,
      activeInstances,
      currentWeekLicenses: currentSnapshots.length,
      criticalLicenses: currentSnapshots.filter((item) => item.riskLevel === "CRITICAL").length,
      highRiskLicenses: currentSnapshots.filter((item) => item.riskLevel === "HIGH").length,
      above90: countAbove(currentSnapshots, 90),
      above100: countAbove(currentSnapshots, 100),
      expiring30: currentSnapshots.filter(
        (item) => item.daysToExpire !== null && item.daysToExpire <= 30
      ).length,
      lastGeneralRun: lastGeneralRun
        ? {
            status: lastGeneralRun.status,
            startedAt: lastGeneralRun.startedAt.toISOString(),
            finishedAt: lastGeneralRun.finishedAt?.toISOString() ?? null
          }
        : null,
      riskByInstance,
      averageUsageByInstance,
      topUsage: currentSnapshots
        .slice()
        .sort((a, b) => (usageOf(b) ?? -1) - (usageOf(a) ?? -1))
        .slice(0, 10)
        .map((snapshot) => ({
          id: snapshot.id,
          name: snapshot.licenseName ?? snapshot.entitlementName ?? snapshot.productCode,
          instance: snapshot.instance.name,
          usagePercent: usageOf(snapshot) ?? 0
        })),
      weeklyComparison
    };
  }

  static async getClientSummary(clientId: string) {
    const weekReference = getWeekReference();
    const previousWeekReference = getPreviousWeekReference();
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        instances: {
          orderBy: { name: "asc" }
        }
      }
    });

    if (!client) {
      return null;
    }

    const [currentSnapshots, previousSnapshots, allSnapshots, lastClientRun] =
      await Promise.all([
        prisma.licenseWeeklySnapshot.findMany({
          where: { clientId, weekReference },
          include: { instance: true }
        }),
        prisma.licenseWeeklySnapshot.findMany({
          where: { clientId, weekReference: previousWeekReference }
        }),
        prisma.licenseWeeklySnapshot.findMany({
          where: { clientId },
          include: { instance: true },
          orderBy: { weekReference: "asc" }
        }),
        prisma.collectorRun.findFirst({
          where: { clientId },
          orderBy: { startedAt: "desc" }
        })
      ]);

    const byWeek = groupByWeek(allSnapshots);
    const weeklyCritical = Object.entries(byWeek).map(([week, snapshots]) => ({
      week: weekLabel(week),
      critical: snapshots.filter((snapshot) => snapshot.riskLevel === "CRITICAL").length
    }));

    const weeklyUsageByInstance = Object.entries(byWeek).map(([week, snapshots]) => {
      const row: Record<string, string | number> = { week: weekLabel(week) };
      for (const instance of client.instances) {
        row[instance.name] =
          averageUsage(snapshots.filter((snapshot) => snapshot.instanceId === instance.id)) ?? 0;
      }
      return row;
    });

    const riskDistribution = (["LOW", "MEDIUM", "HIGH", "CRITICAL"] as RiskLevel[]).map(
      (riskLevel) => ({
        name: riskLevel,
        value: currentSnapshots.filter((snapshot) => snapshot.riskLevel === riskLevel).length
      })
    );

    return {
      client,
      lastClientRun,
      totalLicenses: currentSnapshots.length,
      criticalRisks: currentSnapshots.filter((snapshot) => snapshot.riskLevel === "CRITICAL").length,
      highRisks: currentSnapshots.filter((snapshot) => snapshot.riskLevel === "HIGH").length,
      averageUsage: averageUsage(currentSnapshots),
      comparison: compareInstanceSnapshots(currentSnapshots, previousSnapshots),
      instances: client.instances.map((instance) => {
        const instanceSnapshots = currentSnapshots.filter(
          (snapshot) => snapshot.instanceId === instance.id
        );
        const latest = allSnapshots
          .filter((snapshot) => snapshot.instanceId === instance.id)
          .sort((a, b) => b.collectedAt.getTime() - a.collectedAt.getTime())[0];

        return {
          ...instance,
          currentLicenses: instanceSnapshots.length,
          currentCritical: instanceSnapshots.filter(
            (snapshot) => snapshot.riskLevel === "CRITICAL"
          ).length,
          latestCollectedAt: latest?.collectedAt.toISOString() ?? null
        };
      }),
      weeklyUsageByInstance,
      riskDistribution,
      weeklyCritical,
      topCritical: currentSnapshots
        .slice()
        .sort((a, b) => {
          const riskDelta = riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
          return riskDelta || (usageOf(b) ?? -1) - (usageOf(a) ?? -1);
        })
        .slice(0, 10)
    };
  }

  static async getInstanceSummary(instanceId: string) {
    const weekReference = getWeekReference();
    const previousWeekReference = getPreviousWeekReference();
    const instance = await prisma.serviceNowInstance.findUnique({
      where: { id: instanceId },
      include: { client: true }
    });

    if (!instance) {
      return null;
    }

    const [currentSnapshots, previousSnapshots, allSnapshots, lastRun] =
      await Promise.all([
        prisma.licenseWeeklySnapshot.findMany({
          where: { instanceId, weekReference },
          orderBy: [{ riskLevel: "desc" }, { licenseName: "asc" }]
        }),
        prisma.licenseWeeklySnapshot.findMany({
          where: { instanceId, weekReference: previousWeekReference }
        }),
        prisma.licenseWeeklySnapshot.findMany({
          where: { instanceId },
          orderBy: [{ weekReference: "asc" }, { licenseName: "asc" }]
        }),
        prisma.collectorRun.findFirst({
          where: {
            OR: [
              { instanceId },
              { scope: "GENERAL" },
              { scope: "CLIENT", clientId: instance.clientId }
            ]
          },
          orderBy: { startedAt: "desc" }
        })
      ]);

    const previousByProduct = new Map(
      previousSnapshots.map((snapshot) => [
        `${snapshot.productCode}:${snapshot.licenseSysId}`,
        snapshot
      ])
    );
    const byWeek = groupByWeek(allSnapshots);

    return {
      instance,
      lastRun,
      totalLicenses: currentSnapshots.length,
      criticalLicenses: currentSnapshots.filter((snapshot) => snapshot.riskLevel === "CRITICAL").length,
      expiringLicenses: currentSnapshots.filter(
        (snapshot) => snapshot.daysToExpire !== null && snapshot.daysToExpire <= 30
      ).length,
      averageUsage: averageUsage(currentSnapshots),
      comparison: compareInstanceSnapshots(currentSnapshots, previousSnapshots),
      licenses: currentSnapshots.map((snapshot) => ({
        snapshot,
        comparison: compareLicenseSnapshots(
          snapshot,
          previousByProduct.get(`${snapshot.productCode}:${snapshot.licenseSysId}`)
        )
      })),
      weeklyAverageUsage: Object.entries(byWeek).map(([week, snapshots]) => ({
        week: weekLabel(week),
        usagePercent: averageUsage(snapshots) ?? 0
      })),
      weeklyCritical: Object.entries(byWeek).map(([week, snapshots]) => ({
        week: weekLabel(week),
        critical: snapshots.filter((snapshot) => snapshot.riskLevel === "CRITICAL").length
      })),
      weeklyPurchasedAllocated: Object.entries(byWeek).map(([week, snapshots]) => ({
        week: weekLabel(week),
        purchased: snapshots.reduce(
          (sum, snapshot) => sum + (snapshot.licenseCount ?? snapshot.purchasedCount ?? 0),
          0
        ),
        allocated: snapshots.reduce(
          (sum, snapshot) => sum + (snapshot.licenseAllocated ?? snapshot.allocatedCount ?? 0),
          0
        )
      })),
      meterDistribution: Object.entries(
        currentSnapshots.reduce<Record<string, number>>((groups, snapshot) => {
          const key = snapshot.meterType ?? "N/A";
          groups[key] = (groups[key] ?? 0) + 1;
          return groups;
        }, {})
      ).map(([name, value]) => ({ name, value })),
      topUsage: currentSnapshots
        .slice()
        .sort((a, b) => (usageOf(b) ?? -1) - (usageOf(a) ?? -1))
        .slice(0, 10)
        .map((snapshot) => ({
          name: snapshot.licenseName ?? snapshot.productCode,
          usagePercent: usageOf(snapshot) ?? 0
        }))
    };
  }

  static async getLicenseDetail(snapshotId: string) {
    const snapshot = await prisma.licenseWeeklySnapshot.findUnique({
      where: { id: snapshotId },
      include: {
        instance: {
          include: { client: true }
        }
      }
    });

    if (!snapshot) {
      return null;
    }

    const history = await prisma.licenseWeeklySnapshot.findMany({
      where: {
        instanceId: snapshot.instanceId,
        productCode: snapshot.productCode,
        licenseSysId: snapshot.licenseSysId
      },
      orderBy: { weekReference: "asc" }
    });
    const currentIndex = history.findIndex((item) => item.id === snapshot.id);
    const previous = currentIndex > 0 ? history[currentIndex - 1] : null;

    return {
      snapshot,
      history,
      comparison: compareLicenseSnapshots(snapshot, previous),
      purchasedAllocatedSeries: history.map((item) => ({
        week: weekLabel(item.weekReference),
        purchased: item.licenseCount ?? item.purchasedCount ?? 0,
        allocated: item.licenseAllocated ?? item.allocatedCount ?? 0
      }))
    };
  }
}
