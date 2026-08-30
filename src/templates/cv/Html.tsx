import type { Resume } from "@/lib/resume-schema";
import { formatDateRange, joinContact, nonEmpty } from "../shared";

export type CvVariant = "standard" | "academic";

type Props = { resume: Resume; variant: CvVariant };

const ACCENT: Record<CvVariant, string> = { standard: "#1e3a5f", academic: "#3f3f46" };

export function CvHtml({ resume, variant }: Props) {
  const accent = ACCENT[variant];
  const serif = variant === "academic";
  const contact = joinContact(resume);

  const page: React.CSSProperties = {
    width: 794,
    minHeight: 1123,
    background: "#ffffff",
    color: "#111827",
    fontFamily: serif ? "Georgia, 'Times New Roman', serif" : "Arial, Helvetica, sans-serif",
    fontSize: 12.5,
    lineHeight: 1.55,
    padding: 52,
    boxSizing: "border-box",
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section style={{ marginTop: 18 }}>
      <h2
        style={{
          fontSize: serif ? 14 : 12,
          textTransform: serif ? "none" : "uppercase",
          letterSpacing: serif ? 0.4 : 1.5,
          fontWeight: 700,
          color: accent,
          borderBottom: `1px solid ${accent}`,
          paddingBottom: 4,
          margin: "0 0 8px",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );

  const Entry = ({ left, right, sub, bullets }: { left: React.ReactNode; right?: string; sub?: string; bullets?: string[] }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
        <div style={{ flex: 1, minWidth: 0 }}>{left}</div>
        {right ? <div style={{ fontSize: 11.5, color: "#6b7280", whiteSpace: "nowrap" }}>{right}</div> : null}
      </div>
      {sub ? <div style={{ fontSize: 11.5, color: "#6b7280" }}>{sub}</div> : null}
      {bullets && bullets.length > 0 && (
        <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
          {bullets.map((b, i) => <li key={i} style={{ marginBottom: 2 }}>{b}</li>)}
        </ul>
      )}
    </div>
  );

  const List = ({ items }: { items: string[] }) => (
    <ul style={{ margin: 0, paddingLeft: 18 }}>
      {items.map((s, i) => <li key={i} style={{ marginBottom: 2 }}>{s}</li>)}
    </ul>
  );

  const roles = (items: Resume["experience"]) =>
    items.map((e, i) => (
      <Entry
        key={i}
        left={<span><b>{e.title}</b>{e.org ? ` — ${e.org}` : ""}</span>}
        right={formatDateRange(e.start, e.end, e.current)}
        sub={e.location || undefined}
        bullets={nonEmpty(e.bullets)}
      />
    ));

  return (
    <div style={page}>
      <header style={{ textAlign: serif ? "center" : "left", borderBottom: `2px solid ${accent}`, paddingBottom: 12 }}>
        <h1 style={{ margin: 0, fontSize: serif ? 30 : 28, fontWeight: 700, letterSpacing: serif ? 0.8 : -0.4 }}>
          {resume.name || "Your Name"}
        </h1>
        {resume.headline && <div style={{ marginTop: 4, fontSize: 13, color: accent, fontWeight: 600 }}>{resume.headline}</div>}
        {contact.length > 0 && <div style={{ marginTop: 6, fontSize: 11.5, color: "#6b7280" }}>{contact.join("   ·   ")}</div>}
      </header>

      {resume.summary && (
        <Section title={serif ? "Research Profile" : "Profile"}>
          <p style={{ margin: 0 }}>{resume.summary}</p>
        </Section>
      )}

      {nonEmpty(resume.education).length > 0 && serif && (
        <Section title="Education">
          {resume.education.map((e, i) => (
            <Entry
              key={i}
              left={<span><b>{e.school}</b>{(e.degree || e.field) ? ` — ${[e.degree, e.field].filter(Boolean).join(" in ")}` : ""}</span>}
              right={formatDateRange(e.start, e.end)}
              bullets={nonEmpty(e.bullets)}
            />
          ))}
        </Section>
      )}

      {nonEmpty(resume.experience).length > 0 && (
        <Section title={serif ? "Academic & Professional Appointments" : "Professional Experience"}>{roles(resume.experience)}</Section>
      )}

      {nonEmpty(resume.research).length > 0 && <Section title="Research Experience">{roles(resume.research!)}</Section>}
      {nonEmpty(resume.teaching).length > 0 && <Section title="Teaching Experience">{roles(resume.teaching!)}</Section>}

      {nonEmpty(resume.publications).length > 0 && (
        <Section title="Publications">
          <ol style={{ margin: 0, paddingLeft: 20 }}>
            {resume.publications!.map((p, i) => (
              <li key={i} style={{ marginBottom: 5 }}>
                {p.authors ? <span>{p.authors}. </span> : null}
                <span style={{ fontWeight: 600 }}>{p.title}</span>
                {p.venue ? <span style={{ fontStyle: "italic" }}>, {p.venue}</span> : null}
                {p.year ? <span>, {p.year}</span> : null}
                {p.link ? <span style={{ color: accent }}> · {p.link}</span> : null}
              </li>
            ))}
          </ol>
        </Section>
      )}

      {nonEmpty(resume.projects).length > 0 && (
        <Section title="Projects">
          {resume.projects.map((p, i) => (
            <Entry key={i} left={<span><b>{p.name}</b></span>} sub={p.description || undefined} bullets={nonEmpty(p.bullets)} />
          ))}
        </Section>
      )}

      {nonEmpty(resume.education).length > 0 && !serif && (
        <Section title="Education">
          {resume.education.map((e, i) => (
            <Entry
              key={i}
              left={<span><b>{e.school}</b>{(e.degree || e.field) ? ` — ${[e.degree, e.field].filter(Boolean).join(" in ")}` : ""}</span>}
              right={formatDateRange(e.start, e.end)}
              bullets={nonEmpty(e.bullets)}
            />
          ))}
        </Section>
      )}

      {nonEmpty(resume.grants).length > 0 && <Section title="Grants & Funding"><List items={resume.grants!} /></Section>}
      {nonEmpty(resume.talks).length > 0 && <Section title="Talks & Presentations"><List items={resume.talks!} /></Section>}
      {nonEmpty(resume.awards).length > 0 && <Section title="Awards & Honours"><List items={resume.awards!} /></Section>}

      {nonEmpty(resume.skills).length > 0 && (
        <Section title="Skills"><p style={{ margin: 0 }}>{resume.skills.join("  ·  ")}</p></Section>
      )}
      {nonEmpty(resume.certifications).length > 0 && (
        <Section title="Certifications"><List items={resume.certifications} /></Section>
      )}
      {nonEmpty(resume.languages).length > 0 && (
        <Section title="Languages"><p style={{ margin: 0 }}>{resume.languages!.join("  ·  ")}</p></Section>
      )}

      {nonEmpty(resume.references).length > 0 && (
        <Section title="References">
          {resume.references!.map((r, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <b>{r.name}</b>
              {r.role ? `, ${r.role}` : ""}
              {r.org ? `, ${r.org}` : ""}
              {r.contact ? <span style={{ color: "#6b7280" }}> · {r.contact}</span> : null}
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}
