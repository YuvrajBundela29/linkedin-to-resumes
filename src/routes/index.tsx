import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Check, FileText, Sparkles, Zap, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
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
  { kind: "h1", text: "Alex Morgan" },
  { kind: "sub", text: "alex.morgan@email.com · San Francisco, CA · linkedin.com/in/alexmorgan" },
  { kind: "space" },
  { kind: "h2", text: "SUMMARY" },
  { kind: "text", text: "Product-minded software engineer with 6+ years shipping web apps at scale." },
  { kind: "space" },
  { kind: "h2", text: "EXPERIENCE" },
  { kind: "bold", text: "Senior Software Engineer — Northwind · 2022 – Present" },
  { kind: "text", text: "• Led migration to TypeScript across 40+ services; cut prod incidents 62%." },
  { kind: "text", text: "• Shipped realtime dashboards used by 120k weekly active users." },
  { kind: "space" },
  { kind: "bold", text: "Software Engineer — Contoso · 2019 – 2022" },
  { kind: "text", text: "• Built payments pipeline processing $8M/mo with 99.99% uptime." },
  { kind: "space" },
  { kind: "h2", text: "EDUCATION" },
  { kind: "bold", text: "B.S. Computer Science — Stanford University" },
  { kind: "space" },
  { kind: "h2", text: "SKILLS" },
  { kind: "text", text: "TypeScript · React · Node.js · Postgres · AWS · GraphQL · Docker" },
];

function ResumeLine({ line, index, progress }: { line: (typeof RESUME_LINES)[number]; index: number; progress: MotionValue<number> }) {
  const total = RESUME_LINES.length;
  const start = index / total;
  const end = start + 1 / total;
  const opacity = useTransform(progress, [start, end], [0, 1]);

  // Per-kind entrance animation
  const yShift = line.kind === "h1" ? 16 : line.kind === "h2" ? 0 : 8;
  const xShift = line.kind === "h2" ? -18 : line.kind === "bold" ? 6 : 0;
  const blurStart = line.kind === "text" || line.kind === "sub" ? 6 : 0;

  const y = useTransform(progress, [start, end], [yShift, 0]);
  const x = useTransform(progress, [start, end], [xShift, 0]);
  const blur = useTransform(progress, [start, end], [blurStart, 0]);
  const filter = useTransform(blur, (b) => `blur(${b}px)`);
  // Typewriter reveal via clip-path from left for headings, wipe for others
  const clip = useTransform(
    progress,
    [start, end],
    line.kind === "h1" || line.kind === "h2"
      ? ["inset(0 100% 0 0)", "inset(0 0% 0 0)"]
      : ["inset(0 0 100% 0)", "inset(0 0 0% 0)"],
  );

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
    <motion.div style={{ opacity, y, x, filter, clipPath: clip }} className={cls}>
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

const TEMPLATES = ["CLASSIC", "MODERN", "COMPACT", "TECHNICAL", "EXECUTIVE", "ELEGANT", "CREATIVE"];
const MARQUEE = ["ATS-safe", "PDF-native", "Chat-to-edit", "Tool-calling AI", "Version history", "Tailor to JD", "Text-selectable", "7 templates", "Unlimited", "60-second build"];

function Landing() {
  const navigate = useNavigate();
  const signedIn = useSignedIn();

  const start = () => {
    if (signedIn) navigate({ to: "/dashboard" });
    else navigate({ to: "/auth", search: { next: "/dashboard" } });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-x-clip grain-fixed">
      {/* HEADER */}
      <header className="border-b border-white/10 glass sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-3">
            <Logo />
            <span className="hidden md:inline text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground border border-white/10 rounded px-1.5 py-0.5">v1.0</span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <a href="#how" className="text-sm text-muted-foreground hover:text-foreground px-3 py-2 hidden md:inline transition-colors">Pipeline</a>
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground px-3 py-2 hidden md:inline transition-colors">Features</a>
            <a href="#about" className="text-sm text-muted-foreground hover:text-foreground px-3 py-2 hidden md:inline transition-colors">Builder</a>
            {signedIn ? (
              <Button asChild size="sm"><Link to="/dashboard">Dashboard</Link></Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link to="/auth" search={{ next: "/dashboard" }}>Sign in</Link></Button>
                <Button size="sm" onClick={start} className="shine">Get started</Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <Hero3D onStart={start} />

      {/* MARQUEE */}
      <div className="border-y border-white/10 bg-[color:var(--color-surface)]/60 backdrop-blur-md overflow-hidden py-4">
        <div className="marquee-track">
          {[...MARQUEE, ...MARQUEE].map((t, i) => (
            <div key={i} className="flex items-center gap-8 px-6 shrink-0">
              <span className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-chrome whitespace-nowrap">{t}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--color-brand)]" />
            </div>
          ))}
        </div>
      </div>

      {/* STATS BAR — editorial numerals */}
      <section className="border-b border-white/10 relative">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 rounded-2xl overflow-hidden glass">
          {[
            { k: "60s", v: "build time", n: "01" },
            { k: "07", v: "ATS templates", n: "02" },
            { k: "98%", v: "parser pass", n: "03" },
            { k: "∞", v: "resumes, free", n: "04" },
          ].map((s, i) => (
            <motion.div
              key={s.v}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="relative bg-background/40 backdrop-blur-sm p-6 sm:p-8 group hover:bg-background/60 transition-colors noise"
            >
              <div className="flex items-start justify-between">
                <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">{s.n}</div>
                <div className="w-1.5 h-1.5 rounded-full bg-[color:var(--color-brand)] group-hover:animate-pulse" />
              </div>
              <div className="mt-4 sm:mt-6 text-5xl sm:text-6xl font-display font-bold tracking-tight text-chrome">{s.k}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1 font-mono uppercase tracking-wider">{s.v}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS — asymmetric bento */}
      <section id="how" className="border-b border-white/10 bg-[color:var(--color-surface)]/40 relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-[color:var(--color-brand)]/8 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute inset-0 grid-bg-fine opacity-30" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28 relative">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 sm:mb-16">
            <div className="max-w-2xl">
              <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-[color:var(--color-brand)] mb-4">— The Pipeline / 003</div>
              <h2 className="text-4xl md:text-6xl font-display font-semibold tracking-tight leading-[1.02]">
                Three moves.<br />
                <span className="text-gradient">One resume</span> that lands.
              </h2>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm md:text-right">
              Built end-to-end by a solo engineer. No middleware sprawl — just PDF in, JSON in the middle, chat on top, PDF out.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 sm:gap-4">
            {[
              { icon: FileText, title: "Upload your PDF", body: "Export from LinkedIn ('Save to PDF' under More on your profile), then drop it in.", n: "01", span: "md:col-span-3 md:row-span-2", tall: true },
              { icon: Zap, title: "AI structures it", body: "Gemini multimodal extracts every role, degree, and skill into a strict JSON schema — no hallucinations, no lost detail.", n: "02", span: "md:col-span-3" },
              { icon: MessageSquare, title: "Chat to polish", body: "Ask for edits in plain English. Tool-calling guarantees safe, reversible changes.", n: "03", span: "md:col-span-3" },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -6 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={s.span}
                style={{ transformStyle: "preserve-3d" }}
              >
                <Card className={cn(
                  "relative h-full glass-strong border border-white/10 overflow-hidden group shine",
                  s.tall ? "p-7 sm:p-9 min-h-[280px] md:min-h-full" : "p-6 sm:p-7 min-h-[200px]"
                )}>
                  <div aria-hidden className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-[color:var(--color-brand)]/10 via-transparent to-[color:var(--color-brand-2)]/10" />
                  <div aria-hidden className="absolute inset-0 noise opacity-40" />
                  <div className="relative flex flex-col h-full">
                    <div className="flex items-start justify-between mb-6">
                      <div className={cn("rounded-lg bg-[color:var(--color-brand)]/10 text-[color:var(--color-brand)] flex items-center justify-center neon-ring", s.tall ? "w-14 h-14" : "w-11 h-11")}>
                        <s.icon className={s.tall ? "w-6 h-6" : "w-5 h-5"} />
                      </div>
                      <div className="font-display text-5xl sm:text-6xl font-bold text-white/5 leading-none">{s.n}</div>
                    </div>
                    <h3 className={cn("font-display font-semibold tracking-tight", s.tall ? "text-2xl sm:text-3xl" : "text-xl")}>{s.title}</h3>
                    <p className={cn("text-muted-foreground mt-3 leading-relaxed", s.tall ? "text-base" : "text-sm")}>{s.body}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TEMPLATES STRIP */}
      <section className="border-b border-white/10 relative overflow-hidden py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-[color:var(--color-brand)] mb-2">— Seven templates / 004</div>
              <h3 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight">One JSON. Swap freely.</h3>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <span className="w-6 h-px bg-white/20" />
              <span>ATS-verified</span>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-20 z-10 bg-gradient-to-r from-background to-transparent" />
          <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-20 z-10 bg-gradient-to-l from-background to-transparent" />
          <div className="marquee-track gap-4 px-4">
            {[...TEMPLATES, ...TEMPLATES].map((t, i) => (
              <div key={i} className="shrink-0 w-[220px] sm:w-[260px] aspect-[1/1.414] rounded-lg glass-strong p-5 relative overflow-hidden noise group hover:-translate-y-1 transition-transform duration-500">
                <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-[color:var(--color-brand)] mb-4">TPL / {String(i % 7 + 1).padStart(2, "0")}</div>
                <div className="font-display text-lg font-bold text-chrome mb-4">{t}</div>
                <div className="space-y-2">
                  <div className="h-1.5 bg-white/10 rounded w-3/4" />
                  <div className="h-1.5 bg-white/10 rounded w-1/2" />
                  <div className="h-3" />
                  <div className="h-1 bg-white/8 rounded w-full" />
                  <div className="h-1 bg-white/8 rounded w-11/12" />
                  <div className="h-1 bg-white/8 rounded w-4/5" />
                  <div className="h-3" />
                  <div className="h-1 bg-white/8 rounded w-full" />
                  <div className="h-1 bg-white/8 rounded w-10/12" />
                  <div className="h-1 bg-white/8 rounded w-3/4" />
                </div>
                <div className="absolute inset-x-4 bottom-4 flex items-center justify-between text-[9px] font-mono text-muted-foreground">
                  <span>A4 · 96dpi</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--color-brand)]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES — glass bento */}
      <section id="features" className="border-b border-white/10 relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute top-1/2 -right-40 w-[600px] h-[600px] rounded-full bg-[color:var(--color-brand-2)]/8 blur-3xl" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28 relative">
          <div className="max-w-2xl mb-12">
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-[color:var(--color-brand)] mb-4">— Built for the bots / 005</div>
            <h2 className="text-4xl md:text-6xl font-display font-semibold tracking-tight leading-[1.02]">
              Designed to pass<br />
              <span className="text-gradient">Applicant Tracking Systems</span>.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[
              "Single-column layout — parsers handle it correctly",
              "Standard fonts (Arial, Helvetica, Georgia)",
              "Standard section headers (Experience, Education, Skills)",
              "No text inside images or icons-only sections",
              "Reverse-chronological order in every section",
              "Text-selectable PDF output — never rasterized",
              "Seven templates, one JSON — swap without redoing your work",
              "Live chat editor with tool-calling under the hood",
              "Tailor to any JD — reweight bullets and keywords in seconds",
            ].map((t, i) => (
              <motion.div
                key={t}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                className="glass rounded-xl p-4 sm:p-5 hover:border-[color:var(--color-brand)]/40 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
              >
                <div aria-hidden className="absolute inset-0 noise opacity-30" />
                <div className="relative flex items-start gap-3">
                  <div className="w-6 h-6 rounded-md bg-[color:var(--color-brand)]/15 text-[color:var(--color-brand)] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm leading-relaxed">{t}</span>
                </div>
                <div className="relative mt-3 text-[9px] font-mono text-muted-foreground/60 uppercase tracking-widest">FEAT / {String(i + 1).padStart(2, "0")}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT — magazine spread */}
      <section id="about" className="border-b border-white/10 relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 grid-bg-fine opacity-20" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-32 relative">
          <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-[color:var(--color-brand)] mb-4">— The builder / 006</div>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-display font-semibold tracking-tight leading-[0.98]">
            Hi, I'm <span className="text-gradient italic">Yuvraj</span>.<br />
            <span className="text-white/40">I built this in public.</span>
          </h2>

          <div className="mt-14 sm:mt-20 grid lg:grid-cols-[1fr_1.6fr] gap-8 sm:gap-14 items-start">
            <div className="lg:sticky lg:top-24 space-y-4">
              <Card className="glass-strong p-6 border border-white/10 relative overflow-hidden noise">
                <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-4 font-mono">— File / builder.json</div>
                <ul className="space-y-2.5 text-sm font-mono">
                  <li className="flex gap-3"><span className="text-[color:var(--color-brand)] w-20 shrink-0">edu_01</span><span>IIT Guwahati · AI & DS</span></li>
                  <li className="flex gap-3"><span className="text-[color:var(--color-brand)] w-20 shrink-0">edu_02</span><span>AKTU · Cybersecurity</span></li>
                  <li className="flex gap-3"><span className="text-[color:var(--color-brand)] w-20 shrink-0">founded</span><span>ConvertXpert, Mini Mind, Auto Prompt</span></li>
                  <li className="flex gap-3"><span className="text-[color:var(--color-brand)] w-20 shrink-0">stack</span><span>Python · TS · Vertex AI · GCP</span></li>
                  <li className="flex gap-3"><span className="text-[color:var(--color-brand)] w-20 shrink-0">skills</span><span>ML · Pen-testing · Data</span></li>
                  <li className="flex gap-3"><span className="text-[color:var(--color-brand)] w-20 shrink-0">based</span><span>Jhansi, UP 🇮🇳</span></li>
                  <li className="flex gap-3"><span className="text-[color:var(--color-brand)] w-20 shrink-0">plays</span><span>Chess (competitive)</span></li>
                </ul>
              </Card>
            </div>

            <div className="space-y-10">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground mb-3">§ 01 — The problem</div>
                <h3 className="font-display text-2xl sm:text-3xl font-semibold mb-3 tracking-tight">Every application, the same battle.</h3>
                <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
                  My LinkedIn was rich. My experience was real. But turning it into an <b className="text-foreground">ATS-safe</b> resume took hours — templates were paywalled, AI tools rewrote things I never said, and nothing let me just <em>talk</em> to my resume.
                </p>
              </div>

              <blockquote className="border-l-2 border-[color:var(--color-brand)] pl-6 py-2 relative">
                <div aria-hidden className="absolute -top-4 -left-2 font-display text-7xl text-[color:var(--color-brand)]/20 leading-none">"</div>
                <p className="text-xl sm:text-2xl font-display italic leading-snug">If it helps <span className="text-gradient not-italic font-semibold">one student</span> land an interview, the project has done its job.</p>
              </blockquote>

              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground mb-3">§ 02 — What I did</div>
                <h3 className="font-display text-2xl sm:text-3xl font-semibold mb-3 tracking-tight">Built it end-to-end. Alone.</h3>
                <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
                  Algorithm, frontend, backend, deployment. The pipeline parses your LinkedIn PDF, structures it into strict JSON, and lets an AI agent edit via tool-calls — so every change is safe, reversible, and stays ATS-friendly.
                </p>
              </div>

              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground mb-3">§ 03 — Why free</div>
                <h3 className="font-display text-2xl sm:text-3xl font-semibold mb-3 tracking-tight">Seven templates. Unlimited resumes.</h3>
                <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
                  Chat-to-edit, one-click tailor to any JD, version history, and text-selectable PDFs that actually parse. No paywalls, no cards, no catch.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 pt-4">
                <Button size="lg" onClick={start} className="gap-2 shine">Try it yourself <ArrowRight className="w-4 h-4" /></Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="https://www.linkedin.com/in/yuvraj-singh-bundela" target="_blank" rel="noreferrer">Connect on LinkedIn</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-b border-white/10 relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--color-brand)_28%,transparent),transparent_60%)]" />
        <div aria-hidden className="pointer-events-none absolute inset-0 noise opacity-40" />
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative mx-auto max-w-4xl px-4 sm:px-6 py-24 sm:py-32 text-center"
        >
          <div className="inline-flex items-center gap-1.5 rounded-full glass-strong px-3 py-1 text-xs text-muted-foreground mb-6">
            <Sparkles className="w-3 h-3 text-[color:var(--color-brand)]" /> Ready when you are
          </div>
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-display font-semibold tracking-tight leading-[0.98]">
            Free.<br />
            <span className="text-gradient">Unlimited.</span><br />
            Yours.
          </h2>
          <p className="text-muted-foreground mt-6 max-w-xl mx-auto text-base sm:text-lg">
            Every template, every feature, unlimited resumes — no paywalls, no cards, no catch.
          </p>
          <div className="mt-10 flex flex-wrap gap-3 justify-center">
            <Button size="lg" onClick={start} className="gap-2 shine shadow-[0_20px_60px_-20px_color-mix(in_oklab,var(--color-brand)_55%,transparent)]">
              Get started <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" asChild><a href="#how">Learn more</a></Button>
          </div>
          <div className="mt-10 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">— No credit card · No email spam · Just resumes —</div>
        </motion.div>
      </section>

      <footer className="border-t border-white/10 relative">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 grid gap-6 sm:grid-cols-[1fr_auto] items-center">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Logo />
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground border border-white/10 rounded px-1.5 py-0.5">v1.0 · stable</span>
          </div>
          <div className="text-xs text-muted-foreground font-mono">© {new Date().getFullYear()} — Crafted by Yuvraj Singh Bundela · Jhansi 🇮🇳</div>
        </div>
      </footer>
    </div>
  );
}
