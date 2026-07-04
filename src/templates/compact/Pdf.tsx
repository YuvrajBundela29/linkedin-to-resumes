import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Resume } from "@/lib/resume-schema";
import { formatDateRange, joinContact, nonEmpty } from "../shared";

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 9.5, fontFamily: "Helvetica", color: "#111", lineHeight: 1.35 },
  name: { fontSize: 16, fontFamily: "Helvetica-Bold" },
  headline: { fontSize: 10, color: "#333" },
  contact: { fontSize: 9, color: "#555", marginTop: 2, marginBottom: 8 },
  h2: { fontSize: 10, fontFamily: "Helvetica-Bold", borderBottom: 0.5, borderColor: "#999", marginTop: 8, marginBottom: 3 },
  entry: { marginBottom: 4 },
  line: { fontSize: 9.5 },
  dates: { color: "#666" },
  bold: { fontFamily: "Helvetica-Bold" },
  bullet: { flexDirection: "row", marginLeft: 8 },
  bulletDot: { width: 8 },
  bulletText: { flex: 1 },
});

const Bullets = ({ items }: { items: string[] }) => (
  <View>{items.map((b, i) => (<View key={i} style={s.bullet}><Text style={s.bulletDot}>•</Text><Text style={s.bulletText}>{b}</Text></View>))}</View>
);

export function CompactPdf({ resume }: { resume: Resume }) {
  const contact = joinContact(resume);
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text><Text style={s.name}>{resume.name || "Your Name"}</Text>{resume.headline ? <Text style={s.headline}> — {resume.headline}</Text> : null}</Text>
        {contact.length > 0 && <Text style={s.contact}>{contact.join(" | ")}</Text>}

        {!!resume.summary && (<View><Text style={s.h2}>Summary</Text><Text>{resume.summary}</Text></View>)}

        {nonEmpty(resume.experience).length > 0 && (
          <View>
            <Text style={s.h2}>Experience</Text>
            {resume.experience.map((e, i) => (
              <View key={i} style={s.entry} wrap={false}>
                <Text style={s.line}><Text style={s.bold}>{e.title}</Text>{e.org ? `, ${e.org}` : ""}{e.location ? ` · ${e.location}` : ""} <Text style={s.dates}>({formatDateRange(e.start, e.end, e.current)})</Text></Text>
                <Bullets items={nonEmpty(e.bullets)} />
              </View>
            ))}
          </View>
        )}

        {nonEmpty(resume.education).length > 0 && (
          <View>
            <Text style={s.h2}>Education</Text>
            {resume.education.map((e, i) => (
              <View key={i} style={s.entry} wrap={false}>
                <Text style={s.line}><Text style={s.bold}>{e.school}</Text>{(e.degree || e.field) ? `, ${[e.degree, e.field].filter(Boolean).join(" in ")}` : ""} <Text style={s.dates}>({formatDateRange(e.start, e.end)})</Text></Text>
              </View>
            ))}
          </View>
        )}

        {nonEmpty(resume.skills).length > 0 && (<View><Text style={s.h2}>Skills</Text><Text>{resume.skills.join(", ")}</Text></View>)}
        {nonEmpty(resume.projects).length > 0 && (
          <View>
            <Text style={s.h2}>Projects</Text>
            {resume.projects.map((p, i) => (
              <View key={i} style={s.entry} wrap={false}>
                <Text style={s.line}><Text style={s.bold}>{p.name}</Text>{p.description ? ` — ${p.description}` : ""}</Text>
                <Bullets items={nonEmpty(p.bullets)} />
              </View>
            ))}
          </View>
        )}
        {nonEmpty(resume.certifications).length > 0 && (<View><Text style={s.h2}>Certifications</Text><Text>{resume.certifications.join(", ")}</Text></View>)}
      </Page>
    </Document>
  );
}
