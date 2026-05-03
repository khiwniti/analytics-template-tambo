import { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import {
  getPortfolioProfile,
  projectSlug,
  type PortfolioProject,
  type PortfolioProfile,
} from "../services/portfolio-data";

const C = {
  primary: "#0a0e17",
  surface: "rgba(255,255,255,0.03)",
  surfaceHover: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.08)",
  accent: "#34D399",
  accentDim: "rgba(52,211,153,0.5)",
  accentBg: "rgba(52,211,153,0.08)",
  textBright: "#e2e8f0",
  text: "#94a3b8",
  muted: "#64748b",
  faint: "#475569",
};
const F = {
  sans: "'Quicksand',system-ui,sans-serif",
  mono: "'JetBrains Mono','Geist Mono',monospace",
};

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.accent, boxShadow: `0 0 10px ${C.accentDim}` }} />
      <span style={{ fontFamily: F.mono, fontSize: 10, color: C.accentDim, letterSpacing: 3, textTransform: "uppercase" }}>{children}</span>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: 20,
        fontSize: 10,
        fontFamily: F.mono,
        background: C.accentBg,
        border: "1px solid rgba(52,211,153,0.25)",
        color: C.accent,
      }}
    >
      {children}
    </span>
  );
}

function Section({
  label,
  title,
  children,
}: {
  label: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 36 }}>
      <Label>{label}</Label>
      {title && (
        <h2 style={{ fontSize: 22, fontWeight: 700, color: C.textBright, margin: "0 0 12px" }}>
          {title}
        </h2>
      )}
      <div style={{ fontSize: 14, color: C.text, lineHeight: 1.75 }}>{children}</div>
    </section>
  );
}

/**
 * /projects/:slug — long-form case study for a single project.
 *
 * - Falls back gracefully when the slug is unknown OR when the project has
 *   no `caseStudy` block (still shows hero + live link + "Ask the AI").
 * - "Ask the AI" reuses the existing `tambo-pending-message` sessionStorage
 *   pattern so the chat page auto-submits a contextual prompt on mount.
 */
export default function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const [profile, setProfile] = useState<PortfolioProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getPortfolioProfile()
      .then((p) => {
        if (!cancelled) {
          setProfile(p);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Scroll to top whenever the slug changes (since the wrapper is re-used)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [slug]);

  const project: PortfolioProject | null =
    profile?.projects.find((p) => projectSlug(p) === (slug ?? "").toLowerCase()) ?? null;

  const askAi = () => {
    if (!project) return;
    sessionStorage.setItem(
      "tambo-pending-message",
      `Tell me everything about the ${project.name} project — the problem it solves, how I built it, the tech stack, and the results. Render visual cards on the canvas as you go.`,
    );
    navigate("/chat");
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.primary, color: C.muted, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.mono, fontSize: 12 }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');*{box-sizing:border-box}`}</style>
        Loading project…
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ minHeight: "100vh", background: C.primary, color: C.text, fontFamily: F.sans, padding: "80px 24px" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');*{box-sizing:border-box}`}</style>
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontFamily: F.mono, fontSize: 11, color: C.accentDim, letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>404 · Not Found</div>
          <h1 style={{ fontSize: 28, color: C.textBright, marginBottom: 12 }}>Project not found</h1>
          <p style={{ color: C.muted, marginBottom: 28 }}>
            No project with the slug <code style={{ color: C.accent, fontFamily: F.mono }}>{slug}</code>.
          </p>
          <Link href="/" style={{ display: "inline-block", padding: "10px 22px", borderRadius: 8, background: C.accentBg, border: "1px solid rgba(52,211,153,0.3)", color: C.accent, fontFamily: F.mono, fontSize: 12, textDecoration: "none", letterSpacing: 1 }}>
            ← Back home
          </Link>
        </div>
      </div>
    );
  }

  const cs = project.caseStudy;

  return (
    <div style={{ minHeight: "100vh", background: C.primary, color: C.text, fontFamily: F.sans }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');*{box-sizing:border-box}body{margin:0}`}</style>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 96px" }}>
        {/* Back link */}
        <Link
          href="/#projects"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: F.mono,
            fontSize: 11,
            color: C.muted,
            textDecoration: "none",
            letterSpacing: 1.5,
            textTransform: "uppercase",
            marginBottom: 28,
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = C.accent)}
          onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
        >
          ← All projects
        </Link>

        {/* Hero */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <Pill>{project.tag}</Pill>
            {cs?.role && (
              <span style={{ fontSize: 10, fontFamily: F.mono, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>
                {cs.role}
              </span>
            )}
            {typeof cs?.durationMonths === "number" && (
              <span style={{ fontSize: 10, fontFamily: F.mono, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>
                · {cs.durationMonths} mo
              </span>
            )}
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 700, color: C.textBright, margin: "0 0 12px", lineHeight: 1.15, letterSpacing: -0.5 }}>
            {project.name}
          </h1>
          <p style={{ fontSize: 16, color: C.text, lineHeight: 1.6, margin: 0 }}>
            {project.description}
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 24 }}>
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 20px",
                borderRadius: 10,
                background: C.accent,
                color: C.primary,
                fontFamily: F.mono,
                fontSize: 12,
                fontWeight: 700,
                textDecoration: "none",
                letterSpacing: 0.5,
              }}
            >
              Visit live site ↗
            </a>
            <button
              onClick={askAi}
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                background: "transparent",
                border: "1px solid rgba(52,211,153,0.4)",
                color: C.accent,
                fontFamily: F.mono,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: 0.5,
              }}
            >
              💬 Ask the AI about this
            </button>
          </div>
        </div>

        {/* Case study sections (only render if data present) */}
        {cs?.problem && (
          <Section label="Problem" title="What I had to solve">
            <p style={{ margin: 0 }}>{cs.problem}</p>
          </Section>
        )}

        {cs?.approach && (
          <Section label="Approach" title="How I built it">
            <p style={{ margin: 0 }}>{cs.approach}</p>
          </Section>
        )}

        {cs?.results && (
          <Section label="Results" title="What it ships">
            <p style={{ margin: 0 }}>{cs.results}</p>
          </Section>
        )}

        {cs?.highlights && cs.highlights.length > 0 && (
          <Section label="Highlights">
            <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8 }}>
              {cs.highlights.map((h, i) => (
                <li key={i} style={{ color: C.text, lineHeight: 1.7 }}>{h}</li>
              ))}
            </ul>
          </Section>
        )}

        {cs?.tech && cs.tech.length > 0 && (
          <Section label="Tech Stack">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {cs.tech.map((t, i) => (
                <Pill key={i}>{t}</Pill>
              ))}
            </div>
          </Section>
        )}

        {!cs && (
          <div style={{ padding: "20px 24px", borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`, color: C.muted, fontSize: 13, lineHeight: 1.6 }}>
            A full case study for this project hasn't been published yet — but the live site is up. Want a guided tour? Tap{" "}
            <button onClick={askAi} style={{ background: "transparent", border: "none", color: C.accent, padding: 0, fontFamily: "inherit", fontSize: "inherit", cursor: "pointer", textDecoration: "underline" }}>
              Ask the AI
            </button>
            {" "}and the agent will walk you through it.
          </div>
        )}

        {/* Bottom CTA */}
        <div
          style={{
            marginTop: 48,
            padding: "24px 28px",
            borderRadius: 14,
            background: C.accentBg,
            border: "1px solid rgba(52,211,153,0.25)",
            textAlign: "center",
          }}
        >
          <div style={{ fontFamily: F.mono, fontSize: 10, color: C.accentDim, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>
            Want more depth?
          </div>
          <p style={{ color: C.text, fontSize: 14, lineHeight: 1.6, margin: "0 0 16px" }}>
            Ask the AI any follow-up — architecture trade-offs, lessons learned, why I picked X over Y. It renders visual cards as it answers.
          </p>
          <button
            onClick={askAi}
            style={{
              padding: "10px 22px",
              borderRadius: 10,
              background: C.accent,
              color: C.primary,
              border: "none",
              fontFamily: F.mono,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: 0.5,
            }}
          >
            💬 Open the AI chat
          </button>
        </div>
      </div>
    </div>
  );
}
