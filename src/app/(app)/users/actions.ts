"use server";

import { Prisma, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assertAdmin, clearSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma/client";

const roleSchema = z.nativeEnum(UserRole);

const createUserSchema = z.object({
  name: z.string().trim().min(2, "Nome obrigatorio."),
  email: z.string().trim().email("Email invalido.").toLowerCase(),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres."),
  role: roleSchema
});

const updateUserSchema = createUserSchema
  .omit({ password: true })
  .extend({
    password: z.string().optional()
  });

function normalizeOptionalPassword(value: FormDataEntryValue | null) {
  const password = String(value ?? "");
  return password.length > 0 ? password : undefined;
}

function formatUserError(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    throw new Error("Ja existe um usuario cadastrado com este email.");
  }

  throw error;
}

function redirectWithUserError(message: string): never {
  redirect(`/users?error=${encodeURIComponent(message)}`);
}

async function getUserForAdminAction(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      active: true
    }
  });

  if (!user) {
    redirectWithUserError("Usuario nao encontrado.");
  }

  return user;
}

async function assertCanRemoveActiveAdmin(userId: string) {
  const user = await getUserForAdminAction(userId);

  if (user.role !== UserRole.ADMIN || !user.active) {
    return user;
  }

  const activeAdminCount = await prisma.user.count({
    where: {
      role: UserRole.ADMIN,
      active: true
    }
  });

  if (activeAdminCount <= 1) {
    redirectWithUserError("Mantenha pelo menos um administrador ativo cadastrado.");
  }

  return user;
}

async function assertCanChangeRole(userId: string, nextRole: UserRole) {
  if (nextRole === UserRole.ADMIN) {
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, active: true }
  });

  if (user?.role !== UserRole.ADMIN || !user.active) {
    return;
  }

  const adminCount = await prisma.user.count({
    where: {
      role: UserRole.ADMIN,
      active: true
    }
  });

  if (adminCount <= 1) {
    redirectWithUserError("Mantenha pelo menos um administrador ativo cadastrado.");
  }
}

export async function createUserAction(formData: FormData) {
  await assertAdmin();
  const data = createUserSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role")
  });

  try {
    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: await hashPassword(data.password),
        role: data.role,
        active: true
      }
    });
  } catch (error) {
    formatUserError(error);
  }

  revalidatePath("/users");
  redirect("/users?toast=user-created");
}

export async function updateUserAction(userId: string, formData: FormData) {
  await assertAdmin();
  const data = updateUserSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: normalizeOptionalPassword(formData.get("password")),
    role: formData.get("role")
  });

  if (data.password !== undefined && data.password.length < 8) {
    throw new Error("Senha deve ter pelo menos 8 caracteres.");
  }

  await assertCanChangeRole(userId, data.role);

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        ...(data.password
          ? { passwordHash: await hashPassword(data.password) }
          : {})
      }
    });
  } catch (error) {
    formatUserError(error);
  }

  revalidatePath("/users");
  revalidatePath(`/users/${userId}/edit`);
  redirect("/users?toast=user-updated");
}

export async function toggleUserActiveAction(userId: string) {
  const currentUser = await assertAdmin();
  const user = await getUserForAdminAction(userId);
  const nextActive = !user.active;

  if (!nextActive) {
    await assertCanRemoveActiveAdmin(userId);
  }

  await prisma.user.update({
    where: { id: userId },
    data: { active: nextActive }
  });

  revalidatePath("/users");
  revalidatePath(`/users/${userId}/edit`);

  if (currentUser.id === userId && !nextActive) {
    await clearSession();
    redirect("/login");
  }

  redirect(`/users?toast=${nextActive ? "user-activated" : "user-deactivated"}`);
}

export async function deleteUserAction(userId: string) {
  const currentUser = await assertAdmin();
  await assertCanRemoveActiveAdmin(userId);

  await prisma.user.delete({
    where: { id: userId }
  });

  revalidatePath("/users");

  if (currentUser.id === userId) {
    await clearSession();
    redirect("/login");
  }

  redirect("/users?toast=user-deleted");
}
