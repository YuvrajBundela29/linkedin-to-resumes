import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Resume } from "@/lib/resume-schema";
import { formatDateRange, joinContact, nonEmpty } from "../shared";

const s = StyleSheet.create({
  page: { padding: 46, fontSize: 10, fontFamily: "Helvetica", color: "#111", lineHeight: 1.4 },
  name: { fontSize: 20, fontFamily: "Helvetica-Bold" },
  headline: { fontSize: 10.5, color: "#333", marginTop: 2 },
  contact: { fontSize: 9.5, color: "#555", marginTop: 2, marginBottom: 10 },
  h2: { fontSize: 10, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 1, borderBottom: 0.75, borderColor: "#111", paddingBottom: 2, marginTop: 10, marginBottom: 5 },
  entry: { marginBottom: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  left: { flex: 1, paddingRight: 8 },
  bold: { fontFamily: "Helvetica-Bold" },
  dates: { color: "#666", fontSize: 9.5 },
  loc: { color: "#666", fontSize: 9.5 },
  skills: { fontSize: 10 },
  bullet: { flexDirection: "row", marginLeft: 6 },
  bulletDot: { width: 9 },
  bulletText: { flex: 1 },
});

const Bullets = ({ items }: { items: string[] }) => (
  <View>{items.map((b, i) => (<View key={i} style={s.bullet}><Text style={s.bulletDot}>•</Text><Text style={s.bulletText}>{b}</Text></View>))}</View>
);

export function TechnicalPdf({ resume }: { resume: Resume }) {
  const contact = joinContact(resume);
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.name}>{resume.name || "Your Name"}</Text>
        {!!resume.headline && <Text style={s.headline}>{resume.headline}</Text>}
        {contact.length > 0 && <Text style={s.contact}>{contact.join("  ·  ")}</Text>}

        {!!resume.summary && (<View><Text style={s.h2}>Summary</Text><Text>{resume.summary}</Text></View>)}
        {nonEmpty(resume.skills).length > 0 && (<View><Text style={s.h2}>Skills</Text><Text style={s.skills}>{resume.skills.join(" | ")}</Text></View>)}

        {nonEmpty(resume.experience).length > 0 && (
          <View>
            <Text style={s.h2}>Experience</Text>
            {resume.experience.map((e, i) => (
              <View key={i} style={s.entry} wrap={false}>
                <View style={s.row}>
                  <Text><Text style={s.bold}>{e.title}</Text>{e.org ? ` — ${e.org}` : ""}</Text>
                  <Text style={s.dates}>{formatDateRange(e.start, e.end, e.current)}</Text>
                </View>
                {!!e.location && <Text style={s.loc}>{e.location}</Text>}
                <Bullets items={nonEmpty(e.bullets)} />
              </View>
            ))}
          </View>
        )}

        {nonEmpty(resume.projects).length > 0 && (
          <View>
            <Text style={s.h2}>Projects</Text>
            {resume.projects.map((p, i) => (
              <View key={i} style={s.entry} wrap={false}>
                <Text><Text style={s.bold}>{p.name}</Text>{p.description ? ` — ${p.description}` : ""}</Text>
                <Bullets items={nonEmpty(p.bullets)} />
              </View>
            ))}
          </View>
        )}

        {nonEmpty(resume.education).length > 0 && (
          <View>
            <Text style={s.h2}>Education</Text>
            {resume.education.map((e, i) => (
              <View key={i} style={s.entry} wrap={false}>
                <View style={s.row}>
                  <Text><Text style={s.bold}>{e.school}</Text>{(e.degree || e.field) ? ` — ${[e.degree, e.field].filter(Boolean).join(" in ")}` : ""}</Text>
                  <Text style={s.dates}>{formatDateRange(e.start, e.end)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {nonEmpty(resume.certifications).length > 0 && (<View><Text style={s.h2}>Certifications</Text><Text>{resume.certifications.join(" · ")}</Text></View>)}
      </Page>
    </Document>
  );
}
