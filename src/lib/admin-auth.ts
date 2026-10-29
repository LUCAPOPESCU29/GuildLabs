/**
 * Password gate for the admin dashboard.
 *
 * The password is never stored anywhere — not in this file, not in the
 * environment, not in git. What's stored is a salted scrypt hash
 * (`ADMIN_PASSWORD_HASH`), so reading the env var tells an attacker nothing
 * they can log in with; they'd have to brute-force scrypt to recover it.
 *
 * There is deliberately no fallback password. If the hash is unset the gate
 * fails closed rather than quietly accepting a default — a hardcoded default is
 * exactly the thing that leaks when a repo is shared or a file is pasted.
 */

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCb) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number
) => Promise<Buffer>;

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "forge-session-secret-change-in-prod"
);

export const ADMIN_COOKIE = "gl_admin";
const MAX_AGE_SECONDS = 60 * 60 * 12; // 12h — short, this is a read-only console
const KEYLEN = 64;

/**
 * Hash a password for storage. Output: `scrypt$<saltHex>$<hashHex>`.
 * Used by `scripts/hash-admin-password.mjs`; never called at request time.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, KEYLEN);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

/**
 * Verify a candidate against the stored hash in constant time.
 * Returns false — never throws — on malformed input or missing configuration.
 */
export async function passwordMatches(candidate: unknown): Promise<boolean> {
  if (typeof candidate !== "string" || candidate.length === 0) return false;

  const stored = process.env.ADMIN_PASSWORD_HASH;
  if (!stored) return false; // fail closed: no hash configured, no access

  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;

  const salt = Buffer.from(parts[1], "hex");
  const expected = Buffer.from(parts[2], "hex");
  if (salt.length === 0 || expected.length !== KEYLEN) return false;

  let derived: Buffer;
  try {
    derived = await scrypt(candidate, salt, KEYLEN);
  } catch {
    return false;
  }
  // Both buffers are KEYLEN, so timingSafeEqual is safe to call directly.
  return timingSafeEqual(derived, expected);
}

export async function createAdminToken(): Promise<string> {
  return new SignJWT({ admin: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(SECRET);
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}

/** True when the caller holds a valid, unexpired admin cookie. */
export async function isAdmin(): Promise<boolean> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload.admin === true;
  } catch {
    return false;
  }
}
