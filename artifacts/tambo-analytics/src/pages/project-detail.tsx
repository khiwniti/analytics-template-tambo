import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import {
  getPortfolioProfile,
  getRelatedProjects,
  inferTechFromSkills,
  projectSlug,
  type PortfolioProject,
  type PortfolioProfile,
} from "../services/portfolio-data";

const C = {
  primary: "#FAFAF7",
  surface: "#FFFFFF",
  surfaceHover: "#F5F2EC",
  border: "rgba(15,23,42,0.08)",
  accent: "#B0593A",
  accentDim: "rgba(176,89,58,0.65)",
  accentBg: "rgba(176,89,58,0.08)",
  textBright: "#1F2937",
  text: "#374151",
  muted: "#6B7280",
  faint: "#9CA3AF",
};
const F = {
  sans: "'Quicksand',system-ui,sans-serif",
  mono: "'JetBrains Mono','Geist Mono',monospace",
};

const BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.accent }} />
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
        border: "1px solid rgba(176,89,58,0.25)",
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
 * Inline OG / meta tag manager — sets document.title and a small set of
 * <meta> tags for share previews. Removes them on unmount so subsequent
 * pages don't inherit stale values.
 */
function useDocumentMeta(opts: {
  title: string;
  description: string;
  url: string;
  image?: string;
}) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = opts.title;

    const upsert = (selector: string, attrs: Record<string, string>) => {
      let el = document.head.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement("meta");
        document.head.appendChild(el);
      }
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
      return el;
    };

    // Resolve to absolute URL so social crawlers don't try to fetch a
    // relative path against their own host. Falls back to the site's
    // /opengraph.jpg asset when the project has no dedicated image.
    const rawImage = opts.image && opts.image.trim() ? opts.image : "/opengraph.jpg";
    const absoluteImage = /^https?:\/\//i.test(rawImage)
      ? rawImage
      : new URL(rawImage, window.location.origin).toString();

    const tags = [
      upsert('meta[name="description"]', { name: "description", content: opts.description }),
      upsert('meta[property="og:title"]', { property: "og:title", content: opts.title }),
      upsert('meta[property="og:description"]', { property: "og:description", content: opts.description }),
      upsert('meta[property="og:type"]', { property: "og:type", content: "article" }),
      upsert('meta[property="og:url"]', { property: "og:url", content: opts.url }),
      upsert('meta[property="og:image"]', { property: "og:image", content: absoluteImage }),
      upsert('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" }),
      upsert('meta[name="twitter:title"]', { name: "twitter:title", content: opts.title }),
      upsert('meta[name="twitter:description"]', { name: "twitter:description", content: opts.description }),
      upsert('meta[name="twitter:image"]', { name: "twitter:image", content: absoluteImage }),
    ];

    return () => {
      document.title = previousTitle;
      // Leave the tags in place — replacing them on next page is cheap and
      // avoids flicker. (Removing them would briefly clear OG state.)
      void tags;
    };
  }, [opts.title, opts.description, opts.url, opts.image]);
}

/**
 * /projects/:slug — long-form case study for a single project.
 *
 * - Renders hero · problem · approach · architecture · outcomes · tech ·
 *   related-projects strip — matching the spec layout.
 * - Falls back gracefully when the slug is unknown OR when the project has
 *   no `caseStudy` block: shows the description, tech inferred from the
 *   global skills list, and an "Ask the AI" CTA.
 * - Sets per-project OG/Twitter meta tags inline for share previews.
 * - The "Ask the AI" button navigates to `/chat?project=<slug>` — the chat
 *   page reads that query param and stashes a tailored prompt into
 *   sessionStorage for the existing AutoSubmitPendingMessage handler.
 */
export default function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
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

  // Always call the meta hook — feed it safe defaults when project is null.
  useDocumentMeta({
    title: project ? `${project.name} — Case Study · Ikkyu Khiw` : "Project · Ikkyu Khiw",
    description: project?.description ?? "Project case study by Ikkyu Khiw.",
    url: typeof window !== "undefined" ? window.location.href : "",
    // Prefer the first case-study image as the social preview; falls back to
    // the site-wide /opengraph.jpg inside useDocumentMeta when absent.
    image: project?.caseStudy?.images?.[0]?.src,
  });

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
          <Link href="/#projects" style={{ display: "inline-block", padding: "10px 22px", borderRadius: 8, background: C.accentBg, border: "1px solid rgba(176,89,58,0.3)", color: C.accent, fontFamily: F.mono, fontSize: 12, textDecoration: "none", letterSpacing: 1 }}>
            ← Back to projects
          </Link>
        </div>
      </div>
    );
  }

  const cs = project.caseStudy;
  const slugVal = projectSlug(project);
  // Tech to display: explicit caseStudy.tech if present, else inferred from skills.
  const tech = cs?.tech && cs.tech.length > 0
    ? cs.tech
    : profile
      ? inferTechFromSkills(profile, project)
      : [];
  const related = profile ? getRelatedProjects(profile, slugVal, 3) : [];

  // The "Ask the AI" CTA routes to /chat?project=<slug>; the chat page
  // reads the query param and builds the tailored prompt.
  const askAiHref = `${BASE}/chat?project=${encodeURIComponent(slugVal)}`;

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
            {!cs && (
              <span style={{ fontSize: 10, fontFamily: F.mono, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>
                · case study coming soon
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
            <Link
              href={`/chat?project=${encodeURIComponent(slugVal)}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "10px 20px",
                borderRadius: 10,
                background: "transparent",
                border: "1px solid rgba(176,89,58,0.4)",
                color: C.accent,
                fontFamily: F.mono,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: 0.5,
                textDecoration: "none",
              }}
            >
              💬 Ask the AI about this
            </Link>
          </div>
        </div>

        {/* Outcomes metrics strip — only when caseStudy.outcomes is present */}
        {cs?.outcomes && cs.outcomes.length > 0 && (
          <Section label="Outcomes" title="Key numbers">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${Math.min(cs.outcomes.length, 4)}, minmax(0, 1fr))`,
                gap: 10,
              }}
            >
              {cs.outcomes.map((o, i) => (
                <div
                  key={i}
                  style={{
                    padding: "14px 16px",
                    borderRadius: 10,
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <div style={{ fontFamily: F.mono, fontSize: 9, color: C.accentDim, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>
                    {o.label}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: C.accent, fontFamily: F.mono }}>
                    {o.value}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

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

        {cs?.architecture && (
          <Section label="Architecture" title="System design">
            <pre
              style={{
                margin: 0,
                padding: "16px 18px",
                borderRadius: 10,
                background: "#F5F2EC",
                border: `1px solid ${C.border}`,
                color: C.textBright,
                fontFamily: F.mono,
                fontSize: 12,
                lineHeight: 1.6,
                overflowX: "auto",
                whiteSpace: "pre-wrap",
              }}
            >
              {cs.architecture}
            </pre>
          </Section>
        )}

        {cs?.images && cs.images.length > 0 && (
          <Section label="Visuals">
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {cs.images.map((img, i) => (
                <figure key={i} style={{ margin: 0 }}>
                  <img
                    src={img.src}
                    alt={img.caption ?? `${project.name} screenshot ${i + 1}`}
                    style={{ width: "100%", borderRadius: 10, border: `1px solid ${C.border}`, display: "block" }}
                  />
                  {img.caption && (
                    <figcaption style={{ marginTop: 6, fontSize: 11, color: C.muted, fontFamily: F.mono, letterSpacing: 0.5 }}>
                      {img.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </Section>
        )}

        {tech.length > 0 && (
          <Section label="Tech Stack">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {tech.map((t, i) => (
                <Pill key={i}>{t}</Pill>
              ))}
            </div>
            {!cs && (
              <p style={{ marginTop: 8, fontSize: 11, color: C.faint, fontFamily: F.mono, letterSpacing: 0.5 }}>
                Inferred from the global skills list — full case study coming soon.
              </p>
            )}
          </Section>
        )}

        {!cs && (
          <div style={{ padding: "20px 24px", borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`, color: C.muted, fontSize: 13, lineHeight: 1.6, marginTop: 12 }}>
            A full case study for this project hasn't been published yet — but the live site is up. Want a guided tour?{" "}
            <Link href={`/chat?project=${encodeURIComponent(slugVal)}`} style={{ color: C.accent, textDecoration: "underline" }}>
              Ask the AI
            </Link>{" "}and the agent will walk you through it.
          </div>
        )}

        {/* Bottom CTA */}
        <div
          style={{
            marginTop: 48,
            padding: "24px 28px",
            borderRadius: 14,
            background: C.accentBg,
            border: "1px solid rgba(176,89,58,0.25)",
            textAlign: "center",
          }}
        >
          <div style={{ fontFamily: F.mono, fontSize: 10, color: C.accentDim, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>
            Want more depth?
          </div>
          <p style={{ color: C.text, fontSize: 14, lineHeight: 1.6, margin: "0 0 16px" }}>
            Ask the AI any follow-up — architecture trade-offs, lessons learned, why I picked X over Y. It renders visual cards as it answers.
          </p>
          <Link
            href={`/chat?project=${encodeURIComponent(slugVal)}`}
            style={{
              display: "inline-block",
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
              textDecoration: "none",
            }}
          >
            💬 Open the AI chat
          </Link>
          {/* Direct anchor for users with JS disabled — same destination as the Link above */}
          <noscript>
            <a href={askAiHref} style={{ display: "block", marginTop: 8, color: C.accent }}>
              Open the AI chat
            </a>
          </noscript>
        </div>

        {/* Related projects strip */}
        {related.length > 0 && (
          <section style={{ marginTop: 56 }}>
            <Label>More projects</Label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
                gap: 10,
              }}
            >
              {related.map((rp) => {
                const rSlug = projectSlug(rp);
                return (
                  <Link
                    key={rSlug}
                    href={`/projects/${rSlug}`}
                    style={{
                      display: "block",
                      padding: "12px 14px",
                      borderRadius: 10,
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      color: C.text,
                      textDecoration: "none",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = C.accent;
                      e.currentTarget.style.background = C.surfaceHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = C.border;
                      e.currentTarget.style.background = C.surface;
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6, marginBottom: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.textBright }}>{rp.name}</div>
                      <Pill>{rp.tag}</Pill>
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>{rp.description}</div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
