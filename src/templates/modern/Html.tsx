import type { Resume } from "@/lib/resume-schema";
import { formatDateRange, joinContact, nonEmpty } from "../shared";

// Modern: bigger name, thin accent rule, more whitespace.
export function ModernHtml({ resume }: { resume: Resume }) {
  const contact = joinContact(resume);
  return (
    <div className="resume-page resume-modern">
      <header className="mod-header">
        <h1 className="mod-name">{resume.name || "Your Name"}</h1>
        {resume.headline && <div className="mod-headline">{resume.headline}</div>}
        {contact.length > 0 && <div className="mod-contact">{contact.join(" · ")}</div>}
        <div className="mod-rule" />
      </header>

      {resume.summary && (
        <section className="mod-section">
          <h2>Summary</h2>
          <p>{resume.summary}</p>
        </section>
      )}

      {nonEmpty(resume.experience).length > 0 && (
        <section className="mod-section">
          <h2>Experience</h2>
          {resume.experience.map((exp, i) => (
            <div className="mod-entry" key={i}>
              <div className="mod-entry-head">
                <div className="mod-title">{exp.title}</div>
                <div className="mod-dates">{formatDateRange(exp.start, exp.end, exp.current)}</div>
              </div>
              <div className="mod-sub">{[exp.org, exp.location].filter(Boolean).join(" • ")}</div>
              {nonEmpty(exp.bullets).length > 0 && (
                <ul>{exp.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>
              )}
            </div>
          ))}
        </section>
      )}

      {nonEmpty(resume.education).length > 0 && (
        <section className="mod-section">
          <h2>Education</h2>
          {resume.education.map((ed, i) => (
            <div className="mod-entry" key={i}>
              <div className="mod-entry-head">
                <div className="mod-title">{ed.school}</div>
                <div className="mod-dates">{formatDateRange(ed.start, ed.end)}</div>
              </div>
              <div className="mod-sub">{[ed.degree, ed.field].filter(Boolean).join(" in ")}</div>
              {nonEmpty(ed.bullets).length > 0 && (
                <ul>{ed.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>
              )}
            </div>
          ))}
        </section>
      )}

      {nonEmpty(resume.skills).length > 0 && (
        <section className="mod-section">
          <h2>Skills</h2>
          <p>{resume.skills.join(" · ")}</p>
        </section>
      )}

      {nonEmpty(resume.projects).length > 0 && (
        <section className="mod-section">
          <h2>Projects</h2>
          {resume.projects.map((p, i) => (
            <div className="mod-entry" key={i}>
              <div className="mod-title">{p.name}</div>
              {p.description && <div className="mod-sub">{p.description}</div>}
              {nonEmpty(p.bullets).length > 0 && (
                <ul>{p.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>
              )}
            </div>
          ))}
        </section>
      )}

      {nonEmpty(resume.certifications).length > 0 && (
        <section className="mod-section">
          <h2>Certifications</h2>
          <p>{resume.certifications.join(" · ")}</p>
        </section>
      )}
    </div>
  );
}
