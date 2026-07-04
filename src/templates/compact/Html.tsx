import type { Resume } from "@/lib/resume-schema";
import { formatDateRange, joinContact, nonEmpty } from "../shared";

// Compact: tight vertical rhythm, small type, meant to fit more content.
export function CompactHtml({ resume }: { resume: Resume }) {
  const contact = joinContact(resume);
  return (
    <div className="resume-page resume-compact">
      <header className="cmp-header">
        <h1 className="cmp-name">{resume.name || "Your Name"}</h1>
        {resume.headline && <span className="cmp-headline"> — {resume.headline}</span>}
        {contact.length > 0 && <div className="cmp-contact">{contact.join(" | ")}</div>}
      </header>

      {resume.summary && (<section className="cmp-section"><h2>Summary</h2><p>{resume.summary}</p></section>)}

      {nonEmpty(resume.experience).length > 0 && (
        <section className="cmp-section">
          <h2>Experience</h2>
          {resume.experience.map((exp, i) => (
            <div className="cmp-entry" key={i}>
              <div className="cmp-line">
                <b>{exp.title}</b>{exp.org && `, ${exp.org}`}
                {exp.location && ` · ${exp.location}`}
                <span className="cmp-dates"> ({formatDateRange(exp.start, exp.end, exp.current)})</span>
              </div>
              {nonEmpty(exp.bullets).length > 0 && (
                <ul>{exp.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>
              )}
            </div>
          ))}
        </section>
      )}

      {nonEmpty(resume.education).length > 0 && (
        <section className="cmp-section">
          <h2>Education</h2>
          {resume.education.map((ed, i) => (
            <div className="cmp-entry" key={i}>
              <div className="cmp-line">
                <b>{ed.school}</b>
                {(ed.degree || ed.field) && `, ${[ed.degree, ed.field].filter(Boolean).join(" in ")}`}
                <span className="cmp-dates"> ({formatDateRange(ed.start, ed.end)})</span>
              </div>
            </div>
          ))}
        </section>
      )}

      {nonEmpty(resume.skills).length > 0 && (<section className="cmp-section"><h2>Skills</h2><p>{resume.skills.join(", ")}</p></section>)}
      {nonEmpty(resume.projects).length > 0 && (
        <section className="cmp-section">
          <h2>Projects</h2>
          {resume.projects.map((p, i) => (
            <div className="cmp-entry" key={i}>
              <div className="cmp-line"><b>{p.name}</b>{p.description && ` — ${p.description}`}</div>
              {nonEmpty(p.bullets).length > 0 && <ul>{p.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>}
            </div>
          ))}
        </section>
      )}
      {nonEmpty(resume.certifications).length > 0 && (<section className="cmp-section"><h2>Certifications</h2><p>{resume.certifications.join(", ")}</p></section>)}
    </div>
  );
}
