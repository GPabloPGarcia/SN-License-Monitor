import { notFound } from "next/navigation";
import { KpiCard } from "@/components/cards/kpi-card";
import { MultiLineChart } from "@/components/charts/dashboard-charts";
import { PageHeader } from "@/components/layout/page-header";
import { RiskBadge } from "@/components/status/risk-badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardService } from "@/services/DashboardService";
import { formatDate, formatNumber, formatPercent } from "@/lib/utils";

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export default async function LicenseDetailPage({
  params
}: {
  params: Promise<{ snapshotId: string }>;
}) {
  const { snapshotId } = await params;
  const detail = await DashboardService.getLicenseDetail(snapshotId);

  if (!detail) {
    notFound();
  }

  const { snapshot, comparison } = detail;
  const licenseName = snapshot.licenseName ?? snapshot.entitlementName ?? snapshot.productCode;

  return (
    <>
      <PageHeader
        title={licenseName}
        description={`${snapshot.instance.client.name} / ${snapshot.instance.name} / ${snapshot.productCode}`}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Product Code" value={snapshot.productCode} />
        <KpiCard label="Comprado" value={formatNumber(snapshot.purchasedCount ?? snapshot.licenseCount)} />
        <KpiCard label="Alocado" value={formatNumber(snapshot.allocatedCount ?? snapshot.licenseAllocated)} />
        <KpiCard label="Disponivel" value={formatNumber(snapshot.availableCount ?? snapshot.licenseAvailable)} />
        <KpiCard
          label="Uso"
          value={formatPercent(snapshot.usagePercent ?? snapshot.licenseUsagePercent)}
          helper={`Delta semanal: ${formatPercent(comparison.usageDelta)}`}
        />
        <KpiCard label="Dias ate expirar" value={formatNumber(snapshot.daysToExpire)} />
        <KpiCard
          label="Comprado vs anterior"
          value={formatNumber(comparison.purchasedDelta)}
        />
        <KpiCard
          label="Alocado vs anterior"
          value={formatNumber(comparison.allocatedDelta)}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da licenca</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground">Entitlement</p>
              <p className="font-medium">{snapshot.entitlementName ?? "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Meter Type</p>
              <p className="font-medium">{snapshot.meterType ?? "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Unit of Meter</p>
              <p className="font-medium">{snapshot.unitOfMeter ?? "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <p className="font-medium">{snapshot.allocatedStatus ?? snapshot.overviewStatus ?? "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Risco</p>
              <div className="mt-1">
                <RiskBadge riskLevel={snapshot.riskLevel} />
              </div>
            </div>
            <div>
              <p className="text-muted-foreground">Motivo do risco</p>
              <p className="font-medium">{snapshot.riskReason ?? "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Data inicial</p>
              <p className="font-medium">{formatDate(snapshot.startDate)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Data final</p>
              <p className="font-medium">{formatDate(snapshot.endDate)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Flags</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground">Expired</p>
              <p className="font-medium">{snapshot.expired ? "Sim" : "Nao"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Display Only</p>
              <p className="font-medium">{snapshot.displayOnly ? "Sim" : "Nao"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Is Capped</p>
              <p className="font-medium">{snapshot.isCapped ? "Sim" : "Nao"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Auto Sync</p>
              <p className="font-medium">{snapshot.autoSync ? "Sim" : "Nao"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Risco anterior</p>
              <p className="font-medium">{comparison.previousRisk ?? "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Risco mudou</p>
              <p className="font-medium">{comparison.riskChanged ? "Sim" : "Nao"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <MultiLineChart
          title="Evolucao semanal de comprado x alocado"
          data={detail.purchasedAllocatedSeries}
          xKey="week"
          lines={["purchased", "allocated"]}
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Secao tecnica</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            <AccordionItem value="overview">
              <AccordionTrigger>rawOverview</AccordionTrigger>
              <AccordionContent>
                <JsonBlock value={snapshot.rawOverview} />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="entitlement">
              <AccordionTrigger>rawEntitlement</AccordionTrigger>
              <AccordionContent>
                <JsonBlock value={snapshot.rawEntitlement} />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="license">
              <AccordionTrigger>rawLicenseDetails</AccordionTrigger>
              <AccordionContent>
                <JsonBlock value={snapshot.rawLicenseDetails} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </>
  );
}
