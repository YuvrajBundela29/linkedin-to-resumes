import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Resume } from "@/lib/resume-schema";
import { formatDateRange, joinContact, nonEmpty } from "../shared";

const ACCENT = "#dc5c3a"; // warm coral
const s = StyleSheet.create({
  page: { fontSize: 10.5, fontFamily: "Helvetica", color: "#111", lineHeight: 1.45 },
  header: { backgroundColor: ACCENT, padding: 34, color: "#fff" },
  name: { fontSize: 26, fontFamily: "Helvetica-Bold", color: "#fff", letterSpacing: -0.4 },
  headline: { fontSize: 11.5, color: "#fff", marginTop: 3, opacity: 0.95 },
  contact: { fontSize: 9.5, color: "#fff", marginTop: 5, opacity: 0.9 },
  body: { padding: 40 },
  h2: { fontSize: 11, fontFamily: "Helvetica-Bold", color: ACCENT, textTransform: "uppercase", letterSpacing: 1.4, marginTop: 12, marginBottom: 6 },
  entry: { marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  left: { flex: 1, paddingRight: 8 },
  title: { fontFamily: "Helvetica-Bold", fontSize: 11 },
  dates: { color: "#666", fontSize: 9.5 },
  sub: { color: "#555", fontSize: 10, marginBottom: 2 },
  bullet: { flexDirection: "row", marginBottom: 1 },
  bulletDot: { width: 10, color: ACCENT },
  bulletText: { flex: 1 },
});

const Bullets = ({ items }: { items: string[] }) => (
  <View>{items.map((b, i) => (<View key={i} style={s.bullet}><Text style={s.bulletDot}>•</Text><Text style={s.bulletText}>{b}</Text></View>))}</View>
);

export function CreativePdf({ resume }: { resume: Resume }) {
  const contact = joinContact(resume);
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.name}>{resume.name || "Your Name"}</Text>
          {!!resume.headline && <Text style={s.headline}>{resume.headline}</Text>}
          {contact.length > 0 && <Text style={s.contact}>{contact.join(" • ")}</Text>}
        </View>
        <View style={s.body}>
          {!!resume.summary && (<View><Text style={s.h2}>About</Text><Text>{resume.summary}</Text></View>)}
          {nonEmpty(resume.experience).length > 0 && (
            <View>
              <Text style={s.h2}>Experience</Text>
              {resume.experience.map((e, i) => (
                <View key={i} style={s.entry} wrap={false}>
                  <View style={s.row}>
                    <Text style={[s.title, s.left]}>{e.title}</Text>
                    <Text style={s.dates}>{formatDateRange(e.start, e.end, e.current)}</Text>
                  </View>
                  <Text style={s.sub}>{[e.org, e.location].filter(Boolean).join(" • ")}</Text>
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
                    <Text style={[s.title, s.left]}>{e.school}</Text>
                    <Text style={s.dates}>{formatDateRange(e.start, e.end)}</Text>
                  </View>
                  <Text style={s.sub}>{[e.degree, e.field].filter(Boolean).join(" in ")}</Text>
                </View>
              ))}
            </View>
          )}
          {nonEmpty(resume.skills).length > 0 && (<View><Text style={s.h2}>Skills</Text><Text>{resume.skills.join(" • ")}</Text></View>)}
          {nonEmpty(resume.certifications).length > 0 && (<View><Text style={s.h2}>Certifications</Text><Text>{resume.certifications.join(" • ")}</Text></View>)}
        </View>
      </Page>
    </Document>
  );
}
