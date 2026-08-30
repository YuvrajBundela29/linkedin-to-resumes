import { createHmac, timingSafeEqual } from "node:crypto";

export function razorpayKeys() {
  const keyId = process.env["RAZORPAY_KEY_ID"];
  const keySecret = process.env["RAZORPAY_KEY_SECRET"];
  return { keyId, keySecret, configured: !!keyId && !!keySecret };
}

/** Create a Razorpay order via the REST API (fetch-based, Worker safe). */
export async function createRazorpayOrder(input: {
  amountPaise: number;
  receipt: string;
  notes: Record<string, string>;
}) {
  const { keyId, keySecret, configured } = razorpayKeys();
  if (!configured) throw new Error("PAYMENTS_NOT_CONFIGURED");

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amountPaise,
      currency: "INR",
      receipt: input.receipt,
      notes: input.notes,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("razorpay order failed", res.status, text);
    throw new Error("Could not start the payment. Please try again.");
  }
  return (await res.json()) as { id: string; amount: number; currency: string };
}

/** Verify the checkout handler signature: HMAC_SHA256(order_id|payment_id, key_secret). */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  const { keySecret, configured } = razorpayKeys();
  if (!configured) return false;
  const expected = createHmac("sha256", keySecret!).update(`${orderId}|${paymentId}`).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature ?? "", "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Confirm with Razorpay that the payment is actually captured/authorized for this order. */
export async function fetchPayment(paymentId: string) {
  const { keyId, keySecret } = razorpayKeys();
  const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}` },
  });
  if (!res.ok) throw new Error("Could not verify the payment with Razorpay.");
  return (await res.json()) as { id: string; order_id: string; status: string; amount: number };
}
