import Link from "next/link";
import { Suspense } from "react";
import { Edit, Plus } from "lucide-react";
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
import { toggleClientActiveAction } from "@/app/(app)/clients/actions";
import { ClientRepository } from "@/repositories/ClientRepository";
import { requireAuth } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/utils";

export default async function ClientsPage() {
  const [user, clients] = await Promise.all([requireAuth(), ClientRepository.list()]);
  const isAdmin = user.role === "ADMIN";

  return (
    <>
      <Suspense>
        <SearchParamToast />
      </Suspense>
      <PageHeader
        title="Clientes"
        description="Cadastro de clientes monitorados e suas instancias ServiceNow."
        actions={
          isAdmin ? (
            <Button asChild>
              <Link href="/clients/new">
                <Plus className="h-4 w-4" />
                Novo cliente
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Instancias</TableHead>
              <TableHead>Atualizado em</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhum cliente cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <Link href={`/clients/${client.id}`} className="font-medium hover:underline">
                      {client.name}
                    </Link>
                    {client.description ? (
                      <p className="mt-1 text-xs text-muted-foreground">{client.description}</p>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={client.active ? "SUCCESS" : "PENDING"} />
                  </TableCell>
                  <TableCell>{client._count.instances}</TableCell>
                  <TableCell>{formatDateTime(client.updatedAt)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      {isAdmin ? (
                        <>
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/clients/${client.id}/edit`}>
                              <Edit className="h-4 w-4" />
                              Editar
                            </Link>
                          </Button>
                          <form action={toggleClientActiveAction.bind(null, client.id)}>
                            <Button variant="secondary" size="sm">
                              {client.active ? "Desativar" : "Ativar"}
                            </Button>
                          </form>
                        </>
                      ) : (
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/clients/${client.id}`}>Abrir</Link>
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
