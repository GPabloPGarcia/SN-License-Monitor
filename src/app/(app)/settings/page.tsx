import { KpiCard } from "@/components/cards/kpi-card";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/session";

export default async function SettingsPage() {
  const user = await requireAuth();

  return (
    <>
      <PageHeader
        title="Configuracoes"
        description="Resumo operacional da instalacao local do MVP."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Usuario" value={user.name} helper={user.email} />
        <KpiCard label="Role" value={user.role} />
        <KpiCard
          label="Modo ServiceNow"
          value={process.env.MOCK_SERVICE_NOW === "true" ? "MOCK" : "REAL"}
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Seguranca e operacao</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Credenciais ServiceNow sao criptografadas com `ENCRYPTION_KEY` antes de irem para o banco.</p>
          <p>O frontend nao recebe senha, token ou payload de autenticacao das instancias.</p>
          <p>Coletas manuais exigem role ADMIN. VIEWER acessa apenas dashboards.</p>
          <p>Endpoint semanal: `POST /api/jobs/weekly-collection` com `Authorization: Bearer CRON_SECRET`.</p>
        </CardContent>
      </Card>
    </>
  );
}
