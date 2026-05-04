import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import {
  SESSION_COOKIE,
  type SessionUser,
  signSessionToken,
  verifySessionToken
} from "@/lib/auth/token";

const maxAge = 60 * 60 * 8;

export async function createSession(user: SessionUser) {
  const token = await signSessionToken(user);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const session = await verifySessionToken(token);
    if (!session) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    return user
      ? ({
          ...user,
          role: user.role
        } satisfies SessionUser)
      : null;
  } catch {
    return null;
  }
}

export async function requireAuth() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return user;
}

export async function assertAdmin() {
  const user = await getSessionUser();

  if (!user) {
    throw new Error("Sessao expirada. Faca login novamente.");
  }

  if (user.role !== "ADMIN") {
    throw new Error("Apenas administradores podem executar esta acao.");
  }

  return user;
}
