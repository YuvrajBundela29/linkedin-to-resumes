import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";

const SITE_URL = "https://linkedin-to-resumes.lovable.app";
const PATH = "/blog/how-to-export-linkedin-to-resume";
const TITLE = "How to Export a LinkedIn Profile to a Resume (2026)";
const DESC = "Step-by-step guide to exporting your LinkedIn profile as a PDF and turning it into a clean, ATS-friendly resume in 60 seconds.";

export const Route = createFileRoute("/blog/how-to-export-linkedin-to-resume")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "article" },
      { property: "og:url", content: `${SITE_URL}${PATH}` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}${PATH}` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: TITLE,
          description: DESC,
          step: [
            { "@type": "HowToStep", name: "Open your LinkedIn profile", text: "Go to linkedin.com and open your own profile page while signed in." },
            { "@type": "HowToStep", name: "Click 'More' then 'Save to PDF'", text: "Under the profile header, open the More menu and choose Save to PDF. LinkedIn generates a PDF of your profile." },
            { "@type": "HowToStep", name: "Upload the PDF to ResumeForge AI", text: "Drag the downloaded PDF onto ResumeForge AI. The AI extracts your experience, skills, and education." },
            { "@type": "HowToStep", name: "Edit by chatting", text: "Ask the AI to shorten your summary, rewrite bullets, or add a project. The live preview updates instantly." },
            { "@type": "HowToStep", name: "Download an ATS-safe PDF", text: "Pick a template and export a text-selectable, ATS-friendly PDF ready to send." },
          ],
        }),
      },
    ],
  }),
  component: BlogPost,
});

function BlogPost() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/40 bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <span className="font-semibold">ResumeForge AI</span>
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm">Home</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <article className="prose prose-invert max-w-none">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Guide</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{TITLE}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{DESC}</p>

          <section className="mt-10">
            <h2 className="text-2xl font-semibold">Why export from LinkedIn</h2>
            <p className="mt-3 text-muted-foreground">
              Your LinkedIn profile already has your full work history. Retyping it into a resume is slow and error-prone. LinkedIn's built-in <strong>Save to PDF</strong> gives you a machine-readable copy — but that raw PDF is not an ATS-safe resume. It has odd spacing, LinkedIn branding, and formatting that many applicant tracking systems mis-parse. ResumeForge AI takes that same PDF and turns it into a clean, ATS-friendly resume.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl font-semibold">Step 1 — Save your LinkedIn profile as a PDF</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-6 text-muted-foreground">
              <li>Open <a className="text-primary underline" href="https://www.linkedin.com/" target="_blank" rel="noreferrer">linkedin.com</a> and sign in.</li>
              <li>Click your photo in the top nav, then <strong>View Profile</strong>.</li>
              <li>Under your name, click <strong>More</strong> → <strong>Save to PDF</strong>.</li>
              <li>LinkedIn downloads a file named something like <code>Profile.pdf</code>.</li>
            </ol>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl font-semibold">Step 2 — Upload it to ResumeForge AI</h2>
            <p className="mt-3 text-muted-foreground">
              On the home page, drag your <code>Profile.pdf</code> onto the upload area or use the file picker. The AI (Google Gemini) reads the PDF directly and extracts structured data: name, contact, summary, experience, education, and skills.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl font-semibold">Step 3 — Edit by chatting</h2>
            <p className="mt-3 text-muted-foreground">
              The editor has a live preview on the left and an AI chat on the right. Ask in plain English:
            </p>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              <li className="flex gap-2"><Check className="mt-1 h-4 w-4 text-primary" /> "Shorten my summary to two sentences."</li>
              <li className="flex gap-2"><Check className="mt-1 h-4 w-4 text-primary" /> "Rewrite the bullets under Northwind to highlight leadership."</li>
              <li className="flex gap-2"><Check className="mt-1 h-4 w-4 text-primary" /> "Add a project called Payments Migration."</li>
              <li className="flex gap-2"><Check className="mt-1 h-4 w-4 text-primary" /> "Switch to the Modern template."</li>
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl font-semibold">Step 4 — Download an ATS-safe PDF</h2>
            <p className="mt-3 text-muted-foreground">
              Every template is single-column, uses standard section headers (Experience, Education, Skills), and produces a real, <strong>text-selectable</strong> PDF. That is what ATS systems parse cleanly. Click <strong>Download PDF</strong> in the top bar.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl font-semibold">Why the LinkedIn PDF alone isn't ATS-friendly</h2>
            <p className="mt-3 text-muted-foreground">
              LinkedIn's export is designed for humans, not applicant tracking systems. Common issues:
            </p>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              <li className="flex gap-2"><Check className="mt-1 h-4 w-4 text-primary" /> Multi-column layout confuses text extractors.</li>
              <li className="flex gap-2"><Check className="mt-1 h-4 w-4 text-primary" /> Non-standard section labels like "Featured" or "Activity."</li>
              <li className="flex gap-2"><Check className="mt-1 h-4 w-4 text-primary" /> Company logos and icons rendered as images, not text.</li>
              <li className="flex gap-2"><Check className="mt-1 h-4 w-4 text-primary" /> Bulleted lists that lose their bullets on parse.</li>
            </ul>
            <p className="mt-3 text-muted-foreground">
              ResumeForge AI normalizes all of this: standard headers, a single column, real text, and no embedded images in the resume body.
            </p>
          </section>

          <section className="mt-12 rounded-2xl border border-border/60 bg-card/40 p-6 sm:p-8">
            <h2 className="text-2xl font-semibold">Ready to try it</h2>
            <p className="mt-2 text-muted-foreground">Upload your LinkedIn PDF and get an ATS-safe resume in about 60 seconds.</p>
            <div className="mt-5">
              <Link to="/">
                <Button size="lg" className="gap-2">
                  Start now <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </section>
        </article>
      </main>
    </div>
  );
}
