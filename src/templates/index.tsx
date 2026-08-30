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
import { GenericHtml, type GenericVariant } from "./generic/Html";
import { GenericPdf } from "./generic/Pdf";
import { CvHtml } from "./cv/Html";
import { CvPdf } from "./cv/Pdf";


// New enhanced templates built on one shared, ATS-safe layout engine.
const GENERIC: Record<string, { accent: string; variant: GenericVariant }> = {
  onyx:       { accent: "#0b1220", variant: "band" },
  aurora:     { accent: "#4338ca", variant: "band" },
  sidebar:    { accent: "#0f172a", variant: "sidebar" },
  minimalist: { accent: "#111827", variant: "line" },
  crimson:    { accent: "#b91c1c", variant: "line" },
  academic:   { accent: "#1f3a5f", variant: "serif" },
};

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
  onyx:      { id: "onyx",      name: "Onyx",      description: "Dark obsidian header band, high contrast.", tier: "pro", accent: "#0b1220" },
  aurora:    { id: "aurora",    name: "Aurora",    description: "Indigo band, modern product-design feel.",  tier: "pro", accent: "#4338ca" },
  sidebar:   { id: "sidebar",   name: "Sidebar",   description: "Two-column with skills rail — recruiter scannable.", tier: "pro", accent: "#0f172a" },
  minimalist:{ id: "minimalist",name: "Minimalist",description: "Hairline rules, maximum whitespace.",       tier: "pro", accent: "#111827" },
  crimson:   { id: "crimson",   name: "Crimson",   description: "Restrained red accents, confident.",        tier: "pro", accent: "#b91c1c" },
  academic:  { id: "academic",  name: "Academic",  description: "Serif, centered — research & CV friendly.", tier: "pro", accent: "#1f3a5f" },
  cv_standard:{ id: "cv_standard", name: "CV — Standard", description: "Multi-page professional CV with awards, languages, references.", tier: "pro", accent: "#1e3a5f" },
  cv_academic:{ id: "cv_academic", name: "CV — Academic", description: "Serif academic CV: publications, research, teaching, grants.", tier: "pro", accent: "#3f3f46" },
};


export function HtmlFor({ template, resume }: { template: TemplateId; resume: Resume }) {
  switch (template) {
    case "modern":    return <ModernHtml resume={resume} />;
    case "compact":   return <CompactHtml resume={resume} />;
    case "technical": return <TechnicalHtml resume={resume} />;
    case "executive": return <ExecutiveHtml resume={resume} />;
    case "elegant":   return <ElegantHtml resume={resume} />;
    case "creative":  return <CreativeHtml resume={resume} />;
    case "cv_standard": return <CvHtml resume={resume} variant="standard" />;
    case "cv_academic": return <CvHtml resume={resume} variant="academic" />;
    case "onyx": case "aurora": case "sidebar": case "minimalist": case "crimson": case "academic":
      return <GenericHtml resume={resume} accent={GENERIC[template].accent} variant={GENERIC[template].variant} dark={template === "onyx"} />;

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
    case "cv_standard": return <CvPdf resume={resume} variant="standard" />;
    case "cv_academic": return <CvPdf resume={resume} variant="academic" />;
    case "onyx": case "aurora": case "sidebar": case "minimalist": case "crimson": case "academic":
      return <GenericPdf resume={resume} accent={GENERIC[template].accent} variant={GENERIC[template].variant} />;

    case "classic":
    default:          return <ClassicPdf resume={resume} />;
  }
}
