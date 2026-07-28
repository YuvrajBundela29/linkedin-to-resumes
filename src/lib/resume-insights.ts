import type { Resume } from "@/lib/resume-schema";

const ACTION_VERBS = [
  "led","built","launched","designed","shipped","reduced","increased","improved","owned","drove",
  "created","automated","scaled","delivered","managed","optimized","developed","implemented","migrated","negotiated",
];

export type AtsCheck = { label: string; ok: boolean; hint: string; weight: number };
export type AtsReport = { score: number; checks: AtsCheck[]; words: number };

export function toPlainText(r: Resume): string {
  const L: string[] = [];
  L.push(r.name || "Your Name");
  if (r.headline) L.push(r.headline);
  const c = [r.contact?.email, r.contact?.phone, r.contact?.location, r.contact?.linkedin, r.contact?.website].filter(Boolean);
  if (c.length) L.push(c.join(" | "));
  if (r.summary) L.push("", "SUMMARY", r.summary);
  if (r.experience?.length) {
    L.push("", "EXPERIENCE");
    for (const e of r.experience) {
      L.push(`${e.title}${e.org ? ` — ${e.org}` : ""}${e.start || e.end || e.current ? ` (${[e.start, e.current ? "Present" : e.end].filter(Boolean).join(" – ")})` : ""}`);
      for (const b of e.bullets ?? []) L.push(`- ${b}`);
    }
  }
  if (r.projects?.length) {
    L.push("", "PROJECTS");
    for (const p of r.projects) {
      L.push(`${p.name}${p.description ? ` — ${p.description}` : ""}`);
      for (const b of p.bullets ?? []) L.push(`- ${b}`);
    }
  }
  if (r.education?.length) {
    L.push("", "EDUCATION");
    for (const e of r.education) {
      L.push(`${e.school}${e.degree || e.field ? ` — ${[e.degree, e.field].filter(Boolean).join(" in ")}` : ""}${e.start || e.end ? ` (${[e.start, e.end].filter(Boolean).join(" – ")})` : ""}`);
    }
  }
  if (r.skills?.length) L.push("", "SKILLS", r.skills.join(", "));
  if (r.certifications?.length) L.push("", "CERTIFICATIONS", r.certifications.join(", "));
  return L.join("\n");
}

export function atsReport(r: Resume): AtsReport {
  const bullets = (r.experience ?? []).flatMap((e) => e.bullets ?? []);
  const text = toPlainText(r);
  const words = text.split(/\s+/).filter(Boolean).length;
  const quantified = bullets.filter((b) => /\d/.test(b)).length;
  const strongStarts = bullets.filter((b) => ACTION_VERBS.includes((b.trim().split(/\s+/)[0] || "").toLowerCase().replace(/[^a-z]/g, ""))).length;
  const longBullets = bullets.filter((b) => b.split(/\s+/).length > 32).length;

  const checks: AtsCheck[] = [
    { label: "Contact details present", ok: !!(r.contact?.email && (r.contact?.phone || r.contact?.linkedin)), hint: "Add an email plus a phone or LinkedIn URL.", weight: 15 },
    { label: "Professional summary", ok: (r.summary ?? "").split(/\s+/).filter(Boolean).length >= 25, hint: "Write a 2–4 sentence summary.", weight: 10 },
    { label: "At least 2 roles with bullets", ok: (r.experience ?? []).filter((e) => (e.bullets ?? []).length > 0).length >= 2, hint: "Add achievement bullets to each role.", weight: 15 },
    { label: "Bullets start with action verbs", ok: bullets.length > 0 && strongStarts / bullets.length >= 0.5, hint: "Start bullets with verbs like Led, Built, Reduced.", weight: 15 },
    { label: "Quantified achievements", ok: bullets.length > 0 && quantified / bullets.length >= 0.4, hint: "Add numbers: %, ₹/$, users, time saved.", weight: 15 },
    { label: "8+ relevant skills listed", ok: (r.skills ?? []).length >= 8, hint: "List the hard skills from the job posting.", weight: 10 },
    { label: "Education included", ok: (r.education ?? []).length > 0, hint: "Add your degree or highest qualification.", weight: 5 },
    { label: "Concise bullets (≤32 words)", ok: longBullets === 0, hint: "Split or shorten long bullets.", weight: 10 },
    { label: "Length within one–two pages", ok: words >= 220 && words <= 950, hint: "Aim for roughly 300–800 words.", weight: 5 },
  ];

  const score = Math.round(checks.reduce((a, c) => a + (c.ok ? c.weight : 0), 0));
  return { score, checks, words };
}
