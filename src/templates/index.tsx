import type { Resume, TemplateId } from "@/lib/resume-schema";
import { ClassicHtml } from "./classic/Html";
import { ClassicPdf } from "./classic/Pdf";
import { ModernHtml } from "./modern/Html";
import { ModernPdf } from "./modern/Pdf";
import { CompactHtml } from "./compact/Html";
import { CompactPdf } from "./compact/Pdf";
import { TechnicalHtml } from "./technical/Html";
import { TechnicalPdf } from "./technical/Pdf";
import { ExecutiveHtml } from "./executive/Html";
import { ExecutivePdf } from "./executive/Pdf";
import { ElegantHtml } from "./elegant/Html";
import { ElegantPdf } from "./elegant/Pdf";
import { CreativeHtml } from "./creative/Html";
import { CreativePdf } from "./creative/Pdf";

export type TemplateMeta = {
  id: TemplateId;
  name: string;
  description: string;
  tier: "free" | "pro";
  accent: string;
};

export const TEMPLATES: Record<TemplateId, TemplateMeta> = {
  classic:   { id: "classic",   name: "Classic",   description: "Timeless, recruiter-friendly.",       tier: "free", accent: "#111827" },
  modern:    { id: "modern",    name: "Modern",    description: "Larger name, roomy hierarchy.",       tier: "free", accent: "#111827" },
  compact:   { id: "compact",   name: "Compact",   description: "Dense — fit more into one page.",     tier: "pro",  accent: "#374151" },
  technical: { id: "technical", name: "Technical", description: "Skills-first, engineer-friendly.",    tier: "pro",  accent: "#1e293b" },
  executive: { id: "executive", name: "Executive", description: "Serif, centered header, navy accent.",tier: "pro",  accent: "#0f2a4a" },
  elegant:   { id: "elegant",   name: "Elegant",   description: "Emerald accent bar, refined.",        tier: "pro",  accent: "#0f766e" },
  creative:  { id: "creative",  name: "Creative",  description: "Bold coral header band.",             tier: "pro",  accent: "#dc5c3a" },
};

export function HtmlFor({ template, resume }: { template: TemplateId; resume: Resume }) {
  switch (template) {
    case "modern":    return <ModernHtml resume={resume} />;
    case "compact":   return <CompactHtml resume={resume} />;
    case "technical": return <TechnicalHtml resume={resume} />;
    case "executive": return <ExecutiveHtml resume={resume} />;
    case "elegant":   return <ElegantHtml resume={resume} />;
    case "creative":  return <CreativeHtml resume={resume} />;
    case "classic":
    default:          return <ClassicHtml resume={resume} />;
  }
}

export function PdfDocumentFor({ template, resume }: { template: TemplateId; resume: Resume }) {
  switch (template) {
    case "modern":    return <ModernPdf resume={resume} />;
    case "compact":   return <CompactPdf resume={resume} />;
    case "technical": return <TechnicalPdf resume={resume} />;
    case "executive": return <ExecutivePdf resume={resume} />;
    case "elegant":   return <ElegantPdf resume={resume} />;
    case "creative":  return <CreativePdf resume={resume} />;
    case "classic":
    default:          return <ClassicPdf resume={resume} />;
  }
}
