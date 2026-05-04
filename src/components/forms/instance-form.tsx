import type { Client, ServiceNowInstance } from "@prisma/client";
import Link from "next/link";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InstanceForm({
  instance,
  clients,
  action
}: {
  instance?: ServiceNowInstance;
  clients: Client[];
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form action={action} className="max-w-2xl space-y-5">
      <div className="space-y-2">
        <Label htmlFor="clientId">Cliente</Label>
        <select
          id="clientId"
          name="clientId"
          defaultValue={instance?.clientId ?? clients[0]?.id}
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nome da instancia</Label>
          <Input id="name" name="name" defaultValue={instance?.name ?? ""} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="environment">Ambiente</Label>
          <Input
            id="environment"
            name="environment"
            defaultValue={instance?.environment ?? ""}
            placeholder="production"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="baseUrl">Base URL</Label>
        <Input
          id="baseUrl"
          name="baseUrl"
          type="url"
          defaultValue={instance?.baseUrl ?? ""}
          placeholder="https://instance.service-now.com"
          required
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="username">Usuario Basic Auth</Label>
          <Input
            id="username"
            name="username"
            defaultValue={instance?.username ?? ""}
            autoComplete="off"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha Basic Auth</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder={instance ? "Manter senha atual" : ""}
            autoComplete="new-password"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="token">Token criptografado opcional</Label>
        <Input
          id="token"
          name="token"
          type="password"
          placeholder={instance ? "Manter token atual" : ""}
          autoComplete="off"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked={instance?.active ?? true}
          className="h-4 w-4 rounded border-input"
        />
        Instancia ativa
      </label>
      <div className="flex gap-2">
        <SubmitButton>{instance ? "Salvar instancia" : "Criar instancia"}</SubmitButton>
        <Button asChild variant="outline">
          <Link href="/instances">Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
