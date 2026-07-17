import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/Logo";
import { ResumePreview } from "@/components/ResumePreview";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";

import {
  getResume, applyChatEdit, switchTemplate, listVersions, rollbackVersion, listChatMessages,
} from "@/lib/resume.functions";
import { TEMPLATES, PdfDocumentFor } from "@/templates";
import { TEMPLATE_IDS, type TemplateId } from "@/lib/resume-schema";
import { toast } from "sonner";
import {
  ArrowLeft, Download, History, Loader2, Send, Sparkles, Target, HelpCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { pdf } from "@react-pdf/renderer";


export const Route = createFileRoute("/_authenticated/r/$resumeId")({
  head: () => ({ meta: [{ title: "Editor — ResumeForge AI" }, { name: "robots", content: "noindex" }] }),
  component: Editor,
});

type Msg = { role: "user" | "assistant"; text: string };

function Editor() {
  const { resumeId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const getR = useServerFn(getResume);
  const edit = useServerFn(applyChatEdit);
  const swap = useServerFn(switchTemplate);
  const listV = useServerFn(listVersions);
  const rollbackV = useServerFn(rollbackVersion);
  const listChat = useServerFn(listChatMessages);

  const rQ = useQuery({ queryKey: ["resume", resumeId], queryFn: () => getR({ data: { resumeId } }) });
  const versionsQ = useQuery({ queryKey: ["versions", resumeId], queryFn: () => listV({ data: { resumeId } }), enabled: false });
  const historyQ = useQuery({ queryKey: ["chat", resumeId], queryFn: () => listChat({ data: { resumeId } }) });

  const WELCOME: Msg = { role: "assistant", text: "Hi! I can edit **content and style** on your resume — try:\n\n- *Make my resume look more professional*\n- *Switch to the executive template*\n- *Add a bullet to my first job about leading a team of 5*\n- *Make my bullets more quantified*\n- *Reorder education so my Master's is first*" };
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [mobileTab, setMobileTab] = useState<"preview" | "chat">("preview");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Hydrate from persisted history
  useEffect(() => {
    if (historyQ.data && historyQ.data.length > 0) {
      setMessages([WELCOME, ...historyQ.data.map((m: any) => ({ role: m.role as "user"|"assistant", text: m.content }))]);
    }
  }, [historyQ.data]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  const editMut = useMutation({
    mutationFn: (message: string) => edit({ data: { resumeId, message } }),
    onSuccess: (data) => {
      qc.setQueryData(["resume", resumeId], (old: any) => old ? { ...old, resume: data.resume, template: data.template ?? old.template } : old);
      qc.invalidateQueries({ queryKey: ["versions", resumeId] });
      qc.invalidateQueries({ queryKey: ["chat", resumeId] });
      setMessages((m) => [...m, { role: "assistant", text: data.reply || "Done." }]);
    },
    onError: (e: Error) => {
      setMessages((m) => [...m, { role: "assistant", text: `⚠ ${e.message}` }]);
      toast.error(e.message);
    },
    onSettled: () => setPending(false),
  });

  const swapMut = useMutation({
    mutationFn: (template: TemplateId) => swap({ data: { resumeId, template } }),
    onSuccess: (_r, template) => {
      qc.setQueryData(["resume", resumeId], (old: any) => old ? { ...old, template } : old);
      toast.success("Template updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rollbackMut = useMutation({
    mutationFn: (versionId: string) => rollbackV({ data: { resumeId, versionId } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["resume", resumeId] }); toast.success("Rolled back"); },
    onError: (e: Error) => toast.error(e.message),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || pending) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setPending(true);
    editMut.mutate(text);
  }

  async function downloadPdf() {
    if (!rQ.data) { toast.error("Resume not loaded"); return; }
    toast.info("Rendering PDF…");
    try {
      const blob = await pdf(PdfDocumentFor({ template: rQ.data.template, resume: rQ.data.resume })).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(rQ.data.title ?? "resume").replace(/[^\w\-]+/g, "_")}.pdf`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      toast.success("PDF downloaded");
    } catch (e: any) {
      console.error("client pdf render failed", e);
      toast.error(e?.message ?? "PDF failed");
    }
  }

  if (rQ.isLoading) return (
    <div className="h-[100dvh] bg-background flex flex-col">
      <div className="border-b h-14 flex items-center px-4 gap-3">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-4 w-40" />
        <div className="ml-auto flex gap-2">
          <Skeleton className="h-8 w-[180px]" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>
      </div>
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-0 min-h-0">
        <div className="p-4"><Skeleton className="w-full max-w-[794px] mx-auto aspect-[794/1123]" /></div>
        <div className="border-l p-4 space-y-3 bg-[color:var(--color-surface)]">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-10 w-3/4 ml-auto" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
  );
  if (rQ.isError || !rQ.data) return <div className="min-h-screen grid place-items-center text-muted-foreground">Couldn't load this resume.</div>;

  const { resume, template, title } = rQ.data;

  return (
    <div className="min-h-[100dvh] lg:h-[100dvh] lg:overflow-hidden bg-background flex flex-col">

      <header className="border-b overflow-hidden">
        <div className="mx-auto max-w-[1600px] px-3 sm:px-4 min-h-14 py-2 grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 min-w-0">
            <Button variant="ghost" size="sm" asChild className="shrink-0"><Link to="/dashboard"><ArrowLeft className="w-4 h-4" /></Link></Button>
            <div className="flex items-center gap-2 min-w-0">
              <Logo className="hidden lg:inline-flex shrink-0" />
              <div className="text-sm text-muted-foreground truncate min-w-0">/ {title}</div>
            </div>
          </div>
          <div className="min-w-0 overflow-x-auto pb-1 md:overflow-visible md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max min-w-full items-center gap-1.5 sm:gap-2 md:min-w-0 md:justify-end">
            <Select value={template} onValueChange={(v) => swapMut.mutate(v as TemplateId)}>
              <SelectTrigger className="w-[128px] sm:w-[180px] h-9 shrink-0"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TEMPLATE_IDS.map((id) => (
                  <SelectItem key={id} value={id}>
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: TEMPLATES[id].accent }} />
                      {TEMPLATES[id].name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Sheet onOpenChange={(open) => { if (open) versionsQ.refetch(); }}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 px-2 sm:px-3 shrink-0">
                  <History className="w-4 h-4" /> <span className="hidden sm:inline">History</span>
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader><SheetTitle>Version history</SheetTitle></SheetHeader>
                <div className="mt-4 space-y-2">
                  {(versionsQ.data ?? []).length === 0 ? (
                    <div className="text-sm text-muted-foreground">No previous versions yet. Every edit creates one automatically .</div>
                  ) : versionsQ.data!.map((v) => (
                    <Card key={v.id} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{v.label || "Snapshot"}</div>
                        <div className="text-xs text-muted-foreground">{new Date(v.created_at).toLocaleString()}</div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => rollbackMut.mutate(v.id)}>Restore</Button>
                    </Card>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 px-2 sm:px-3 shrink-0">
                  <HelpCircle className="w-4 h-4" /> <span className="hidden sm:inline">Guide</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-[color:var(--color-brand)]" /> How to use the AI editor</DialogTitle>
                  <DialogDescription>Everything you can do — in one place.</DialogDescription>
                </DialogHeader>
                <div className="space-y-5 text-sm mt-2">
                  <section>
                    <h3 className="font-semibold mb-1.5">1. Edit content by chatting</h3>
                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                      <li>"Add a bullet to my first job about leading a team of 5"</li>
                      <li>"Rewrite my summary to be more concise and quantified"</li>
                      <li>"Reorder education so my Master's is first"</li>
                      <li>"Remove the last project"</li>
                    </ul>
                  </section>
                  <section>
                    <h3 className="font-semibold mb-1.5">2. Change the look</h3>
                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                      <li>Pick a template from the dropdown, or say <em>"switch to the executive template"</em>.</li>
                      <li>Try: Classic · Modern · Compact · Technical · Executive · Elegant · Creative.</li>
                    </ul>
                  </section>
                  <section>
                    <h3 className="font-semibold mb-1.5">3. Tailor to a job</h3>
                    <p className="text-muted-foreground">Click <b>Tailor</b>, paste a job description, and the AI aligns your resume — keeping it ATS-safe.</p>
                  </section>
                  <section>
                    <h3 className="font-semibold mb-1.5">4. Undo any change</h3>
                    <p className="text-muted-foreground">Every edit auto-snapshots. Click <b>History</b> to restore any earlier version.</p>
                  </section>
                  <section>
                    <h3 className="font-semibold mb-1.5">5. Download</h3>
                    <p className="text-muted-foreground">Hit <b>Download PDF</b> for a text-selectable, ATS-safe file — never rasterized.</p>
                  </section>
                  <section className="rounded-md border p-3 bg-[color:var(--color-muted)]">
                    <div className="font-semibold mb-1">Pro tip</div>
                    <p className="text-muted-foreground">Ask for metrics ("quantify my bullets") — recruiters and ATS both reward numbers.</p>
                  </section>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" asChild className="px-2 sm:px-3 shrink-0">
              <Link to="/r/$resumeId/tailor" params={{ resumeId }}>
                <Target className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Tailor</span>
              </Link>
            </Button>
            <Button size="sm" onClick={downloadPdf} className="gap-1 px-2 sm:px-3 shrink-0">
              <Download className="w-4 h-4" /> <span className="hidden sm:inline">Download PDF</span><span className="sm:hidden">PDF</span>
            </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-0 lg:min-h-0">
        {/* Preview */}
        <div className="lg:min-h-0 lg:overflow-auto p-3 sm:p-4">
          <ResumePreview resume={resume} template={template} />
        </div>
        {/* Chat */}
        <div className="border-t lg:border-t-0 lg:border-l flex flex-col min-h-0 h-[calc(100dvh-5.75rem)] lg:h-auto bg-[color:var(--color-surface)]">
          <div className="px-4 py-3 border-b flex items-center gap-2 text-sm font-medium">
            <Sparkles className="w-4 h-4 text-[color:var(--color-brand)]" /> AI editor
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 scroll-pb-48">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
                {m.role === "user" ? (
                  <div className="rounded-2xl bg-primary text-primary-foreground px-4 py-2 max-w-[85%] text-sm">
                    {m.text}
                  </div>
                ) : (
                  <div className="max-w-[95%] text-sm prose prose-sm prose-neutral dark:prose-invert">
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                  </div>
                )}
              </div>
            ))}
            {pending && (
              <div className="text-sm text-muted-foreground inline-flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" /> Thinking…
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="border-t bg-background shrink-0">
            <div className="px-3 pt-2 flex flex-wrap gap-1.5">
              {[
                "Strengthen my bullets with metrics",
                "Shorten my summary to 2 sentences",
                "Reorder skills by relevance",
                "Fix typos and tighten wording",
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={pending}
                  onClick={() => { setMessages((m) => [...m, { role: "user", text: q }]); setPending(true); editMut.mutate(q); }}
                  className="text-xs rounded-full border px-2.5 py-1 hover:bg-[color:var(--color-accent)] disabled:opacity-50 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
            <form onSubmit={submit} className="p-3 flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask for an edit — e.g. 'add a bullet about mentoring 5 engineers'"
                className="min-h-[44px] max-h-40 resize-none"
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(e as any); } }}
                disabled={pending}
                autoFocus
              />
              <Button type="submit" size="icon" disabled={pending || !input.trim()}><Send className="w-4 h-4" /></Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
