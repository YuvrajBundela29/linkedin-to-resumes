import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Is the payment portal live, and what's the public key for checkout? */
export const getPaymentConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { razorpayKeys } = await import("./razorpay.server");
    const { keyId, configured } = razorpayKeys();
    return { configured, keyId: configured ? keyId! : null };
  });

/** Validate a promo code and return the discount percentage. */
export const checkPromoCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ code: z.string().min(2).max(40) }).parse(i))
  .handler(async ({ data, context }) => {
    const code = data.code.trim().toUpperCase();
    const { data: row } = await context.supabase
      .from("promo_codes")
      .select("code, label, percent_off, active, max_redemptions, times_redeemed, expires_at")
      .eq("code", code)
      .maybeSingle();

    if (!row || !row.active) return { valid: false as const, reason: "That code isn't valid." };
    if (row.expires_at && new Date(row.expires_at).getTime() < Date.now())
      return { valid: false as const, reason: "That code has expired." };
    if (row.max_redemptions !== null && row.times_redeemed >= row.max_redemptions)
      return { valid: false as const, reason: "That code has been fully claimed." };

    return { valid: true as const, code: row.code, percentOff: row.percent_off, label: row.label };
  });

/** Create a Razorpay order for a credit pack. */
export const createCreditOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ packId: z.string().min(2).max(30), promoCode: z.string().max(40).optional() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { packById } = await import("./pricing");
    const pack = packById(data.packId);
    if (!pack) throw new Error("Unknown credit pack.");

    let percentOff = 0;
    let promoCode: string | null = null;
    if (data.promoCode) {
      const code = data.promoCode.trim().toUpperCase();
      const { data: row } = await context.supabase
        .from("promo_codes")
        .select("code, percent_off, active, max_redemptions, times_redeemed, expires_at")
        .eq("code", code)
        .maybeSingle();
      const usable =
        row &&
        row.active &&
        (!row.expires_at || new Date(row.expires_at).getTime() > Date.now()) &&
        (row.max_redemptions === null || row.times_redeemed < row.max_redemptions);
      if (usable) {
        percentOff = row!.percent_off;
        promoCode = row!.code;
      }
    }

    const discountPaise = Math.round((pack.pricePaise * percentOff) / 100);
    const amountPaise = Math.max(100, pack.pricePaise - discountPaise);

    const { createRazorpayOrder } = await import("./razorpay.server");
    const order = await createRazorpayOrder({
      amountPaise,
      receipt: `rf_${Date.now()}`,
      notes: { userId: context.userId, packId: pack.id, credits: String(pack.credits) },
    });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("credit_orders").insert({
      user_id: context.userId,
      pack_id: pack.id,
      credits: pack.credits,
      amount_paise: amountPaise,
      discount_paise: discountPaise,
      promo_code: promoCode,
      razorpay_order_id: order.id,
      status: "created",
    });
    if (error) throw new Error(error.message);

    return {
      orderId: order.id,
      amountPaise,
      discountPaise,
      promoCode,
      percentOff,
      credits: pack.credits,
      packName: pack.name,
    };
  });

/** Verify a completed checkout and credit the account. */
export const confirmCreditOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        razorpayOrderId: z.string().min(5).max(80),
        razorpayPaymentId: z.string().min(5).max(80),
        razorpaySignature: z.string().min(10).max(200),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { verifyPaymentSignature, fetchPayment } = await import("./razorpay.server");
    if (!verifyPaymentSignature(data.razorpayOrderId, data.razorpayPaymentId, data.razorpaySignature)) {
      throw new Error("Payment could not be verified.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin
      .from("credit_orders")
      .select("id, user_id, credits, status, promo_code")
      .eq("razorpay_order_id", data.razorpayOrderId)
      .maybeSingle();

    if (!order || order.user_id !== context.userId) throw new Error("Order not found.");
    if (order.status === "paid") {
      const { readCredits } = await import("./credits.server");
      return { ok: true as const, alreadyApplied: true, ...(await readCredits(context.supabase, context.userId)) };
    }

    const payment = await fetchPayment(data.razorpayPaymentId);
    if (payment.order_id !== data.razorpayOrderId || !["captured", "authorized"].includes(payment.status)) {
      throw new Error("Payment is not complete.");
    }

    await supabaseAdmin.rpc("add_purchased_credits", { _user_id: order.user_id, _credits: order.credits });
    await supabaseAdmin
      .from("credit_orders")
      .update({ status: "paid", razorpay_payment_id: payment.id, paid_at: new Date().toISOString() })
      .eq("id", order.id);

    if (order.promo_code) {
      const { data: promo } = await supabaseAdmin
        .from("promo_codes")
        .select("times_redeemed")
        .eq("code", order.promo_code)
        .maybeSingle();
      if (promo) {
        await supabaseAdmin
          .from("promo_codes")
          .update({ times_redeemed: (promo.times_redeemed ?? 0) + 1 })
          .eq("code", order.promo_code);
      }
    }

    await supabaseAdmin.from("usage_events").insert({
      user_id: order.user_id,
      kind: "credit_purchase",
      meta: { credits: order.credits, order_id: order.id },
    });

    const { readCredits } = await import("./credits.server");
    return { ok: true as const, alreadyApplied: false, ...(await readCredits(context.supabase, context.userId)) };
  });

/** The signed-in user's own purchase history. */
export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("credit_orders")
      .select("id, pack_id, credits, amount_paise, discount_paise, promo_code, status, created_at, paid_at")
      .order("created_at", { ascending: false })
      .limit(50);
    return { orders: data ?? [] };
  });

/** Admin revenue view — requires admin role + unlocked portal. */
export const getRevenueOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { requireAdminUnlocked } = await import("./admin-gate.server");
    await requireAdminUnlocked(context.userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: orders }, { data: promos }] = await Promise.all([
      supabaseAdmin
        .from("credit_orders")
        .select("id, user_id, pack_id, credits, amount_paise, discount_paise, promo_code, status, created_at, paid_at")
        .order("created_at", { ascending: false })
        .limit(500),
      supabaseAdmin
        .from("promo_codes")
        .select("code, label, percent_off, active, max_redemptions, times_redeemed, expires_at")
        .order("percent_off", { ascending: false }),
    ]);

    const paid = (orders ?? []).filter((o: any) => o.status === "paid");
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    return {
      orders: orders ?? [],
      promos: promos ?? [],
      totals: {
        revenuePaise: paid.reduce((s: number, o: any) => s + o.amount_paise, 0),
        revenueMonthPaise: paid
          .filter((o: any) => new Date(o.paid_at ?? o.created_at) >= monthStart)
          .reduce((s: number, o: any) => s + o.amount_paise, 0),
        paidOrders: paid.length,
        creditsSold: paid.reduce((s: number, o: any) => s + o.credits, 0),
        discountsPaise: paid.reduce((s: number, o: any) => s + (o.discount_paise ?? 0), 0),
      },
    };
  });
