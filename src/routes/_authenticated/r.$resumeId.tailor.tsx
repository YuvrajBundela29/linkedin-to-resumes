import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { tailorToJobDescription } from "@/lib/resume.functions";
import { toast } from "sonner";
import { ArrowLeft, Target } from "lucide-react";

export const Route = createFileRoute("/_authenticated/r/$resumeId/tailor")({
  head: () => ({ meta: [{ title: "Tailor to job — ResumeForge AI" }, { name: "robots", content: "noindex" }] }),
  component: TailorPage,
});

function TailorPage() {
  const { resumeId } = Route.useParams();
  const navigate = useNavigate();
  const tailor = useServerFn(tailorToJobDescription);
  const [jd, setJd] = useState("");

  const mut = useMutation({
    mutationFn: () => tailor({ data: { resumeId, jobDescription: jd } }),
    onSuccess: () => { toast.success("Resume tailored. Review your changes."); navigate({ to: "/r/$resumeId" as any, params: { resumeId } }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto max-w-3xl px-6 h-14 flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild><Link to={"/r/$resumeId" as any} params={{ resumeId }}><ArrowLeft className="w-4 h-4" /></Link></Button>
          <Logo />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Target className="w-4 h-4" /> Pro feature</div>
        <h1 className="text-3xl font-semibold tracking-tight mt-2">Tailor to a job description</h1>
        <p className="text-muted-foreground mt-2">Paste a JD. The AI reweights your bullets and reorders skills to match — without inventing new experience.</p>
        <Card className="mt-6 p-4">
          <Textarea value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste the full job description here…" className="min-h-[280px]" />
          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">Your previous version is saved automatically.</div>
            <Button disabled={jd.trim().length < 20 || mut.isPending} onClick={() => mut.mutate()}>
              {mut.isPending ? "Tailoring…" : "Tailor my resume"}
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
