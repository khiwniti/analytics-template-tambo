/**
 * @file portfolio-data.ts
 * @description Fetches Ikkyu's portfolio data from the API server (portfolio.json).
 * To update portfolio content, edit the JSON file via PUT /api/portfolio
 * or directly edit artifacts/api-server/data/portfolio.json.
 *
 * After any successful PUT /api/portfolio, call clearPortfolioCache() to
 * immediately invalidate the 60-second in-memory cache and notify all other
 * open browser tabs via BroadcastChannel so they also fetch fresh data.
 * The API server itself holds no server-side cache.
 */

const API_BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

const CACHE_TTL_MS = 60_000;
let _cached: PortfolioProfile | null = null;
let _cachedAt = 0;

// BroadcastChannel propagates cache invalidation to other open tabs
// (e.g. admin tab saves → chat tab receives "clear" → fetches fresh context).
const _channel =
  typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel("portfolio-cache")
    : null;

_channel?.addEventListener("message", (event: MessageEvent) => {
  if (event.data === "clear") {
    _cached = null;
    _cachedAt = 0;
  }
});

async function fetchPortfolio(): Promise<PortfolioProfile> {
  const res = await fetch(`${API_BASE}/api/portfolio`);
  if (!res.ok) throw new Error(`Failed to fetch portfolio: ${res.status}`);
  return res.json();
}

async function getPortfolioData(): Promise<PortfolioProfile> {
  if (_cached && Date.now() - _cachedAt < CACHE_TTL_MS) return _cached;
  _cached = await fetchPortfolio();
  _cachedAt = Date.now();
  return _cached;
}

export function clearPortfolioCache(): void {
  _cached = null;
  _cachedAt = 0;
  // Notify sibling tabs (e.g. an open chat tab) to also drop their cache
  _channel?.postMessage("clear");
}

/**
 * Optional long-form case study attached to a project. Render on
 * /projects/:slug. All sub-fields are optional so a project can opt-in to as
 * much depth as it wants.
 */
export type ProjectCaseStudy = {
  problem?: string;
  approach?: string;
  /** Architecture description — supports plain text or ASCII diagram. */
  architecture?: string;
  /** Key outcomes / metrics, rendered as a labeled stat strip. */
  outcomes?: Array<{ label: string; value: string }>;
  tech?: string[];
  /** Optional supporting images (architecture diagrams, screenshots). */
  images?: Array<{ src: string; caption?: string }>;
};

export type PortfolioProject = {
  name: string;
  url: string;
  tag: string;
  description: string;
  /** URL-safe slug for /projects/:slug. Optional — falls back to slugify(name). */
  slug?: string;
  /** Optional deep-dive content shown on the project detail page. */
  caseStudy?: ProjectCaseStudy;
};

export type PortfolioProfile = {
  name: string;
  handle: string;
  title: string;
  location: string;
  email: string;
  website: string;
  github: string;
  linkedin: string;
  resume: string;
  summary: string;
  stats: { live: number; projects: number; workers: number; industries: number };
  career: Array<{ year: string; role: string; company: string; description: string; highlight?: boolean }>;
  projects: PortfolioProject[];
  domains: Array<{ icon: string; label: string; detail: string }>;
  skills: Array<{ category: string; items: string[] }>;
  education: { degree: string; university: string; years: string; honors: string; languages: string };
  sideProjects: Array<{ name: string; url: string; description: string }>;
  contact: { email: string; github: string; linkedin: string; resume: string };
  /** ISO date (YYYY-MM-DD) of the last portfolio edit. Auto-stamped by API on PUT. */
  updatedAt?: string;
};

/** Convert a project name into a URL-safe slug. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Resolve the canonical slug for a project (explicit `slug` wins, else slugified name). */
export function projectSlug(p: Pick<PortfolioProject, "slug" | "name">): string {
  return (p.slug && p.slug.trim()) || slugify(p.name);
}

/** Look up a project by its slug (or its slugified name). Returns null if not found. */
export async function getProjectBySlug(slug: string): Promise<PortfolioProject | null> {
  const profile = await getPortfolioData();
  const target = slug.toLowerCase();
  return (
    profile.projects.find((p) => projectSlug(p) === target) ?? null
  );
}

/** Return up to `limit` other projects (excluding the given slug). */
export function getRelatedProjects(
  profile: PortfolioProfile,
  excludeSlug: string,
  limit = 3,
): PortfolioProject[] {
  return profile.projects
    .filter((p) => projectSlug(p) !== excludeSlug)
    .slice(0, limit);
}

/**
 * Best-effort tech inference for projects without an explicit caseStudy —
 * pulls from the global skills list, biased by the project's tag.
 */
export function inferTechFromSkills(
  profile: PortfolioProfile,
  project: Pick<PortfolioProject, "tag">,
): string[] {
  const tag = project.tag.toLowerCase();
  const all = profile.skills.flatMap((s) => s.items);
  const tagBias: Record<string, string[]> = {
    bim: ["IFC", "Three.js", "Next.js"],
    "bim+ai": ["IFC", "Three.js", "Claude Sonnet", "Next.js"],
    earth: ["FourCastNet", "PINNs", "CesiumJS"],
    gov: ["FastAPI", "Next.js", "PostgreSQL"],
    "gov+ai": ["LangGraph", "PINNs", "FastAPI"],
    "3d": ["Three.js", "React"],
    iot: ["FastAPI", "Docker", "K8s"],
    data: ["Airflow", "Pandas", "PostgreSQL"],
    telecom: ["Three.js", "TypeScript"],
    "f&b": ["FastAPI", "PostgreSQL", "LangGraph"],
  };
  const biased = tagBias[tag] ?? [];
  // Combine biased + a sample from each skill category, dedupe, cap to 6.
  const seed = [...biased, ...all.slice(0, 6)];
  return Array.from(new Set(seed)).slice(0, 6);
}

export const getPortfolioProfile = async (): Promise<PortfolioProfile> => {
  return getPortfolioData();
};

export const getProjectDetails = async (params?: {
  projectName?: string;
}): Promise<
  PortfolioProfile["projects"][number] | PortfolioProfile["projects"]
> => {
  const profile = await getPortfolioData();
  if (params?.projectName) {
    const found = profile.projects.find((p) =>
      p.name.toLowerCase().includes(params.projectName!.toLowerCase()),
    );
    return found ?? profile.projects;
  }
  return profile.projects;
};

export async function buildPortfolioContextText(): Promise<string> {
  const p = await getPortfolioData();
  return `
# Ikkyu Khiw — AI Portfolio Agent Context

## Identity
Name: ${p.name}
Handle: ${p.handle}
Title: ${p.title}
Location: ${p.location}
Email: ${p.email}
Website: ${p.website}
GitHub: ${p.github}
LinkedIn: ${p.linkedin}
Resume: ${p.resume}

## Summary
${p.summary}

## Key Stats
- ${p.stats.live} live apps · ${p.stats.projects}+ projects shipped · ${p.stats.workers} Cloudflare Workers · ${p.stats.industries} industries

## Career Timeline
${p.career
  .map((c) => `- ${c.year}: ${c.role} @ ${c.company}${c.highlight ? " ★" : ""}\n  ${c.description}`)
  .join("\n")}

## Projects (${p.projects.length} total)
${p.projects
  .map((pr) => {
    const lines = [`- ${pr.name} [${pr.tag}]: ${pr.description}`, `  Live: ${pr.url}`, `  Case study: /projects/${projectSlug(pr)}${pr.caseStudy ? " (full deep-dive available)" : " (overview page)"}`];
    return lines.join("\n");
  })
  .join("\n")}

## Project Case-Study URLs (always link to these when mentioning a project)
${p.projects
  .map((pr) => `- ${pr.name} → /projects/${projectSlug(pr)}`)
  .join("\n")}

## Domain Expertise
${p.domains.map((d) => `- ${d.label}: ${d.detail}`).join("\n")}

## Skills
${p.skills.map((s) => `- ${s.category}: ${s.items.join(", ")}`).join("\n")}

## Education
${p.education.degree} — ${p.education.university} (${p.education.years})
${p.education.honors} · ${p.education.languages}

## Side Projects
${p.sideProjects.map((sp) => `- ${sp.name} (${sp.url}): ${sp.description}`).join("\n")}

## Contact
Email: ${p.contact.email}
GitHub: ${p.contact.github}
LinkedIn: ${p.contact.linkedin}

## Agent Instructions
You are Ikkyu Khiw's AI portfolio assistant. Help recruiters, HR professionals, engineers, and curious visitors understand his background, skills, and projects. Be warm, concise, and truthful — only state facts from this profile. Always be enthusiastic about his unique multidisciplinary background (engineering → nuclear → AI → government).

IMPORTANT — when you mention any project by name, ALWAYS include a markdown link to its case study using the URLs above (e.g. "I built [CarbonBIM](/projects/carbonbim) — an AI carbon calculator…"). This lets visitors jump straight into the deep-dive.

Canvas component usage (always prefer visual components over plain text):
- ResumeCard — resume/CV requests. Customize for the requester type and role.
- ProjectShowcase — deep-dive on a specific project. Always render this, never just describe a project as text.
- Graph — data visualization: bar, line, or pie charts for numerical comparisons.
- SkillRadar — render this when asked about skill strengths, technical profile, or "how good are you at X". Use real proficiency scores (0–100) based on his career and projects.
- TimelineCard — career history, work journey, or education overview. Order newest-first. Prefer this over listing career as bullet points.
- StatCard — quick facts and key numbers at a glance (years experience, projects shipped, AI agents built, etc). Render this for "give me a snapshot" or "impress me in 10 seconds" type questions.
- SelectForm — whenever you need to ask the user a question with choices, always use this instead of bullet points.
- ContactForm — when a visitor wants to reach out or get hired.
`.trim();
}
