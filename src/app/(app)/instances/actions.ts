"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { encryptSecret } from "@/lib/crypto/credentials";
import { assertAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

const instanceSchema = z.object({
  clientId: z.string().min(1, "Cliente obrigatorio."),
  name: z.string().trim().min(2, "Nome obrigatorio."),
  baseUrl: z.string().trim().url("Base URL invalida."),
  environment: z.string().trim().optional(),
  active: z.boolean(),
  username: z.string().trim().optional(),
  password: z.string().optional(),
  token: z.string().optional()
});

function parseInstanceForm(formData: FormData) {
  return instanceSchema.parse({
    clientId: formData.get("clientId"),
    name: formData.get("name"),
    baseUrl: formData.get("baseUrl"),
    environment: String(formData.get("environment") ?? "") || undefined,
    active: formData.get("active") === "on",
    username: String(formData.get("username") ?? "") || undefined,
    password: String(formData.get("password") ?? "") || undefined,
    token: String(formData.get("token") ?? "") || undefined
  });
}

export async function createInstanceAction(formData: FormData) {
  await assertAdmin();
  const data = parseInstanceForm(formData);

  const instance = await prisma.serviceNowInstance.create({
    data: {
      clientId: data.clientId,
      name: data.name,
      baseUrl: data.baseUrl,
      environment: data.environment,
      active: data.active,
      authType: "BASIC",
      username: data.username,
      encryptedPassword: encryptSecret(data.password),
      encryptedToken: encryptSecret(data.token)
    }
  });

  revalidatePath("/instances");
  revalidatePath(`/clients/${data.clientId}`);
  redirect(`/instances/${instance.id}?toast=instance-created`);
}

export async function updateInstanceAction(id: string, formData: FormData) {
  await assertAdmin();
  const data = parseInstanceForm(formData);

  await prisma.serviceNowInstance.update({
    where: { id },
    data: {
      clientId: data.clientId,
      name: data.name,
      baseUrl: data.baseUrl,
      environment: data.environment,
      active: data.active,
      authType: "BASIC",
      username: data.username,
      ...(data.password ? { encryptedPassword: encryptSecret(data.password) } : {}),
      ...(data.token ? { encryptedToken: encryptSecret(data.token) } : {})
    }
  });

  revalidatePath("/instances");
  revalidatePath(`/instances/${id}`);
  revalidatePath(`/clients/${data.clientId}`);
  redirect(`/instances/${id}?toast=instance-updated`);
}

export async function toggleInstanceActiveAction(id: string) {
  await assertAdmin();
  const instance = await prisma.serviceNowInstance.findUnique({ where: { id } });

  if (!instance) {
    throw new Error("Instancia nao encontrada.");
  }

  await prisma.serviceNowInstance.update({
    where: { id },
    data: { active: !instance.active }
  });

  revalidatePath("/instances");
  revalidatePath(`/instances/${id}`);
  revalidatePath(`/clients/${instance.clientId}`);
}

export async function deleteInstanceAction(id: string) {
  await assertAdmin();
  const instance = await prisma.serviceNowInstance.findUnique({ where: { id } });

  if (!instance) {
    throw new Error("Instancia nao encontrada.");
  }

  await prisma.serviceNowInstance.delete({ where: { id } });

  revalidatePath("/instances");
  revalidatePath(`/clients/${instance.clientId}`);
  redirect("/instances?toast=instance-deleted");
}
