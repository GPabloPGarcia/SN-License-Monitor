import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "sn_license_session";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "VIEWER";
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required in production.");
  }

  return new TextEncoder().encode(
    secret ?? "development-only-auth-secret-change-me"
  );
}

export async function signSessionToken(user: SessionUser) {
  return new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecret());
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret());

  if (
    typeof payload.id !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.name !== "string" ||
    (payload.role !== "ADMIN" && payload.role !== "VIEWER")
  ) {
    return null;
  }

  return {
    id: payload.id,
    name: payload.name,
    email: payload.email,
    role: payload.role
  } satisfies SessionUser;
}
