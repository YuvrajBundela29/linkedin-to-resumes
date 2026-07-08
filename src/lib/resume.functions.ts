import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, generateObject, tool, stepCountIs, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { createLovableAiGateway, DEFAULT_MODEL } from "./ai-gateway.server";
import { ResumeSchema, EMPTY_RESUME, TEMPLATE_IDS, type Resume, type TemplateId } from "./resume-schema";

async function logUsage(
  supabase: any,
  userId: string,
  kind: string,
  resumeId: string | null,
  meta?: Record<string, unknown>,
) {
  try {
    await supabase.from("usage_events").insert({
      user_id: userId,
      kind,
      resume_id: resumeId,
      meta: meta ?? null,
    });
  } catch (e) {
    console.error("usage log failed", e);
  }
}

const EXTRACT_PROMPT = `You are extracting a structured resume from a LinkedIn "Save to PDF" export.

Rules:
- Return VALID JSON matching the provided schema.
- Preserve reverse-chronological order within Experience and Education.
- Keep bullet points concise (one line each). Rewrite awkward LinkedIn phrasing lightly, but do not invent facts.
- Skills: return a flat de-duplicated list of individual skills (no categories).
- Dates: use short forms like "Jan 2022" or "2022".
- Leave fields as empty strings/arrays if the PDF doesn't contain them.
- The summary field: 2-4 sentences from the LinkedIn About section.`;

const ExtractInput = z.object({
  resumeId: z.string().uuid(),
  fileDataUrl: z.string(), // "data:application/pdf;base64,..."
  filename: z.string().optional(),
});

/**
 * Upload a LinkedIn PDF, run extraction, save into resumes.current_json.
 * Client creates the resume row (empty) then calls this with the base64 PDF.
 */
export const extractResumeFromPdf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ExtractInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verify resume ownership
    const { data: row, error: rowErr } = await supabase
      .from("resumes").select("id, user_id").eq("id", data.resumeId).single();
    if (rowErr || !row || row.user_id !== userId) throw new Error("Resume not found");

    const gateway = createLovableAiGateway();

    let resume: Resume;
    try {
      const { object } = await generateObject({
        model: gateway(DEFAULT_MODEL),
        schema: ResumeSchema,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: EXTRACT_PROMPT },
              {
                type: "file",
                data: data.fileDataUrl,
                mediaType: "application/pdf",
              } as any,
            ],
          },
        ],
      });
      resume = ResumeSchema.parse(object);
    } catch (err: unknown) {
      // Fallback: try parsing the raw text response
      if (NoObjectGeneratedError.isInstance(err)) {
        try {
          const cleaned = (err.text || "").replace(/```json|```/g, "").trim();
          resume = ResumeSchema.parse(JSON.parse(cleaned));
        } catch {
          throw new Error("The AI couldn't structure this resume. Please try a different PDF.");
        }
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("429")) throw new Error("Rate limit — please try again in a moment.");
        if (msg.includes("402")) throw new Error("Out of AI credits — please add more to continue.");
        throw new Error(`Extraction failed: ${msg}`);
      }
    }

    // Save
    const title = resume.name ? `${resume.name} — Resume` : "Untitled resume";
    const { error: updErr } = await supabase.from("resumes")
      .update({ current_json: resume, title })
      .eq("id", data.resumeId);
    if (updErr) throw new Error(updErr.message);

    await logUsage(supabase, userId, "extract", data.resumeId, { filename: data.filename });

    return { resume, title };
  });

// ------------- Chat edit (tool-calling) -------------

const EDIT_SYSTEM = `You are an assistant that edits a user's resume via structured tool calls.

You receive:
- CURRENT_RESUME: the full JSON.
- USER_REQUEST: a natural-language edit request.

Rules:
- Use ONLY the provided tools; do not fabricate content the user didn't ask for.
- Reasonable inference is fine (e.g., "move bachelors above masters" → reorder education).
- Section keys: "experience", "education", "skills", "certifications", "projects".
- After edits, briefly confirm what you changed (1–2 sentences, no lists).
- If the request is unclear, ask a short clarifying question instead of calling tools.
- Bullets should be concise, one line each, action-verb first.`;

const ChatEditInput = z.object({
  resumeId: z.string().uuid(),
  message: z.string(),
});

type Section = "experience" | "education" | "skills" | "certifications" | "projects";

function ensureSectionArray(resume: Resume, section: Section): unknown[] {
  const val = (resume as any)[section];
  if (!Array.isArray(val)) (resume as any)[section] = [];
  return (resume as any)[section];
}

export const applyChatEdit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ChatEditInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: row, error } = await supabase
      .from("resumes").select("id, user_id, current_json, template").eq("id", data.resumeId).single();
    if (error || !row || row.user_id !== userId) throw new Error("Resume not found");

    const prevJson = ResumeSchema.parse(row.current_json ?? EMPTY_RESUME);
    // Snapshot previous state (trigger keeps last 5)
    await supabase.from("resume_versions").insert({
      resume_id: data.resumeId,
      user_id: userId,
      snapshot_json: prevJson,
      label: "Before edit",
    });

    // Working copy the tools mutate
    const draft: Resume = JSON.parse(JSON.stringify(prevJson));
    const changeLog: string[] = [];

    const gateway = createLovableAiGateway();

    const tools = {
      setField: tool({
        description: "Set a top-level string field on the resume (name, headline, summary) or a contact.* field.",
        inputSchema: z.object({
          path: z.string().describe("One of: name, headline, summary, contact.email, contact.phone, contact.linkedin, contact.website, contact.location"),
          value: z.string(),
        }),
        execute: async ({ path, value }) => {
          const parts = path.split(".");
          if (parts.length === 1) (draft as any)[parts[0]] = value;
          else if (parts[0] === "contact") (draft.contact as any)[parts[1]] = value;
          else throw new Error(`Unknown path: ${path}`);
          changeLog.push(`set ${path}`);
          return { ok: true };
        },
      }),
      reorderList: tool({
        description: "Move an item within a section from one index to another.",
        inputSchema: z.object({
          section: z.enum(["experience","education","skills","certifications","projects"]),
          fromIndex: z.number().int().nonnegative(),
          toIndex: z.number().int().nonnegative(),
        }),
        execute: async ({ section, fromIndex, toIndex }) => {
          const arr = ensureSectionArray(draft, section);
          if (fromIndex >= arr.length) return { ok: false, error: "fromIndex out of range" };
          const [item] = arr.splice(fromIndex, 1);
          arr.splice(Math.min(toIndex, arr.length), 0, item);
          changeLog.push(`reordered ${section}`);
          return { ok: true };
        },
      }),
      removeItem: tool({
        description: "Remove an item at an index in a section. For skills/certifications, index is the position in the list.",
        inputSchema: z.object({
          section: z.enum(["experience","education","skills","certifications","projects"]),
          index: z.number().int().nonnegative(),
        }),
        execute: async ({ section, index }) => {
          const arr = ensureSectionArray(draft, section);
          if (index >= arr.length) return { ok: false, error: "index out of range" };
          arr.splice(index, 1);
          changeLog.push(`removed from ${section}`);
          return { ok: true };
        },
      }),
      removeSection: tool({
        description: "Clear an entire section.",
        inputSchema: z.object({ section: z.enum(["experience","education","skills","certifications","projects","summary"]) }),
        execute: async ({ section }) => {
          if (section === "summary") draft.summary = "";
          else (draft as any)[section] = [];
          changeLog.push(`cleared ${section}`);
          return { ok: true };
        },
      }),
      addItem: tool({
        description: "Add a new item to a section. For skills/certifications, pass { text }. For experience/education/projects, pass the appropriate fields as JSON.",
        inputSchema: z.object({
          section: z.enum(["experience","education","skills","certifications","projects"]),
          itemJson: z.string().describe("A JSON string for the new item"),
        }),
        execute: async ({ section, itemJson }) => {
          let parsed: any;
          try { parsed = JSON.parse(itemJson); } catch { return { ok: false, error: "invalid itemJson" }; }
          const arr = ensureSectionArray(draft, section);
          if (section === "skills" || section === "certifications") {
            const s = typeof parsed === "string" ? parsed : parsed.text ?? parsed.name;
            if (s) arr.push(s);
          } else {
            arr.push(parsed);
          }
          changeLog.push(`added to ${section}`);
          return { ok: true };
        },
      }),
      addBullet: tool({
        description: "Add a new bullet to an experience/education/project entry, optionally at a specific index (defaults to end).",
        inputSchema: z.object({
          section: z.enum(["experience","education","projects"]),
          itemIndex: z.number().int().nonnegative(),
          text: z.string(),
          atIndex: z.number().int().nonnegative().optional(),
        }),
        execute: async ({ section, itemIndex, text, atIndex }) => {
          const arr = ensureSectionArray(draft, section) as any[];
          const item = arr[itemIndex];
          if (!item) return { ok: false, error: "item not found" };
          if (!Array.isArray(item.bullets)) item.bullets = [];
          if (typeof atIndex === "number") item.bullets.splice(Math.min(atIndex, item.bullets.length), 0, text);
          else item.bullets.push(text);
          changeLog.push(`added bullet to ${section}[${itemIndex}]`);
          return { ok: true };
        },
      }),
      removeBullet: tool({
        description: "Remove a bullet from an experience/education/project entry.",
        inputSchema: z.object({
          section: z.enum(["experience","education","projects"]),
          itemIndex: z.number().int().nonnegative(),
          bulletIndex: z.number().int().nonnegative(),
        }),
        execute: async ({ section, itemIndex, bulletIndex }) => {
          const arr = ensureSectionArray(draft, section) as any[];
          const item = arr[itemIndex];
          if (!item || !Array.isArray(item.bullets) || bulletIndex >= item.bullets.length) return { ok: false, error: "bullet not found" };
          item.bullets.splice(bulletIndex, 1);
          changeLog.push(`removed bullet ${section}[${itemIndex}][${bulletIndex}]`);
          return { ok: true };
        },
      }),
      reorderBullets: tool({
        description: "Move a bullet within an entry from one index to another.",
        inputSchema: z.object({
          section: z.enum(["experience","education","projects"]),
          itemIndex: z.number().int().nonnegative(),
          fromIndex: z.number().int().nonnegative(),
          toIndex: z.number().int().nonnegative(),
        }),
        execute: async ({ section, itemIndex, fromIndex, toIndex }) => {
          const arr = ensureSectionArray(draft, section) as any[];
          const item = arr[itemIndex];
          if (!item || !Array.isArray(item.bullets) || fromIndex >= item.bullets.length) return { ok: false, error: "out of range" };
          const [b] = item.bullets.splice(fromIndex, 1);
          item.bullets.splice(Math.min(toIndex, item.bullets.length), 0, b);
          changeLog.push(`reordered bullet in ${section}[${itemIndex}]`);
          return { ok: true };
        },
      }),
      updateItemField: tool({
        description: "Update a scalar field on an item inside a section. For experience: title/org/location/start/end/current. For education: school/degree/field/start/end. For projects: name/description.",
        inputSchema: z.object({
          section: z.enum(["experience","education","projects"]),
          itemIndex: z.number().int().nonnegative(),
          field: z.string(),
          value: z.string(),
        }),
        execute: async ({ section, itemIndex, field, value }) => {
          const arr = ensureSectionArray(draft, section) as any[];
          const item = arr[itemIndex];
          if (!item) return { ok: false, error: "item not found" };
          if (field === "current") item[field] = value === "true";
          else item[field] = value;
          changeLog.push(`updated ${section}[${itemIndex}].${field}`);
          return { ok: true };
        },
      }),
      setSkills: tool({
        description: "Replace the entire skills list with a new de-duplicated array. Use for bulk skill rewrites.",
        inputSchema: z.object({ skills: z.array(z.string()) }),
        execute: async ({ skills }) => {
          const dedup = Array.from(new Set(skills.map((x) => x.trim()).filter(Boolean)));
          draft.skills = dedup;
          changeLog.push(`updated skills (${dedup.length})`);
          return { ok: true };
        },
      }),
      rewriteBullet: tool({
        description: "Replace a bullet in an experience/education/project entry.",
        inputSchema: z.object({
          section: z.enum(["experience","education","projects"]),
          itemIndex: z.number().int().nonnegative(),
          bulletIndex: z.number().int().nonnegative(),
          newText: z.string(),
        }),
        execute: async ({ section, itemIndex, bulletIndex, newText }) => {
          const arr = ensureSectionArray(draft, section) as any[];
          const item = arr[itemIndex];
          if (!item || !Array.isArray(item.bullets)) return { ok: false, error: "item not found" };
          if (bulletIndex >= item.bullets.length) item.bullets.push(newText);
          else item.bullets[bulletIndex] = newText;
          changeLog.push(`rewrote bullet in ${section}[${itemIndex}]`);
          return { ok: true };
        },
      }),
      rewriteSummary: tool({
        description: "Rewrite the professional summary. Provide the new full text (2-4 sentences).",
        inputSchema: z.object({ text: z.string() }),
        execute: async ({ text }) => { draft.summary = text; changeLog.push("rewrote summary"); return { ok: true }; },
      }),
      strengthenBullets: tool({
        description: "Rewrite all bullets in one experience entry to be action-verb-first, quantified, and concise. Provide the new bullets.",
        inputSchema: z.object({
          itemIndex: z.number().int().nonnegative(),
          bullets: z.array(z.string()),
        }),
        execute: async ({ itemIndex, bullets }) => {
          const arr = draft.experience;
          const item = arr[itemIndex];
          if (!item) return { ok: false, error: "item not found" };
          item.bullets = bullets;
          changeLog.push(`strengthened experience[${itemIndex}] bullets`);
          return { ok: true };
        },
      }),
      replaceResume: tool({
        description: "Replace the entire resume JSON. Only use for large rewrites the user explicitly asked for.",
        inputSchema: z.object({ resumeJson: z.string() }),
        execute: async ({ resumeJson }) => {
          try {
            const next = ResumeSchema.parse(JSON.parse(resumeJson));
            Object.assign(draft, next);
            changeLog.push("replaced full resume");
            return { ok: true };
          } catch {
            return { ok: false, error: "invalid resume JSON" };
          }
        },
      }),

    } as const;

    let reply = "";
    try {
      const result = await generateText({
        model: gateway(DEFAULT_MODEL),
        system: EDIT_SYSTEM,
        prompt: `CURRENT_RESUME:\n${JSON.stringify(prevJson)}\n\nUSER_REQUEST:\n${data.message}`,
        tools,
        stopWhen: stepCountIs(50),
      });
      reply = result.text || (changeLog.length ? `Done — ${changeLog.join(", ")}.` : "Okay.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("429")) throw new Error("Rate limit — please try again in a moment.");
      if (msg.includes("402")) throw new Error("Out of AI credits — please add more to continue.");
      throw new Error(`Edit failed: ${msg}`);
    }

    // Validate and save
    const nextJson = ResumeSchema.parse(draft);
    const { error: updErr } = await supabase.from("resumes")
      .update({ current_json: nextJson })
      .eq("id", data.resumeId);
    if (updErr) throw new Error(updErr.message);

    await logUsage(supabase, userId, "chat_edit", data.resumeId, { changes: changeLog });

    return { resume: nextJson, reply, changes: changeLog };
  });

// ------------- Template switch -------------
export const switchTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ resumeId: z.string().uuid(), template: z.enum(TEMPLATE_IDS) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("resumes").update({ template: data.template }).eq("id", data.resumeId).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });


// ------------- Versions -------------
export const listVersions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ resumeId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase.from("resume_versions")
      .select("id, created_at, label")
      .eq("resume_id", data.resumeId).eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const rollbackVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ resumeId: z.string().uuid(), versionId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: ent } = await supabase.from("entitlements").select("version_history_enabled").eq("user_id", userId).single();
    if (!ent?.version_history_enabled) throw new Error("Version history requires Pro.");
    const { data: v, error } = await supabase.from("resume_versions").select("snapshot_json, resume_id, user_id").eq("id", data.versionId).single();
    if (error || !v || v.user_id !== userId || v.resume_id !== data.resumeId) throw new Error("Version not found");
    const { error: updErr } = await supabase.from("resumes").update({ current_json: v.snapshot_json }).eq("id", data.resumeId).eq("user_id", userId);
    if (updErr) throw new Error(updErr.message);
    return { ok: true };
  });

// ------------- Job-description tailor -------------
const TailorInput = z.object({
  resumeId: z.string().uuid(),
  jobDescription: z.string().min(20),
});

export const tailorToJobDescription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => TailorInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: ent } = await supabase.from("entitlements").select("tailor_enabled").eq("user_id", userId).single();
    if (!ent?.tailor_enabled) throw new Error("Tailoring is a Pro feature. Upgrade to unlock it.");

    const { data: row, error } = await supabase.from("resumes").select("current_json, user_id").eq("id", data.resumeId).single();
    if (error || !row || row.user_id !== userId) throw new Error("Resume not found");

    const prev = ResumeSchema.parse(row.current_json);
    await supabase.from("resume_versions").insert({
      resume_id: data.resumeId, user_id: userId, snapshot_json: prev, label: "Before tailor",
    });

    const gateway = createLovableAiGateway();
    const { object } = await generateObject({
      model: gateway(DEFAULT_MODEL),
      schema: ResumeSchema,
      prompt: `Rewrite this resume to align with the target job description without inventing new roles, employers, or dates. Reweight bullets to emphasize relevant impact and keywords. Reorder skills so the most relevant to the JD come first.

RESUME_JSON:
${JSON.stringify(prev)}

JOB_DESCRIPTION:
${data.jobDescription}

Return the updated resume as JSON.`,
    });
    const next = ResumeSchema.parse(object);
    await supabase.from("resumes").update({ current_json: next }).eq("id", data.resumeId);
    await logUsage(supabase, userId, "tailor", data.resumeId);
    return { resume: next };
  });

// ------------- Create empty resume (before upload) -------------
export const createEmptyResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: ent } = await supabase.from("entitlements").select("max_resumes").eq("user_id", userId).single();
    const { count } = await supabase.from("resumes").select("id", { count: "exact", head: true }).eq("user_id", userId);
    const cap = ent?.max_resumes ?? 1;
    if ((count ?? 0) >= cap) throw new Error(`Free plan limit reached — you can create ${cap} resume(s). Upgrade for more.`);
    const { data: row, error } = await supabase.from("resumes")
      .insert({ user_id: userId, current_json: EMPTY_RESUME as any, title: "Untitled resume" })
      .select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

export const getResume = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ resumeId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase.from("resumes").select("*").eq("id", data.resumeId).eq("user_id", userId).single();
    if (error) throw new Error(error.message);
    return {
      id: row.id as string,
      title: row.title as string,
      template: row.template as TemplateId,
      resume: ResumeSchema.parse(row.current_json ?? EMPTY_RESUME),
      updated_at: row.updated_at as string,
    };
  });

export const listResumes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase.from("resumes")
      .select("id, title, template, updated_at").eq("user_id", userId).order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const deleteResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ resumeId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("resumes").delete().eq("id", data.resumeId).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getAccountSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: ent }, { data: prof }, { count: resumeCount }, { data: usage }] = await Promise.all([
      supabase.from("entitlements").select("*").eq("user_id", userId).single(),
      supabase.from("profiles").select("full_name, plan").eq("id", userId).single(),
      supabase.from("resumes").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("usage_events").select("kind, created_at").eq("user_id", userId).gte("created_at", new Date(Date.now() - 30*24*3600*1000).toISOString()),
    ]);
    return {
      profile: prof ?? { full_name: null, plan: "free" },
      entitlements: ent,
      resumeCount: resumeCount ?? 0,
      usage30d: usage ?? [],
    };
  });
