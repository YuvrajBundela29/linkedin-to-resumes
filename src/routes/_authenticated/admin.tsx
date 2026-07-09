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
import { ArrowLeft, Shield, Users, FileText, Activity, Search, Loader2, MessageSquare, Eye } from "lucide-react";
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

function AdminPage() {
  const navigate = useNavigate();
  const fn = useServerFn(getAdminOverview);
  const q = useQuery({ queryKey: ["adminOverview"], queryFn: () => fn(), retry: false });
  const [tab, setTab] = useState<"users" | "resumes" | "activity">("users");
  const [search, setSearch] = useState("");
  const [viewResumeId, setViewResumeId] = useState<string | null>(null);
  const getConv = useServerFn(getResumeConversation);
  const convQ = useQuery({
    queryKey: ["conversation", viewResumeId],
    queryFn: () => getConv({ data: { resumeId: viewResumeId! } }),
    enabled: !!viewResumeId,
  });

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
  const userMap = new Map(data.users.map((u) => [u.id, u]));

  const filteredUsers = data.users.filter((u) =>
    !search || (u.email ?? "").toLowerCase().includes(search.toLowerCase()) || (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const filteredResumes = useMemo(() => data.resumes.filter((r: any) => {
    if (!search) return true;
    const u = userMap.get(r.user_id);
    const s = search.toLowerCase();
    return r.title?.toLowerCase().includes(s) || u?.email?.toLowerCase().includes(s);
  }), [data.resumes, search]);

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
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-6 py-10 z-10">
        <h1 className="text-4xl font-semibold tracking-tight">Command center</h1>
        <p className="text-muted-foreground mt-2">Every user, every resume, every action — all in one place.</p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={Users} label="Total users" value={data.totals.users} tint="linear-gradient(135deg,#3b82f6,#6366f1)" />
          <StatCard icon={FileText} label="Total resumes" value={data.totals.resumes} tint="linear-gradient(135deg,#10b981,#059669)" />
          <StatCard icon={Activity} label="Active in last 24h" value={data.totals.activeUsers24h} tint="linear-gradient(135deg,#f97316,#ef4444)" />
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-2">
          {(["users","resumes","activity"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${tab === t ? "bg-foreground text-background shadow-lg" : "bg-background/60 border hover:bg-[color:var(--color-accent)]"}`}
            >
              {t} {t !== "activity" && `(${t === "users" ? data.users.length : data.resumes.length})`}
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
        </Card>
      </main>
    </div>
  );
}
