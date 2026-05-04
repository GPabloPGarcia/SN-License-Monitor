import { notFound } from "next/navigation";
import { updateInstanceAction } from "@/app/(app)/instances/actions";
import { InstanceForm } from "@/components/forms/instance-form";
import { PageHeader } from "@/components/layout/page-header";
import { requireAdmin } from "@/lib/auth/session";
import { ClientRepository } from "@/repositories/ClientRepository";
import { InstanceRepository } from "@/repositories/InstanceRepository";

export default async function EditInstancePage({
  params
}: {
  params: Promise<{ instanceId: string }>;
}) {
  await requireAdmin();
  const { instanceId } = await params;
  const [instance, clients] = await Promise.all([
    InstanceRepository.findById(instanceId),
    ClientRepository.listActive()
  ]);

  if (!instance) {
    notFound();
  }

  return (
    <>
      <PageHeader title="Editar instancia" description={instance.name} />
      <InstanceForm
        instance={instance}
        clients={clients}
        action={updateInstanceAction.bind(null, instance.id)}
      />
    </>
  );
}
