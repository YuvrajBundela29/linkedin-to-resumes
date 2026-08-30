import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { Logo } from "@/components/Logo";
import { CreditsBadge } from "@/components/CreditsBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import {
  listResumes,
  createEmptyResume,
  extractResumeFromPdf,
  importFromProfileUrl,
  importFromText,
  deleteResume,
  getIsAdmin,
} from "@/lib/resume.functions";
import { DOC_TYPES, DOC_TYPE_META, type DocType } from "@/lib/resume-schema";
import { toast } from "sonner";
import { FileText, Loader2, Trash2, Upload, LogOut, User, Shield, Link2, ClipboardType } from "lucide-react";
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
  const fromUrl = useServerFn(importFromProfileUrl);
  const fromText = useServerFn(importFromText);
  const del = useServerFn(deleteResume);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState<DocType>("resume");
  const [profileUrl, setProfileUrl] = useState("");
  const [pastedText, setPastedText] = useState("");

  const resumesQ = useQuery({ queryKey: ["resumes"], queryFn: () => list() });
  const adminFn = useServerFn(getIsAdmin);
  const adminQ = useQuery({ queryKey: ["isAdmin"], queryFn: () => adminFn() });


  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { resumeId: id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["resumes"] }); toast.success("Deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  /** Shared import runner: creates the document, runs `work`, then opens the editor. */
  async function runImport(work: (id: string) => Promise<unknown>) {
    setUploading(true);
    try {
      const { id } = await create({ data: { docType } });
      toast.info(`Building your ${DOC_TYPE_META[docType].short.toLowerCase()}…`);
      await work(id);
      qc.invalidateQueries({ queryKey: ["credits"] });
      qc.invalidateQueries({ queryKey: ["resumes"] });
      navigate({ to: "/r/$resumeId", params: { resumeId: id } });
    } catch (e: any) {
      qc.invalidateQueries({ queryKey: ["credits"] });
      toast.error(e?.message ?? "Import failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleUpload(file: File) {
    if (file.type !== "application/pdf") { toast.error("Please upload a PDF file."); return; }
    if (file.size > 15 * 1024 * 1024) { toast.error("File too large (max 15MB)."); return; }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(file);
    });
    await runImport((id) => extract({ data: { resumeId: id, fileDataUrl: dataUrl, filename: file.name } }));
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          <Link to="/" className="min-w-0 shrink"><Logo className="[&>span]:hidden sm:[&>span]:inline" /></Link>
          <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">
            <CreditsBadge />
            {adminQ.data?.isAdmin && (
              <Button asChild variant="ghost" size="sm" className="text-[color:var(--color-brand)] px-2">
                <Link to="/admin"><Shield className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Admin</span></Link>
              </Button>
            )}
            <Button asChild variant="ghost" size="sm" className="px-2"><Link to="/account"><User className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Account</span></Link></Button>
            <Button variant="ghost" size="sm" onClick={signOut} className="px-2"><LogOut className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Sign out</span></Button>
          </div>
        </div>
      </header>


      <main className="mx-auto max-w-6xl px-3 sm:px-6 py-6 sm:py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Your documents</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">Build a resume or a full CV from your LinkedIn — PDF, profile link, or pasted text.</p>
          </div>
        </div>

        {/* Step 1 — document type */}
        <div className="mb-4">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">1 · What are we building?</div>
          <div className="grid gap-3 sm:grid-cols-3">
            {DOC_TYPES.map((t) => {
              const active = docType === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDocType(t)}
                  className={`text-left rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg ${active ? "border-[color:var(--color-brand)] ring-2 ring-[color:var(--color-brand)]/40 bg-[color:var(--color-brand)]/[0.06]" : "border-border"}`}
                >
                  <div className="font-medium">{DOC_TYPE_META[t].label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{DOC_TYPE_META[t].description}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2 — import source */}
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">2 · Where should we read from?</div>
        <Tabs defaultValue="pdf">
          <TabsList className="mb-3">
            <TabsTrigger value="pdf" className="gap-1.5"><Upload className="w-4 h-4" /> PDF</TabsTrigger>
            <TabsTrigger value="url" className="gap-1.5"><Link2 className="w-4 h-4" /> Profile link</TabsTrigger>
            <TabsTrigger value="text" className="gap-1.5"><ClipboardType className="w-4 h-4" /> Paste text</TabsTrigger>
          </TabsList>

          <TabsContent value="pdf">
            <Card
              className={`p-8 border-dashed border-2 transition-colors ${uploading ? "opacity-70" : "hover:border-[color:var(--color-brand)] cursor-pointer"}`}
              onClick={() => { if (!uploading) fileRef.current?.click(); }}
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={(e) => { e.preventDefault(); if (uploading) return; const f = e.dataTransfer.files[0]; if (f) handleUpload(f); }}
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
          </TabsContent>

          <TabsContent value="url">
            <Card className="p-6">
              <div className="font-medium">Paste a LinkedIn profile URL</div>
              <p className="text-sm text-muted-foreground mt-1">
                We read the public version of the profile. Many profiles are login-walled — if that happens, use the PDF or paste-text option.
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="https://www.linkedin.com/in/your-handle"
                  value={profileUrl}
                  onChange={(e) => setProfileUrl(e.target.value)}
                  disabled={uploading}
                />
                <Button
                  disabled={uploading || profileUrl.trim().length < 8}
                  onClick={() => runImport((id) => fromUrl({ data: { resumeId: id, url: profileUrl.trim() } }))}
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Analyze profile"}
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="text">
            <Card className="p-6">
              <div className="font-medium">Paste your profile or existing document text</div>
              <p className="text-sm text-muted-foreground mt-1">
                Select everything on your LinkedIn profile (or an old resume/CV) and paste it here. Works every time.
              </p>
              <Textarea
                className="mt-4 min-h-[180px]"
                placeholder="Paste your experience, education, skills…"
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                disabled={uploading}
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">{pastedText.trim().length} characters (minimum 80)</span>
                <Button
                  disabled={uploading || pastedText.trim().length < 80}
                  onClick={() => runImport((id) => fromText({ data: { resumeId: id, text: pastedText.trim() } }))}
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Build my ${DOC_TYPE_META[docType].short.toLowerCase()}`}
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>


        <div className="mt-10">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Recent</h2>
          {resumesQ.isLoading ? (
            <div className="mt-4 text-sm text-muted-foreground">Loading…</div>
          ) : (resumesQ.data?.length ?? 0) === 0 ? (
            <div className="mt-4 text-sm text-muted-foreground">Nothing here yet. Pick a type above and import to get started.</div>
          ) : (
            <div className="mt-4 grid gap-3">
              {resumesQ.data!.map((r) => (
                <Card key={r.id} className="p-4 flex items-center justify-between hover:shadow-sm transition">
                  <Link to="/r/$resumeId" params={{ resumeId: r.id }} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-md bg-[color:var(--color-muted)] grid place-items-center shrink-0"><FileText className="w-5 h-5" /></div>
                    <div className="min-w-0">
                      <div className="font-medium truncate flex items-center gap-2">
                        <span className="truncate">{r.title}</span>
                        <span className="shrink-0 rounded-full border border-[color:var(--color-brand)]/40 bg-[color:var(--color-brand)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--color-brand)]">
                          {DOC_TYPE_META[((r as any).doc_type as DocType) ?? "resume"].short}
                        </span>
                      </div>
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
