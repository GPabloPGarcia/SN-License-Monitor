import type { CollectorScope, ServiceNowInstance } from "@prisma/client";
import { getWeekReference } from "@/lib/dates/weeks";
import { prisma } from "@/lib/prisma/client";
import { InstanceRepository } from "@/repositories/InstanceRepository";
import { SnapshotRepository } from "@/repositories/SnapshotRepository";
import { ServiceNowLicenseCollector } from "@/services/ServiceNowLicenseCollector";

type RunOptions = {
  createdByUserId?: string;
  weekReference?: string;
};

export class CollectorRunService {
  private readonly collector = new ServiceNowLicenseCollector();

  async runGeneral(options: RunOptions = {}) {
    const instances = await InstanceRepository.listActiveForCollection();
    return this.run({
      scope: "GENERAL",
      instances,
      createdByUserId: options.createdByUserId,
      weekReference: options.weekReference
    });
  }

  async runClient(clientId: string, options: RunOptions = {}) {
    const instances = await InstanceRepository.listActiveByClient(clientId);
    return this.run({
      scope: "CLIENT",
      clientId,
      instances,
      createdByUserId: options.createdByUserId,
      weekReference: options.weekReference
    });
  }

  async runInstance(instanceId: string, options: RunOptions = {}) {
    const instance = await InstanceRepository.findById(instanceId);

    if (!instance || !instance.active || !instance.client.active) {
      throw new Error("Instancia ativa nao encontrada para coleta.");
    }

    return this.run({
      scope: "INSTANCE",
      clientId: instance.clientId,
      instanceId: instance.id,
      instances: [instance],
      createdByUserId: options.createdByUserId,
      weekReference: options.weekReference
    });
  }

  async runWeeklyCollection() {
    return this.runGeneral({
      weekReference: getWeekReference(new Date())
    });
  }

  private async run({
    scope,
    clientId,
    instanceId,
    instances,
    createdByUserId,
    weekReference
  }: {
    scope: CollectorScope;
    clientId?: string;
    instanceId?: string;
    instances: ServiceNowInstance[];
    createdByUserId?: string;
    weekReference?: string;
  }) {
    const run = await prisma.collectorRun.create({
      data: {
        scope,
        clientId,
        instanceId,
        status: "RUNNING",
        totalInstances: instances.length,
        createdByUserId
      }
    });

    let totalSuccess = 0;
    let totalFailed = 0;
    let totalSnapshots = 0;
    const errors: string[] = [];
    const collectedAt = new Date();
    const effectiveWeek = weekReference ?? getWeekReference(collectedAt);

    for (const instance of instances) {
      try {
        const snapshots = await this.collector.collectInstance(instance, {
          collectedAt,
          weekReference: effectiveWeek
        });
        totalSnapshots += await SnapshotRepository.replaceInstanceWeek(
          instance.id,
          effectiveWeek,
          snapshots
        );
        totalSuccess += 1;
      } catch (error) {
        totalFailed += 1;
        errors.push(
          `${instance.name}: ${error instanceof Error ? error.message : "erro desconhecido"}`
        );
      }
    }

    const status =
      totalFailed === 0 ? "SUCCESS" : totalSuccess === 0 ? "FAILED" : "PARTIAL";

    return prisma.collectorRun.update({
      where: { id: run.id },
      data: {
        status,
        finishedAt: new Date(),
        totalSuccess,
        totalFailed,
        totalSnapshots,
        errorMessage: errors.length > 0 ? errors.join("\n") : null
      }
    });
  }
}

export async function runWeeklyCollection() {
  return new CollectorRunService().runWeeklyCollection();
}
