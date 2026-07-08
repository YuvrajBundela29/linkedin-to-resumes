import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  listResumes,
  createEmptyResume,
  extractResumeFromPdf,
  deleteResume,
  getIsAdmin,
} from "@/lib/resume.functions";
import { toast } from "sonner";
import { FileText, Loader2, Trash2, Upload, LogOut, User, Shield } from "lucide-react";
import { TEMPLATES } from "@/templates";


export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Your resumes — ResumeForge AI" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const list = useServerFn(listResumes);
  const create = useServerFn(createEmptyResume);
  const extract = useServerFn(extractResumeFromPdf);
  const del = useServerFn(deleteResume);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const resumesQ = useQuery({ queryKey: ["resumes"], queryFn: () => list() });
  const adminFn = useServerFn(getIsAdmin);
  const adminQ = useQuery({ queryKey: ["isAdmin"], queryFn: () => adminFn() });


  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { resumeId: id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["resumes"] }); toast.success("Deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  async function handleUpload(file: File) {
    if (file.type !== "application/pdf") { toast.error("Please upload a PDF file."); return; }
    if (file.size > 15 * 1024 * 1024) { toast.error("File too large (max 15MB)."); return; }
    setUploading(true);
    try {
      const { id } = await create();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = () => reject(r.error);
        r.readAsDataURL(file);
      });
      toast.info("Analyzing your profile…");
      await extract({ data: { resumeId: id, fileDataUrl: dataUrl, filename: file.name } });
      navigate({ to: "/r/$resumeId", params: { resumeId: id } });
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link to="/"><Logo /></Link>
          <div className="flex items-center gap-2">
            {adminQ.data?.isAdmin && (
              <Button asChild variant="ghost" size="sm" className="text-[color:var(--color-brand)]">
                <Link to="/admin"><Shield className="w-4 h-4 mr-1" /> Admin</Link>
              </Button>
            )}
            <Button asChild variant="ghost" size="sm"><Link to="/account"><User className="w-4 h-4 mr-1" /> Account</Link></Button>
            <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="w-4 h-4 mr-1" /> Sign out</Button>
          </div>
        </div>
      </header>


      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Your resumes</h1>
            <p className="text-muted-foreground mt-1">Upload a LinkedIn PDF or open one to edit.</p>
          </div>
        </div>

        {/* Upload zone */}
        <Card
          className="p-8 border-dashed border-2 hover:border-[color:var(--color-brand)] transition-colors cursor-pointer"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); }}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleUpload(f); }}
        >
          <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
          <div className="flex flex-col items-center text-center">
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 text-[color:var(--color-brand)] animate-spin" />
                <div className="mt-3 font-medium">Analyzing your profile…</div>
                <div className="text-sm text-muted-foreground">This usually takes about 15 seconds.</div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-[color:var(--color-brand)]/10 text-[color:var(--color-brand)] grid place-items-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="mt-3 font-medium">Drop your LinkedIn "Save to PDF" here</div>
                <div className="text-sm text-muted-foreground">or click to browse. PDF only, up to 15MB.</div>
              </>
            )}
          </div>
        </Card>

        <div className="mt-10">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Recent</h2>
          {resumesQ.isLoading ? (
            <div className="mt-4 text-sm text-muted-foreground">Loading…</div>
          ) : (resumesQ.data?.length ?? 0) === 0 ? (
            <div className="mt-4 text-sm text-muted-foreground">No resumes yet. Upload one above to get started.</div>
          ) : (
            <div className="mt-4 grid gap-3">
              {resumesQ.data!.map((r) => (
                <Card key={r.id} className="p-4 flex items-center justify-between hover:shadow-sm transition">
                  <Link to="/r/$resumeId" params={{ resumeId: r.id }} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-md bg-[color:var(--color-muted)] grid place-items-center shrink-0"><FileText className="w-5 h-5" /></div>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{r.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {TEMPLATES[r.template as keyof typeof TEMPLATES]?.name ?? "Classic"} template · updated {new Date(r.updated_at).toLocaleString()}
                      </div>
                    </div>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete this resume?")) delMut.mutate(r.id); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
