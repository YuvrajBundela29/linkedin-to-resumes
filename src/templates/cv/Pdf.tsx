import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Resume } from "@/lib/resume-schema";
import { formatDateRange, joinContact, nonEmpty } from "../shared";
import type { CvVariant } from "./Html";

type Props = { resume: Resume; variant: CvVariant };

const ACCENT: Record<CvVariant, string> = { standard: "#1e3a5f", academic: "#3f3f46" };

const s = StyleSheet.create({
  page: { fontSize: 10.5, color: "#111827", lineHeight: 1.5, paddingVertical: 44, paddingHorizontal: 46 },
  entry: { marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  left: { flex: 1, paddingRight: 10 },
  dates: { color: "#6b7280", fontSize: 9.5 },
  loc: { color: "#6b7280", fontSize: 9.5, marginBottom: 2 },
  bullet: { flexDirection: "row", marginBottom: 1.5 },
  dot: { width: 10 },
  bulletText: { flex: 1 },
});

export function CvPdf({ resume, variant }: Props) {
  const accent = ACCENT[variant];
  const serif = variant === "academic";
  const bold = serif ? "Times-Bold" : "Helvetica-Bold";
  const body = serif ? "Times-Roman" : "Helvetica";
  const contact = joinContact(resume);

  const H2 = ({ children }: { children: string }) => (
    <Text
      style={{
        fontSize: serif ? 11.5 : 10,
        fontFamily: bold,
        color: accent,
        letterSpacing: serif ? 0.4 : 1.3,
        textTransform: serif ? "none" : "uppercase",
        borderBottomWidth: 1,
        borderBottomColor: accent,
        paddingBottom: 3,
        marginTop: 13,
        marginBottom: 6,
      }}
    >
      {children}
    </Text>
  );

  const Bullets = ({ items }: { items: string[] }) => (
    <View>
      {items.map((b, i) => (
        <View key={i} style={s.bullet}>
          <Text style={[s.dot, { color: accent }]}>•</Text>
          <Text style={s.bulletText}>{b}</Text>
        </View>
      ))}
    </View>
  );

  const Roles = ({ items }: { items: Resume["experience"] }) => (
    <View>
      {items.map((e, i) => (
        <View key={i} style={s.entry} wrap={false}>
          <View style={s.row}>
            <Text style={s.left}><Text style={{ fontFamily: bold }}>{e.title}</Text>{e.org ? ` — ${e.org}` : ""}</Text>
            <Text style={s.dates}>{formatDateRange(e.start, e.end, e.current)}</Text>
          </View>
          {!!e.location && <Text style={s.loc}>{e.location}</Text>}
          <Bullets items={nonEmpty(e.bullets)} />
        </View>
      ))}
    </View>
  );

  const Education = () => (
    <View>
      <H2>Education</H2>
      {resume.education.map((e, i) => (
        <View key={i} style={s.entry} wrap={false}>
          <View style={s.row}>
            <Text style={s.left}>
              <Text style={{ fontFamily: bold }}>{e.school}</Text>
              {(e.degree || e.field) ? ` — ${[e.degree, e.field].filter(Boolean).join(" in ")}` : ""}
            </Text>
            <Text style={s.dates}>{formatDateRange(e.start, e.end)}</Text>
          </View>
          <Bullets items={nonEmpty(e.bullets)} />
        </View>
      ))}
    </View>
  );

  const Lines = ({ items }: { items: string[] }) => (
    <View>
      {items.map((t, i) => (
        <View key={i} style={s.bullet}>
          <Text style={[s.dot, { color: accent }]}>•</Text>
          <Text style={s.bulletText}>{t}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <Document>
      <Page size="A4" style={[s.page, { fontFamily: body }]}>
        <View style={{ borderBottomWidth: 2, borderBottomColor: accent, paddingBottom: 9, alignItems: serif ? "center" : "flex-start" }}>
          <Text style={{ fontSize: 22, fontFamily: bold, letterSpacing: serif ? 0.8 : -0.3, lineHeight: 1.25 }}>
            {resume.name || "Your Name"}
          </Text>
          {!!resume.headline && <Text style={{ fontSize: 10.5, color: accent, fontFamily: bold, marginTop: 2 }}>{resume.headline}</Text>}
          {contact.length > 0 && <Text style={{ fontSize: 9.5, color: "#6b7280", marginTop: 4 }}>{contact.join("   ·   ")}</Text>}
        </View>

        {!!resume.summary && (
          <View><H2>{serif ? "Research Profile" : "Profile"}</H2><Text>{resume.summary}</Text></View>
        )}

        {serif && nonEmpty(resume.education).length > 0 && <Education />}

        {nonEmpty(resume.experience).length > 0 && (
          <View>
            <H2>{serif ? "Academic & Professional Appointments" : "Professional Experience"}</H2>
            <Roles items={resume.experience} />
          </View>
        )}

        {nonEmpty(resume.research).length > 0 && <View><H2>Research Experience</H2><Roles items={resume.research!} /></View>}
        {nonEmpty(resume.teaching).length > 0 && <View><H2>Teaching Experience</H2><Roles items={resume.teaching!} /></View>}

        {nonEmpty(resume.publications).length > 0 && (
          <View>
            <H2>Publications</H2>
            {resume.publications!.map((p, i) => (
              <View key={i} style={{ flexDirection: "row", marginBottom: 3 }} wrap={false}>
                <Text style={{ width: 16, color: accent }}>{i + 1}.</Text>
                <Text style={{ flex: 1 }}>
                  {p.authors ? `${p.authors}. ` : ""}
                  <Text style={{ fontFamily: bold }}>{p.title}</Text>
                  {p.venue ? `, ${p.venue}` : ""}
                  {p.year ? `, ${p.year}` : ""}
                  {p.link ? ` · ${p.link}` : ""}
                </Text>
              </View>
            ))}
          </View>
        )}

        {nonEmpty(resume.projects).length > 0 && (
          <View>
            <H2>Projects</H2>
            {resume.projects.map((p, i) => (
              <View key={i} style={s.entry} wrap={false}>
                <Text style={{ fontFamily: bold }}>{p.name}</Text>
                {!!p.description && <Text style={s.loc}>{p.description}</Text>}
                <Bullets items={nonEmpty(p.bullets)} />
              </View>
            ))}
          </View>
        )}

        {!serif && nonEmpty(resume.education).length > 0 && <Education />}

        {nonEmpty(resume.grants).length > 0 && <View><H2>Grants & Funding</H2><Lines items={resume.grants!} /></View>}
        {nonEmpty(resume.talks).length > 0 && <View><H2>Talks & Presentations</H2><Lines items={resume.talks!} /></View>}
        {nonEmpty(resume.awards).length > 0 && <View><H2>Awards & Honours</H2><Lines items={resume.awards!} /></View>}

        {nonEmpty(resume.skills).length > 0 && <View><H2>Skills</H2><Text>{resume.skills.join("  ·  ")}</Text></View>}
        {nonEmpty(resume.certifications).length > 0 && <View><H2>Certifications</H2><Lines items={resume.certifications} /></View>}
        {nonEmpty(resume.languages).length > 0 && <View><H2>Languages</H2><Text>{resume.languages!.join("  ·  ")}</Text></View>}

        {nonEmpty(resume.references).length > 0 && (
          <View>
            <H2>References</H2>
            {resume.references!.map((r, i) => (
              <Text key={i} style={{ marginBottom: 3 }}>
                <Text style={{ fontFamily: bold }}>{r.name}</Text>
                {r.role ? `, ${r.role}` : ""}
                {r.org ? `, ${r.org}` : ""}
                {r.contact ? ` · ${r.contact}` : ""}
              </Text>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
