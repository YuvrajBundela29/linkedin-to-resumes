import type { Resume } from "@/lib/resume-schema";
import { formatDateRange, joinContact, nonEmpty } from "../shared";

export type GenericVariant = "band" | "line" | "sidebar" | "serif";

type Props = { resume: Resume; accent: string; variant: GenericVariant; dark?: boolean };

const page: React.CSSProperties = {
  width: 794,
  minHeight: 1123,
  background: "#ffffff",
  color: "#111827",
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: 13,
  lineHeight: 1.5,
  boxSizing: "border-box",
};

function Section({ title, accent, variant, children }: { title: string; accent: string; variant: GenericVariant; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 16 }}>
      <h2
        style={{
          fontSize: variant === "serif" ? 14 : 12,
          letterSpacing: variant === "serif" ? 0.5 : 1.6,
          textTransform: variant === "serif" ? "none" : "uppercase",
          fontWeight: 700,
          color: variant === "line" ? "#111827" : accent,
          borderBottom: `1px solid ${variant === "line" ? "#d1d5db" : accent}`,
          paddingBottom: 4,
          margin: "0 0 8px",
          fontFamily: variant === "serif" ? "Georgia, 'Times New Roman', serif" : undefined,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function Entry({ left, right, sub, bullets, accent }: { left: React.ReactNode; right?: string; sub?: string; bullets?: string[]; accent: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
        <div style={{ flex: 1, minWidth: 0 }}>{left}</div>
        {right ? <div style={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>{right}</div> : null}
      </div>
      {sub ? <div style={{ fontSize: 12, color: "#6b7280" }}>{sub}</div> : null}
      {bullets && bullets.length > 0 && (
        <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
          {bullets.map((b, i) => (
            <li key={i} style={{ marginBottom: 2, color: "#1f2937" }}>
              <span style={{ color: accent }} /> {b}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Body({ resume, accent, variant }: Props) {
  return (
    <>
      {resume.summary && (
        <Section title={variant === "serif" ? "Profile" : "Summary"} accent={accent} variant={variant}>
          <p style={{ margin: 0 }}>{resume.summary}</p>
        </Section>
      )}

      {nonEmpty(resume.experience).length > 0 && (
        <Section title="Experience" accent={accent} variant={variant}>
          {resume.experience.map((e, i) => (
            <Entry
              key={i}
              accent={accent}
              left={<span><b>{e.title}</b>{e.org ? <span style={{ color: accent }}> — {e.org}</span> : null}</span>}
              right={formatDateRange(e.start, e.end, e.current)}
              sub={e.location || undefined}
              bullets={nonEmpty(e.bullets)}
            />
          ))}
        </Section>
      )}

      {nonEmpty(resume.projects).length > 0 && (
        <Section title="Projects" accent={accent} variant={variant}>
          {resume.projects.map((p, i) => (
            <Entry key={i} accent={accent} left={<span><b>{p.name}</b></span>} sub={p.description || undefined} bullets={nonEmpty(p.bullets)} />
          ))}
        </Section>
      )}

      {nonEmpty(resume.education).length > 0 && (
        <Section title="Education" accent={accent} variant={variant}>
          {resume.education.map((e, i) => (
            <Entry
              key={i}
              accent={accent}
              left={<span><b>{e.school}</b>{(e.degree || e.field) ? ` — ${[e.degree, e.field].filter(Boolean).join(" in ")}` : ""}</span>}
              right={formatDateRange(e.start, e.end)}
              bullets={nonEmpty(e.bullets)}
            />
          ))}
        </Section>
      )}
    </>
  );
}

export function GenericHtml({ resume, accent, variant, dark }: Props) {
  const contact = joinContact(resume);
  const skills = nonEmpty(resume.skills);
  const certs = nonEmpty(resume.certifications);

  if (variant === "sidebar") {
    return (
      <div style={{ ...page, display: "flex" }}>
        <aside style={{ width: 230, background: accent, color: "#fff", padding: "36px 22px", boxSizing: "border-box" }}>
          <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>{resume.name || "Your Name"}</div>
          {resume.headline && <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>{resume.headline}</div>}
          {contact.length > 0 && (
            <div style={{ marginTop: 20, fontSize: 11.5, opacity: 0.9, lineHeight: 1.8, wordBreak: "break-word" }}>
              {contact.map((c, i) => <div key={i}>{c}</div>)}
            </div>
          )}
          {skills.length > 0 && (
            <div style={{ marginTop: 22 }}>
              <div style={{ fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", opacity: 0.75, marginBottom: 6 }}>Skills</div>
              <div style={{ fontSize: 11.5, lineHeight: 1.7 }}>{skills.map((s, i) => <div key={i}>{s}</div>)}</div>
            </div>
          )}
          {certs.length > 0 && (
            <div style={{ marginTop: 22 }}>
              <div style={{ fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", opacity: 0.75, marginBottom: 6 }}>Certifications</div>
              <div style={{ fontSize: 11.5, lineHeight: 1.7 }}>{certs.map((s, i) => <div key={i}>{s}</div>)}</div>
            </div>
          )}
        </aside>
        <main style={{ flex: 1, padding: "36px 34px", boxSizing: "border-box", minWidth: 0 }}>
          <Body resume={resume} accent={accent} variant={variant} />
        </main>
      </div>
    );
  }

  return (
    <div style={{ ...page, padding: variant === "band" ? 0 : 48 }}>
      {variant === "band" ? (
        <header style={{ background: accent, color: "#fff", padding: "34px 48px" }}>
          <h1 style={{ margin: 0, fontSize: 30, letterSpacing: -0.5, fontWeight: 700 }}>{resume.name || "Your Name"}</h1>
          {resume.headline && <div style={{ marginTop: 4, fontSize: 13.5, opacity: dark ? 0.85 : 0.92 }}>{resume.headline}</div>}
          {contact.length > 0 && <div style={{ marginTop: 8, fontSize: 12, opacity: 0.85 }}>{contact.join("   ·   ")}</div>}
        </header>
      ) : (
        <header style={{ textAlign: variant === "serif" ? "center" : "left", borderBottom: `2px solid ${accent}`, paddingBottom: 12 }}>
          <h1 style={{
            margin: 0,
            fontSize: variant === "serif" ? 30 : 28,
            fontWeight: 700,
            letterSpacing: variant === "serif" ? 1 : -0.4,
            fontFamily: variant === "serif" ? "Georgia, 'Times New Roman', serif" : undefined,
          }}>{resume.name || "Your Name"}</h1>
          {resume.headline && <div style={{ marginTop: 4, fontSize: 13, color: accent, fontWeight: 600 }}>{resume.headline}</div>}
          {contact.length > 0 && <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>{contact.join("   ·   ")}</div>}
        </header>
      )}

      <div style={{ padding: variant === "band" ? "24px 48px 48px" : 0 }}>
        <Body resume={resume} accent={accent} variant={variant} />

        {skills.length > 0 && (
          <Section title="Skills" accent={accent} variant={variant}>
            <p style={{ margin: 0 }}>{skills.join("  ·  ")}</p>
          </Section>
        )}
        {certs.length > 0 && (
          <Section title="Certifications" accent={accent} variant={variant}>
            <p style={{ margin: 0 }}>{certs.join("  ·  ")}</p>
          </Section>
        )}
      </div>
    </div>
  );
}
