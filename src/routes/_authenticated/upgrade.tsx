import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CREDIT_PACKS, formatINR, pricePerCredit, type CreditPack } from "@/lib/pricing";
import {
  getPaymentConfig,
  checkPromoCode,
  createCreditOrder,
  confirmCreditOrder,
  listMyOrders,
} from "@/lib/payments.functions";
import { useCreditsQuery } from "@/components/CreditsBadge";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Clock,
  Flame,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  Tag,
  Users,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/upgrade")({
  head: () => ({
    meta: [
      { title: "Credit store — ResumeForge AI" },
      { name: "description", content: "Top up ResumeForge AI credits instantly. Credits never expire, secure Razorpay checkout." },
      { property: "og:title", content: "Credit store — ResumeForge AI" },
      { property: "og:description", content: "Top up ResumeForge AI credits instantly. Credits never expire." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: UpgradePage,
});

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

function useCountdown() {
  const [left, setLeft] = useState(() => 0);
  useEffect(() => {
    const now = new Date();
    // Free credits refresh on the 1st of each month at 00:00 UTC.
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
    const tick = () => setLeft(Math.max(0, end.getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  const d = Math.floor(left / 86_400_000);
  const h = Math.floor((left % 86_400_000) / 3_600_000);
  const m = Math.floor((left % 3_600_000) / 60_000);
  const s = Math.floor((left % 60_000) / 1000);
  const clock = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return d > 0 ? `${d}d ${clock}` : clock;
}


function PackCard({
  pack,
  percentOff,
  busy,
  onBuy,
}: {
  pack: CreditPack;
  percentOff: number;
  busy: boolean;
  onBuy: (p: CreditPack) => void;
}) {
  const final = Math.max(100, pack.pricePaise - Math.round((pack.pricePaise * percentOff) / 100));
  return (
    <Card
      className={`relative overflow-hidden p-7 transition-transform duration-300 hover:-translate-y-1.5 ${
        pack.featured
          ? "border-[color:var(--color-brand)]/50 bg-background/80 shadow-[0_40px_90px_-40px_color-mix(in_oklab,var(--color-brand)_60%,transparent)] md:scale-[1.03]"
          : "border-white/15 bg-background/60 shadow-[0_25px_60px_-35px_rgba(0,0,0,0.6)]"
      } backdrop-blur-xl`}
    >
      {pack.featured && (
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-16 w-64 h-64 rounded-full blur-3xl opacity-40"
          style={{ background: "radial-gradient(circle,var(--color-brand),transparent 70%)" }}
        />
      )}
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm uppercase tracking-[0.2em] text-muted-foreground">{pack.name}</div>
            <div className="mt-1 text-sm text-muted-foreground">{pack.tagline}</div>
          </div>
          {pack.badge && (
            <span className="shrink-0 text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-[color:var(--color-brand)]/15 text-[color:var(--color-brand)] border border-[color:var(--color-brand)]/40">
              {pack.badge}
            </span>
          )}
        </div>

        <div className="mt-6 flex items-end gap-2">
          <div className="text-4xl font-semibold tracking-tight tabular-nums">{formatINR(final)}</div>
          <div className="pb-1 text-sm text-muted-foreground line-through tabular-nums">{formatINR(pack.comparePaise)}</div>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {pack.credits.toLocaleString("en-IN")} credits · {pricePerCredit(final, pack.credits)}
          {percentOff > 0 && (
            <span className="ml-2 text-[color:var(--color-brand)] font-medium">−{percentOff}% applied</span>
          )}
        </div>

        <ul className="mt-6 space-y-2.5">
          {pack.perks.map((perk) => (
            <li key={perk} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 mt-0.5 shrink-0 text-[color:var(--color-brand)]" />
              <span>{perk}</span>
            </li>
          ))}
        </ul>

        <Button
          className="mt-7 w-full h-11"
          variant={pack.featured ? "default" : "outline"}
          disabled={busy}
          onClick={() => onBuy(pack)}
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Get {pack.credits.toLocaleString("en-IN")} credits</>}
        </Button>
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <Lock className="w-3 h-3" /> Secure Razorpay checkout · credits never expire
        </div>
      </div>
    </Card>
  );
}

function UpgradePage() {
  const navigate = useNavigate();
  const countdown = useCountdown();
  const creditsQ = useCreditsQuery();

  const cfgFn = useServerFn(getPaymentConfig);
  const cfgQ = useQuery({ queryKey: ["paymentConfig"], queryFn: () => cfgFn() });

  const ordersFn = useServerFn(listMyOrders);
  const ordersQ = useQuery({ queryKey: ["myOrders"], queryFn: () => ordersFn() });

  const promoFn = useServerFn(checkPromoCode);
  const createFn = useServerFn(createCreditOrder);
  const confirmFn = useServerFn(confirmCreditOrder);

  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; percentOff: number; label: string } | null>(null);
  const [busyPack, setBusyPack] = useState<string | null>(null);

  const applyPromo = useMutation({
    mutationFn: async () => promoFn({ data: { code: promoInput } }),
    onSuccess: (res) => {
      if (res.valid) {
        setPromo({ code: res.code, percentOff: res.percentOff, label: res.label });
        toast.success(`${res.code} applied — ${res.percentOff}% off`);
      } else {
        setPromo(null);
        toast.error(res.reason);
      }
    },
    onError: () => toast.error("Could not check that code."),
  });

  async function buy(pack: CreditPack) {
    if (!cfgQ.data?.configured) {
      toast.error("The payment portal isn't live yet. Razorpay keys are still being connected.");
      return;
    }
    setBusyPack(pack.id);
    try {
      const ok = await loadRazorpayScript();
      if (!ok || !window.Razorpay) throw new Error("Checkout failed to load.");

      const order = await createFn({ data: { packId: pack.id, promoCode: promo?.code } });

      const rz = new window.Razorpay({
        key: cfgQ.data.keyId,
        amount: order.amountPaise,
        currency: "INR",
        name: "ResumeForge AI",
        description: `${order.packName} · ${order.credits} credits`,
        order_id: order.orderId,
        theme: { color: "#6366f1" },
        handler: async (resp: any) => {
          try {
            await confirmFn({
              data: {
                razorpayOrderId: resp.razorpay_order_id,
                razorpayPaymentId: resp.razorpay_payment_id,
                razorpaySignature: resp.razorpay_signature,
              },
            });
            toast.success(`${order.credits} credits added to your account 🎉`);
            creditsQ.refetch();
            ordersQ.refetch();
          } catch {
            toast.error("Payment received but crediting failed — contact support with your payment ID.");
          } finally {
            setBusyPack(null);
          }
        },
        modal: { ondismiss: () => setBusyPack(null) },
      });
      rz.open();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not start checkout.");
      setBusyPack(null);
    }
  }

  const percentOff = promo?.percentOff ?? 0;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[620px] bg-[radial-gradient(circle_at_20%_0%,color-mix(in_oklab,var(--color-brand)_22%,transparent),transparent_60%),radial-gradient(circle_at_80%_10%,color-mix(in_oklab,#a855f7_18%,transparent),transparent_55%)]"
      />

      <header className="relative z-10 border-b border-white/10 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard"><ArrowLeft className="w-4 h-4" /></Link>
            </Button>
            <Logo />
          </div>
          <div className="flex items-center gap-2 text-xs rounded-full border border-white/15 bg-background/60 px-3 h-9">
            <Zap className="w-3.5 h-3.5 text-[color:var(--color-brand)]" />
            <span className="tabular-nums">{creditsQ.data?.credits ?? "—"} credits</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-brand)]/40 bg-[color:var(--color-brand)]/10 px-3 py-1 text-xs text-[color:var(--color-brand)]">
            <Flame className="w-3.5 h-3.5" /> Launch pricing — up to 60% off with a code
          </div>
          <h1 className="mt-5 text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.05]">
            Don't lose the interview<br className="hidden sm:block" /> over 20 free credits.
          </h1>
          <p className="mt-4 text-muted-foreground text-base sm:text-lg">
            You get <span className="text-foreground font-medium">20 credits every month</span>, free, forever. But a real
            application sprint — tailoring to 10 job descriptions, rewriting every bullet — burns through that fast.
            Top up once and never edit against a timer again.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Monthly reset in <span className="tabular-nums text-foreground">{countdown}</span></span>
            <span className="inline-flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Purchased credits never expire</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Encrypted Razorpay checkout</span>
          </div>
        </div>

        {/* Promo code */}
        <Card className="mt-10 mx-auto max-w-xl p-5 border-white/15 bg-background/60 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-sm font-medium"><Tag className="w-4 h-4 text-[color:var(--color-brand)]" /> Have a discount code?</div>
          <div className="mt-3 flex gap-2">
            <Input
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
              placeholder="e.g. LAUNCH40"
              className="uppercase tracking-wider"
            />
            <Button onClick={() => applyPromo.mutate()} disabled={!promoInput || applyPromo.isPending} variant="outline">
              {applyPromo.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
            </Button>
          </div>
          {promo && (
            <div className="mt-3 flex items-center gap-2 text-xs text-[color:var(--color-brand)]">
              <BadgeCheck className="w-4 h-4" /> {promo.code} — {promo.label || `${promo.percentOff}% off`}
            </div>
          )}
          <div className="mt-3 text-[11px] text-muted-foreground">
            Try <b>FORGE20</b> for 20% off, or <b>HIREME60</b> while the flash sale lasts.
          </div>
        </Card>

        {!cfgQ.data?.configured && !cfgQ.isLoading && (
          <div className="mt-6 mx-auto max-w-xl text-center text-xs rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 px-4 py-3">
            Checkout is in setup — Razorpay keys haven't been connected yet. Everything else works; buying will unlock
            the moment the keys are added.
          </div>
        )}

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 md:items-center">
          {CREDIT_PACKS.map((p) => (
            <PackCard key={p.id} pack={p} percentOff={percentOff} busy={busyPack === p.id} onBuy={buy} />
          ))}
        </div>

        {/* Trust row */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: ShieldCheck, title: "Bank-grade security", body: "Payments are handled entirely by Razorpay. We never see or store your card details." },
            { icon: Sparkles, title: "Credits never expire", body: "Bought credits sit on top of your free monthly 20 and stay until you use them." },
            { icon: BadgeCheck, title: "Every template included", body: "All 15 resume and CV layouts, ATS scoring, tailoring and version history." },
          ].map((t) => (
            <Card key={t.title} className="p-5 border-white/10 bg-background/50 backdrop-blur-xl">
              <t.icon className="w-5 h-5 text-[color:var(--color-brand)]" />
              <div className="mt-3 font-medium text-sm">{t.title}</div>
              <div className="mt-1 text-xs text-muted-foreground leading-relaxed">{t.body}</div>
            </Card>
          ))}
        </div>

        {/* Purchase history */}
        <div className="mt-14">
          <h2 className="text-lg font-semibold">Your purchases</h2>
          <Card className="mt-4 overflow-hidden border-white/10 bg-background/60 backdrop-blur-xl">
            {ordersQ.isLoading ? (
              <div className="p-8 grid place-items-center text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /></div>
            ) : (ordersQ.data?.orders?.length ?? 0) === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No purchases yet — you're on the free monthly plan.</div>
            ) : (
              <div className="divide-y divide-white/10">
                {ordersQ.data!.orders.map((o: any) => (
                  <div key={o.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                    <div className="min-w-0">
                      <div className="font-medium capitalize truncate">{o.pack_id} · {o.credits} credits</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleString()}
                        {o.promo_code && <span className="ml-2">code {o.promo_code}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="tabular-nums">{formatINR(o.amount_paise)}</div>
                      <div className={`text-xs capitalize ${o.status === "paid" ? "text-emerald-400" : "text-muted-foreground"}`}>{o.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="mt-10 text-center">
          <Button variant="ghost" onClick={() => navigate({ to: "/dashboard" })}>Back to dashboard</Button>
        </div>
      </main>
    </div>
  );
}
