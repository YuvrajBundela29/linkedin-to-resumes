export const MONTHLY_CREDITS = 20;
/** @deprecated kept as an alias — the free allowance now refreshes monthly. */
export const DAILY_CREDITS = MONTHLY_CREDITS;

export const CREDIT_COSTS = {
  extract: 5,
  chat_edit: 1,
  tailor: 3,
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

export class InsufficientCreditsError extends Error {
  constructor(cost: number) {
    super(
      `You don't have enough credits for this action (needs ${cost}). Your ${MONTHLY_CREDITS} free monthly credits refresh on the 1st (00:00 UTC) — or top up instantly from the credit store.`,
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

/** Read the current balance, applying the monthly refresh in-memory. */
export async function readCredits(supabase: any, userId: string) {
  const now = new Date();
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
  const { data } = await supabase
    .from("user_credits")
    .select("credits, cycle_date, purchased_credits")
    .eq("user_id", userId)
    .maybeSingle();

  const stale = !data || data.cycle_date < periodStart;
  const daily = stale ? DAILY_CREDITS : (data.credits as number);
  const purchased = (data?.purchased_credits as number) ?? 0;

  const resets = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));

  return {
    credits: daily + purchased,
    daily,
    purchased,
    dailyAllowance: DAILY_CREDITS,
    resetsAt: resets.toISOString(),
    costs: CREDIT_COSTS as Record<string, number>,
  };
}
