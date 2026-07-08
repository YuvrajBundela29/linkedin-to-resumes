import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { getAccountSummary } from "@/lib/resume.functions";
import { ArrowLeft, Crown, LogOut } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "Account — ResumeForge AI" }, { name: "robots", content: "noindex" }] }),
  component: AccountPage,
});

function AccountPage() {
  const navigate = useNavigate();
  const fn = useServerFn(getAccountSummary);
  const q = useQuery({ queryKey: ["account"], queryFn: () => fn() });

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const usageByKind = (q.data?.usage30d ?? []).reduce<Record<string, number>>((acc, r: any) => {
    acc[r.kind] = (acc[r.kind] ?? 0) + 1; return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto max-w-3xl px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild><Link to="/dashboard"><ArrowLeft className="w-4 h-4" /></Link></Button>
            <Logo />
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="w-4 h-4 mr-1" /> Sign out</Button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10 space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Account</h1>
          <p className="text-muted-foreground mt-1">Your plan and usage.</p>
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Access</div>
              <div className="text-2xl font-semibold mt-1 flex items-center gap-2">
                Unlimited <Crown className="w-5 h-5 text-[color:var(--color-brand)]" />
              </div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div><div className="text-muted-foreground">Resumes created</div><div className="font-medium">{q.data?.resumeCount ?? 0}</div></div>
            <div><div className="text-muted-foreground">Templates</div><div className="font-medium">All 7 unlocked</div></div>
            <div><div className="text-muted-foreground">Version history</div><div className="font-medium">On</div></div>
            <div><div className="text-muted-foreground">JD tailoring</div><div className="font-medium">On</div></div>
          </div>
        </Card>


        <Card className="p-6">
          <div className="text-sm text-muted-foreground">Usage in the last 30 days</div>
          <div className="mt-4 grid grid-cols-4 gap-4 text-center">
            {["extract","chat_edit","pdf_export","tailor"].map((k) => (
              <div key={k}>
                <div className="text-3xl font-semibold">{usageByKind[k] ?? 0}</div>
                <div className="text-xs text-muted-foreground mt-1 capitalize">{k.replace("_"," ")}</div>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}
