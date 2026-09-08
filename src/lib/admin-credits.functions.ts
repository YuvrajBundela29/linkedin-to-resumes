import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Admin-only: grant credits to any user. Requires admin role + unlocked portal. */
export const grantCreditsToUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        credits: z.number().int().min(1).max(100000),
        note: z.string().max(200).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { requireAdminUnlocked } = await import("./admin-gate.server");
    await requireAdminUnlocked(context.userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: total, error } = await supabaseAdmin.rpc("add_purchased_credits", {
      _user_id: data.userId,
      _credits: data.credits,
    });
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("usage_events").insert({
      user_id: data.userId,
      kind: "admin_credit_grant",
      meta: { credits: data.credits, granted_by: context.userId, note: data.note ?? null },
    });

    return { ok: true as const, userId: data.userId, granted: data.credits, total: (total as number) ?? 0 };
  });
