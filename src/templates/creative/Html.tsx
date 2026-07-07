import type { Resume } from "@/lib/resume-schema";
import { formatDateRange, joinContact, nonEmpty } from "../shared";

// Creative: colored header band, warm coral accent, still single-column ATS-safe.
export function CreativeHtml({ resume }: { resume: Resume }) {
  const contact = joinContact(resume);
  return (
    <div className="resume-page resume-creative">
      <header className="cre-header">
        <h1 className="cre-name">{resume.name || "Your Name"}</h1>
        {resume.headline && <div className="cre-headline">{resume.headline}</div>}
        {contact.length > 0 && <div className="cre-contact">{contact.join(" • ")}</div>}
      </header>

      <div className="cre-body">
        {resume.summary && (
          <section className="cre-section"><h2>About</h2><p>{resume.summary}</p></section>
        )}

        {nonEmpty(resume.experience).length > 0 && (
          <section className="cre-section">
            <h2>Experience</h2>
            {resume.experience.map((exp, i) => (
              <div className="cre-entry" key={i}>
                <div className="cre-entry-head">
                  <div className="cre-title">{exp.title}</div>
                  <div className="cre-dates">{formatDateRange(exp.start, exp.end, exp.current)}</div>
                </div>
                <div className="cre-sub">{[exp.org, exp.location].filter(Boolean).join(" • ")}</div>
                {nonEmpty(exp.bullets).length > 0 && <ul>{exp.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>}
              </div>
            ))}
          </section>
        )}

        {nonEmpty(resume.education).length > 0 && (
          <section className="cre-section">
            <h2>Education</h2>
            {resume.education.map((ed, i) => (
              <div className="cre-entry" key={i}>
                <div className="cre-entry-head">
                  <div className="cre-title">{ed.school}</div>
                  <div className="cre-dates">{formatDateRange(ed.start, ed.end)}</div>
                </div>
                <div className="cre-sub">{[ed.degree, ed.field].filter(Boolean).join(" in ")}</div>
              </div>
            ))}
          </section>
        )}

        {nonEmpty(resume.skills).length > 0 && (
          <section className="cre-section">
            <h2>Skills</h2>
            <div className="cre-chips">{resume.skills.map((s, i) => <span key={i} className="cre-chip">{s}</span>)}</div>
          </section>
        )}
        {nonEmpty(resume.projects).length > 0 && (
          <section className="cre-section">
            <h2>Projects</h2>
            {resume.projects.map((p, i) => (
              <div className="cre-entry" key={i}>
                <div className="cre-title">{p.name}</div>
                {p.description && <div className="cre-sub">{p.description}</div>}
                {nonEmpty(p.bullets).length > 0 && <ul>{p.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>}
              </div>
            ))}
          </section>
        )}
        {nonEmpty(resume.certifications).length > 0 && (
          <section className="cre-section"><h2>Certifications</h2><p>{resume.certifications.join(" • ")}</p></section>
        )}
      </div>
    </div>
  );
}
