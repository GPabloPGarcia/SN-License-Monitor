import Link from "next/link";
import type { Prisma, RiskLevel } from "@prisma/client";
import { KpiCard } from "@/components/cards/kpi-card";
import { PageHeader } from "@/components/layout/page-header";
import { LicenseTable, type LicenseTableItem } from "@/components/tables/license-table";
import { Button } from "@/components/ui/button";
import { getWeekReference } from "@/lib/dates/weeks";
import { prisma } from "@/lib/prisma/client";
import { formatPercent } from "@/lib/utils";

const validRisks = new Set<RiskLevel>(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

function parseRisks(value: string | undefined) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter((item): item is RiskLevel => validRisks.has(item as RiskLevel));
}

function pageTitle({
  risks,
  usageGte,
  expiringDays
}: {
  risks: RiskLevel[];
  usageGte: number | null;
  expiringDays: number | null;
}) {
  if (risks.length === 1) {
    return `Licencas com risco ${risks[0]}`;
  }

  if (usageGte !== null) {
    return `Licencas com uso acima de ${usageGte}%`;
  }

  if (expiringDays !== null) {
    return `Licencas vencendo em ${expiringDays} dias`;
  }

  return "Licencas monitoradas";
}

export default async function LicensesPage({
  searchParams
}: {
  searchParams: Promise<{
    risk?: string;
    usageGte?: string;
    expiringDays?: string;
  }>;
}) {
  const params = await searchParams;
  const weekReference = getWeekReference();
  const risks = parseRisks(params.risk);
  const usageGte = params.usageGte ? Number(params.usageGte) : null;
  const expiringDays = params.expiringDays ? Number(params.expiringDays) : null;

  const where: Prisma.LicenseWeeklySnapshotWhereInput = {
    weekReference
  };

  if (risks.length > 0) {
    where.riskLevel = { in: risks };
  }

  if (usageGte !== null && Number.isFinite(usageGte)) {
    where.OR = [
      { usagePercent: { gte: usageGte } },
      { licenseUsagePercent: { gte: usageGte } }
    ];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (expiringDays !== null && Number.isFinite(expiringDays)) {
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() + expiringDays);
    where.endDate = { gte: today, lte: cutoff };
  }

  const [licenses, totals] = await Promise.all([
    prisma.licenseWeeklySnapshot.findMany({
      where,
      include: {
        instance: {
          include: {
            client: true
          }
        }
      },
      orderBy: [{ riskLevel: "desc" }, { usagePercent: "desc" }, { licenseName: "asc" }]
    }),
    prisma.licenseWeeklySnapshot.findMany({
      where: { weekReference },
      select: {
        riskLevel: true,
        usagePercent: true,
        licenseUsagePercent: true,
        daysToExpire: true,
        endDate: true
      }
    })
  ]);

  const rows: LicenseTableItem[] = licenses.map((snapshot) => ({
    id: snapshot.id,
    name: `${snapshot.licenseName ?? snapshot.entitlementName ?? snapshot.productCode} / ${snapshot.instance.name}`,
    productCode: snapshot.productCode,
    meterType: snapshot.meterType,
    purchased: snapshot.purchasedCount ?? snapshot.licenseCount,
    allocated: snapshot.allocatedCount ?? snapshot.licenseAllocated,
    available: snapshot.availableCount ?? snapshot.licenseAvailable,
    usagePercent: snapshot.usagePercent ?? snapshot.licenseUsagePercent,
    status: snapshot.allocatedStatus ?? snapshot.overviewStatus,
    riskLevel: snapshot.riskLevel,
    endDate: snapshot.endDate?.toISOString() ?? null,
    weeklyVariation: null
  }));

  const cutoff30 = new Date(today);
  cutoff30.setDate(cutoff30.getDate() + 30);

  const critical = totals.filter((item) => item.riskLevel === "CRITICAL").length;
  const high = totals.filter((item) => item.riskLevel === "HIGH").length;
  const above90 = totals.filter(
    (item) => (item.usagePercent ?? item.licenseUsagePercent ?? 0) >= 90
  ).length;
  const expiring30 = totals.filter(
    (item) =>
      item.endDate !== null &&
      item.endDate >= today &&
      item.endDate <= cutoff30
  ).length;

  return (
    <>
      <PageHeader
        title={pageTitle({ risks, usageGte, expiringDays })}
        description={`Semana de referencia ${weekReference}. Clique em uma licenca para abrir o detalhe tecnico e historico semanal.`}
        actions={
          <Button asChild variant="outline">
            <Link href="/dashboard">Voltar ao dashboard</Link>
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Resultado filtrado" value={licenses.length} href="/licenses" />
        <KpiCard label="Risco critico" value={critical} href="/licenses?risk=CRITICAL" />
        <KpiCard label="Alto risco" value={high} href="/licenses?risk=HIGH" />
        <KpiCard label="Acima de 90%" value={above90} href="/licenses?usageGte=90" />
        <KpiCard
          label="Vencendo em 30 dias"
          value={expiring30}
          href="/licenses?expiringDays=30"
        />
        <KpiCard
          label="Filtro de uso"
          value={usageGte !== null && Number.isFinite(usageGte) ? formatPercent(usageGte) : "-"}
        />
      </div>

      <LicenseTable licenses={rows} />
    </>
  );
}
