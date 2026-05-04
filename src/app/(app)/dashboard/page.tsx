import { executeGeneralCollectionAction } from "@/app/(app)/collection-actions";
import { RunCollectionButton } from "@/components/actions/run-collection-button";
import { KpiCard } from "@/components/cards/kpi-card";
import {
  MultiLineChart,
  SimpleBarChart,
  StackedRiskChart
} from "@/components/charts/dashboard-charts";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/status/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardService } from "@/services/DashboardService";
import { formatDateTime, formatNumber, formatPercent } from "@/lib/utils";
import { requireAuth } from "@/lib/auth/session";
import Link from "next/link";

export default async function DashboardPage() {
  const [user, summary] = await Promise.all([
    requireAuth(),
    DashboardService.getGeneralSummary()
  ]);
  const isAdmin = user.role === "ADMIN";

  const comparisonData = [
    {
      metric: "Criticas",
      atual: summary.weeklyComparison.currentCritical,
      anterior: summary.weeklyComparison.previousCritical
    },
    {
      metric: "Media uso",
      atual: summary.weeklyComparison.currentAverageUsage ?? 0,
      anterior: summary.weeklyComparison.previousAverageUsage ?? 0
    },
    {
      metric: "Acima 90%",
      atual: summary.weeklyComparison.currentAbove90,
      anterior: summary.weeklyComparison.previousAbove90
    },
    {
      metric: "Acima 100%",
      atual: summary.weeklyComparison.currentAbove100,
      anterior: summary.weeklyComparison.previousAbove100
    }
  ];

  return (
    <>
      <PageHeader
        title="Dashboard geral"
        description="Visao consolidada de clientes, instancias, consumo e risco da semana atual."
        actions={
          isAdmin ? (
            <RunCollectionButton
              label="Executar coleta geral"
              action={executeGeneralCollectionAction}
            />
          ) : null
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Clientes ativos" value={summary.activeClients} href="/clients" />
        <KpiCard label="Instancias ativas" value={summary.activeInstances} href="/instances" />
        <KpiCard
          label="Licencas monitoradas"
          value={summary.currentWeekLicenses}
          href="/licenses"
        />
        <KpiCard
          label="Risco critico"
          value={summary.criticalLicenses}
          href="/licenses?risk=CRITICAL"
        />
        <KpiCard
          label="Alto risco"
          value={summary.highRiskLicenses}
          href="/licenses?risk=HIGH"
        />
        <KpiCard
          label="Acima de 90%"
          value={summary.above90}
          href="/licenses?usageGte=90"
        />
        <KpiCard
          label="Acima de 100%"
          value={summary.above100}
          href="/licenses?usageGte=100"
        />
        <KpiCard
          label="Vencendo em 30 dias"
          value={summary.expiring30}
          href="/licenses?expiringDays=30"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Ultima coleta geral</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.lastGeneralRun ? (
              <>
                <StatusBadge status={summary.lastGeneralRun.status} />
                <p className="text-sm text-muted-foreground">
                  Inicio: {formatDateTime(summary.lastGeneralRun.startedAt)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Fim: {formatDateTime(summary.lastGeneralRun.finishedAt)}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma coleta geral registrada.
              </p>
            )}
          </CardContent>
        </Card>
        <KpiCard
          label="Delta criticas"
          value={formatNumber(summary.weeklyComparison.criticalDelta)}
          helper="Semana atual menos semana anterior"
        />
        <KpiCard
          label="Delta uso medio"
          value={formatPercent(summary.weeklyComparison.averageUsageDelta)}
          helper="Semana atual menos semana anterior"
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <StackedRiskChart title="Risco por instancia" data={summary.riskByInstance} />
        <SimpleBarChart
          title="Consumo medio por instancia"
          data={summary.averageUsageByInstance}
          xKey="instance"
          yKey="usagePercent"
        />
        <SimpleBarChart
          title="Top 10 licencas por uso"
          data={summary.topUsage.map((item) => ({
            licenca: `${item.name} (${item.instance})`,
            uso: item.usagePercent
          }))}
          xKey="licenca"
          yKey="uso"
          color="#E03131"
        />
        <MultiLineChart
          title="Semana atual vs anterior"
          data={comparisonData}
          xKey="metric"
          lines={["atual", "anterior"]}
        />
      </div>

      {summary.currentWeekLicenses === 0 ? (
        <Card className="mt-6">
          <CardContent className="flex flex-col gap-3 p-6 text-sm text-muted-foreground">
            <p>
              Ainda nao ha snapshots na semana atual. Com `MOCK_SERVICE_NOW=true`, a coleta
              geral ja popula os dashboards usando os JSONs locais.
            </p>
            {isAdmin ? null : (
              <Button asChild variant="outline" className="w-fit">
                <Link href="/collector-runs">Ver historico de coletas</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
