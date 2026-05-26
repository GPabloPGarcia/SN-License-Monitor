import Link from "next/link";
import { Suspense } from "react";
import { Edit, Plus } from "lucide-react";
import { toggleInstanceActiveAction } from "@/app/(app)/instances/actions";
import { DeleteInstanceButton } from "@/components/actions/resource-action-buttons";
import { SearchParamToast } from "@/components/feedback/search-param-toast";
import { PageHeader } from "@/components/layout/page-header";
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
import { InstanceRepository } from "@/repositories/InstanceRepository";
import { requireAuth } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/utils";

export default async function InstancesPage() {
  const [user, instances] = await Promise.all([requireAuth(), InstanceRepository.list()]);
  const isAdmin = user.role === "ADMIN";

  return (
    <>
      <Suspense>
        <SearchParamToast />
      </Suspense>
      <PageHeader
        title="Instancias"
        description="Instancias ServiceNow cadastradas por cliente. Credenciais nao sao exibidas."
        actions={
          isAdmin ? (
            <Button asChild>
              <Link href="/instances/new">
                <Plus className="h-4 w-4" />
                Nova instancia
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Instancia</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Base URL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Atualizado em</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {instances.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhuma instancia cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              instances.map((instance) => (
                <TableRow key={instance.id}>
                  <TableCell>
                    <Link
                      href={`/instances/${instance.id}`}
                      className="font-medium hover:underline"
                    >
                      {instance.name}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {instance.environment ?? "ambiente nao informado"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Link href={`/clients/${instance.clientId}`} className="hover:underline">
                      {instance.client.name}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{instance.baseUrl}</TableCell>
                  <TableCell>
                    <StatusBadge status={instance.active ? "SUCCESS" : "PENDING"} />
                  </TableCell>
                  <TableCell>{formatDateTime(instance.updatedAt)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      {isAdmin ? (
                        <>
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/instances/${instance.id}/edit`}>
                              <Edit className="h-4 w-4" />
                              Editar
                            </Link>
                          </Button>
                          <form action={toggleInstanceActiveAction.bind(null, instance.id)}>
                            <Button variant="secondary" size="sm">
                              {instance.active ? "Desativar" : "Ativar"}
                            </Button>
                          </form>
                          <DeleteInstanceButton instanceId={instance.id} instanceName={instance.name} />
                        </>
                      ) : (
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/instances/${instance.id}`}>Abrir</Link>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
