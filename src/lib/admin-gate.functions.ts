import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdminRole(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (error || !data) throw new Error("Forbidden");
}

/** Is the caller an admin, and has this browser session been unlocked with the portal password? */
export const getAdminGateStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!data) return { isAdmin: false, unlocked: false };
    const { getAdminSession } = await import("./admin-gate.server");
    const session = await getAdminSession();
    return { isAdmin: true, unlocked: !!session.data.unlocked && session.data.userId === userId };
  });

export const unlockAdminPortal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ password: z.string().min(1).max(200) }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdminRole(supabase, userId);

    const expected = process.env.ADMIN_PORTAL_PASSWORD;
    if (!expected) throw new Error("Admin portal password is not configured");

    const { passwordMatches, getAdminSession } = await import("./admin-gate.server");
    // Constant-ish delay to blunt online guessing.
    await new Promise((r) => setTimeout(r, 400));
    if (!passwordMatches(data.password, expected)) return { ok: false as const };

    const session = await getAdminSession();
    await session.update({ unlocked: true, userId });
    return { ok: true as const };
  });

export const lockAdminPortal = createServerFn({ method: "POST" }).handler(async () => {
  const { getAdminSession } = await import("./admin-gate.server");
  const session = await getAdminSession();
  await session.clear();
  return { ok: true as const };
});
