import type { Resume, TemplateId } from "@/lib/resume-schema";
import { ClassicHtml } from "./classic/Html";
import { ClassicPdf } from "./classic/Pdf";
import { ModernHtml } from "./modern/Html";
import { ModernPdf } from "./modern/Pdf";
import { CompactHtml } from "./compact/Html";
import { CompactPdf } from "./compact/Pdf";
import { TechnicalHtml } from "./technical/Html";
import { TechnicalPdf } from "./technical/Pdf";

export type TemplateMeta = {
  id: TemplateId;
  name: string;
  description: string;
  tier: "free" | "pro";
};

export const TEMPLATES: Record<TemplateId, TemplateMeta> = {
  classic:   { id: "classic",   name: "Classic",   description: "Timeless, recruiter-friendly.",     tier: "free" },
  modern:    { id: "modern",    name: "Modern",    description: "Larger name, roomy hierarchy.",     tier: "free" },
  compact:   { id: "compact",   name: "Compact",   description: "Dense — fit more into one page.",   tier: "pro" },
  technical: { id: "technical", name: "Technical", description: "Skills-first, engineer-friendly.",  tier: "pro" },
};

export function HtmlFor({ template, resume }: { template: TemplateId; resume: Resume }) {
  switch (template) {
    case "modern":    return <ModernHtml resume={resume} />;
    case "compact":   return <CompactHtml resume={resume} />;
    case "technical": return <TechnicalHtml resume={resume} />;
    case "classic":
    default:          return <ClassicHtml resume={resume} />;
  }
}

export function PdfDocumentFor({ template, resume }: { template: TemplateId; resume: Resume }) {
  switch (template) {
    case "modern":    return <ModernPdf resume={resume} />;
    case "compact":   return <CompactPdf resume={resume} />;
    case "technical": return <TechnicalPdf resume={resume} />;
    case "classic":
    default:          return <ClassicPdf resume={resume} />;
  }
}
