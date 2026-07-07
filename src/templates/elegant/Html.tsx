import type { Resume } from "@/lib/resume-schema";
import { formatDateRange, joinContact, nonEmpty } from "../shared";

// Elegant: left accent bar, refined type, emerald accent.
export function ElegantHtml({ resume }: { resume: Resume }) {
  const contact = joinContact(resume);
  return (
    <div className="resume-page resume-elegant">
      <header className="ele-header">
        <div className="ele-accent" />
        <div>
          <h1 className="ele-name">{resume.name || "Your Name"}</h1>
          {resume.headline && <div className="ele-headline">{resume.headline}</div>}
          {contact.length > 0 && <div className="ele-contact">{contact.join("   ·   ")}</div>}
        </div>
      </header>

      {resume.summary && (
        <section className="ele-section"><h2>Profile</h2><p>{resume.summary}</p></section>
      )}

      {nonEmpty(resume.experience).length > 0 && (
        <section className="ele-section">
          <h2>Experience</h2>
          {resume.experience.map((exp, i) => (
            <div className="ele-entry" key={i}>
              <div className="ele-entry-head">
                <div className="ele-title">{exp.title}<span className="ele-org">{exp.org && ` · ${exp.org}`}</span></div>
                <div className="ele-dates">{formatDateRange(exp.start, exp.end, exp.current)}</div>
              </div>
              {exp.location && <div className="ele-loc">{exp.location}</div>}
              {nonEmpty(exp.bullets).length > 0 && <ul>{exp.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>}
            </div>
          ))}
        </section>
      )}

      {nonEmpty(resume.education).length > 0 && (
        <section className="ele-section">
          <h2>Education</h2>
          {resume.education.map((ed, i) => (
            <div className="ele-entry" key={i}>
              <div className="ele-entry-head">
                <div className="ele-title">{ed.school}<span className="ele-org">{(ed.degree || ed.field) && ` · ${[ed.degree, ed.field].filter(Boolean).join(" in ")}`}</span></div>
                <div className="ele-dates">{formatDateRange(ed.start, ed.end)}</div>
              </div>
            </div>
          ))}
        </section>
      )}

      {nonEmpty(resume.skills).length > 0 && (
        <section className="ele-section"><h2>Skills</h2>
          <div className="ele-chips">{resume.skills.map((s, i) => <span key={i} className="ele-chip">{s}</span>)}</div>
        </section>
      )}
      {nonEmpty(resume.projects).length > 0 && (
        <section className="ele-section">
          <h2>Projects</h2>
          {resume.projects.map((p, i) => (
            <div className="ele-entry" key={i}>
              <div className="ele-title">{p.name}</div>
              {p.description && <div className="ele-loc">{p.description}</div>}
              {nonEmpty(p.bullets).length > 0 && <ul>{p.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>}
            </div>
          ))}
        </section>
      )}
      {nonEmpty(resume.certifications).length > 0 && (
        <section className="ele-section"><h2>Certifications</h2><p>{resume.certifications.join(" · ")}</p></section>
      )}
    </div>
  );
}
