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
});

export type Resume = z.infer<typeof ResumeSchema>;
export type ExperienceItem = z.infer<typeof ExperienceItemSchema>;
export type EducationItem = z.infer<typeof EducationItemSchema>;

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
};

export const TEMPLATE_IDS = ["classic", "modern", "compact", "technical"] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];
