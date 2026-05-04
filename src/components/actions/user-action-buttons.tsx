"use client";

import { Trash2, UserCheck, UserX } from "lucide-react";
import {
  deleteUserAction,
  toggleUserActiveAction
} from "@/app/(app)/users/actions";
import { Button } from "@/components/ui/button";

export function ToggleUserActiveButton({
  userId,
  active
}: {
  userId: string;
  active: boolean;
}) {
  return (
    <form action={toggleUserActiveAction.bind(null, userId)}>
      <Button type="submit" variant="secondary" size="sm">
        {active ? (
          <UserX className="h-4 w-4" />
        ) : (
          <UserCheck className="h-4 w-4" />
        )}
        {active ? "Desativar" : "Ativar"}
      </Button>
    </form>
  );
}

export function DeleteUserButton({
  userId,
  userName
}: {
  userId: string;
  userName: string;
}) {
  return (
    <form
      action={deleteUserAction.bind(null, userId)}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `Tem certeza que deseja excluir o usuario "${userName}"? Essa acao nao pode ser desfeita.`
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <Button type="submit" variant="destructive" size="sm">
        <Trash2 className="h-4 w-4" />
        Excluir
      </Button>
    </form>
  );
}
