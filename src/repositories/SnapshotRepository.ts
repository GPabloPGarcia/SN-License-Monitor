import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";
import type { NormalizedLicenseSnapshot } from "@/types/snapshots";

export class SnapshotRepository {
  static async replaceInstanceWeek(
    instanceId: string,
    weekReference: string,
    snapshots: NormalizedLicenseSnapshot[]
  ) {
    const result = await prisma.$transaction(async (tx) => {
      await tx.licenseWeeklySnapshot.deleteMany({
        where: {
          instanceId,
          weekReference
        }
      });

      if (snapshots.length === 0) {
        return { count: 0 };
      }

      return tx.licenseWeeklySnapshot.createMany({
        data: snapshots as Prisma.LicenseWeeklySnapshotCreateManyInput[],
        skipDuplicates: true
      });
    });

    return result.count;
  }

  static async upsertMany(snapshots: NormalizedLicenseSnapshot[]) {
    let total = 0;

    for (const snapshot of snapshots) {
      await prisma.licenseWeeklySnapshot.upsert({
        where: {
          snapshot_week_unique: {
            instanceId: snapshot.instanceId,
            weekReference: snapshot.weekReference,
            productCode: snapshot.productCode,
            licenseSysId: snapshot.licenseSysId,
            subscriptionSysId: snapshot.subscriptionSysId
          }
        },
        create: snapshot as Prisma.LicenseWeeklySnapshotUncheckedCreateInput,
        update: snapshot as Prisma.LicenseWeeklySnapshotUncheckedUpdateInput
      });
      total += 1;
    }

    return total;
  }
}
