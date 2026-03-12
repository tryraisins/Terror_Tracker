import { sign, verify } from "jsonwebtoken";
import { compare, hash } from "bcryptjs";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_SECRET_VERSION = process.env.JWT_SECRET_VERSION || "1";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required");
}
const COOKIE_NAME = "admin_token";

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return compare(password, hash);
}

export async function createSession(userId: string, username: string) {
  const token = sign(
    { userId, username, ver: JWT_SECRET_VERSION },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
  const cookieStore = await cookies();
  
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

export async function verifySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const decoded = verify(token, JWT_SECRET) as {
      userId: string;
      username: string;
      ver?: string;
    };
    if (decoded.ver !== JWT_SECRET_VERSION) return null;
    return decoded as { userId: string; username: string };
  } catch (err) {
    return null;
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
