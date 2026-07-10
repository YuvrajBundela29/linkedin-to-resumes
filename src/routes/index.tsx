import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Check, FileText, Sparkles, Zap, MessageSquare, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ResumeForge AI — LinkedIn PDF to interview-ready resume in 60 seconds" },
      { name: "description", content: "Upload your LinkedIn PDF. AI builds a clean, ATS-safe resume. Edit it by chatting in plain English. Download a text-selectable PDF." },
      { property: "og:title", content: "ResumeForge AI" },
      { property: "og:description", content: "Turn your LinkedIn into an interview-ready resume in 60 seconds." },
    ],
  }),
  component: Landing,
});

function useSignedIn() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s?.user));
    return () => sub.subscription.unsubscribe();
  }, []);
  return signedIn;
}

function Landing() {
  const navigate = useNavigate();
  const signedIn = useSignedIn();

  const start = () => {
    if (signedIn) navigate({ to: "/dashboard" });
    else navigate({ to: "/auth", search: { next: "/dashboard" } });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-x-clip">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 grid-bg opacity-40" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[800px] bg-[radial-gradient(circle_at_20%_20%,color-mix(in_oklab,var(--color-brand)_35%,transparent),transparent_60%),radial-gradient(circle_at_80%_10%,color-mix(in_oklab,var(--color-brand-2)_28%,transparent),transparent_55%)]" />

      <header className="border-b border-white/10 glass sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link to="/"><Logo /></Link>
          <nav className="flex items-center gap-2">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground px-3 py-2 hidden sm:inline">Features</a>
            <a href="#how" className="text-sm text-muted-foreground hover:text-foreground px-3 py-2 hidden sm:inline">How it works</a>
            <a href="#about" className="text-sm text-muted-foreground hover:text-foreground px-3 py-2 hidden sm:inline">About</a>

            {signedIn ? (
              <Button asChild size="sm"><Link to="/dashboard">Dashboard</Link></Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm"><Link to="/auth" search={{ next: "/dashboard" }}>Sign in</Link></Button>
                <Button size="sm" onClick={start}>Get started</Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full glass px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="w-3 h-3 text-[color:var(--color-brand)]" /> Powered by Lovable AI · <span className="text-[color:var(--color-brand)]">Neural pipeline online</span>
            </div>
            <h1 className="mt-4 text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
              Turn your LinkedIn into an <span className="text-gradient">interview-ready</span> resume in 60 seconds.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl">
              Upload your LinkedIn "Save to PDF" export. Our AI structures it into an ATS-safe resume you can polish by chatting in plain English.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={start} className="gap-2">
                Upload your LinkedIn PDF <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" asChild><a href="#how">See how it works</a></Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4 text-[color:var(--color-brand)]" /> ATS-safe by default</span>
              <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4 text-[color:var(--color-brand)]" /> Text-selectable PDF</span>
              <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4 text-[color:var(--color-brand)]" /> No credit card</span>
            </div>
          </div>

          {/* Before/After preview */}
          <div className="relative [perspective:1400px]">
            <Card className="p-4 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.25),0_10px_30px_-15px_rgba(0,0,0,0.15)] border border-white/40 bg-background/70 backdrop-blur-xl [transform:rotateX(6deg)_rotateY(-8deg)] transition-transform duration-500 hover:[transform:rotateX(2deg)_rotateY(-2deg)]">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Before → After</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="border rounded-md p-3 bg-[color:var(--color-muted)] font-mono text-[10px] leading-snug text-muted-foreground max-h-64 overflow-hidden shadow-inner">
                  Jane Doe<br/>
                  Software Engineer at Acme Corp<br/>
                  San Francisco Bay Area · 500+ connections<br/><br/>
                  Experience<br/>
                  Senior Software Engineer<br/>
                  Acme Corp · Full-time<br/>
                  Jan 2022 - Present · 2 yrs 6 mos<br/>
                  San Francisco, CA<br/>
                  - Led migration of monolith to microservices<br/>
                  - Mentored 5 engineers<br/>
                  ...
                </div>
                <div className="border rounded-md overflow-hidden bg-white text-[7px] leading-snug text-black p-3 max-h-64 shadow-lg">
                  <div className="font-bold text-[11px]">Jane Doe</div>
                  <div className="text-[6px] text-neutral-500 mb-1">jane@doe.com · San Francisco, CA</div>
                  <div className="uppercase text-[6px] font-bold border-b border-black mb-1 mt-1">Experience</div>
                  <div className="font-bold">Senior Software Engineer, Acme Corp <span className="float-right font-normal text-neutral-500">Jan 2022 – Present</span></div>
                  <div className="ml-2">• Led monolith → microservices migration, cutting p95 latency 42%.</div>
                  <div className="ml-2">• Mentored 5 engineers; two promoted within a year.</div>
                  <div className="uppercase text-[6px] font-bold border-b border-black mb-1 mt-2">Skills</div>
                  <div>TypeScript · Go · Kubernetes · Postgres · gRPC</div>
                </div>
              </div>
            </Card>
            <div aria-hidden className="absolute -inset-6 -z-10 rounded-3xl bg-[color:var(--color-brand)]/10 blur-3xl" />
          </div>
        </div>
      </section>


      {/* HOW IT WORKS */}
      <section id="how" className="border-t bg-[color:var(--color-surface)]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Three steps. One resume you'll actually send.</h2>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              { icon: FileText, title: "Upload your PDF", body: "Export from LinkedIn ('Save to PDF' under More on your profile), then drop it in." },
              { icon: Zap, title: "AI structures it", body: "We extract every role, degree, and skill into a clean, ATS-safe layout — no tables, no icons, standard headers." },
              { icon: MessageSquare, title: "Chat to polish", body: "Ask for edits like 'shorten my summary' or 'reorder education'. The preview updates live." },
            ].map((s, i) => (
              <Card key={i} className="p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.2)] bg-background/70 backdrop-blur-sm">
                <div className="w-9 h-9 rounded-md bg-[color:var(--color-brand)]/10 text-[color:var(--color-brand)] flex items-center justify-center mb-4">
                  <s.icon className="w-5 h-5" />
                </div>
                <div className="text-sm text-muted-foreground mb-1">Step {i+1}</div>
                <h3 className="font-semibold text-lg">{s.title}</h3>
                <p className="text-muted-foreground mt-1">{s.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Designed to pass Applicant Tracking Systems.</h2>
          <p className="text-muted-foreground mt-3 max-w-2xl">Every template follows ATS rules by default so recruiters — and their software — actually read your resume.</p>
          <div className="mt-10 grid md:grid-cols-2 gap-x-10 gap-y-4">
            {[
              "Single-column layout — parsers handle it correctly",
              "Standard fonts (Arial, Helvetica, Georgia)",
              "Standard section headers (Experience, Education, Skills)",
              "No text inside images or icons-only sections",
              "Reverse-chronological order in every section",
              "Text-selectable PDF output — never rasterized",
              "Four templates, one JSON — swap without redoing your work",
              "Live chat editor with tool-calling under the hood",
            ].map((t) => (
              <div key={t} className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 mt-0.5 text-[color:var(--color-brand)] shrink-0" /> <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT / STORY */}
      <section id="about" className="border-t">
        <div className="mx-auto max-w-4xl px-6 py-24">
          <div className="inline-flex items-center gap-1.5 rounded-full glass px-3 py-1 text-xs text-muted-foreground mb-4">
            <Sparkles className="w-3 h-3 text-[color:var(--color-brand)]" /> The story behind ResumeForge AI
          </div>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
            Hi, I'm <span className="text-gradient">Yuvraj Singh Bundela</span>.
          </h2>
          <p className="mt-3 text-muted-foreground text-lg">
            A dual-track student sitting at the intersection of <b>Cybersecurity</b> and <b>AI</b> — and the builder behind this platform.
          </p>

          <div className="mt-10 grid md:grid-cols-[1fr_1.4fr] gap-8 items-start">
            <Card className="p-6 bg-background/70 backdrop-blur-sm">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Quick facts</div>
              <ul className="space-y-2 text-sm">
                <li><b>@ IIT Guwahati</b> — BS in AI & Data Science</li>
                <li><b>@ AKTU / SR Group</b> — B.Tech in Cybersecurity</li>
                <li>Founder — <b>ConvertXpert</b>, <b>Mini Mind</b>, <b>Auto Prompt</b></li>
                <li>Python · C++ · SQL · Vertex AI · GCP</li>
                <li>Ethical hacking · ML · Data analysis</li>
                <li>Competitive chess player</li>
                <li>Based in Jhansi, Uttar Pradesh 🇮🇳</li>
              </ul>
            </Card>

            <div className="space-y-5 text-[15px] leading-relaxed">
              <div>
                <h3 className="font-semibold text-lg mb-1.5">The problem I kept hitting</h3>
                <p className="text-muted-foreground">
                  Every time I applied for internships, I fought the same battle: my LinkedIn was rich, my experience was real —
                  but turning it into a clean, <b>ATS-safe</b> resume took hours. Templates were paywalled. AI tools rewrote things I never said.
                  And nothing let me just <em>talk</em> to my resume like a normal human.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-1.5">What I did about it</h3>
                <p className="text-muted-foreground">
                  I built ResumeForge AI end-to-end — algorithm design, frontend, backend, deployment. The pipeline parses your
                  LinkedIn PDF, structures it into a strict JSON schema, and lets an AI agent edit it via tool-calls — so every
                  change is safe, reversible, and stays ATS-friendly. Seven templates. Unlimited resumes. No paywalls.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-1.5">Why it matters</h3>
                <p className="text-muted-foreground">
                  I've made every feature I ever wished existed while job-hunting: chat-to-edit, one-click tailor to any JD,
                  version history, and text-selectable PDFs that actually parse. If it helps one student land an interview,
                  the project has done its job.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button size="sm" onClick={start} className="gap-2">Try it yourself <ArrowRight className="w-4 h-4" /></Button>
                <Button size="sm" variant="outline" asChild>
                  <a href="https://www.linkedin.com/in/yuvraj-singh-bundela" target="_blank" rel="noreferrer">Connect on LinkedIn</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-[color:var(--color-surface)]">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Free. Unlimited. Yours.</h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">Every template, every feature, unlimited resumes — no paywalls, no cards, no catch.</p>
          <Button size="lg" onClick={start} className="mt-8 gap-2">
            Get started <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>



      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-8 flex items-center justify-between text-sm text-muted-foreground">
          <Logo />
          <div>© {new Date().getFullYear()} ResumeForge AI</div>
        </div>
      </footer>
    </div>
  );
}
