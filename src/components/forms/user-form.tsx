import type { User, UserRole } from "@prisma/client";
import Link from "next/link";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

type UserFormData = Pick<User, "name" | "email" | "role">;

export function UserForm({
  user,
  action
}: {
  user?: UserFormData;
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form action={action} className="max-w-2xl space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" defaultValue={user?.name ?? ""} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={user?.email ?? ""}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">
          {user ? "Nova senha" : "Senha"}
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          minLength={8}
          required={!user}
          autoComplete="new-password"
        />
        {user ? (
          <p className="text-xs text-muted-foreground">
            Deixe em branco para manter a senha atual.
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Perfil</Label>
        <Select name="role" defaultValue={(user?.role ?? "VIEWER") satisfies UserRole}>
          <SelectTrigger id="role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ADMIN">ADMIN</SelectItem>
            <SelectItem value="VIEWER">VIEWER</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <SubmitButton>{user ? "Salvar usuario" : "Criar usuario"}</SubmitButton>
        <Button asChild variant="outline">
          <Link href="/users">Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
