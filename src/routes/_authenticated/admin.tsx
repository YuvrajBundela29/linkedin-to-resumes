import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ResumePreview } from "@/components/ResumePreview";
import { getAdminOverview, getResumeConversation } from "@/lib/resume.functions";
import { getAdminGateStatus, unlockAdminPortal, lockAdminPortal } from "@/lib/admin-gate.functions";
import { getRevenueOverview } from "@/lib/payments.functions";
import { formatINR } from "@/lib/pricing";
import { ArrowLeft, Shield, Users, FileText, Activity, Search, Loader2, MessageSquare, Eye, Lock, LogOut, IndianRupee, Tag } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { TEMPLATES } from "@/templates";
import type { TemplateId } from "@/lib/resume-schema";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Super Admin — ResumeForge AI" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

function StatCard({ icon: Icon, label, value, tint }: { icon: any; label: string; value: number | string; tint: string }) {
  return (
    <Card className="relative overflow-hidden p-6 border border-white/40 bg-background/70 backdrop-blur-xl shadow-[0_20px_50px_-25px_rgba(0,0,0,0.35)] transition-transform hover:-translate-y-1">
      <div aria-hidden className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-40`} style={{ background: tint }} />
      <div className="relative flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl grid place-items-center text-white shadow-lg" style={{ background: tint }}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="text-3xl font-semibold mt-0.5">{value}</div>
        </div>
      </div>
    </Card>
  );
}

function UnlockScreen({ isAdmin, onUnlocked }: { isAdmin: boolean; onUnlocked: () => void }) {
  const navigate = useNavigate();
  const unlock = useServerFn(unlockAdminPortal);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center">
        <div>
          <Shield className="w-10 h-10 mx-auto text-muted-foreground" />
          <div className="mt-3 font-medium">Access denied</div>
          <div className="text-sm text-muted-foreground mt-1">You don't have admin privileges.</div>
          <Button className="mt-4" onClick={() => navigate({ to: "/dashboard" })}>Back to dashboard</Button>
        </div>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const res = await unlock({ data: { password } });
      if (res.ok) { setPassword(""); onUnlocked(); }
      else setError("Incorrect password.");
    } catch {
      setError("Could not verify the password.");
    } finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6 relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklab,var(--color-brand)_20%,transparent),transparent_60%)]" />
      <Card className="relative w-full max-w-sm p-7 border border-white/40 bg-background/70 backdrop-blur-xl shadow-[0_25px_60px_-30px_rgba(0,0,0,0.5)]">
        <div className="w-11 h-11 rounded-xl grid place-items-center bg-[color:var(--color-brand)]/15 text-[color:var(--color-brand)] border border-[color:var(--color-brand)]/30">
          <Lock className="w-5 h-5" />
        </div>
        <h1 className="mt-4 text-xl font-semibold">Super admin portal</h1>
        <p className="text-sm text-muted-foreground mt-1">Second factor required. Enter the admin portal password to continue.</p>
        <form onSubmit={submit} className="mt-5 space-y-3">
          <Input
            type="password"
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            placeholder="Admin portal password"
          />
          {error && <div className="text-xs text-red-500">{error}</div>}
          <Button type="submit" className="w-full" disabled={busy || !password}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Unlock"}
          </Button>
        </form>
        <Button variant="ghost" size="sm" className="mt-3 w-full" onClick={() => navigate({ to: "/dashboard" })}>Back to dashboard</Button>
      </Card>
    </div>
  );
}

function AdminPage() {
  const navigate = useNavigate();
  const gateFn = useServerFn(getAdminGateStatus);
  const lockFn = useServerFn(lockAdminPortal);
  const gateQ = useQuery({ queryKey: ["adminGate"], queryFn: () => gateFn(), retry: false });
  const unlocked = !!gateQ.data?.unlocked;

  const fn = useServerFn(getAdminOverview);
  const q = useQuery({ queryKey: ["adminOverview"], queryFn: () => fn(), retry: false, enabled: unlocked });
  const revFn = useServerFn(getRevenueOverview);
  const revQ = useQuery({ queryKey: ["adminRevenue"], queryFn: () => revFn(), retry: false, enabled: unlocked });
  const [tab, setTab] = useState<"users" | "resumes" | "activity" | "revenue">("users");
  const [search, setSearch] = useState("");
  const [viewResumeId, setViewResumeId] = useState<string | null>(null);
  const getConv = useServerFn(getResumeConversation);
  const convQ = useQuery({
    queryKey: ["conversation", viewResumeId],
    queryFn: () => getConv({ data: { resumeId: viewResumeId! } }),
    enabled: !!viewResumeId,
  });

  // All hooks must run before any early return — keep derived data in hooks up here.
  const userMap = useMemo(
    () => new Map((q.data?.users ?? []).map((u: any) => [u.id, u])),
    [q.data?.users],
  );
  const filteredUsers = useMemo(() => (q.data?.users ?? []).filter((u: any) =>
    !search || (u.email ?? "").toLowerCase().includes(search.toLowerCase()) || (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()),
  ), [q.data?.users, search]);
  const filteredResumes = useMemo(() => (q.data?.resumes ?? []).filter((r: any) => {
    if (!search) return true;
    const u: any = userMap.get(r.user_id);
    const s = search.toLowerCase();
    return r.title?.toLowerCase().includes(s) || u?.email?.toLowerCase().includes(s);
  }), [q.data?.resumes, userMap, search]);

  if (gateQ.isLoading) return <div className="min-h-screen grid place-items-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  if (!unlocked) return <UnlockScreen isAdmin={!!gateQ.data?.isAdmin} onUnlocked={() => gateQ.refetch()} />;
  if (q.isLoading) return <div className="min-h-screen grid place-items-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  if (q.isError) {
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center">
        <div>
          <Shield className="w-10 h-10 mx-auto text-muted-foreground" />
          <div className="mt-3 font-medium">Access denied</div>
          <div className="text-sm text-muted-foreground mt-1">You don't have admin privileges.</div>
          <Button className="mt-4" onClick={() => navigate({ to: "/dashboard" })}>Back to dashboard</Button>
        </div>
      </div>
    );
  }

  const data = q.data!;


  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[500px] bg-[radial-gradient(circle_at_15%_0%,color-mix(in_oklab,var(--color-brand)_25%,transparent),transparent_60%),radial-gradient(circle_at_85%_0%,color-mix(in_oklab,#a855f7_20%,transparent),transparent_55%)]" />
      <header className="relative border-b bg-background/70 backdrop-blur-xl z-10">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild><Link to="/dashboard"><ArrowLeft className="w-4 h-4" /></Link></Button>
            <Logo />
            <div className="flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 bg-[color:var(--color-brand)]/10 text-[color:var(--color-brand)] border border-[color:var(--color-brand)]/30">
              <Shield className="w-3 h-3" /> Super Admin
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={async () => { await lockFn(); gateQ.refetch(); }}>
            <LogOut className="w-3.5 h-3.5" /> Lock portal
          </Button>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-6 py-10 z-10">
        <h1 className="text-4xl font-semibold tracking-tight">Command center</h1>
        <p className="text-muted-foreground mt-2">Every user, every resume, every action — all in one place.</p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total users" value={data.totals.users} tint="linear-gradient(135deg,#3b82f6,#6366f1)" />
          <StatCard icon={FileText} label="Total resumes" value={data.totals.resumes} tint="linear-gradient(135deg,#10b981,#059669)" />
          <StatCard icon={Activity} label="Active in last 24h" value={data.totals.activeUsers24h} tint="linear-gradient(135deg,#f97316,#ef4444)" />
          <StatCard
            icon={IndianRupee}
            label="Revenue (all time)"
            value={revQ.data ? formatINR(revQ.data.totals.revenuePaise) : "—"}
            tint="linear-gradient(135deg,#a855f7,#ec4899)"
          />
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-2">
          {(["users","resumes","activity","revenue"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${tab === t ? "bg-foreground text-background shadow-lg" : "bg-background/60 border hover:bg-[color:var(--color-accent)]"}`}
            >
              {t} {(t === "users" || t === "resumes") && `(${t === "users" ? data.users.length : data.resumes.length})`}
            </button>
          ))}
          <div className="ml-auto relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search email, name, resume…" className="pl-9 w-72" />
          </div>
        </div>

        <Card className="mt-6 overflow-hidden border border-white/40 bg-background/70 backdrop-blur-xl shadow-[0_25px_60px_-30px_rgba(0,0,0,0.35)]">
          {tab === "users" && (
            <div className="divide-y">
              <div className="grid grid-cols-[1fr_1fr_120px_180px] gap-4 px-6 py-3 text-xs uppercase tracking-wider text-muted-foreground bg-[color:var(--color-surface)]/60">
                <div>User</div><div>Email</div><div>Plan</div><div>Last sign-in</div>
              </div>
              {filteredUsers.map((u) => (
                <div key={u.id} className="grid grid-cols-[1fr_1fr_120px_180px] gap-4 px-6 py-3 items-center hover:bg-[color:var(--color-accent)]/40 transition-colors">
                  <div className="font-medium truncate">{u.full_name || "—"}</div>
                  <div className="text-sm text-muted-foreground truncate">{u.email || "—"}</div>
                  <div className="text-xs"><span className="inline-block px-2 py-0.5 rounded-full bg-[color:var(--color-brand)]/10 text-[color:var(--color-brand)] capitalize">{u.plan}</span></div>
                  <div className="text-xs text-muted-foreground">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : "Never"}</div>
                </div>
              ))}
              {filteredUsers.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">No users match.</div>}
            </div>
          )}

          {tab === "resumes" && (
            <div className="divide-y">
              <div className="grid grid-cols-[1fr_1fr_140px_160px_110px] gap-4 px-6 py-3 text-xs uppercase tracking-wider text-muted-foreground bg-[color:var(--color-surface)]/60">
                <div>Resume</div><div>Owner</div><div>Template</div><div>Updated</div><div className="text-right">View</div>
              </div>
              {filteredResumes.map((r: any) => {
                const u = userMap.get(r.user_id);
                return (
                  <div key={r.id} className="grid grid-cols-[1fr_1fr_140px_160px_110px] gap-4 px-6 py-3 items-center hover:bg-[color:var(--color-accent)]/40 transition-colors">
                    <div className="font-medium truncate">{r.title}</div>
                    <div className="text-sm text-muted-foreground truncate">{u?.email ?? r.user_id.slice(0, 8)}</div>
                    <div className="text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: (TEMPLATES as any)[r.template]?.accent ?? "#888" }} />
                      {(TEMPLATES as any)[r.template]?.name ?? r.template}
                    </div>
                    <div className="text-xs text-muted-foreground">{new Date(r.updated_at).toLocaleString()}</div>
                    <div className="text-right">
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setViewResumeId(r.id)}>
                        <Eye className="w-3.5 h-3.5" /> Open
                      </Button>
                    </div>
                  </div>
                );
              })}
              {filteredResumes.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">No resumes yet.</div>}
            </div>
          )}

          {tab === "activity" && (
            <div className="divide-y max-h-[600px] overflow-auto">
              <div className="grid grid-cols-[160px_140px_1fr_180px] gap-4 px-6 py-3 text-xs uppercase tracking-wider text-muted-foreground bg-[color:var(--color-surface)]/60 sticky top-0">
                <div>When</div><div>Action</div><div>User</div><div>Resume</div>
              </div>
              {data.usage.map((e: any, i: number) => {
                const u = userMap.get(e.user_id);
                return (
                  <div key={i} className="grid grid-cols-[160px_140px_1fr_180px] gap-4 px-6 py-2.5 items-center text-sm hover:bg-[color:var(--color-accent)]/40">
                    <div className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</div>
                    <div><span className="text-xs px-2 py-0.5 rounded-full bg-[color:var(--color-muted)] capitalize">{e.kind.replace("_"," ")}</span></div>
                    <div className="text-sm text-muted-foreground truncate">{u?.email ?? e.user_id.slice(0, 8)}</div>
                    <div className="text-xs text-muted-foreground truncate">{e.resume_id?.slice(0, 8) ?? "—"}</div>
                  </div>
                );
              })}
              {data.usage.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">No activity yet.</div>}
            </div>
          )}
          {tab === "revenue" && (
            <div>
              {revQ.isLoading ? (
                <div className="p-10 grid place-items-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /></div>
              ) : revQ.isError || !revQ.data ? (
                <div className="p-10 text-center text-sm text-muted-foreground">Revenue data unavailable.</div>
              ) : (
                <div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 border-b">
                    {[
                      { label: "This month", value: formatINR(revQ.data.totals.revenueMonthPaise) },
                      { label: "Paid orders", value: String(revQ.data.totals.paidOrders) },
                      { label: "Credits sold", value: revQ.data.totals.creditsSold.toLocaleString("en-IN") },
                      { label: "Discounts given", value: formatINR(revQ.data.totals.discountsPaise) },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl border bg-[color:var(--color-surface)]/50 p-4">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
                        <div className="mt-1 text-2xl font-semibold tabular-nums">{s.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="px-6 py-4 text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5" /> Promo codes
                  </div>
                  <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {revQ.data.promos.map((p: any) => (
                      <div key={p.code} className="rounded-xl border p-4 bg-background/50">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-medium tracking-wider">{p.code}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[color:var(--color-brand)]/10 text-[color:var(--color-brand)]">{p.percent_off}% off</span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">{p.label}</div>
                        <div className="mt-2 text-[11px] text-muted-foreground">
                          Redeemed {p.times_redeemed}{p.max_redemptions ? ` / ${p.max_redemptions}` : ""}
                          {p.expires_at ? ` · expires ${new Date(p.expires_at).toLocaleDateString()}` : " · no expiry"}
                          {!p.active && " · inactive"}
                        </div>
                      </div>
                    ))}
                    {revQ.data.promos.length === 0 && <div className="text-sm text-muted-foreground">No promo codes.</div>}
                  </div>

                  <div className="divide-y border-t max-h-[500px] overflow-auto">
                    <div className="grid grid-cols-[160px_1fr_110px_110px_100px_90px] gap-4 px-6 py-3 text-xs uppercase tracking-wider text-muted-foreground bg-[color:var(--color-surface)]/60 sticky top-0">
                      <div>When</div><div>User</div><div>Pack</div><div>Credits</div><div>Amount</div><div>Status</div>
                    </div>
                    {revQ.data.orders.map((o: any) => (
                      <div key={o.id} className="grid grid-cols-[160px_1fr_110px_110px_100px_90px] gap-4 px-6 py-2.5 items-center text-sm hover:bg-[color:var(--color-accent)]/40">
                        <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground truncate">{userMap.get(o.user_id)?.email ?? o.user_id.slice(0, 8)}</div>
                        <div className="text-xs capitalize">{o.pack_id}</div>
                        <div className="text-xs tabular-nums">{o.credits}</div>
                        <div className="text-xs tabular-nums">{formatINR(o.amount_paise)}</div>
                        <div className={`text-xs capitalize ${o.status === "paid" ? "text-emerald-500" : "text-muted-foreground"}`}>{o.status}</div>
                      </div>
                    ))}
                    {revQ.data.orders.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">No orders yet.</div>}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </main>

      <Dialog open={!!viewResumeId} onOpenChange={(o) => !o && setViewResumeId(null)}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-white/10">
          <DialogHeader className="px-6 py-4 border-b border-white/10 shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[color:var(--color-brand)]" />
              {convQ.data?.resume?.title ?? "Conversation & resume"}
              {convQ.data?.email && <span className="text-xs font-normal text-muted-foreground ml-2">· {convQ.data.email}</span>}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_420px] h-[calc(90vh-65px)]">
            <div className="min-h-0 overflow-auto p-4">
              {convQ.isLoading ? (
                <div className="h-full grid place-items-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /></div>
              ) : convQ.data ? (
                <ResumePreview resume={convQ.data.resume.resume} template={convQ.data.resume.template as TemplateId} />
              ) : null}
            </div>
            <div className="border-l border-white/10 flex flex-col min-h-0 bg-[color:var(--color-surface)]/40">
              <div className="px-4 py-3 border-b border-white/10 text-xs uppercase tracking-wider text-muted-foreground shrink-0">
                Conversation ({convQ.data?.messages?.length ?? 0})
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {convQ.data?.messages?.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-8">No AI editor messages yet for this resume.</div>
                )}
                {convQ.data?.messages?.map((m: any) => (
                  <div key={m.id} className={m.role === "user" ? "flex justify-end" : ""}>
                    {m.role === "user" ? (
                      <div className="rounded-2xl bg-[color:var(--color-brand)]/15 border border-[color:var(--color-brand)]/30 text-foreground px-3 py-2 max-w-[90%] text-sm">
                        {m.content}
                      </div>
                    ) : (
                      <div className="max-w-[95%] text-sm prose prose-sm prose-invert">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{new Date(m.created_at).toLocaleString()}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
