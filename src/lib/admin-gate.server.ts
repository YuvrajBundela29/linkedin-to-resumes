import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

export type AdminGateSession = { unlocked?: boolean; userId?: string };

function sessionConfig() {
  const password = process.env.ADMIN_SESSION_SECRET;
  if (!password) throw new Error("Missing ADMIN_SESSION_SECRET");
  return {
    password,
    name: "rf-admin-gate",
    maxAge: 60 * 60 * 4, // 4 hours
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
  };
}

export function passwordMatches(input: string, expected: string) {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export async function getAdminSession() {
  return useSession<AdminGateSession>(sessionConfig());
}

/** Throws unless this exact signed-in admin unlocked the portal with the password. */
export async function requireAdminUnlocked(userId: string) {
  const session = await getAdminSession();
  if (!session.data.unlocked || session.data.userId !== userId) {
    throw new Error("Admin portal locked");
  }
}
