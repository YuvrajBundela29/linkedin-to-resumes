import { createFileRoute } from "@tanstack/react-router";
import { renderToStream } from "@react-pdf/renderer";
import { createClient } from "@supabase/supabase-js";
import { ResumeSchema, TEMPLATE_IDS, type TemplateId } from "@/lib/resume-schema";
import { PdfDocumentFor } from "@/templates";
import type { Database } from "@/integrations/supabase/types";

// Streams the resume PDF for the authenticated user. Uses bearer token in
// the Authorization header (attached by the client via fetch with a
// pre-fetched session token, since <a href> can't send headers we'll POST
// via fetch and let the browser save the blob).
export const Route = createFileRoute("/api/resume/$resumeId/pdf")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const authHeader = request.headers.get("authorization") ?? "";
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
        if (!token) return new Response("Unauthorized", { status: 401 });

        const supabase = createClient<Database>(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
          },
        );

        const { data: userRes, error: userErr } = await supabase.auth.getUser(token);
        if (userErr || !userRes.user) return new Response("Unauthorized", { status: 401 });
        const userId = userRes.user.id;

        const { data: row, error } = await supabase.from("resumes")
          .select("current_json, template, title, user_id")
          .eq("id", params.resumeId).single();
        if (error || !row || row.user_id !== userId) return new Response("Not found", { status: 404 });

        const templateId: TemplateId = TEMPLATE_IDS.includes(row.template as TemplateId)
          ? (row.template as TemplateId) : "classic";
        const resume = ResumeSchema.parse(row.current_json ?? {});

        try {
          const stream = await renderToStream(PdfDocumentFor({ template: templateId, resume }));
          const chunks: Uint8Array[] = [];
          for await (const chunk of stream as any) {
            chunks.push(chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk));
          }
          const buffer = Buffer.concat(chunks);

          // Log usage (fire and forget)
          supabase.from("usage_events").insert({
            user_id: userId, kind: "pdf_export", resume_id: params.resumeId,
          }).then(() => {}, () => {});

          const filename = (row.title || "resume").replace(/[^\w\-]+/g, "_") + ".pdf";
          return new Response(buffer, {
            status: 200,
            headers: {
              "content-type": "application/pdf",
              "content-disposition": `attachment; filename="${filename}"`,
              "cache-control": "no-store",
            },
          });
        } catch (e) {
          console.error("pdf render failed", e);
          return new Response("PDF generation failed", { status: 500 });
        }
      },
    },
  },
});
