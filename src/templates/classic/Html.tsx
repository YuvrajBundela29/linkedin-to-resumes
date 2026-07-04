import type { Resume } from "@/lib/resume-schema";
import { formatDateRange, joinContact, nonEmpty } from "../shared";

// ATS-safe: single column, standard sans-serif, standard section headers,
// no icons, no tables, reverse-chronological.
export function ClassicHtml({ resume }: { resume: Resume }) {
  const contact = joinContact(resume);
  return (
    <div className="resume-page resume-classic">
      <header className="cls-header">
        <h1 className="cls-name">{resume.name || "Your Name"}</h1>
        {resume.headline && <div className="cls-headline">{resume.headline}</div>}
        {contact.length > 0 && (
          <div className="cls-contact">{contact.join("  •  ")}</div>
        )}
      </header>

      {resume.summary && (
        <section className="cls-section">
          <h2>Summary</h2>
          <p className="cls-summary">{resume.summary}</p>
        </section>
      )}

      {nonEmpty(resume.experience).length > 0 && (
        <section className="cls-section">
          <h2>Experience</h2>
          {resume.experience.map((exp, i) => (
            <div className="cls-entry" key={i}>
              <div className="cls-entry-row">
                <div>
                  <span className="cls-title">{exp.title}</span>
                  {exp.org && <span className="cls-org">, {exp.org}</span>}
                </div>
                <div className="cls-dates">{formatDateRange(exp.start, exp.end, exp.current)}</div>
              </div>
              {exp.location && <div className="cls-loc">{exp.location}</div>}
              {nonEmpty(exp.bullets).length > 0 && (
                <ul className="cls-bullets">
                  {exp.bullets.map((b, j) => <li key={j}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {nonEmpty(resume.education).length > 0 && (
        <section className="cls-section">
          <h2>Education</h2>
          {resume.education.map((ed, i) => (
            <div className="cls-entry" key={i}>
              <div className="cls-entry-row">
                <div>
                  <span className="cls-title">{ed.school}</span>
                  {(ed.degree || ed.field) && (
                    <span className="cls-org">, {[ed.degree, ed.field].filter(Boolean).join(" in ")}</span>
                  )}
                </div>
                <div className="cls-dates">{formatDateRange(ed.start, ed.end)}</div>
              </div>
              {nonEmpty(ed.bullets).length > 0 && (
                <ul className="cls-bullets">
                  {ed.bullets.map((b, j) => <li key={j}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {nonEmpty(resume.skills).length > 0 && (
        <section className="cls-section">
          <h2>Skills</h2>
          <p className="cls-inline">{resume.skills.join(" • ")}</p>
        </section>
      )}

      {nonEmpty(resume.projects).length > 0 && (
        <section className="cls-section">
          <h2>Projects</h2>
          {resume.projects.map((p, i) => (
            <div className="cls-entry" key={i}>
              <div className="cls-title">{p.name}</div>
              {p.description && <div className="cls-loc">{p.description}</div>}
              {nonEmpty(p.bullets).length > 0 && (
                <ul className="cls-bullets">
                  {p.bullets.map((b, j) => <li key={j}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {nonEmpty(resume.certifications).length > 0 && (
        <section className="cls-section">
          <h2>Certifications</h2>
          <p className="cls-inline">{resume.certifications.join(" • ")}</p>
        </section>
      )}
    </div>
  );
}
