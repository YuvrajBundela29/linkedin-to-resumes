import { z } from "zod";

// Structured resume schema. Kept small and free of length bounds / enums
// so it plays well with Gemini structured output.
export const ContactSchema = z.object({
  email: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  linkedin: z.string().optional().default(""),
  website: z.string().optional().default(""),
  location: z.string().optional().default(""),
});

export const ExperienceItemSchema = z.object({
  title: z.string().default(""),
  org: z.string().default(""),
  location: z.string().optional().default(""),
  start: z.string().optional().default(""),
  end: z.string().optional().default(""),
  current: z.boolean().optional().default(false),
  bullets: z.array(z.string()).default([]),
});

export const EducationItemSchema = z.object({
  school: z.string().default(""),
  degree: z.string().optional().default(""),
  field: z.string().optional().default(""),
  start: z.string().optional().default(""),
  end: z.string().optional().default(""),
  bullets: z.array(z.string()).default([]),
});

export const ProjectItemSchema = z.object({
  name: z.string().default(""),
  description: z.string().optional().default(""),
  bullets: z.array(z.string()).default([]),
});

// ---- CV-only sections (optional everywhere; only rendered by CV templates) ----
export const PublicationItemSchema = z.object({
  title: z.string().default(""),
  authors: z.string().optional().default(""),
  venue: z.string().optional().default(""),
  year: z.string().optional().default(""),
  link: z.string().optional().default(""),
});

export const ReferenceItemSchema = z.object({
  name: z.string().default(""),
  role: z.string().optional().default(""),
  org: z.string().optional().default(""),
  contact: z.string().optional().default(""),
});

export const ResumeSchema = z.object({
  name: z.string().default(""),
  headline: z.string().optional().default(""),
  contact: ContactSchema.default({}),
  summary: z.string().optional().default(""),
  experience: z.array(ExperienceItemSchema).default([]),
  education: z.array(EducationItemSchema).default([]),
  skills: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  projects: z.array(ProjectItemSchema).default([]),
  // CV extras — safely default to empty for existing resume documents.
  publications: z.array(PublicationItemSchema).optional().default([]),
  research: z.array(ExperienceItemSchema).optional().default([]),
  teaching: z.array(ExperienceItemSchema).optional().default([]),
  talks: z.array(z.string()).optional().default([]),
  grants: z.array(z.string()).optional().default([]),
  awards: z.array(z.string()).optional().default([]),
  languages: z.array(z.string()).optional().default([]),
  references: z.array(ReferenceItemSchema).optional().default([]),
});

export type Resume = z.infer<typeof ResumeSchema>;
export type ExperienceItem = z.infer<typeof ExperienceItemSchema>;
export type EducationItem = z.infer<typeof EducationItemSchema>;
export type PublicationItem = z.infer<typeof PublicationItemSchema>;
export type ReferenceItem = z.infer<typeof ReferenceItemSchema>;

export const EMPTY_RESUME: Resume = {
  name: "",
  headline: "",
  contact: { email: "", phone: "", linkedin: "", website: "", location: "" },
  summary: "",
  experience: [],
  education: [],
  skills: [],
  certifications: [],
  projects: [],
  publications: [],
  research: [],
  teaching: [],
  talks: [],
  grants: [],
  awards: [],
  languages: [],
  references: [],
};

export const TEMPLATE_IDS = [
  "classic", "modern", "compact", "technical", "executive", "elegant", "creative",
  "onyx", "aurora", "sidebar", "minimalist", "crimson", "academic",
  "cv_standard", "cv_academic",
] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

// ---- Document types ----
export const DOC_TYPES = ["resume", "cv_professional", "cv_academic"] as const;
export type DocType = (typeof DOC_TYPES)[number];

export const DOC_TYPE_META: Record<DocType, { label: string; short: string; description: string; defaultTemplate: TemplateId }> = {
  resume: {
    label: "Resume",
    short: "Resume",
    description: "One page, condensed. Best for job applications.",
    defaultTemplate: "classic",
  },
  cv_professional: {
    label: "Professional CV",
    short: "CV",
    description: "Full unabridged history, awards, languages, references.",
    defaultTemplate: "cv_standard",
  },
  cv_academic: {
    label: "Academic CV",
    short: "Academic CV",
    description: "Publications, research, teaching, talks and grants.",
    defaultTemplate: "cv_academic",
  },
};

/** CV documents use the multi-page CV layouts so no section is dropped. */
export const CV_TEMPLATE_IDS = ["cv_standard", "cv_academic"] as const;

export function templatesForDocType(docType: DocType): TemplateId[] {
  if (docType === "resume") return TEMPLATE_IDS.filter((t) => !CV_TEMPLATE_IDS.includes(t as any)) as TemplateId[];
  return [...CV_TEMPLATE_IDS];
}

export function defaultTemplateForDocType(docType: DocType): TemplateId {
  return DOC_TYPE_META[docType].defaultTemplate;
}

export function isCv(docType: DocType | undefined): boolean {
  return docType === "cv_professional" || docType === "cv_academic";
}
