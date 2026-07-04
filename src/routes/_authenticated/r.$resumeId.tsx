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
import { supabase } from "@/integrations/supabase/client";
import {
  getResume, applyChatEdit, switchTemplate, listVersions, rollbackVersion,
} from "@/lib/resume.functions";
import { TEMPLATES } from "@/templates";
import { TEMPLATE_IDS, type TemplateId } from "@/lib/resume-schema";
import { toast } from "sonner";
import {
  ArrowLeft, Download, History, Loader2, Send, Sparkles, Target,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

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

  const rQ = useQuery({ queryKey: ["resume", resumeId], queryFn: () => getR({ data: { resumeId } }) });
  const versionsQ = useQuery({ queryKey: ["versions", resumeId], queryFn: () => listV({ data: { resumeId } }), enabled: false });

  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", text: "Hi! Tell me what to change — e.g. *shorten my summary*, *reorder my education*, or *make it more focused on AI roles*." }]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  const editMut = useMutation({
    mutationFn: (message: string) => edit({ data: { resumeId, message } }),
    onSuccess: (data) => {
      qc.setQueryData(["resume", resumeId], (old: any) => old ? { ...old, resume: data.resume } : old);
      qc.invalidateQueries({ queryKey: ["versions", resumeId] });
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
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) { toast.error("Sign in required"); return; }
    toast.info("Rendering PDF…");
    try {
      const res = await fetch(`/api/resume/${resumeId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text() || "PDF failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${rQ.data?.title ?? "resume"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(e.message ?? "PDF failed");
    }
  }

  if (rQ.isLoading) return <div className="min-h-screen grid place-items-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  if (rQ.isError || !rQ.data) return <div className="min-h-screen grid place-items-center text-muted-foreground">Couldn't load this resume.</div>;

  const { resume, template, title } = rQ.data;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="mx-auto max-w-[1600px] px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="sm" asChild><Link to="/dashboard"><ArrowLeft className="w-4 h-4" /></Link></Button>
            <Logo className="hidden sm:inline-flex" />
            <div className="text-sm text-muted-foreground truncate">/ {title}</div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={template} onValueChange={(v) => swapMut.mutate(v as TemplateId)}>
              <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TEMPLATE_IDS.map((id) => (
                  <SelectItem key={id} value={id}>
                    {TEMPLATES[id].name} {TEMPLATES[id].tier === "pro" && <span className="text-xs text-muted-foreground ml-1">Pro</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Sheet onOpenChange={(open) => { if (open) versionsQ.refetch(); }}>
              <SheetTrigger asChild><Button variant="outline" size="sm" className="gap-1"><History className="w-4 h-4" /> History</Button></SheetTrigger>
              <SheetContent>
                <SheetHeader><SheetTitle>Version history</SheetTitle></SheetHeader>
                <div className="mt-4 space-y-2">
                  {(versionsQ.data ?? []).length === 0 ? (
                    <div className="text-sm text-muted-foreground">No previous versions yet. Every edit creates one automatically (Pro plan required for rollback).</div>
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
            <Button variant="outline" size="sm" asChild><Link to={"/r/$resumeId/tailor" as any} params={{ resumeId }}><Target className="w-4 h-4 mr-1" /> Tailor</Link></Button>
            <Button size="sm" onClick={downloadPdf} className="gap-1"><Download className="w-4 h-4" /> Download PDF</Button>
          </div>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-0 min-h-0">
        {/* Preview */}
        <div className="min-h-0 overflow-auto p-4">
          <ResumePreview resume={resume} template={template} />
        </div>
        {/* Chat */}
        <div className="border-l flex flex-col min-h-0 bg-[color:var(--color-surface)]">
          <div className="px-4 py-3 border-b flex items-center gap-2 text-sm font-medium">
            <Sparkles className="w-4 h-4 text-[color:var(--color-brand)]" /> AI editor
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
          <form onSubmit={submit} className="border-t p-3 flex gap-2 bg-background">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for an edit — e.g. 'move my last job to first'"
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
  );
}
