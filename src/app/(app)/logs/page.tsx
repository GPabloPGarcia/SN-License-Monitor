import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/cards/kpi-card";
import { LogsTable, type LogRunItem } from "@/components/tables/logs-table";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

export default async function LogsPage() {
  const user = await requireAuth();

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const runs = await prisma.collectorRun.findMany({
    include: {
      client: { select: { name: true } },
      instance: { select: { name: true } },
      createdByUser: { select: { name: true } }
    },
    orderBy: { startedAt: "desc" },
    take: 500
  });

  const total = runs.length;
  const failed = runs.filter((r) => r.status === "FAILED").length;
  const partial = runs.filter((r) => r.status === "PARTIAL").length;
  const success = runs.filter((r) => r.status === "SUCCESS").length;

  const logItems: LogRunItem[] = runs.map((run) => ({
    id: run.id,
    scope: run.scope,
    status: run.status,
    startedAt: run.startedAt.toISOString(),
    finishedAt: run.finishedAt?.toISOString() ?? null,
    clientName: run.client?.name ?? null,
    instanceName: run.instance?.name ?? null,
    totalInstances: run.totalInstances,
    totalSuccess: run.totalSuccess,
    totalFailed: run.totalFailed,
    totalSnapshots: run.totalSnapshots,
    errorMessage: run.errorMessage,
    createdByUser: run.createdByUser?.name ?? null
  }));

  return (
    <>
      <PageHeader
        title="Logs da aplicacao"
        description="Historico completo de execucoes do coletor, erros e detalhes de falhas. Ultimas 500 entradas."
      />

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total de execucoes" value={total} />
        <KpiCard label="Sucesso" value={success} />
        <KpiCard label="Parcial" value={partial} />
        <KpiCard label="Falha" value={failed} />
      </div>

      <LogsTable runs={logItems} />
    </>
  );
}
