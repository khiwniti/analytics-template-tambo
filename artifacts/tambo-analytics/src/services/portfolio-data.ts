/**
 * @file portfolio-data.ts
 * @description Fetches Ikkyu's portfolio data from the API server (portfolio.json).
 * To update portfolio content, edit the JSON file via PUT /api/portfolio
 * or directly edit artifacts/api-server/data/portfolio.json.
 *
 * After any successful PUT /api/portfolio, callers must invoke
 * clearPortfolioCache() so the next getPortfolioData() (and therefore
 * buildPortfolioContextText) fetches fresh data rather than serving stale
 * cache. The API server itself holds no server-side cache.
 */

const API_BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

const CACHE_TTL_MS = 60_000;
let _cached: PortfolioProfile | null = null;
let _cachedAt = 0;

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
}

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
  projects: Array<{ name: string; url: string; tag: string; description: string }>;
  domains: Array<{ icon: string; label: string; detail: string }>;
  skills: Array<{ category: string; items: string[] }>;
  education: { degree: string; university: string; years: string; honors: string; languages: string };
  sideProjects: Array<{ name: string; url: string; description: string }>;
  contact: { email: string; github: string; linkedin: string; resume: string };
};

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
${p.projects.map((pr) => `- ${pr.name} [${pr.tag}]: ${pr.description}\n  Live: ${pr.url}`).join("\n")}

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
You are Ikkyu Khiw's AI portfolio assistant. Help recruiters, HR professionals, engineers, and curious visitors understand his background, skills, and projects. Be warm, concise, and truthful — only state facts from this profile. When asked for a resume, render a ResumeCard on the canvas tailored to the requester. When asked about a specific project, render a ProjectShowcase card. Always be enthusiastic about Ikkyu's unique multidisciplinary background (engineering → nuclear → AI → government).
`.trim();
}
