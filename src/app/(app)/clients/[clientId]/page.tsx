import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Edit } from "lucide-react";
import { executeClientCollectionAction } from "@/app/(app)/collection-actions";
import { RunCollectionButton } from "@/components/actions/run-collection-button";
import { KpiCard } from "@/components/cards/kpi-card";
import {
  MultiLineChart,
  PieDistributionChart,
  SimpleBarChart
} from "@/components/charts/dashboard-charts";
import { SearchParamToast } from "@/components/feedback/search-param-toast";
import { PageHeader } from "@/components/layout/page-header";
import { RiskBadge } from "@/components/status/risk-badge";
import { StatusBadge } from "@/components/status/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { requireAuth } from "@/lib/auth/session";
import { formatDateTime, formatNumber, formatPercent } from "@/lib/utils";
import { DashboardService } from "@/services/DashboardService";

export default async function ClientDashboardPage({
  params
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const [user, summary] = await Promise.all([
    requireAuth(),
    DashboardService.getClientSummary(clientId)
  ]);

  if (!summary) {
    notFound();
  }

  const isAdmin = user.role === "ADMIN";

  return (
    <>
      <Suspense>
        <SearchParamToast />
      </Suspense>
      <PageHeader
        title={summary.client.name}
        description={summary.client.description ?? "Dashboard consolidado do cliente."}
        actions={
          <>
            {isAdmin ? (
              <>
                <RunCollectionButton
                  label="Executar coleta do cliente"
                  action={executeClientCollectionAction.bind(null, summary.client.id)}
                />
                <Button asChild variant="outline">
                  <Link href={`/clients/${summary.client.id}/edit`}>
                    <Edit className="h-4 w-4" />
                    Editar
                  </Link>
                </Button>
              </>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Instancias" value={summary.instances.length} />
        <KpiCard label="Total de licencas" value={summary.totalLicenses} />
        <KpiCard label="Riscos criticos" value={summary.criticalRisks} />
        <KpiCard label="Riscos altos" value={summary.highRisks} />
        <KpiCard
          label="Consumo medio"
          value={formatPercent(summary.averageUsage)}
          helper={`Delta: ${formatPercent(summary.comparison.averageUsageDelta)}`}
        />
        <KpiCard
          label="Criticas vs semana anterior"
          value={formatNumber(summary.comparison.criticalDelta)}
        />
        <KpiCard
          label="Acima de 90%"
          value={summary.comparison.currentAbove90}
          helper={`Delta: ${formatNumber(summary.comparison.above90Delta)}`}
        />
        <KpiCard
          label="Acima de 100%"
          value={summary.comparison.currentAbove100}
          helper={`Delta: ${formatNumber(summary.comparison.above100Delta)}`}
        />
      </div>

      <section className="mt-6 rounded-lg border bg-card">
        <div className="border-b p-5">
          <h2 className="text-base font-semibold">Instancias do cliente</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Instancia</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Licencas</TableHead>
              <TableHead>Criticas</TableHead>
              <TableHead>Ultima coleta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summary.instances.map((instance) => (
              <TableRow key={instance.id}>
                <TableCell>
                  <Link href={`/instances/${instance.id}`} className="font-medium hover:underline">
                    {instance.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <StatusBadge status={instance.latestCollectedAt ? "SUCCESS" : "PENDING"} />
                </TableCell>
                <TableCell>{instance.currentLicenses}</TableCell>
                <TableCell>{instance.currentCritical}</TableCell>
                <TableCell>{formatDateTime(instance.latestCollectedAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <MultiLineChart
          title="Consumo medio semanal por instancia"
          data={summary.weeklyUsageByInstance}
          xKey="week"
          lines={summary.instances.map((instance) => instance.name)}
        />
        <PieDistributionChart
          title="Licencas por nivel de risco"
          data={summary.riskDistribution}
        />
        <SimpleBarChart
          title="Evolucao semanal de riscos criticos"
          data={summary.weeklyCritical}
          xKey="week"
          yKey="critical"
          color="#E03131"
        />
        <section className="rounded-lg border bg-card">
          <div className="border-b p-5">
            <h2 className="text-base font-semibold">Top 10 licencas mais criticas</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Licenca</TableHead>
                <TableHead>Instancia</TableHead>
                <TableHead>Uso</TableHead>
                <TableHead>Risco</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.topCritical.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Sem snapshots na semana atual.
                  </TableCell>
                </TableRow>
              ) : (
                summary.topCritical.map((snapshot) => (
                  <TableRow key={snapshot.id}>
                    <TableCell>
                      <Link href={`/licenses/${snapshot.id}`} className="font-medium hover:underline">
                        {snapshot.licenseName ?? snapshot.productCode}
                      </Link>
                    </TableCell>
                    <TableCell>{snapshot.instance.name}</TableCell>
                    <TableCell>
                      {formatPercent(snapshot.licenseUsagePercent ?? snapshot.usagePercent)}
                    </TableCell>
                    <TableCell>
                      <RiskBadge riskLevel={snapshot.riskLevel} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </section>
      </div>
    </>
  );
}
