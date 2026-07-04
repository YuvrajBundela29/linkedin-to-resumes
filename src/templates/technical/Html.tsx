import type { Resume } from "@/lib/resume-schema";
import { formatDateRange, joinContact, nonEmpty } from "../shared";

// Technical: monospace-ish sensibility (still Arial for ATS), grouped skills,
// good for engineering / data roles.
export function TechnicalHtml({ resume }: { resume: Resume }) {
  const contact = joinContact(resume);
  return (
    <div className="resume-page resume-technical">
      <header className="tec-header">
        <h1 className="tec-name">{resume.name || "Your Name"}</h1>
        {resume.headline && <div className="tec-headline">{resume.headline}</div>}
        {contact.length > 0 && <div className="tec-contact">{contact.join("  ·  ")}</div>}
      </header>

      {resume.summary && (<section className="tec-section"><h2>Summary</h2><p>{resume.summary}</p></section>)}

      {nonEmpty(resume.skills).length > 0 && (
        <section className="tec-section">
          <h2>Skills</h2>
          <p className="tec-skills">{resume.skills.join(" | ")}</p>
        </section>
      )}

      {nonEmpty(resume.experience).length > 0 && (
        <section className="tec-section">
          <h2>Experience</h2>
          {resume.experience.map((exp, i) => (
            <div className="tec-entry" key={i}>
              <div className="tec-entry-head">
                <div><b>{exp.title}</b> — {exp.org}</div>
                <div className="tec-dates">{formatDateRange(exp.start, exp.end, exp.current)}</div>
              </div>
              {exp.location && <div className="tec-loc">{exp.location}</div>}
              {nonEmpty(exp.bullets).length > 0 && <ul>{exp.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>}
            </div>
          ))}
        </section>
      )}

      {nonEmpty(resume.projects).length > 0 && (
        <section className="tec-section">
          <h2>Projects</h2>
          {resume.projects.map((p, i) => (
            <div className="tec-entry" key={i}>
              <div><b>{p.name}</b>{p.description && ` — ${p.description}`}</div>
              {nonEmpty(p.bullets).length > 0 && <ul>{p.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>}
            </div>
          ))}
        </section>
      )}

      {nonEmpty(resume.education).length > 0 && (
        <section className="tec-section">
          <h2>Education</h2>
          {resume.education.map((ed, i) => (
            <div className="tec-entry" key={i}>
              <div className="tec-entry-head">
                <div><b>{ed.school}</b>{(ed.degree || ed.field) && ` — ${[ed.degree, ed.field].filter(Boolean).join(" in ")}`}</div>
                <div className="tec-dates">{formatDateRange(ed.start, ed.end)}</div>
              </div>
            </div>
          ))}
        </section>
      )}

      {nonEmpty(resume.certifications).length > 0 && (<section className="tec-section"><h2>Certifications</h2><p>{resume.certifications.join(" · ")}</p></section>)}
    </div>
  );
}
