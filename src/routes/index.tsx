import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Check, FileText, Sparkles, Zap, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue, type MotionValue } from "motion/react";

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

// Lines that "build" onto the resume as the user scrolls.
const RESUME_LINES: { kind: "h1" | "sub" | "h2" | "bold" | "text" | "space"; text?: string }[] = [
  { kind: "h1", text: "Yuvraj Singh Bundela" },
  { kind: "sub", text: "yuvraj@example.com · Jhansi, IN · linkedin.com/in/yuvraj" },
  { kind: "space" },
  { kind: "h2", text: "EXPERIENCE" },
  { kind: "bold", text: "AI Engineer — ConvertXpert · 2024 – Present" },
  { kind: "text", text: "• Shipped multimodal PDF-to-JSON pipeline, cut manual QA 78%." },
  { kind: "text", text: "• Built agentic chat editor with 12 tool-calls; 4.9★ user rating." },
  { kind: "space" },
  { kind: "bold", text: "Security Researcher — SR Group · 2023" },
  { kind: "text", text: "• Disclosed 6 CVEs; hardened auth flow for 40k+ users." },
  { kind: "space" },
  { kind: "h2", text: "EDUCATION" },
  { kind: "bold", text: "IIT Guwahati — BS, AI & Data Science" },
  { kind: "text", text: "AKTU — B.Tech, Cybersecurity" },
  { kind: "space" },
  { kind: "h2", text: "SKILLS" },
  { kind: "text", text: "Python · TypeScript · Vertex AI · GCP · SQL · Pen-testing" },
];

function ResumeLine({ line, index, progress }: { line: (typeof RESUME_LINES)[number]; index: number; progress: MotionValue<number> }) {
  // Each line reveals in its own scroll window
  const total = RESUME_LINES.length;
  const start = index / total;
  const end = start + 1 / total;
  const opacity = useTransform(progress, [start, end], [0, 1]);
  const y = useTransform(progress, [start, end], [10, 0]);
  const clip = useTransform(progress, [start, end], ["inset(0 100% 0 0)", "inset(0 0% 0 0)"]);

  if (line.kind === "space") return <div className="h-2" />;

  const cls =
    line.kind === "h1"
      ? "text-[15px] font-bold text-black"
      : line.kind === "sub"
      ? "text-[7px] text-neutral-500"
      : line.kind === "h2"
      ? "text-[7px] font-bold tracking-widest text-black border-b border-black mt-1 mb-1"
      : line.kind === "bold"
      ? "text-[8px] font-semibold text-black"
      : "text-[7.5px] text-neutral-800 leading-snug";

  return (
    <motion.div style={{ opacity, y, clipPath: clip }} className={cls}>
      {line.text}
    </motion.div>
  );
}

function Hero3D({ onStart }: { onStart: () => void }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: stageRef, offset: ["start start", "end start"] });

  // Overall build progress across the pinned zone
  const buildRaw = useTransform(scrollYProgress, [0, 0.85], [0, 1]);
  const build = useSpring(buildRaw, { stiffness: 120, damping: 30, mass: 0.6 });

  // 3D rotation: dramatic tilt → flat as you scroll
  const rotateX = useTransform(build, [0, 1], [22, 4]);
  const rotateY = useTransform(build, [0, 1], [-24, -2]);
  const rotateZ = useTransform(build, [0, 1], [-4, 0]);
  const scale = useTransform(build, [0, 1], [0.88, 1]);
  const lift = useTransform(build, [0, 1], [40, -10]);

  // Mouse parallax when idle
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const pRotY = useSpring(mx, { stiffness: 80, damping: 20 });
  const pRotX = useSpring(my, { stiffness: 80, damping: 20 });

  // Continuous float
  const [floatY, setFloatY] = useState(0);
  useEffect(() => {
    let raf: number;
    const t0 = performance.now();
    const tick = (t: number) => {
      setFloatY(Math.sin((t - t0) / 900) * 4);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section
      ref={stageRef}
      className="relative"
      style={{ height: "220vh" }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        mx.set(nx * -12);
        my.set(ny * 8);
      }}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Ambient sci-fi glow */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 grid-bg opacity-40" />
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_20%_10%,color-mix(in_oklab,var(--color-brand)_35%,transparent),transparent_55%),radial-gradient(ellipse_at_85%_20%,color-mix(in_oklab,var(--color-brand-2)_30%,transparent),transparent_55%)]" />

        <div className="mx-auto max-w-6xl h-full px-6 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-8 items-center">
          {/* Copy */}
          <div className="pt-24 lg:pt-0 relative z-10 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full glass px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="w-3 h-3 text-[color:var(--color-brand)]" />
              <span className="text-[color:var(--color-brand)]">Neural pipeline online</span>
            </div>
            <h1 className="mt-4 text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
              Watch your resume <span className="text-gradient">build itself</span> as you scroll.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
              Upload your LinkedIn PDF. Our AI structures it into an ATS-safe resume — then let the chat editor polish it in plain English.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center lg:justify-start">
              <Button size="lg" onClick={onStart} className="gap-2">
                Upload your LinkedIn PDF <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" asChild><a href="#how">How it works</a></Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground justify-center lg:justify-start">
              <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4 text-[color:var(--color-brand)]" /> ATS-safe</span>
              <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4 text-[color:var(--color-brand)]" /> Text-selectable PDF</span>
              <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4 text-[color:var(--color-brand)]" /> No credit card</span>
            </div>

            {/* Scroll hint */}
            <motion.div
              className="mt-10 text-xs uppercase tracking-[0.3em] text-muted-foreground/70 hidden lg:block"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2.2, repeat: Infinity }}
            >
              ↓ scroll to build
            </motion.div>
          </div>

          {/* 3D Resume Stage */}
          <div className="relative h-[520px] sm:h-[560px] lg:h-[620px]" style={{ perspective: 1600 }}>
            {/* Glow underlay */}
            <motion.div
              aria-hidden
              className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-[80%] rounded-3xl bg-[color:var(--color-brand)]/25 blur-3xl -z-10"
              style={{ opacity: useTransform(build, [0, 1], [0.4, 0.8]) }}
            />

            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                rotateX,
                rotateY,
                rotateZ,
                scale,
                y: lift,
                transformStyle: "preserve-3d",
              }}
            >
              <motion.div
                style={{
                  rotateY: pRotY,
                  rotateX: pRotX,
                  y: floatY,
                  transformStyle: "preserve-3d",
                }}
                className="relative"
              >
                {/* Depth stack: back sheets */}
                <div aria-hidden className="absolute inset-0 rounded-lg bg-white/60 shadow-2xl" style={{ transform: "translateZ(-40px) translateY(14px) scale(0.97)" }} />
                <div aria-hidden className="absolute inset-0 rounded-lg bg-white/80 shadow-xl" style={{ transform: "translateZ(-20px) translateY(7px) scale(0.985)" }} />

                {/* The building resume */}
                <div
                  className="relative w-[300px] sm:w-[340px] md:w-[380px] aspect-[1/1.414] rounded-lg bg-white text-black p-5 sm:p-6 shadow-[0_50px_120px_-20px_rgba(6,10,25,0.7),0_20px_50px_-15px_rgba(56,189,248,0.35)] overflow-hidden"
                  style={{ transform: "translateZ(0)" }}
                >
                  {/* Cyan scanning beam */}
                  <motion.div
                    aria-hidden
                    className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-cyan-300/40 to-transparent pointer-events-none"
                    style={{ top: useTransform(build, [0, 1], ["-15%", "115%"]) }}
                  />

                  <div className="relative space-y-[3px]">
                    {RESUME_LINES.map((line, i) => (
                      <ResumeLine key={i} line={line} index={i} progress={build} />
                    ))}
                  </div>

                  {/* Corner brand chip */}
                  <div className="absolute bottom-2 right-2 text-[6px] font-mono text-neutral-400 tracking-widest">RESUMEFORGE.AI</div>
                </div>

                {/* Floating cyber-chips */}
                <motion.div
                  className="absolute -left-8 top-8 glass px-2.5 py-1.5 rounded-md text-[10px] font-mono text-[color:var(--color-brand)] border border-white/10"
                  style={{ transform: "translateZ(60px)", opacity: useTransform(build, [0, 0.2, 1], [0, 1, 1]) }}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity }}
                >
                  ✓ ATS score 98
                </motion.div>
                <motion.div
                  className="absolute -right-6 top-1/3 glass px-2.5 py-1.5 rounded-md text-[10px] font-mono text-[color:var(--color-brand-2)] border border-white/10"
                  style={{ transform: "translateZ(70px)", opacity: useTransform(build, [0.2, 0.5, 1], [0, 1, 1]) }}
                  animate={{ y: [0, 6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 0.4 }}
                >
                  + 12 keywords
                </motion.div>
                <motion.div
                  className="absolute -right-4 bottom-10 glass px-2.5 py-1.5 rounded-md text-[10px] font-mono text-white/80 border border-white/10"
                  style={{ transform: "translateZ(55px)", opacity: useTransform(build, [0.5, 0.9, 1], [0, 1, 1]) }}
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 0.8 }}
                >
                  PDF ready
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
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
      <header className="border-b border-white/10 glass sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
          <Link to="/"><Logo /></Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <a href="#how" className="text-sm text-muted-foreground hover:text-foreground px-3 py-2 hidden md:inline">How it works</a>
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground px-3 py-2 hidden md:inline">Features</a>
            <a href="#about" className="text-sm text-muted-foreground hover:text-foreground px-3 py-2 hidden md:inline">About</a>
            {signedIn ? (
              <Button asChild size="sm"><Link to="/dashboard">Dashboard</Link></Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link to="/auth" search={{ next: "/dashboard" }}>Sign in</Link></Button>
                <Button size="sm" onClick={start}>Get started</Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <Hero3D onStart={start} />

      {/* STATS BAR */}
      <section className="border-t border-white/10 bg-gradient-to-b from-transparent to-[color:var(--color-surface)]/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {[
            { k: "60s", v: "avg. build time" },
            { k: "7", v: "ATS-safe templates" },
            { k: "98%", v: "parser pass rate" },
            { k: "∞", v: "resumes, forever free" },
          ].map((s, i) => (
            <motion.div
              key={s.v}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="glass rounded-xl p-4 sm:p-5 text-center hover:-translate-y-1 transition-transform duration-300"
            >
              <div className="text-3xl sm:text-4xl font-bold text-gradient font-display">{s.k}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">{s.v}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="border-t border-white/10 bg-[color:var(--color-surface)] relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-[color:var(--color-brand)]/10 blur-3xl" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24 relative">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full glass px-3 py-1 text-xs text-muted-foreground mb-4">
              <Zap className="w-3 h-3 text-[color:var(--color-brand)]" /> The pipeline
            </div>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">Three steps. One resume you'll <span className="text-gradient">actually send</span>.</h2>
          </div>
          <div className="mt-10 sm:mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" style={{ perspective: 1200 }}>
            {[
              { icon: FileText, title: "Upload your PDF", body: "Export from LinkedIn ('Save to PDF' under More on your profile), then drop it in." },
              { icon: Zap, title: "AI structures it", body: "We extract every role, degree, and skill into a clean, ATS-safe layout — no tables, no icons, standard headers." },
              { icon: MessageSquare, title: "Chat to polish", body: "Ask for edits like 'shorten my summary' or 'reorder education'. The preview updates live." },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40, rotateX: -8 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                whileHover={{ y: -8, rotateX: 4, rotateY: -3, scale: 1.02 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <Card className="relative p-6 h-full bg-background/60 backdrop-blur-sm border border-white/10 overflow-hidden group">
                  <div aria-hidden className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-[color:var(--color-brand)]/10 via-transparent to-[color:var(--color-brand-2)]/10" />
                  <div className="relative">
                    <div className="w-11 h-11 rounded-lg bg-[color:var(--color-brand)]/10 text-[color:var(--color-brand)] flex items-center justify-center mb-4 neon-ring">
                      <s.icon className="w-5 h-5" />
                    </div>
                    <div className="text-xs text-muted-foreground mb-1 font-mono uppercase tracking-wider">Step {String(i + 1).padStart(2, "0")}</div>
                    <h3 className="font-semibold text-lg">{s.title}</h3>
                    <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{s.body}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="border-t border-white/10 relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute top-1/2 -right-40 w-[600px] h-[600px] rounded-full bg-[color:var(--color-brand-2)]/10 blur-3xl" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24 relative">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full glass px-3 py-1 text-xs text-muted-foreground mb-4">
              <Check className="w-3 h-3 text-[color:var(--color-brand)]" /> Built for the bots
            </div>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">Designed to pass <span className="text-gradient">Applicant Tracking Systems</span>.</h2>
            <p className="text-muted-foreground mt-3 max-w-2xl">Every template follows ATS rules by default so recruiters — and their software — actually read your resume.</p>
          </div>
          <div className="mt-10 sm:mt-12 grid sm:grid-cols-2 gap-3 sm:gap-4">
            {[
              "Single-column layout — parsers handle it correctly",
              "Standard fonts (Arial, Helvetica, Georgia)",
              "Standard section headers (Experience, Education, Skills)",
              "No text inside images or icons-only sections",
              "Reverse-chronological order in every section",
              "Text-selectable PDF output — never rasterized",
              "Seven templates, one JSON — swap without redoing your work",
              "Live chat editor with tool-calling under the hood",
            ].map((t, i) => (
              <motion.div
                key={t}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                className="flex items-start gap-3 text-sm glass rounded-lg p-3 sm:p-4 hover:border-[color:var(--color-brand)]/40 transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-[color:var(--color-brand)]/15 text-[color:var(--color-brand)] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <span className="leading-relaxed">{t}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT / STORY */}
      <section id="about" className="border-t border-white/10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-20 sm:py-24">
          <div className="inline-flex items-center gap-1.5 rounded-full glass px-3 py-1 text-xs text-muted-foreground mb-4">
            <Sparkles className="w-3 h-3 text-[color:var(--color-brand)]" /> The story behind ResumeForge AI
          </div>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
            Hi, I'm <span className="text-gradient">Yuvraj Singh Bundela</span>.
          </h2>
          <p className="mt-3 text-muted-foreground text-base sm:text-lg">
            A dual-track student sitting at the intersection of <b>Cybersecurity</b> and <b>AI</b> — and the builder behind this platform.
          </p>

          <div className="mt-10 grid md:grid-cols-[1fr_1.4fr] gap-6 sm:gap-8 items-start">
            <Card className="p-6 bg-background/60 backdrop-blur-sm border border-white/10">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-mono">Quick facts</div>
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
      <section className="border-t border-white/10 bg-[color:var(--color-surface)] relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--color-brand)_25%,transparent),transparent_60%)]" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative mx-auto max-w-4xl px-4 sm:px-6 py-20 sm:py-28 text-center"
        >
          <div className="inline-flex items-center gap-1.5 rounded-full glass px-3 py-1 text-xs text-muted-foreground mb-5">
            <Sparkles className="w-3 h-3 text-[color:var(--color-brand)]" /> Ready when you are
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight">Free. <span className="text-gradient">Unlimited.</span> Yours.</h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-base sm:text-lg">Every template, every feature, unlimited resumes — no paywalls, no cards, no catch.</p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Button size="lg" onClick={start} className="gap-2 shadow-[0_20px_60px_-20px_color-mix(in_oklab,var(--color-brand)_55%,transparent)]">
              Get started <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" asChild><a href="#how">Learn more</a></Button>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <Logo />
          <div>© {new Date().getFullYear()} ResumeForge AI · Crafted by Yuvraj Singh Bundela</div>
        </div>
      </footer>
    </div>
  );
}
