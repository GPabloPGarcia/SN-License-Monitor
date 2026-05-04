import { createUserAction } from "@/app/(app)/users/actions";
import { UserForm } from "@/components/forms/user-form";
import { PageHeader } from "@/components/layout/page-header";
import { requireAdmin } from "@/lib/auth/session";

export default async function NewUserPage() {
  await requireAdmin();

  return (
    <>
      <PageHeader
        title="Novo usuario"
        description="Cadastre um administrador ou um usuario viewer."
      />
      <UserForm action={createUserAction} />
    </>
  );
}
