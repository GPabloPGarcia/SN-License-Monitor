import { createInstanceAction } from "@/app/(app)/instances/actions";
import { InstanceForm } from "@/components/forms/instance-form";
import { PageHeader } from "@/components/layout/page-header";
import { requireAdmin } from "@/lib/auth/session";
import { ClientRepository } from "@/repositories/ClientRepository";

export default async function NewInstancePage({
  searchParams
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  await requireAdmin();
  const [clients, params] = await Promise.all([
    ClientRepository.listActive(),
    searchParams
  ]);

  return (
    <>
      <PageHeader
        title="Nova instancia"
        description="Cadastre uma instancia ServiceNow vinculada a um cliente ativo."
      />
      <InstanceForm
        clients={clients}
        action={createInstanceAction}
        defaultClientId={params.clientId}
      />
    </>
  );
}
