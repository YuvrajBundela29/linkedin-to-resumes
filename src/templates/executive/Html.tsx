import type { Resume } from "@/lib/resume-schema";
import { formatDateRange, joinContact, nonEmpty } from "../shared";

// Executive: serif, centered header, navy accent. ATS-safe single column.
export function ExecutiveHtml({ resume }: { resume: Resume }) {
  const contact = joinContact(resume);
  return (
    <div className="resume-page resume-executive">
      <header className="exe-header">
        <h1 className="exe-name">{resume.name || "Your Name"}</h1>
        {resume.headline && <div className="exe-headline">{resume.headline}</div>}
        {contact.length > 0 && <div className="exe-contact">{contact.join("  |  ")}</div>}
        <div className="exe-rule" />
      </header>

      {resume.summary && (
        <section className="exe-section"><h2>Executive Summary</h2><p>{resume.summary}</p></section>
      )}

      {nonEmpty(resume.experience).length > 0 && (
        <section className="exe-section">
          <h2>Professional Experience</h2>
          {resume.experience.map((exp, i) => (
            <div className="exe-entry" key={i}>
              <div className="exe-entry-head">
                <div><span className="exe-title">{exp.title}</span>{exp.org && <span className="exe-org"> — {exp.org}</span>}</div>
                <div className="exe-dates">{formatDateRange(exp.start, exp.end, exp.current)}</div>
              </div>
              {exp.location && <div className="exe-loc">{exp.location}</div>}
              {nonEmpty(exp.bullets).length > 0 && (
                <ul>{exp.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>
              )}
            </div>
          ))}
        </section>
      )}

      {nonEmpty(resume.education).length > 0 && (
        <section className="exe-section">
          <h2>Education</h2>
          {resume.education.map((ed, i) => (
            <div className="exe-entry" key={i}>
              <div className="exe-entry-head">
                <div><span className="exe-title">{ed.school}</span>{(ed.degree || ed.field) && <span className="exe-org"> — {[ed.degree, ed.field].filter(Boolean).join(" in ")}</span>}</div>
                <div className="exe-dates">{formatDateRange(ed.start, ed.end)}</div>
              </div>
            </div>
          ))}
        </section>
      )}

      {nonEmpty(resume.skills).length > 0 && (
        <section className="exe-section"><h2>Core Competencies</h2><p>{resume.skills.join("  •  ")}</p></section>
      )}
      {nonEmpty(resume.projects).length > 0 && (
        <section className="exe-section">
          <h2>Selected Engagements</h2>
          {resume.projects.map((p, i) => (
            <div className="exe-entry" key={i}>
              <div className="exe-title">{p.name}</div>
              {p.description && <div className="exe-loc">{p.description}</div>}
              {nonEmpty(p.bullets).length > 0 && <ul>{p.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>}
            </div>
          ))}
        </section>
      )}
      {nonEmpty(resume.certifications).length > 0 && (
        <section className="exe-section"><h2>Certifications</h2><p>{resume.certifications.join("  •  ")}</p></section>
      )}
    </div>
  );
}
