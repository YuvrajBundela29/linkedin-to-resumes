import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Resume } from "@/lib/resume-schema";
import { formatDateRange, joinContact, nonEmpty } from "../shared";
import type { GenericVariant } from "./Html";

type Props = { resume: Resume; accent: string; variant: GenericVariant };

const base = StyleSheet.create({
  page: { fontSize: 10.5, fontFamily: "Helvetica", color: "#111827", lineHeight: 1.5 },
  entry: { marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  left: { flex: 1, paddingRight: 10 },
  title: { fontFamily: "Helvetica-Bold" },
  dates: { color: "#6b7280", fontSize: 9.5 },
  loc: { color: "#6b7280", fontSize: 9.5, marginBottom: 2 },
  bullet: { flexDirection: "row", marginBottom: 1.5 },
  dot: { width: 10 },
  bulletText: { flex: 1 },
});

const Bullets = ({ items, accent }: { items: string[]; accent: string }) => (
  <View>
    {items.map((b, i) => (
      <View key={i} style={base.bullet}>
        <Text style={[base.dot, { color: accent }]}>•</Text>
        <Text style={base.bulletText}>{b}</Text>
      </View>
    ))}
  </View>
);

function H2({ children, accent, variant }: { children: string; accent: string; variant: GenericVariant }) {
  return (
    <Text
      style={{
        fontSize: variant === "serif" ? 11.5 : 10,
        fontFamily: variant === "serif" ? "Times-Bold" : "Helvetica-Bold",
        color: variant === "line" ? "#111827" : accent,
        letterSpacing: variant === "serif" ? 0.4 : 1.4,
        textTransform: variant === "serif" ? "none" : "uppercase",
        borderBottomWidth: 1,
        borderBottomColor: variant === "line" ? "#d1d5db" : accent,
        paddingBottom: 3,
        marginTop: 12,
        marginBottom: 6,
      }}
    >
      {children}
    </Text>
  );
}

function Sections({ resume, accent, variant }: Props) {
  return (
    <View>
      {!!resume.summary && (
        <View>
          <H2 accent={accent} variant={variant}>{variant === "serif" ? "Profile" : "Summary"}</H2>
          <Text>{resume.summary}</Text>
        </View>
      )}

      {nonEmpty(resume.experience).length > 0 && (
        <View>
          <H2 accent={accent} variant={variant}>Experience</H2>
          {resume.experience.map((e, i) => (
            <View key={i} style={base.entry} wrap={false}>
              <View style={base.row}>
                <Text style={base.left}><Text style={base.title}>{e.title}</Text>{e.org ? ` — ${e.org}` : ""}</Text>
                <Text style={base.dates}>{formatDateRange(e.start, e.end, e.current)}</Text>
              </View>
              {!!e.location && <Text style={base.loc}>{e.location}</Text>}
              <Bullets items={nonEmpty(e.bullets)} accent={accent} />
            </View>
          ))}
        </View>
      )}

      {nonEmpty(resume.projects).length > 0 && (
        <View>
          <H2 accent={accent} variant={variant}>Projects</H2>
          {resume.projects.map((p, i) => (
            <View key={i} style={base.entry} wrap={false}>
              <Text style={base.title}>{p.name}</Text>
              {!!p.description && <Text style={base.loc}>{p.description}</Text>}
              <Bullets items={nonEmpty(p.bullets)} accent={accent} />
            </View>
          ))}
        </View>
      )}

      {nonEmpty(resume.education).length > 0 && (
        <View>
          <H2 accent={accent} variant={variant}>Education</H2>
          {resume.education.map((e, i) => (
            <View key={i} style={base.entry} wrap={false}>
              <View style={base.row}>
                <Text style={base.left}>
                  <Text style={base.title}>{e.school}</Text>
                  {(e.degree || e.field) ? ` — ${[e.degree, e.field].filter(Boolean).join(" in ")}` : ""}
                </Text>
                <Text style={base.dates}>{formatDateRange(e.start, e.end)}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export function GenericPdf({ resume, accent, variant }: Props) {
  const contact = joinContact(resume);
  const skills = nonEmpty(resume.skills);
  const certs = nonEmpty(resume.certifications);

  if (variant === "sidebar") {
    return (
      <Document>
        <Page size="A4" style={[base.page, { flexDirection: "row" }]}>
          <View style={{ width: 165, backgroundColor: accent, color: "#fff", padding: 20 }}>
            <Text style={{ fontSize: 17, fontFamily: "Helvetica-Bold", lineHeight: 1.25 }}>{resume.name || "Your Name"}</Text>
            {!!resume.headline && <Text style={{ fontSize: 9.5, marginTop: 4, opacity: 0.9 }}>{resume.headline}</Text>}
            {contact.length > 0 && (
              <View style={{ marginTop: 14 }}>
                {contact.map((c, i) => <Text key={i} style={{ fontSize: 8.5, marginBottom: 3, opacity: 0.9 }}>{c}</Text>)}
              </View>
            )}
            {skills.length > 0 && (
              <View style={{ marginTop: 16 }}>
                <Text style={{ fontSize: 8.5, letterSpacing: 1.2, fontFamily: "Helvetica-Bold", marginBottom: 4, opacity: 0.8 }}>SKILLS</Text>
                {skills.map((s, i) => <Text key={i} style={{ fontSize: 8.5, marginBottom: 2 }}>{s}</Text>)}
              </View>
            )}
            {certs.length > 0 && (
              <View style={{ marginTop: 16 }}>
                <Text style={{ fontSize: 8.5, letterSpacing: 1.2, fontFamily: "Helvetica-Bold", marginBottom: 4, opacity: 0.8 }}>CERTIFICATIONS</Text>
                {certs.map((s, i) => <Text key={i} style={{ fontSize: 8.5, marginBottom: 2 }}>{s}</Text>)}
              </View>
            )}
          </View>
          <View style={{ flex: 1, padding: 28 }}>
            <Sections resume={resume} accent={accent} variant={variant} />
          </View>
        </Page>
      </Document>
    );
  }

  return (
    <Document>
      <Page size="A4" style={[base.page, { padding: variant === "band" ? 0 : 44 }]}>
        {variant === "band" ? (
          <View style={{ backgroundColor: accent, color: "#fff", paddingVertical: 24, paddingHorizontal: 44 }}>
            <Text style={{ fontSize: 22, fontFamily: "Helvetica-Bold", lineHeight: 1.25 }}>{resume.name || "Your Name"}</Text>
            {!!resume.headline && <Text style={{ fontSize: 10.5, marginTop: 3, opacity: 0.92 }}>{resume.headline}</Text>}
            {contact.length > 0 && <Text style={{ fontSize: 9, marginTop: 5, opacity: 0.85 }}>{contact.join("   ·   ")}</Text>}
          </View>
        ) : (
          <View style={{ borderBottomWidth: 2, borderBottomColor: accent, paddingBottom: 9, alignItems: variant === "serif" ? "center" : "flex-start" }}>
            <Text style={{
              fontSize: 22,
              fontFamily: variant === "serif" ? "Times-Bold" : "Helvetica-Bold",
              letterSpacing: variant === "serif" ? 1 : -0.3,
              lineHeight: 1.25,
            }}>{resume.name || "Your Name"}</Text>
            {!!resume.headline && <Text style={{ fontSize: 10.5, color: accent, fontFamily: "Helvetica-Bold", marginTop: 2 }}>{resume.headline}</Text>}
            {contact.length > 0 && <Text style={{ fontSize: 9.5, color: "#6b7280", marginTop: 4 }}>{contact.join("   ·   ")}</Text>}
          </View>
        )}

        <View style={{ paddingHorizontal: variant === "band" ? 44 : 0, paddingBottom: variant === "band" ? 40 : 0 }}>
          <Sections resume={resume} accent={accent} variant={variant} />
          {skills.length > 0 && (
            <View><H2 accent={accent} variant={variant}>Skills</H2><Text>{skills.join("  ·  ")}</Text></View>
          )}
          {certs.length > 0 && (
            <View><H2 accent={accent} variant={variant}>Certifications</H2><Text>{certs.join("  ·  ")}</Text></View>
          )}
        </View>
      </Page>
    </Document>
  );
}
