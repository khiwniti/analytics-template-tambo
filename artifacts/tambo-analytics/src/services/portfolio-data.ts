/**
 * @file portfolio-data.ts
 * @description Ikkyu's full portfolio profile data — sourced from home.tsx ground truth
 */

export const PORTFOLIO_PROFILE = {
  name: "Ikkyu Khiw",
  handle: "khiw.dev / getintheQ",
  title: "AI-Augmented Full-Stack Developer · AI Agent Architect",
  location: "Bangkok, Thailand 🇹🇭",
  email: "kiw.brw@gmail.com",
  website: "khiw.dev",
  github: "github.com/getintheQ",
  linkedin: "linkedin.com/in/getintheq",
  resume: "https://www.khiw.dev/api/resume",

  summary:
    "Mechanical-engineer-turned-AI-architect with First Class Honors from Naresuan University (2019). Career spans welding inspections at Bangchack Refinery, ANSYS analysis at Hitachi, nuclear radiopharmaceuticals (I-131) at TINT, injection molding at CP Group, and now AI agent architecture + Thai government digital transformation. Shipped 50+ projects on Vercel and 47 Cloudflare Workers across 9 industries.",

  stats: {
    live: 29,
    projects: 50,
    workers: 47,
    industries: 9,
  },

  career: [
    {
      year: "2025–Now",
      role: "Associate Solution Architect",
      company: "Bangkok Silicon (BKS)",
      description:
        "AI/ML consulting, government digital transformation, BIM agentic frameworks, DDPM disaster platforms, Royal Rainmaking AI, hospitality intelligence.",
      highlight: true,
    },
    {
      year: "2024–Now",
      role: "Lead Data & AI Engineer",
      company: "Libralytics (Freelance)",
      description:
        "AI agents for restaurant marketing, MLOps (Docker/K8s), full-stack pipelines, FastAPI, Apache Airflow, Next.js.",
    },
    {
      year: "2019–Now",
      role: "CFD/FEA Specialist",
      company: "Freelance (7+ years)",
      description:
        "ANSYS Fluent/CFX, COMSOL, OpenFOAM, Moldex3D. Aerodynamics, turbomachinery, HVAC, multiphase flows, heat transfer.",
    },
    {
      year: "2025",
      role: "Data Engineer",
      company: "Tipco Asphalt",
      description:
        "Azure Data Factory, Synapse Analytics, Oracle-to-cloud migration, LLM integration.",
    },
    {
      year: "2023",
      role: "Service Dev Specialist",
      company: "Q-CHANG",
      description:
        "SOPs, GMV forecasting (regression), Python sentiment analysis, supplier management.",
    },
    {
      year: "2022–23",
      role: "Future Leader (FLP 12)",
      company: "Charoen Pokphand Group",
      description:
        "24-cavity mold → 300K pcs/day. +2.9M Baht sales. Power BI. Reported to CP Shareman Executive.",
    },
    {
      year: "2021–22",
      role: "Nuclear Engineer",
      company: "Thailand Institute of Nuclear Technology",
      description:
        "Radiopharmaceutical production (I-131). ISO 9001, GMP. Data science for preventive maintenance.",
    },
    {
      year: "2021",
      role: "Mechanical Design Engineer",
      company: "Arçelik Hitachi",
      description:
        "ANSYS & Moldex3D stress/fatigue analysis. Prototype testing with Japanese lab. FBF640→720.",
    },
    {
      year: "2019–21",
      role: "Mechanical Engineer",
      company: "MACS",
      description:
        "EPC at Bangchack Refinery. QC Welding (ASME IX). AutoCAD Plant 3D.",
    },
  ],

  projects: [
    {
      name: "CarbonBIM",
      url: "https://bim.getintheq.space",
      tag: "BIM+AI",
      description: "AI carbon calculator — IFC upload, 104+ TGO emission factors",
    },
    {
      name: "EarthCast AI",
      url: "https://earthcast-ai.vercel.app",
      tag: "Earth",
      description: "AI weather forecast — PINNs + FourCastNet + CesiumJS",
    },
    {
      name: "Facility Manager",
      url: "https://facility-management-app-mocha.vercel.app",
      tag: "3D",
      description: "Full-stack building management with 3D viewer",
    },
    {
      name: "NDWC Smart Alert",
      url: "https://ndwc-smart-alert.vercel.app",
      tag: "Gov",
      description: "Thailand flood monitoring & AI water alerts",
    },
    {
      name: "GDAS Disaster",
      url: "https://gdas-ai-disaster-watch.vercel.app",
      tag: "Gov",
      description: "DDPM multi-hazard early warning (14 types, CAP v1.2)",
    },
    {
      name: "NT Facility 3D",
      url: "https://nt-facility-3-d-manager-new-ui.vercel.app",
      tag: "Telecom",
      description: "National Telecom 3D facility (xeokit/Three.js)",
    },
    {
      name: "Rainmaking",
      url: "https://rainmaking-mission-planing-dashboard.vercel.app",
      tag: "Gov+AI",
      description: "Royal Rainmaking mission planning with PINNs",
    },
    {
      name: "BIM Companion",
      url: "https://bim-model-companion.vercel.app",
      tag: "BIM",
      description: "Browser-native IFC viewer with AI companion",
    },
    {
      name: "SCADA AI",
      url: "https://scada-ai.vercel.app",
      tag: "IoT",
      description: "Industrial IoT AI monitoring platform",
    },
    {
      name: "Farmbook",
      url: "https://farmbook-dashboard.vercel.app",
      tag: "Gov",
      description: "Ministry of Agriculture data dashboard",
    },
    {
      name: "BiteBase API",
      url: "https://api.bitebase.app",
      tag: "F&B",
      description: "Restaurant BI backend with AI agents",
    },
    {
      name: "Pipeline Viz",
      url: "https://data-pipeline-visualizer.vercel.app",
      tag: "Data",
      description: "ETL pipeline visualization tool",
    },
  ],

  domains: [
    { icon: "◆", label: "BIM & Construction", detail: "IFC, EN 15978, TGO, EDGE, TREES, BOQ-to-cost" },
    { icon: "◇", label: "Weather & Earth Science", detail: "FourCastNet, PINNs, GFS, CesiumJS, NOAA" },
    { icon: "▣", label: "Thai Government", detail: "DDPM, TPQI, NSDF, NDWC, Rainmaking, AOT" },
    { icon: "△", label: "Hospitality & F&B", detail: "BiteBase, HotelCSI, Wongnai, LINE MAN" },
    { icon: "○", label: "Engineering Simulation", detail: "ANSYS, COMSOL, OpenFOAM, DeepXDE, Moldex3D" },
    { icon: "□", label: "Healthcare", detail: "FHIR R4, Thai NLP, LINE OA, lab analysis" },
  ],

  skills: [
    { category: "AI / Agents", items: ["LangGraph", "Claude Sonnet", "Qwen3", "MCP", "A2A", "Huggingface", "Typhoon", "PINNs", "DeepXDE"] },
    { category: "Full-Stack", items: ["Next.js", "React", "TypeScript", "Tailwind", "FastAPI", "Express", "shadcn/ui"] },
    { category: "Data / Cloud", items: ["PostgreSQL", "MongoDB", "Azure", "Airflow", "Docker", "K8s", "Pandas", "Power BI", "Tableau"] },
    { category: "Engineering", items: ["ANSYS Fluent", "COMSOL", "OpenFOAM", "Moldex3D", "SolidWorks", "AutoCAD", "CFD", "FEA"] },
    { category: "Platforms", items: ["Vercel", "Cloudflare Workers", "Supabase", "LINE OA", "Postman", "Git", "LangSmith"] },
  ],

  education: {
    degree: "B.Eng Mechanical Engineering",
    university: "Naresuan University",
    years: "2015–2019",
    honors: "First Class Honors, GPA 3.50",
    languages: "EF SET C2 (72/100) · Thai (Native) · English (Professional)",
  },

  sideProjects: [
    {
      name: "kidpen.org",
      url: "https://kidpen.org",
      description:
        "Free, open-source STEM education platform for Thai students. Because the skills that changed my career shouldn't be locked behind paywalls.",
    },
  ],

  contact: {
    email: "kiw.brw@gmail.com",
    github: "https://github.com/getintheQ",
    linkedin: "https://linkedin.com/in/getintheq",
    resume: "https://www.khiw.dev/api/resume",
  },
};

export type PortfolioProfile = typeof PORTFOLIO_PROFILE;

export const getPortfolioProfile = async (): Promise<PortfolioProfile> => {
  await new Promise((r) => setTimeout(r, 50));
  return PORTFOLIO_PROFILE;
};

export const getProjectDetails = async (params?: {
  projectName?: string;
}): Promise<
  (typeof PORTFOLIO_PROFILE.projects)[number] | typeof PORTFOLIO_PROFILE.projects
> => {
  await new Promise((r) => setTimeout(r, 50));
  if (params?.projectName) {
    const found = PORTFOLIO_PROFILE.projects.find((p) =>
      p.name.toLowerCase().includes(params.projectName!.toLowerCase()),
    );
    return found ?? PORTFOLIO_PROFILE.projects;
  }
  return PORTFOLIO_PROFILE.projects;
};

export function buildPortfolioContextText(): string {
  const p = PORTFOLIO_PROFILE;
  return `
# Ikkyu Khiw — AI Portfolio Agent Context

## Identity
Name: Ikkyu Khiw
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
