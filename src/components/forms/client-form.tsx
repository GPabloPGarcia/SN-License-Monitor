import type { Client } from "@prisma/client";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

export function ClientForm({
  client,
  action
}: {
  client?: Client;
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form action={action} className="max-w-2xl space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" defaultValue={client?.name ?? ""} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descricao</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={client?.description ?? ""}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked={client?.active ?? true}
          className="h-4 w-4 rounded border-input"
        />
        Cliente ativo
      </label>
      <div className="flex gap-2">
        <SubmitButton>{client ? "Salvar cliente" : "Criar cliente"}</SubmitButton>
        <Button asChild variant="outline">
          <Link href="/clients">Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
