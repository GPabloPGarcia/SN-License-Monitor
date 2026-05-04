import { ClientForm } from "@/components/forms/client-form";
import { PageHeader } from "@/components/layout/page-header";
import { createClientAction } from "@/app/(app)/clients/actions";
import { requireAdmin } from "@/lib/auth/session";

export default async function NewClientPage() {
  await requireAdmin();

  return (
    <>
      <PageHeader title="Novo cliente" description="Cadastre um novo cliente monitorado." />
      <ClientForm action={createClientAction} />
    </>
  );
}
