import { notFound } from "next/navigation";
import { updateUserAction } from "@/app/(app)/users/actions";
import { UserForm } from "@/components/forms/user-form";
import { PageHeader } from "@/components/layout/page-header";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

export default async function EditUserPage({
  params
}: {
  params: Promise<{ userId: string }>;
}) {
  await requireAdmin();
  const { userId } = await params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      role: true
    }
  });

  if (!user) {
    notFound();
  }

  return (
    <>
      <PageHeader title="Editar usuario" description={user.email} />
      <UserForm user={user} action={updateUserAction.bind(null, userId)} />
    </>
  );
}
