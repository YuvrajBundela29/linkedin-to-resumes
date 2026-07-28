export const DAILY_CREDITS = 50;

export const CREDIT_COSTS = {
  extract: 5,
  chat_edit: 1,
  tailor: 3,
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

export class InsufficientCreditsError extends Error {
  constructor(cost: number) {
    super(
      `You don't have enough credits for this action (needs ${cost}). Your ${DAILY_CREDITS} daily credits refresh at 00:00 UTC.`,
    );
    this.name = "InsufficientCreditsError";
  }
}

/** Atomically spend credits for the user. Throws when the balance is too low. */
export async function spendCredits(userId: string, action: CreditAction) {
  const cost = CREDIT_COSTS[action];
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("spend_credits", {
    _user_id: userId,
    _cost: cost,
  });
  if (error) {
    if (String(error.message).includes("INSUFFICIENT_CREDITS")) throw new InsufficientCreditsError(cost);
    throw new Error(error.message);
  }
  return { spent: cost, remaining: (data as number) ?? 0 };
}

/** Read the current balance, applying the daily refresh in-memory. */
export async function readCredits(supabase: any, userId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("user_credits")
    .select("credits, cycle_date")
    .eq("user_id", userId)
    .maybeSingle();

  const stale = !data || data.cycle_date < today;
  const credits = stale ? DAILY_CREDITS : (data.credits as number);

  const resets = new Date();
  resets.setUTCHours(24, 0, 0, 0);

  return {
    credits,
    dailyAllowance: DAILY_CREDITS,
    resetsAt: resets.toISOString(),
    costs: CREDIT_COSTS as Record<string, number>,
  };
}
