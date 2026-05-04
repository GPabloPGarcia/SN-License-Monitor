import { notFound } from "next/navigation";
import { ClientForm } from "@/components/forms/client-form";
import { PageHeader } from "@/components/layout/page-header";
import { updateClientAction } from "@/app/(app)/clients/actions";
import { requireAdmin } from "@/lib/auth/session";
import { ClientRepository } from "@/repositories/ClientRepository";

export default async function EditClientPage({
  params
}: {
  params: Promise<{ clientId: string }>;
}) {
  await requireAdmin();
  const { clientId } = await params;
  const client = await ClientRepository.findById(clientId);

  if (!client) {
    notFound();
  }

  return (
    <>
      <PageHeader title="Editar cliente" description={client.name} />
      <ClientForm client={client} action={updateClientAction.bind(null, client.id)} />
    </>
  );
}
