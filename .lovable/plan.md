
# ResumeForge AI — Build Plan

## Stack decisions (from your answers)
- **PDF extraction:** Send the uploaded LinkedIn PDF directly to Gemini (multimodal file part) — no server-side pdf-parse. Works cleanly on the Worker runtime.
- **PDF export:** `@react-pdf/renderer` running inside a server function. Same JSON schema drives both the on-screen HTML preview and the PDF output. All templates authored twice (HTML component + react-pdf component) so previews stay pixel-close to the export and ATS text-selectability is guaranteed.
- **AI:** Lovable AI Gateway. `google/gemini-3-flash-preview` for extraction + chat edits (multimodal, fast, structured output via AI SDK `Output.object`, tool-calling for edits).
- **Backend:** TanStack Start server functions (app-internal) + one server route for the PDF stream download. No Supabase edge functions.
- **DB/Auth:** Lovable Cloud (Supabase). Email/password + managed Google sign-in via the Lovable broker.

## User-facing surface

Routes:
- `/` — landing (hero, value prop, before/after preview, upload CTA, feature grid, pricing teaser)
- `/auth` — sign in / sign up (email + Google)
- `/_authenticated/dashboard` — list of user's resumes, "New resume" (upload)
- `/_authenticated/r/$resumeId` — main editor: left = live HTML preview, right = chat panel, top bar = template switcher + "Download PDF" + version history drawer
- `/_authenticated/r/$resumeId/tailor` — paste job description, AI reweights bullets/keywords (paid feature; gated behind entitlement flag but built now)
- `/_authenticated/account` — plan, usage this month, sign out

## Data model (Supabase)

Tables (all with RLS scoped to `auth.uid()`, plus GRANTs):
- `profiles` — id (FK auth.users), full_name, plan ('free'|'pro'), created_at
- `resumes` — id, user_id, title, current_json (jsonb — the structured schema), template ('classic'|'modern'|'compact'|'technical'), updated_at, created_at
- `resume_versions` — id, resume_id, user_id, snapshot_json (jsonb), created_at. Trigger keeps only the latest 5 per resume_id (delete-oldest on insert).
- `usage_events` — id, user_id, kind ('extract'|'chat_edit'|'pdf_export'|'tailor'), resume_id (nullable), tokens_in, tokens_out, created_at. Written from every AI/PDF server fn. Powers future billing.
- `entitlements` — user_id (PK), max_resumes, allowed_templates (text[]), version_history_enabled, tailor_enabled. Seeded to free-tier defaults via trigger on profile insert; admin can flip to pro values.

`has_role` pattern is not needed — plan gating uses `entitlements`.

## Structured resume JSON (single source of truth)

```
{ name, contact:{email,phone,linkedin,website,location},
  summary,
  experience:[{title,org,location,start,end,current,bullets[]}],
  education:[{school,degree,field,start,end,bullets[]}],
  skills:[string], certifications:[string], projects?:[{name,description,bullets[]}] }
```

Zod schema shared client/server. **Kept small and unbounded** per the AI SDK rule (no `.min/.max`, no long enums) — length limits enforced in prompt text and clamped in code post-parse.

## Server functions (`src/lib/*.functions.ts`)

All under `_authenticated` call sites; all use `requireSupabaseAuth`; each logs a `usage_events` row.

1. `extractResumeFromPdf({ resumeId, fileDataUrl })` — sends the PDF as an `image_url`/`file` block to Gemini with `Output.object(ResumeSchema)`. Returns parsed JSON. Uses `NoObjectGeneratedError.isInstance` fallback to `error.text` JSON.parse per the gateway rules. Enforces free-tier `max_resumes` cap.
2. `applyChatEdit({ resumeId, message, currentJson })` — Gemini with tool calling. Tools: `setField(path,value)`, `reorderList(section,fromIndex,toIndex)`, `removeItem(section,index)`, `addItem(section,item)`, `rewriteBullet(section,index,newText)`, `regenerateSummary(instructions)`. `stopWhen: stepCountIs(50)`. Returns updated JSON + assistant reply. Snapshots previous JSON into `resume_versions` before saving.
3. `tailorToJobDescription({ resumeId, jd })` — checks `entitlements.tailor_enabled`, otherwise returns 402-style app error. Rewrites bullets and reorders skills to match JD keywords.
4. `switchTemplate({ resumeId, template })` — validates template is in `entitlements.allowed_templates`.
5. `listVersions({ resumeId })` / `rollbackVersion({ resumeId, versionId })` — gated on `version_history_enabled`.

## Server route (`src/routes/api/resume.$resumeId.pdf.ts`)
`GET` — auth via bearer token → loads resume + template → renders with `@react-pdf/renderer`'s `renderToStream` → returns `application/pdf` with `Content-Disposition: attachment`. Logs `pdf_export` usage.

## Templates (both an HTML + a react-pdf component per template)
Classic, Modern, Compact, Technical — all: single column, standard headers (Experience/Education/Skills), Helvetica/Times (react-pdf built-ins map to Arial/Georgia visually), no icons-only sections, reverse-chronological, text-selectable. Difference is spacing, weight, and header treatment only.

Templates live in `src/templates/<name>/{Html.tsx,Pdf.tsx,meta.ts}` and both read the same typed JSON.

## Editor UX

- Left pane: rendered HTML template inside an A4-proportioned scaled container. Updates instantly on JSON change (React state).
- Right pane: **AI Elements**-composed chat (`Conversation`, `Message`, `MessageResponse`, `PromptInput`, `Shimmer`, `Tool` for showing which edit tools ran, collapsed by default). Assistant messages have no background; user bubble uses `primary`/`primary-foreground`. Custom domain-specific logo in the empty state (generated), not `Sparkles`.
- Top bar: template dropdown, "Download PDF" (calls the server route in a new tab or via fetch → blob), "History" (drawer listing up to 5 versions with "Restore").
- Chat submits via `useChat` with a custom transport hitting a `/api/chat` server route that wraps `applyChatEdit` and streams the assistant reply. After each turn the client refetches `resumes.current_json` (or receives the new JSON via a tool part) and updates the preview.

## Landing page
- Hero with the exact value prop line, upload CTA that requires sign-in first (bounces to `/auth?next=/`).
- Before/after: real side-by-side of a scraped LinkedIn text block vs a rendered Classic template.
- "How it works" 3-step, feature grid, ATS-safety checklist, pricing table (Free vs Pro — Pro marked "Coming soon" but the entitlement rows are live).
- Design language: Linear/Notion-inspired — restrained neutrals, one accent, generous whitespace, tight typography (Inter for UI, Söhne-style feel via system stack fallback), subtle motion. Distinct from generic AI-tool purple gradients.
- Real head() metadata on `/` and every route (title, description, og:*, twitter:*).

## Monetization scaffolding (built, not billed)
- Every AI call and PDF render inserts into `usage_events`.
- `entitlements` gates: resume count, template list, version history, tailor. Free defaults: 1 resume, `['classic','modern']`, no version history, no tailor. Enforced server-side in every relevant server fn.
- Account page shows this month's usage counts (queried from `usage_events`).
- No Stripe wiring in v1 — just an "Upgrade" button that opens a "Coming soon" modal. Data model is ready to plug billing in later.

## Auth
- Email/password + Google via `lovable.auth.signInWithOAuth("google", ...)`.
- Call `supabase--configure_social_auth` for Google in the same build.
- Standard `_authenticated` layout is integration-managed; not re-authored.
- Root `onAuthStateChange` filters to identity transitions per guidance.

## Build order
1. Enable Lovable Cloud; create migrations for all 5 tables + GRANTs + RLS + version-trim trigger + entitlement-seed trigger.
2. Configure Google social auth; landing + auth pages.
3. Install deps: `@react-pdf/renderer`, `ai`, `@ai-sdk/react`, `@ai-sdk/openai-compatible`, `zod`, AI Elements (`conversation message prompt-input shimmer tool`).
4. Shared resume Zod schema; AI Gateway provider helper in `src/lib/ai-gateway.server.ts`.
5. `extractResumeFromPdf` server fn + upload flow → creates a resume row and redirects to `/_authenticated/r/$id`.
6. Editor page: HTML preview + Classic template first.
7. Chat server route + `applyChatEdit` with tool set; AI Elements chat UI; version snapshotting.
8. Add Modern, Compact, Technical templates (HTML + PDF variants); template switcher gated by entitlements.
9. PDF download server route via `@react-pdf/renderer` streaming.
10. Version history drawer + rollback.
11. `tailorToJobDescription` + `/tailor` page (entitlement-gated).
12. Dashboard, account/usage page, "Upgrade" placeholder modal.
13. Landing page polish: before/after, feature grid, pricing, SEO metadata per route.
14. Generate a domain logo image; wire into nav, favicon, empty states, og:image on landing.
15. Verify: upload a sample LinkedIn PDF end-to-end, run through 2–3 chat edits, switch templates, download PDF, roll back a version, sign out/in.

## Notes / risks
- `@react-pdf/renderer` must bundle for the Worker — it's pure JS/WASM-free and known to work; if a runtime issue appears we'll bundle its fonts inline rather than fetch at runtime.
- Free-tier resume cap (`1`) enforced on `extractResumeFromPdf`; a friendly upsell error is shown on hit.
- Chat tool loop uses `stepCountIs(50)`; each tool `execute` mutates a working copy of the JSON, and only the final validated JSON is persisted (plus a version snapshot of the previous state).
