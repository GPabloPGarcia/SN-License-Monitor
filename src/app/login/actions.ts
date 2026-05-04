"use server";

import { redirect } from "next/navigation";
import { createSession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma/client";

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _previousState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const nextValue = String(formData.get("next") ?? "/dashboard");
  const next = nextValue.startsWith("/") && !nextValue.startsWith("//")
    ? nextValue
    : "/dashboard";

  if (!email || !password) {
    return { error: "Informe email e senha." };
  }

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    return { error: "Credenciais invalidas." };
  }

  if (!user.active) {
    return { error: "Usuario desativado. Fale com um administrador." };
  }

  const validPassword = await verifyPassword(password, user.passwordHash);
  if (!validPassword) {
    return { error: "Credenciais invalidas." };
  }

  await createSession({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  });

  redirect(next);
}
