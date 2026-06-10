import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "forge-session-secret-change-in-prod"
);

export type SessionUser = {
  id: string;
  username: string;
  avatar: string | null;
  accessToken: string;
};

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);
  return token;
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get("forge_session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return (payload as any).user as SessionUser;
  } catch {
    return null;
  }
}
