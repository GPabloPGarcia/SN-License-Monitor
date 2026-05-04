import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Edit } from "lucide-react";
import {
  executeInstanceCollectionAction,
  testInstanceConnectionAction
} from "@/app/(app)/collection-actions";
import {
  RunCollectionButton,
  TestConnectionButton
} from "@/components/actions/run-collection-button";
import { KpiCard } from "@/components/cards/kpi-card";
import {
  MultiLineChart,
  PieDistributionChart,
  SimpleBarChart
} from "@/components/charts/dashboard-charts";
import { SearchParamToast } from "@/components/feedback/search-param-toast";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/status/status-badge";
import { LicenseTable, type LicenseTableItem } from "@/components/tables/license-table";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/session";
import { formatDateTime, formatPercent } from "@/lib/utils";
import { DashboardService } from "@/services/DashboardService";

export default async function InstanceDashboardPage({
  params
}: {
  params: Promise<{ instanceId: string }>;
}) {
  const { instanceId } = await params;
  const [user, summary] = await Promise.all([
    requireAuth(),
    DashboardService.getInstanceSummary(instanceId)
  ]);

  if (!summary) {
    notFound();
  }

  const isAdmin = user.role === "ADMIN";
  const licenseRows: LicenseTableItem[] = summary.licenses.map(({ snapshot, comparison }) => ({
    id: snapshot.id,
    name: snapshot.licenseName ?? snapshot.entitlementName ?? snapshot.productCode,
    productCode: snapshot.productCode,
    meterType: snapshot.meterType,
    purchased: snapshot.purchasedCount ?? snapshot.licenseCount,
    allocated: snapshot.allocatedCount ?? snapshot.licenseAllocated,
    available: snapshot.availableCount ?? snapshot.licenseAvailable,
    usagePercent: snapshot.usagePercent ?? snapshot.licenseUsagePercent,
    status: snapshot.allocatedStatus ?? snapshot.overviewStatus,
    riskLevel: snapshot.riskLevel,
    endDate: snapshot.endDate?.toISOString() ?? null,
    weeklyVariation: comparison.usageDelta
  }));

  return (
    <>
      <Suspense>
        <SearchParamToast />
      </Suspense>
      <PageHeader
        title={summary.instance.name}
        description={`${summary.instance.client.name} - ${summary.instance.baseUrl}`}
        actions={
          isAdmin ? (
            <>
              <RunCollectionButton
                label="Executar coleta da instancia"
                action={executeInstanceCollectionAction.bind(null, summary.instance.id)}
              />
              <TestConnectionButton
                action={testInstanceConnectionAction.bind(null, summary.instance.id)}
              />
              <Button asChild variant="outline">
                <Link href={`/instances/${summary.instance.id}/edit`}>
                  <Edit className="h-4 w-4" />
                  Editar
                </Link>
              </Button>
            </>
          ) : null
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Cliente" value={summary.instance.client.name} />
        <KpiCard label="Total de licencas" value={summary.totalLicenses} />
        <KpiCard label="Licencas criticas" value={summary.criticalLicenses} />
        <KpiCard label="Licencas vencendo" value={summary.expiringLicenses} />
        <KpiCard
          label="Consumo medio"
          value={formatPercent(summary.averageUsage)}
          helper={`Delta: ${formatPercent(summary.comparison.averageUsageDelta)}`}
        />
        <KpiCard
          label="Acima de 90%"
          value={summary.comparison.currentAbove90}
          helper={`Delta: ${summary.comparison.above90Delta}`}
        />
        <KpiCard
          label="Acima de 100%"
          value={summary.comparison.currentAbove100}
          helper={`Delta: ${summary.comparison.above100Delta}`}
        />
        <div className="rounded-lg border bg-card p-5">
          <p className="text-sm font-medium text-muted-foreground">Ultima coleta</p>
          <div className="mt-3">
            {summary.lastRun ? <StatusBadge status={summary.lastRun.status} /> : <StatusBadge status="PENDING" />}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {formatDateTime(summary.lastRun?.finishedAt ?? summary.lastRun?.startedAt)}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <SimpleBarChart
          title="Evolucao semanal de uso medio"
          data={summary.weeklyAverageUsage}
          xKey="week"
          yKey="usagePercent"
        />
        <SimpleBarChart
          title="Evolucao semanal de licencas criticas"
          data={summary.weeklyCritical}
          xKey="week"
          yKey="critical"
          color="#E03131"
        />
        <MultiLineChart
          title="Comprado x alocado por semana"
          data={summary.weeklyPurchasedAllocated}
          xKey="week"
          lines={["purchased", "allocated"]}
        />
        <PieDistributionChart
          title="Distribuicao por meter type"
          data={summary.meterDistribution}
        />
        <SimpleBarChart
          title="Top 10 licencas com maior consumo"
          data={summary.topUsage.map((item) => ({
            licenca: item.name,
            uso: item.usagePercent
          }))}
          xKey="licenca"
          yKey="uso"
          color="#F59F00"
        />
      </div>

      <section className="mt-6">
        <div className="mb-3">
          <h2 className="text-base font-semibold">Licencas da semana atual</h2>
          <p className="text-sm text-muted-foreground">
            Use o filtro para localizar licencas, product codes, medidores ou status.
          </p>
        </div>
        <LicenseTable licenses={licenseRows} />
      </section>
    </>
  );
}
