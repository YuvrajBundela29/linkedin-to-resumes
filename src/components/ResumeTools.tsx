import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { atsReport, toPlainText } from "@/lib/resume-insights";
import type { Resume, TemplateId } from "@/lib/resume-schema";
import { TEMPLATES } from "@/templates";
import { HtmlFor } from "@/templates";
import { Check, X, Gauge, ClipboardCopy, LayoutGrid } from "lucide-react";
import { toast } from "sonner";

export function AtsScoreDialog({ resume }: { resume: Resume }) {
  const report = useMemo(() => atsReport(resume), [resume]);
  const tone = report.score >= 80 ? "#22c55e" : report.score >= 55 ? "#f59e0b" : "#ef4444";
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 px-2 sm:px-3 shrink-0">
          <Gauge className="w-4 h-4" /> <span className="hidden sm:inline">ATS score</span>
          <span className="text-xs font-semibold" style={{ color: tone }}>{report.score}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Gauge className="w-4 h-4" /> ATS readiness</DialogTitle>
          <DialogDescription>{report.words} words · scored on the checks recruiters' parsers care about.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-4 mt-1">
          <div className="text-5xl font-semibold tabular-nums" style={{ color: tone }}>{report.score}</div>
          <div className="flex-1 h-2 rounded-full bg-[color:var(--color-muted)] overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${report.score}%`, background: tone }} />
          </div>
        </div>
        <ul className="mt-4 space-y-2">
          {report.checks.map((c) => (
            <li key={c.label} className="flex items-start gap-2.5 text-sm">
              <span className={`mt-0.5 w-4 h-4 rounded-full grid place-items-center shrink-0 ${c.ok ? "bg-emerald-500/20 text-emerald-500" : "bg-red-500/15 text-red-500"}`}>
                {c.ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
              </span>
              <span>
                <span className={c.ok ? "" : "font-medium"}>{c.label}</span>
                {!c.ok && <span className="block text-xs text-muted-foreground">{c.hint}</span>}
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

export function CopyPlainTextButton({ resume }: { resume: Resume }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1 px-2 sm:px-3 shrink-0"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(toPlainText(resume));
          toast.success("Plain-text resume copied — paste it into any application form");
        } catch {
          toast.error("Couldn't access the clipboard");
        }
      }}
    >
      <ClipboardCopy className="w-4 h-4" /> <span className="hidden sm:inline">Copy text</span>
    </Button>
  );
}

export function TemplateGallery({
  resume, template, onSelect, allowed,
}: { resume: Resume; template: TemplateId; onSelect: (id: TemplateId) => void; allowed?: TemplateId[] }) {
  const [open, setOpen] = useState(false);
  const ids = allowed ?? (Object.keys(TEMPLATES) as TemplateId[]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 px-2 sm:px-3 shrink-0">
          <LayoutGrid className="w-4 h-4" /> <span className="hidden sm:inline">Gallery</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Template gallery</DialogTitle>
          <DialogDescription>Live previews of your own resume in every template. Click one to apply.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mt-2">
          {ids.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => { onSelect(id); setOpen(false); }}
              className={`text-left rounded-xl border overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl ${id === template ? "ring-2 ring-[color:var(--color-brand)]" : ""}`}
            >
              <div className="h-[220px] overflow-hidden bg-white">
                <div style={{ transform: "scale(0.27)", transformOrigin: "top left", width: 794 }}>
                  <HtmlFor template={id} resume={resume} />
                </div>
              </div>
              <div className="p-2.5 border-t bg-background">
                <div className="text-sm font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: TEMPLATES[id].accent }} />
                  {TEMPLATES[id].name}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{TEMPLATES[id].description}</div>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
