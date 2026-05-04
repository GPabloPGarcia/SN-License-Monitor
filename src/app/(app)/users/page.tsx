import Link from "next/link";
import { Suspense } from "react";
import { Edit, Plus } from "lucide-react";
import {
  DeleteUserButton,
  ToggleUserActiveButton
} from "@/components/actions/user-action-buttons";
import { SearchParamToast } from "@/components/feedback/search-param-toast";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
import { formatDateTime } from "@/lib/utils";

export default async function UsersPage() {
  await requireAdmin();
  const users = await prisma.user.findMany({
    orderBy: [{ active: "desc" }, { role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return (
    <>
      <Suspense>
        <SearchParamToast />
      </Suspense>
      <PageHeader
        title="Usuarios"
        description="Gerencie administradores e usuarios com acesso somente leitura."
        actions={
          <Button asChild>
            <Link href="/users/new">
              <Plus className="h-4 w-4" />
              Novo usuario
            </Link>
          </Button>
        }
      />

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead>Atualizado em</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhum usuario cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <p className="font-medium">{user.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{user.email}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.active ? "low" : "outline"}>
                      {user.active ? "ATIVO" : "INATIVO"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDateTime(user.createdAt)}</TableCell>
                  <TableCell>{formatDateTime(user.updatedAt)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/users/${user.id}/edit`}>
                          <Edit className="h-4 w-4" />
                          Editar
                        </Link>
                      </Button>
                      <ToggleUserActiveButton userId={user.id} active={user.active} />
                      <DeleteUserButton userId={user.id} userName={user.name} />
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
