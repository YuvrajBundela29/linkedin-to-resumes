import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Resume } from "@/lib/resume-schema";
import { formatDateRange, joinContact, nonEmpty } from "../shared";

const NAVY = "#0f2a4a";
const s = StyleSheet.create({
  page: { padding: 54, fontSize: 10.5, fontFamily: "Times-Roman", color: "#111", lineHeight: 1.45 },
  header: { textAlign: "center", marginBottom: 10 },
  name: { fontSize: 24, fontFamily: "Times-Bold", color: NAVY, letterSpacing: 1 },
  headline: { fontSize: 11, color: "#333", marginTop: 3, fontFamily: "Times-Italic" },
  contact: { fontSize: 9.5, color: "#555", marginTop: 4 },
  rule: { height: 1.5, backgroundColor: NAVY, marginTop: 10, marginBottom: 6 },
  h2: { fontSize: 11, fontFamily: "Times-Bold", color: NAVY, textTransform: "uppercase", letterSpacing: 1.2, marginTop: 12, marginBottom: 5, borderBottom: 0.5, borderColor: "#888", paddingBottom: 2 },
  entry: { marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  left: { flex: 1, paddingRight: 8 },
  title: { fontFamily: "Times-Bold" },
  dates: { color: "#555", fontSize: 9.5, fontFamily: "Times-Italic" },
  loc: { color: "#666", fontSize: 9.5, fontFamily: "Times-Italic", marginBottom: 2 },
  bullet: { flexDirection: "row", marginBottom: 1 },
  bulletDot: { width: 10 },
  bulletText: { flex: 1 },
});

const Bullets = ({ items }: { items: string[] }) => (
  <View>{items.map((b, i) => (<View key={i} style={s.bullet}><Text style={s.bulletDot}>•</Text><Text style={s.bulletText}>{b}</Text></View>))}</View>
);

export function ExecutivePdf({ resume }: { resume: Resume }) {
  const contact = joinContact(resume);
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.name}>{(resume.name || "Your Name").toUpperCase()}</Text>
          {!!resume.headline && <Text style={s.headline}>{resume.headline}</Text>}
          {contact.length > 0 && <Text style={s.contact}>{contact.join("  |  ")}</Text>}
        </View>
        <View style={s.rule} />

        {!!resume.summary && (<View><Text style={s.h2}>Executive Summary</Text><Text>{resume.summary}</Text></View>)}

        {nonEmpty(resume.experience).length > 0 && (
          <View>
            <Text style={s.h2}>Professional Experience</Text>
            {resume.experience.map((e, i) => (
              <View key={i} style={s.entry} wrap={false}>
                <View style={s.row}>
                  <Text><Text style={s.title}>{e.title}</Text>{e.org ? ` — ${e.org}` : ""}</Text>
                  <Text style={s.dates}>{formatDateRange(e.start, e.end, e.current)}</Text>
                </View>
                {!!e.location && <Text style={s.loc}>{e.location}</Text>}
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
                <View style={s.row}>
                  <Text><Text style={s.title}>{e.school}</Text>{(e.degree || e.field) ? ` — ${[e.degree, e.field].filter(Boolean).join(" in ")}` : ""}</Text>
                  <Text style={s.dates}>{formatDateRange(e.start, e.end)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {nonEmpty(resume.skills).length > 0 && (<View><Text style={s.h2}>Core Competencies</Text><Text>{resume.skills.join("  •  ")}</Text></View>)}
        {nonEmpty(resume.certifications).length > 0 && (<View><Text style={s.h2}>Certifications</Text><Text>{resume.certifications.join("  •  ")}</Text></View>)}
      </Page>
    </Document>
  );
}
