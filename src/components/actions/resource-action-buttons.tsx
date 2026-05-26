"use client";

import { Trash2 } from "lucide-react";
import { deleteClientAction } from "@/app/(app)/clients/actions";
import { deleteInstanceAction } from "@/app/(app)/instances/actions";
import { Button } from "@/components/ui/button";

export function DeleteClientButton({
  clientId,
  clientName
}: {
  clientId: string;
  clientName: string;
}) {
  return (
    <form
      action={deleteClientAction.bind(null, clientId)}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `Tem certeza que deseja excluir o cliente "${clientName}"?\n\nIsso tambem exclui todas as instancias e snapshots vinculados. Essa acao nao pode ser desfeita.`
        );
        if (!confirmed) event.preventDefault();
      }}
    >
      <Button type="submit" variant="destructive" size="sm">
        <Trash2 className="h-4 w-4" />
        Excluir
      </Button>
    </form>
  );
}

export function DeleteInstanceButton({
  instanceId,
  instanceName
}: {
  instanceId: string;
  instanceName: string;
}) {
  return (
    <form
      action={deleteInstanceAction.bind(null, instanceId)}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `Tem certeza que deseja excluir a instancia "${instanceName}"?\n\nIsso tambem exclui todos os snapshots vinculados. Essa acao nao pode ser desfeita.`
        );
        if (!confirmed) event.preventDefault();
      }}
    >
      <Button type="submit" variant="destructive" size="sm">
        <Trash2 className="h-4 w-4" />
        Excluir
      </Button>
    </form>
  );
}
