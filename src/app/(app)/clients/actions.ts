"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

const clientSchema = z.object({
  name: z.string().trim().min(2, "Nome obrigatorio."),
  description: z.string().trim().optional(),
  active: z.boolean()
});

function parseClientForm(formData: FormData) {
  return clientSchema.parse({
    name: formData.get("name"),
    description: String(formData.get("description") ?? "") || undefined,
    active: formData.get("active") === "on"
  });
}

export async function createClientAction(formData: FormData) {
  await assertAdmin();
  const data = parseClientForm(formData);

  await prisma.client.create({
    data
  });

  revalidatePath("/clients");
  redirect("/clients?toast=client-created");
}

export async function updateClientAction(id: string, formData: FormData) {
  await assertAdmin();
  const data = parseClientForm(formData);

  await prisma.client.update({
    where: { id },
    data
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  redirect(`/clients/${id}?toast=client-updated`);
}

export async function toggleClientActiveAction(id: string) {
  await assertAdmin();
  const client = await prisma.client.findUnique({ where: { id } });

  if (!client) {
    throw new Error("Cliente nao encontrado.");
  }

  await prisma.client.update({
    where: { id },
    data: { active: !client.active }
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
}

export async function deleteClientAction(id: string) {
  await assertAdmin();

  await prisma.client.delete({ where: { id } });

  revalidatePath("/clients");
  redirect("/clients?toast=client-deleted");
}
