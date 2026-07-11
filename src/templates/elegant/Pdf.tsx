import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Resume } from "@/lib/resume-schema";
import { formatDateRange, joinContact, nonEmpty } from "../shared";

const ACCENT = "#0f766e"; // emerald
const s = StyleSheet.create({
  page: { padding: 50, fontSize: 10.5, fontFamily: "Helvetica", color: "#111", lineHeight: 1.5 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  accent: { width: 4, height: 54, backgroundColor: ACCENT, marginRight: 14 },
  name: { fontSize: 24, fontFamily: "Helvetica-Bold", letterSpacing: -0.4 },
  headline: { fontSize: 11, color: ACCENT, marginTop: 2, fontFamily: "Helvetica-Bold" },
  contact: { fontSize: 9.5, color: "#555", marginTop: 3 },
  h2: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: ACCENT, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 12, marginBottom: 6 },
  entry: { marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  left: { flex: 1, paddingRight: 8 },
  title: { fontFamily: "Helvetica-Bold", fontSize: 11 },
  dates: { color: "#666", fontSize: 9.5 },
  loc: { color: "#666", fontSize: 9.5, marginBottom: 2 },
  bullet: { flexDirection: "row", marginBottom: 1 },
  bulletDot: { width: 10, color: ACCENT },
  bulletText: { flex: 1 },
  chip: { fontSize: 9.5, marginRight: 6, color: "#333" },
});

const Bullets = ({ items }: { items: string[] }) => (
  <View>{items.map((b, i) => (<View key={i} style={s.bullet}><Text style={s.bulletDot}>▸</Text><Text style={s.bulletText}>{b}</Text></View>))}</View>
);

export function ElegantPdf({ resume }: { resume: Resume }) {
  const contact = joinContact(resume);
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View style={s.accent} />
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{resume.name || "Your Name"}</Text>
            {!!resume.headline && <Text style={s.headline}>{resume.headline}</Text>}
            {contact.length > 0 && <Text style={s.contact}>{contact.join("   ·   ")}</Text>}
          </View>
        </View>

        {!!resume.summary && (<View><Text style={s.h2}>Profile</Text><Text>{resume.summary}</Text></View>)}

        {nonEmpty(resume.experience).length > 0 && (
          <View>
            <Text style={s.h2}>Experience</Text>
            {resume.experience.map((e, i) => (
              <View key={i} style={s.entry} wrap={false}>
                <View style={s.row}>
                  <Text style={s.left}><Text style={s.title}>{e.title}</Text>{e.org ? ` · ${e.org}` : ""}</Text>
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
                  <Text style={s.left}><Text style={s.title}>{e.school}</Text>{(e.degree || e.field) ? ` · ${[e.degree, e.field].filter(Boolean).join(" in ")}` : ""}</Text>
                  <Text style={s.dates}>{formatDateRange(e.start, e.end)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {nonEmpty(resume.skills).length > 0 && (<View><Text style={s.h2}>Skills</Text><Text>{resume.skills.join("  ·  ")}</Text></View>)}
        {nonEmpty(resume.certifications).length > 0 && (<View><Text style={s.h2}>Certifications</Text><Text>{resume.certifications.join(" · ")}</Text></View>)}
      </Page>
    </Document>
  );
}
