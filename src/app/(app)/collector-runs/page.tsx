import { executeGeneralCollectionAction } from "@/app/(app)/collection-actions";
import { RunCollectionButton } from "@/components/actions/run-collection-button";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/status/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
import { formatDateTime } from "@/lib/utils";

export default async function CollectorRunsPage() {
  const [user, runs] = await Promise.all([
    requireAuth(),
    prisma.collectorRun.findMany({
      include: {
        client: true,
        instance: true,
        createdByUser: true
      },
      orderBy: { startedAt: "desc" },
      take: 100
    })
  ]);

  return (
    <>
      <PageHeader
        title="Historico de coletas"
        description="Execucoes manuais e automatizadas do coletor ServiceNow."
        actions={
          user.role === "ADMIN" ? (
            <RunCollectionButton
              label="Executar coleta geral"
              action={executeGeneralCollectionAction}
              variant="outline"
            />
          ) : null
        }
      />

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Inicio</TableHead>
              <TableHead>Fim</TableHead>
              <TableHead>Escopo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Instancia</TableHead>
              <TableHead>Sucesso/Falha</TableHead>
              <TableHead>Snapshots</TableHead>
              <TableHead>Usuario</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  Nenhuma coleta registrada.
                </TableCell>
              </TableRow>
            ) : (
              runs.map((run) => (
                <TableRow key={run.id}>
                  <TableCell>{formatDateTime(run.startedAt)}</TableCell>
                  <TableCell>{formatDateTime(run.finishedAt)}</TableCell>
                  <TableCell>{run.scope}</TableCell>
                  <TableCell>
                    <StatusBadge status={run.status} />
                  </TableCell>
                  <TableCell>{run.client?.name ?? "-"}</TableCell>
                  <TableCell>{run.instance?.name ?? "-"}</TableCell>
                  <TableCell>
                    {run.totalSuccess}/{run.totalFailed}
                    {run.errorMessage ? (
                      <p className="mt-1 max-w-xs whitespace-pre-line text-xs text-red-600 dark:text-red-300">
                        {run.errorMessage}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell>{run.totalSnapshots}</TableCell>
                  <TableCell>{run.createdByUser?.name ?? "job interno"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
