import type { Resume } from "@/lib/resume-schema";

export function formatDateRange(start?: string, end?: string, current?: boolean) {
  const s = (start || "").trim();
  const e = current ? "Present" : (end || "").trim();
  if (s && e) return `${s} – ${e}`;
  return s || e || "";
}

export function nonEmpty<T>(arr: T[] | undefined): T[] {
  return Array.isArray(arr) ? arr : [];
}

export function joinContact(r: Resume): string[] {
  const c = r.contact || {};
  return [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean) as string[];
}
