"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth/session";
import { ServiceNowLicenseCollector } from "@/services/ServiceNowLicenseCollector";
import { CollectorRunService } from "@/services/CollectorRunService";
import { InstanceRepository } from "@/repositories/InstanceRepository";

function resultFromError(error: unknown) {
  return {
    ok: false,
    message: error instanceof Error ? error.message : "Erro desconhecido."
  };
}

export async function executeGeneralCollectionAction() {
  try {
    const user = await assertAdmin();
    const run = await new CollectorRunService().runGeneral({
      createdByUserId: user.id
    });
    revalidatePath("/dashboard");
    revalidatePath("/collector-runs");
    return {
      ok: run.status === "SUCCESS" || run.status === "PARTIAL",
      message: `Coleta ${run.status.toLowerCase()} com ${run.totalSnapshots} snapshots.`,
      runId: run.id
    };
  } catch (error) {
    return resultFromError(error);
  }
}

export async function executeClientCollectionAction(clientId: string) {
  try {
    const user = await assertAdmin();
    const run = await new CollectorRunService().runClient(clientId, {
      createdByUserId: user.id
    });
    revalidatePath("/dashboard");
    revalidatePath(`/clients/${clientId}`);
    revalidatePath("/collector-runs");
    return {
      ok: run.status === "SUCCESS" || run.status === "PARTIAL",
      message: `Coleta ${run.status.toLowerCase()} com ${run.totalSnapshots} snapshots.`,
      runId: run.id
    };
  } catch (error) {
    return resultFromError(error);
  }
}

export async function executeInstanceCollectionAction(instanceId: string) {
  try {
    const user = await assertAdmin();
    const run = await new CollectorRunService().runInstance(instanceId, {
      createdByUserId: user.id
    });
    revalidatePath("/dashboard");
    revalidatePath(`/instances/${instanceId}`);
    revalidatePath("/collector-runs");
    return {
      ok: run.status === "SUCCESS" || run.status === "PARTIAL",
      message: `Coleta ${run.status.toLowerCase()} com ${run.totalSnapshots} snapshots.`,
      runId: run.id
    };
  } catch (error) {
    return resultFromError(error);
  }
}

export async function testInstanceConnectionAction(instanceId: string) {
  try {
    await assertAdmin();
    const instance = await InstanceRepository.findById(instanceId);

    if (!instance) {
      throw new Error("Instancia nao encontrada.");
    }

    return await new ServiceNowLicenseCollector().testConnection(instance);
  } catch (error) {
    return resultFromError(error);
  }
}
