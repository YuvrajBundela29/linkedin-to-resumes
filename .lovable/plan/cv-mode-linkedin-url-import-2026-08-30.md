# CV mode + LinkedIn URL import

Two additions, no changes to the existing resume flow. PDF upload stays exactly as it is.

## 1. Document types: Resume, Professional CV, Academic CV

A document gets its type at creation and keeps it (no in-editor conversion).

- **Resume** — today's behaviour, unchanged (1 page, condensed bullets).
- **Professional CV** — full unabridged history, all roles and bullets, plus awards, languages, references.
- **Academic CV** — publications, research, teaching, talks, grants, awards, languages, references; multi-page, no length trimming.

What changes:
- `resumes` table gets a `doc_type` column (`'resume' | 'cv_professional' | 'cv_academic'`, defaults to `'resume'`), so every existing document keeps working untouched.
- The resume JSON schema gains **optional** sections used only by CV types: `publications`, `research`, `teaching`, `talks`, `grants`, `awards`, `languages`, `references`. Optional + defaulted, so existing stored JSON stays valid.
- Extraction and chat prompts branch on `doc_type`: resume = condense to one page; CV = keep everything, expand, and populate the academic sections when the source has them.
- The chat assistant gets tools for the new sections (add/remove/edit publication, award, language, etc.) so "add my 2024 paper" works.
- Two CV layouts are added (`cv_standard`, `cv_academic`) built on the existing shared layout engine — multi-page, section-aware, with HTML preview + text-selectable PDF, same as every current template. Resume templates stay available for CVs where the sections fit.
- Download works identically (client-side PDF), and plain-text export includes the new sections.

Dashboard: "New document" offers the three types; each card shows a type badge. Editor top bar shows the type and only offers templates that suit it.

## 2. Import from a LinkedIn URL

LinkedIn blocks plain server-side fetching, so a single method isn't reliable. The import screen offers three inputs and tries them in the best order — the PDF upload option is untouched and remains the recommended path:

1. **Paste LinkedIn URL** → server tries a real fetch through the Firecrawl connector (a JS-rendering scraper that gets public profiles more often than a raw fetch). On success, the page text goes into the same AI extraction step as the PDF.
2. **If the fetch is blocked** (login wall / private profile), the AI falls back to a web search on the profile URL and name to draft what it can, and the UI clearly says the result is partial and asks the user to confirm or paste more.
3. **Paste profile text** → a textarea for the user to copy their profile (works 100% of the time), parsed by the same extraction step.

The URL is always saved into `contact.linkedin` regardless of which path produced the content.

This needs the **Firecrawl connector** connected (I'll open the connect card during the build). If you skip it, the URL box still works via the search fallback and the paste-text path.

Credits: URL/text import costs the same 5 credits as a PDF import; a blocked fetch that produces nothing is not charged.

## Technical notes

- Migration: add `resumes.doc_type` with a default and a check constraint; no data backfill needed. Keep existing RLS/GRANTs.
- `src/lib/resume-schema.ts`: add `DocType`, optional CV sections, `EMPTY_RESUME` defaults, and a `TEMPLATES_FOR_DOC_TYPE` map.
- `src/lib/resume.functions.ts`: `createEmptyResume` takes `docType`; new `importFromLinkedInUrl` and `importFromPastedText` server functions sharing the extraction helper with `extractResumeFromPdf`; extraction/chat/tailor prompts parameterised by doc type; new chat tools for CV sections.
- `src/lib/linkedin-scrape.server.ts`: Firecrawl scrape (gateway or direct mode per the linked connection), with clear typed outcomes for blocked/empty results.
- `src/templates/cv-standard/` and `src/templates/cv-academic/` (Html + Pdf) reusing `src/templates/generic` primitives; registered in `src/templates/index.tsx`.
- UI: import panel on the dashboard with three tabs (Upload PDF / LinkedIn URL / Paste text), type picker, type badges, skeletons, and toasts for partial results.
- Head metadata added for any new route; existing routes untouched.

## Verify before done

Create one of each type, import via PDF, via URL, and via pasted text; run a chat edit that adds a publication and an award; switch templates; download the PDF for a resume and both CV types and confirm no overlap and selectable text.
