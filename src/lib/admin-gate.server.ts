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
    // sameSite "none" is required because the app is viewed inside the Lovable
    // preview iframe — a "lax" cookie is dropped there, so the unlock never sticks.
    cookie: { httpOnly: true, secure: true, sameSite: "none" as const, path: "/" },
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

const UNLOCK_HOURS = 4;

/** Cookie-independent unlock record, so the gate also works when cookies are blocked (preview iframe). */
export async function recordUnlock(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const until = new Date(Date.now() + UNLOCK_HOURS * 3600 * 1000).toISOString();
  await supabaseAdmin
    .from("admin_portal_unlocks")
    .upsert({ user_id: userId, unlocked_until: until }, { onConflict: "user_id" });
}

export async function clearUnlock(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("admin_portal_unlocks").delete().eq("user_id", userId);
}

export async function isUnlocked(userId: string) {
  try {
    const session = await getAdminSession();
    if (session.data.unlocked && session.data.userId === userId) return true;
  } catch {
    /* cookie unavailable — fall through to the database record */
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("admin_portal_unlocks")
    .select("unlocked_until")
    .eq("user_id", userId)
    .maybeSingle();
  return !!data && new Date(data.unlocked_until as string).getTime() > Date.now();
}

/** Throws unless this exact signed-in admin unlocked the portal with the password. */
export async function requireAdminUnlocked(userId: string) {
  if (!(await isUnlocked(userId))) throw new Error("Admin portal locked");
}
