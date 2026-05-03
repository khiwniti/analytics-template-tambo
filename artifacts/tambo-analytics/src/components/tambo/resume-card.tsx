"use client";

import * as React from "react";
import { z } from "zod";
import { getPortfolioProfile, type PortfolioProfile } from "@/services/portfolio-data";

export const resumeCardSchema = z.object({
  targetRole: z.string().describe("The job role or position being applied for"),
  targetCompany: z
    .string()
    .optional()
    .describe("The company name (optional, for personalization)"),
  requesterType: z
    .enum(["hr", "recruiter", "technical", "general"])
    .describe(
      "Type of person requesting: hr (culture fit + background), recruiter (scannable facts), technical (depth on stack), general (balanced overview)",
    ),
  emphasis: z
    .array(z.string())
    .describe(
      "Skill category names to highlight, e.g. ['AI / Agents', 'Full-Stack', 'Engineering', 'Thai Government']",
    ),
  summary: z
    .string()
    .describe(
      "AI-generated custom 2-3 sentence summary tailored to this role and requester type",
    ),
});

export type ResumeCardProps = z.infer<typeof resumeCardSchema>;

const C = {
  bg: "#FAFAF7",
  surface: "#FFFFFF",
  border: "rgba(15,23,42,0.08)",
  accent: "#B0593A",
  accentDim: "rgba(176,89,58,0.65)",
  text: "#1F2937",
  muted: "#6B7280",
  tag: "rgba(176,89,58,0.10)",
};

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
          paddingBottom: 6,
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: C.accent,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 9,
            fontFamily: "JetBrains Mono, monospace",
            color: C.accentDim,
            letterSpacing: 2.5,
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

function SkillPill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 20,
        fontSize: 10,
        fontFamily: "JetBrains Mono, monospace",
        background: C.tag,
        border: `1px solid ${C.border}`,
        color: C.accent,
        marginRight: 4,
        marginBottom: 4,
      }}
    >
      {children}
    </span>
  );
}

async function generatePdf(props: ResumeCardProps, p: PortfolioProfile) {
  const { default: jsPDF } = await import("jspdf");
  const autoTableModule = await import("jspdf-autotable");
  const autoTable = autoTableModule.default;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Colors: header = dark bg with white/green text; body = white bg with dark text
  const accent: [number, number, number] = [16, 120, 80];     // dark green, readable on white
  const accentHeader: [number, number, number] = [52, 211, 153]; // bright green for dark bg
  const dark: [number, number, number] = [10, 14, 23];
  const darkBg: [number, number, number] = [22, 27, 34];
  const whiteText: [number, number, number] = [230, 237, 243];  // for dark backgrounds only
  const bodyText: [number, number, number] = [30, 30, 40];      // dark, readable on white page
  const subText: [number, number, number] = [80, 90, 100];      // muted dark, readable on white

  // Header bar — dark bg, white/green text
  doc.setFillColor(...dark);
  doc.rect(0, 0, 210, 40, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...whiteText);
  doc.text(p.name, 14, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...accentHeader);
  const headLine = props.targetRole ? `${p.title.split("·")[0].trim()} — ${props.targetRole}` : p.title;
  doc.text(headLine, 14, 27);

  doc.setFontSize(8);
  doc.setTextColor(...whiteText);
  doc.text([p.email, p.website, p.location].join("   ·   "), 14, 35);

  // --- Relevance scoring helpers ---
  const keywords = [
    ...props.emphasis.map((e) => e.toLowerCase()),
    ...(props.targetRole ? props.targetRole.toLowerCase().split(/\s+/) : []),
    ...(props.requesterType ? props.requesterType.toLowerCase().split(/\s+/) : []),
  ].filter(Boolean);

  function scoreText(text: string): number {
    if (!keywords.length) return 0;
    const lower = text.toLowerCase();
    return keywords.reduce((acc, kw) => acc + (lower.includes(kw) ? 1 : 0), 0);
  }

  function scoredSort<T>(items: T[], getTexts: (item: T) => string[]): T[] {
    if (!keywords.length) return items;
    return [...items].sort((a, b) => {
      const sa = getTexts(a).reduce((sum, t) => sum + scoreText(t), 0);
      const sb = getTexts(b).reduce((sum, t) => sum + scoreText(t), 0);
      return sb - sa;
    });
  }

  const rankedCareer = scoredSort(p.career, (j) => [j.role, j.company, j.description]).slice(0, 5);
  const rankedProjects = scoredSort(p.projects, (pr) => [pr.name, pr.description, pr.tag]).slice(0, 4);
  // --- End relevance scoring ---

  let y = 48;

  // Custom summary box — dark bg, white text
  doc.setFillColor(...darkBg);
  const summaryLines = doc.splitTextToSize(props.summary, 180);
  doc.roundedRect(10, y - 2, 190, summaryLines.length * 5 + 8, 2, 2, "F");
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(...whiteText);
  doc.text(summaryLines, 14, y + 4);
  y += summaryLines.length * 5 + 14;

  // Skills — dark label, dark body text on white page
  const allSkills = props.emphasis.length
    ? p.skills
        .filter((s) =>
          props.emphasis.some(
            (e) => s.category.toLowerCase().includes(e.toLowerCase()) || e.toLowerCase().includes(s.category.toLowerCase().split(" ")[0]),
          ),
        )
        .flatMap((s) => s.items)
        .slice(0, 16)
    : p.skills.slice(0, 2).flatMap((s) => s.items).slice(0, 16);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...accent);
  doc.text("SKILLS", 14, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...bodyText);
  const skillText = (allSkills.length ? allSkills : p.skills[0].items).join("  ·  ");
  const skillLines = doc.splitTextToSize(skillText, 182);
  doc.text(skillLines, 14, y);
  y += skillLines.length * 4 + 8;

  // Experience — dark header rows, dark body text on white
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...accent);
  doc.text("EXPERIENCE", 14, y);
  y += 3;

  for (const job of rankedCareer) {
    autoTable(doc, {
      startY: y,
      head: [[`${job.role}`, `${job.company}  |  ${job.year}`]],
      body: [[job.description, ""]],
      theme: "plain",
      styles: { fontSize: 8, cellPadding: 1.5, textColor: bodyText },
      headStyles: { fillColor: darkBg, textColor: whiteText, fontStyle: "bold", fontSize: 9 },
      columnStyles: { 0: { cellWidth: 130 }, 1: { cellWidth: 60, halign: "right", textColor: subText } },
      margin: { left: 10, right: 10 },
    });
    const finalY = (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 14;
    y = finalY + 3;
  }

  // Projects — dark header rows, dark body text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...accent);
  doc.text("SELECTED PROJECTS", 14, y);
  y += 3;

  for (const proj of rankedProjects) {
    autoTable(doc, {
      startY: y,
      head: [[`${proj.name}  [${proj.tag}]`, proj.url]],
      body: [[proj.description, ""]],
      theme: "plain",
      styles: { fontSize: 8, cellPadding: 1.5, textColor: bodyText },
      headStyles: { fillColor: darkBg, textColor: whiteText, fontStyle: "bold", fontSize: 9 },
      columnStyles: { 0: { cellWidth: 130 }, 1: { cellWidth: 60, halign: "right", textColor: subText } },
      margin: { left: 10, right: 10 },
    });
    const finalY = (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 10;
    y = finalY + 2;
  }

  // Education — dark readable text on white page
  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...accent);
  doc.text("EDUCATION", 14, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...bodyText);
  doc.text(`${p.education.degree}  ·  ${p.education.university}  ·  ${p.education.years}`, 14, y + 6);
  doc.setTextColor(...subText);
  doc.text(p.education.honors + " · " + p.education.languages, 14, y + 12);

  const slug = props.targetRole.toLowerCase().replace(/\s+/g, "-");
  doc.save(`ikkyu-resume-${slug}.pdf`);
}

export const ResumeCard = React.forwardRef<HTMLDivElement, ResumeCardProps>(
  (props, ref) => {
    const { targetRole, targetCompany, requesterType, emphasis, summary } = props;
    const [downloading, setDownloading] = React.useState(false);
    const [p, setP] = React.useState<PortfolioProfile | null>(null);

    React.useEffect(() => {
      getPortfolioProfile().then(setP).catch(console.error);
    }, []);

    const highlightedSkills = React.useMemo(() => {
      if (!p) return [];
      if (!emphasis.length) {
        return p.skills.slice(0, 2).flatMap((s) => s.items).slice(0, 12);
      }
      const matched = p.skills
        .filter((s) =>
          emphasis.some(
            (e) => s.category.toLowerCase().includes(e.toLowerCase()) || e.toLowerCase().includes(s.category.toLowerCase().split(" ")[0]),
          ),
        )
        .flatMap((s) => s.items)
        .slice(0, 14);
      return matched.length ? matched : p.skills.slice(0, 2).flatMap((s) => s.items).slice(0, 12);
    }, [emphasis, p]);

    const handleDownload = async () => {
      if (!p) return;
      setDownloading(true);
      try {
        await generatePdf(props, p);
      } finally {
        setDownloading(false);
      }
    };

    if (!p) {
      return (
        <div
          ref={ref}
          style={{
            padding: "24px 28px",
            color: C.muted,
            width: "100%",
            boxSizing: "border-box" as const,
            textAlign: "center",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 12,
          }}
        >
          Loading resume…
        </div>
      );
    }

    return (
      <div
        ref={ref}
        style={{
          padding: "24px 28px",
          fontFamily: "Quicksand, sans-serif",
          color: C.text,
          width: "100%",
          boxSizing: "border-box" as const,
          position: "relative",
        }}
      >
        {/* Gradient top accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background:
              "linear-gradient(90deg, transparent, rgba(176,89,58,0.7) 30%, rgba(176,89,58,0.9) 50%, rgba(176,89,58,0.7) 70%, transparent)",
            borderRadius: "16px 16px 0 0",
          }}
        />
        {/* Corner glow */}
        <div
          style={{
            position: "absolute",
            top: -60,
            left: -60,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(176,89,58,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text, lineHeight: 1.2 }}>
                {p.name}
              </h2>
              <div style={{ fontSize: 12, color: C.accent, fontWeight: 600, marginTop: 4 }}>
                {targetRole ? `AI-Augmented Full-Stack Developer → ${targetRole}` : p.title}
                {targetCompany && (
                  <span style={{ color: C.muted, fontWeight: 400 }}> @ {targetCompany}</span>
                )}
              </div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 6, fontFamily: "JetBrains Mono, monospace" }}>
                {p.email} · {p.website} · {p.location}
              </div>
            </div>
            <button
              onClick={handleDownload}
              disabled={downloading}
              style={{
                background: "rgba(176,89,58,0.15)",
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: "8px 14px",
                color: C.accent,
                fontSize: 11,
                fontWeight: 700,
                cursor: downloading ? "not-allowed" : "pointer",
                fontFamily: "JetBrains Mono, monospace",
                flexShrink: 0,
                transition: "all 0.2s",
                whiteSpace: "nowrap",
                opacity: downloading ? 0.6 : 1,
              }}
              onMouseEnter={(e) => { if (!downloading) e.currentTarget.style.background = "rgba(176,89,58,0.25)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(176,89,58,0.15)"; }}
            >
              {downloading ? "Generating..." : "⬇ Download PDF"}
            </button>
          </div>
        </div>

        {/* Summary */}
        <Section label="Summary">
          <p style={{ margin: 0, fontSize: 13, color: C.text, lineHeight: 1.6, fontStyle: "italic", opacity: 0.9 }}>
            {summary}
          </p>
        </Section>

        {/* Skills */}
        <Section label="Highlighted Skills">
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {highlightedSkills.map((s) => (
              <SkillPill key={s}>{s}</SkillPill>
            ))}
          </div>
        </Section>

        {/* Experience */}
        <Section label="Experience">
          {p.career.slice(0, requesterType === "technical" ? 5 : 4).map((job) => (
            <div
              key={`${job.year}-${job.company}`}
              style={{ marginBottom: 14, paddingLeft: 10, borderLeft: `2px solid ${C.border}` }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{job.role}</span>
                <span style={{ fontSize: 9, color: C.muted, fontFamily: "JetBrains Mono, monospace", flexShrink: 0 }}>
                  {job.year}
                </span>
              </div>
              <div style={{ fontSize: 11, color: C.accent, marginBottom: 3 }}>{job.company}</div>
              <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>{job.description}</div>
            </div>
          ))}
        </Section>

        {/* Projects */}
        <Section label="Featured Projects">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {p.projects.slice(0, 4).map((proj) => (
              <a
                key={proj.name}
                href={proj.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  padding: "10px 12px",
                  textDecoration: "none",
                  display: "block",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(176,89,58,0.35)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 2 }}>{proj.name}</div>
                <span style={{ fontSize: 8, background: C.tag, color: C.accent, padding: "1px 6px", borderRadius: 10, fontFamily: "JetBrains Mono, monospace" }}>
                  {proj.tag}
                </span>
                <p style={{ fontSize: 10, color: C.muted, marginTop: 4, marginBottom: 0, lineHeight: 1.4 }}>
                  {proj.description.substring(0, 70)}…
                </p>
              </a>
            ))}
          </div>
        </Section>

        {/* Education */}
        <Section label="Education">
          <div style={{ fontSize: 12, color: C.text }}>{p.education.degree}</div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
            {p.education.university} · {p.education.years} ·{" "}
            <span style={{ color: C.accent }}>{p.education.honors}</span>
          </div>
        </Section>

        <div style={{ marginTop: 8, paddingTop: 12, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 9, color: C.muted, fontFamily: "JetBrains Mono, monospace" }}>
            Tailored for: {requesterType.toUpperCase()}{targetCompany ? ` · ${targetCompany}` : ""}
          </span>
          <span style={{ fontSize: 9, color: C.accentDim, fontFamily: "JetBrains Mono, monospace" }}>khiw.dev</span>
        </div>
      </div>
    );
  },
);

ResumeCard.displayName = "ResumeCard";
