import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Resume } from "@/lib/resume-schema";
import { formatDateRange, joinContact, nonEmpty } from "../shared";

const s = StyleSheet.create({
  page: { padding: 48, fontSize: 10.5, fontFamily: "Helvetica", color: "#111", lineHeight: 1.4 },
  name: { fontSize: 22, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  headline: { fontSize: 11, color: "#444", marginBottom: 4 },
  contact: { fontSize: 9.5, color: "#444", marginBottom: 12 },
  h2: { fontSize: 11, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 1, borderBottom: 1, borderColor: "#000", paddingBottom: 2, marginTop: 12, marginBottom: 6 },
  entry: { marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  left: { flex: 1, paddingRight: 8 },
  title: { fontFamily: "Helvetica-Bold" },
  dates: { color: "#555", fontSize: 9.5 },
  loc: { color: "#555", fontSize: 9.5, marginBottom: 2 },
  bullet: { flexDirection: "row", marginBottom: 1 },
  bulletDot: { width: 10, textAlign: "left" },
  bulletText: { flex: 1 },
  para: { marginBottom: 4 },
});

const Bullets = ({ items }: { items: string[] }) => (
  <View>
    {items.map((b, i) => (
      <View key={i} style={s.bullet}>
        <Text style={s.bulletDot}>•</Text>
        <Text style={s.bulletText}>{b}</Text>
      </View>
    ))}
  </View>
);

export function ClassicPdf({ resume }: { resume: Resume }) {
  const contact = joinContact(resume);
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.name}>{resume.name || "Your Name"}</Text>
        {!!resume.headline && <Text style={s.headline}>{resume.headline}</Text>}
        {contact.length > 0 && <Text style={s.contact}>{contact.join("  •  ")}</Text>}

        {!!resume.summary && (
          <View>
            <Text style={s.h2}>Summary</Text>
            <Text style={s.para}>{resume.summary}</Text>
          </View>
        )}

        {nonEmpty(resume.experience).length > 0 && (
          <View>
            <Text style={s.h2}>Experience</Text>
            {resume.experience.map((e, i) => (
              <View key={i} style={s.entry} wrap={false}>
                <View style={s.row}>
                  <Text style={s.left}><Text style={s.title}>{e.title}</Text>{e.org ? `, ${e.org}` : ""}</Text>
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
                  <Text><Text style={s.title}>{e.school}</Text>{(e.degree || e.field) ? `, ${[e.degree, e.field].filter(Boolean).join(" in ")}` : ""}</Text>
                  <Text style={s.dates}>{formatDateRange(e.start, e.end)}</Text>
                </View>
                <Bullets items={nonEmpty(e.bullets)} />
              </View>
            ))}
          </View>
        )}

        {nonEmpty(resume.skills).length > 0 && (
          <View>
            <Text style={s.h2}>Skills</Text>
            <Text style={s.para}>{resume.skills.join(" • ")}</Text>
          </View>
        )}

        {nonEmpty(resume.projects).length > 0 && (
          <View>
            <Text style={s.h2}>Projects</Text>
            {resume.projects.map((p, i) => (
              <View key={i} style={s.entry} wrap={false}>
                <Text style={s.title}>{p.name}</Text>
                {!!p.description && <Text style={s.loc}>{p.description}</Text>}
                <Bullets items={nonEmpty(p.bullets)} />
              </View>
            ))}
          </View>
        )}

        {nonEmpty(resume.certifications).length > 0 && (
          <View>
            <Text style={s.h2}>Certifications</Text>
            <Text style={s.para}>{resume.certifications.join(" • ")}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
