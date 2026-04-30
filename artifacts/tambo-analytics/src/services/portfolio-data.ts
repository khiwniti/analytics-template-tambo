/**
 * @file portfolio-data.ts
 * @description Ikkyu's full portfolio profile data for AI context and tools
 */

export const PORTFOLIO_PROFILE = {
  name: "Ikkyu Khiw",
  title: "Full-Stack AI Engineer",
  location: "Bangkok, Thailand",
  email: "ikkyu@khiw.dev",
  website: "khiw.dev",
  github: "github.com/ikkyu-3",
  summary:
    "Full-stack engineer specializing in AI-powered systems, LLM integration, and scalable web platforms. 5+ years building production systems across fintech, government, and startup sectors. Deep experience turning AI research into real products — from LLM pipelines to agentic workflows and generative UI.",

  stats: {
    yearsExperience: 5,
    projectsShipped: 20,
    aiAgentsBuilt: 8,
    countriesReached: 3,
  },

  career: [
    {
      role: "AI Engineer / Tech Lead",
      company: "Government Digital Services",
      period: "2023 – Present",
      description:
        "Led AI initiatives for Thai government digital transformation. Built LLM-powered document processing pipelines handling millions of records. Architected agentic systems for policy analysis and citizen services.",
      highlights: [
        "Designed multi-agent orchestration framework used across 5 government agencies",
        "Reduced manual document processing time by 85% with AI extraction pipeline",
        "Built RAG system over 10M+ government documents for policy search",
        "Led a team of 6 engineers on high-stakes production systems",
      ],
      tech: ["Python", "LangChain", "FastAPI", "Next.js", "PostgreSQL", "AWS"],
    },
    {
      role: "Senior Full-Stack Engineer",
      company: "Fintech Startup (Stealth)",
      period: "2021 – 2023",
      description:
        "Core engineer at a Series A fintech building AI-powered financial insights. Owned the full stack from React frontend to Python ML services.",
      highlights: [
        "Built real-time transaction anomaly detection system with <200ms latency",
        "Shipped AI-generated financial reports feature, increased user retention 40%",
        "Designed event-driven microservices architecture on AWS",
        "Mentored 4 junior engineers, established code review culture",
      ],
      tech: ["React", "TypeScript", "Python", "FastAPI", "Kafka", "AWS", "ML"],
    },
    {
      role: "Full-Stack Developer",
      company: "Digital Agency",
      period: "2019 – 2021",
      description:
        "Built web platforms and mobile apps for clients across retail, logistics, and education. First exposure to ML integration in production apps.",
      highlights: [
        "Delivered 8 production projects across 2 years",
        "Introduced automated testing, cut production bugs by 60%",
        "Built real-time logistics tracking platform handling 50k+ events/day",
      ],
      tech: ["React", "Node.js", "React Native", "MongoDB", "GCP"],
    },
  ],

  projects: [
    {
      name: "GovRAG",
      tag: "AI · Government",
      description:
        "Production RAG system indexing 10M+ Thai government documents for policy search and citizen Q&A. Sub-second retrieval with contextual re-ranking.",
      highlights: [
        "10M+ documents indexed with hybrid BM25 + vector search",
        "Custom re-ranker fine-tuned on Thai government text",
        "Used by 5 government agencies in production",
        "99.9% uptime SLA maintained for 18 months",
      ],
      tech: ["Python", "LangChain", "Weaviate", "FastAPI", "Next.js"],
      url: "https://khiw.dev",
      featured: true,
    },
    {
      name: "AgentFlow",
      tag: "AI · Developer Tool",
      description:
        "Visual orchestration framework for building multi-agent AI workflows. Drag-and-drop agent graph editor with real-time execution tracing.",
      highlights: [
        "Graph-based agent execution engine with dynamic routing",
        "Real-time streaming execution traces in the UI",
        "Plugin system for custom agent tools and memory stores",
        "Open-sourced, 400+ GitHub stars",
      ],
      tech: ["TypeScript", "React", "Python", "LangGraph", "WebSockets"],
      url: "https://github.com/ikkyu-3",
      featured: true,
    },
    {
      name: "FinSight AI",
      tag: "AI · Fintech",
      description:
        "AI-generated financial reports from raw transaction data. Natural language summaries with anomaly detection and spend forecasting.",
      highlights: [
        "LLM-powered narrative generation over structured financial data",
        "Real-time anomaly detection with <200ms latency",
        "Spend forecasting with 91% 30-day accuracy",
        "Shipped to 50k+ active users",
      ],
      tech: ["Python", "FastAPI", "React", "TypeScript", "Kafka", "AWS"],
      url: "https://khiw.dev",
      featured: true,
    },
    {
      name: "khiw.dev (this site)",
      tag: "AI · Portfolio",
      description:
        "AI portfolio agent — this very site. Personal AI agent that knows Ikkyu's full profile and can generate custom resumes, showcase projects, and answer recruiter questions in real time.",
      highlights: [
        "Tambo AI generative UI with custom canvas components",
        "Dynamic resume PDF generation with jsPDF",
        "Vite + React + TypeScript, migrated from Next.js",
        "Real-time AI chat with context-aware responses",
      ],
      tech: ["React", "TypeScript", "Vite", "Tambo AI", "jsPDF"],
      url: "https://khiw.dev",
      featured: false,
    },
    {
      name: "LogiTrack",
      tag: "Platform · Logistics",
      description:
        "Real-time logistics tracking platform processing 50k+ events per day. Map-based dashboard with driver routing and anomaly alerts.",
      highlights: [
        "50k+ real-time events/day via WebSocket pipeline",
        "Driver route optimization with ML ETA prediction",
        "Multi-tenant SaaS with per-client analytics",
      ],
      tech: ["React", "Node.js", "PostgreSQL", "Redis", "Google Maps API"],
      url: "https://khiw.dev",
      featured: false,
    },
  ],

  skills: {
    aiMl: [
      "LLM Integration",
      "RAG Systems",
      "LangChain",
      "LangGraph",
      "Agent Orchestration",
      "Fine-tuning",
      "Vector Databases",
      "Prompt Engineering",
      "Weaviate",
      "OpenAI API",
    ],
    frontend: [
      "React",
      "TypeScript",
      "Next.js",
      "Vite",
      "Tailwind CSS",
      "React Native",
      "Framer Motion",
    ],
    backend: [
      "Python",
      "FastAPI",
      "Node.js",
      "Express",
      "REST",
      "GraphQL",
      "WebSockets",
      "Kafka",
    ],
    infrastructure: [
      "AWS",
      "GCP",
      "Docker",
      "PostgreSQL",
      "Redis",
      "MongoDB",
      "CI/CD",
      "Terraform",
    ],
  },

  domains: [
    {
      name: "AI & LLM Systems",
      description: "Production RAG, agents, fine-tuning, generative UI",
    },
    {
      name: "Government Tech",
      description: "High-compliance systems, document AI, policy platforms",
    },
    {
      name: "Fintech",
      description: "Real-time data, anomaly detection, financial AI",
    },
    {
      name: "Developer Tools",
      description: "Frameworks, OSS libraries, dev experience",
    },
  ],

  education: {
    degree: "B.Eng. Computer Engineering",
    university: "Chulalongkorn University",
    year: "2019",
    honors: "First Class Honours",
  },

  languages: ["Thai (native)", "English (professional)"],

  personality:
    "Pragmatic builder who ships fast and iterates. Prefers elegant simplicity over over-engineering. Cares deeply about real user impact. Strong communicator, comfortable presenting to both technical and non-technical stakeholders.",
};

export type PortfolioProfile = typeof PORTFOLIO_PROFILE;

export const getPortfolioProfile = async (): Promise<PortfolioProfile> => {
  await new Promise((r) => setTimeout(r, 50));
  return PORTFOLIO_PROFILE;
};

export const getProjectDetails = async (params?: {
  projectName?: string;
}): Promise<(typeof PORTFOLIO_PROFILE.projects)[number] | (typeof PORTFOLIO_PROFILE.projects)> => {
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
# Portfolio Agent Context — ${p.name}

## Identity
Name: ${p.name}
Title: ${p.title}
Location: ${p.location}
Email: ${p.email}
Website: ${p.website}
GitHub: ${p.github}

## Summary
${p.summary}

## Stats
- Years of experience: ${p.stats.yearsExperience}+
- Projects shipped: ${p.stats.projectsShipped}+
- AI agents built: ${p.stats.aiAgentsBuilt}
- Countries reached: ${p.stats.countriesReached}

## Career History
${p.career
  .map(
    (c) => `### ${c.role} @ ${c.company} (${c.period})
${c.description}
Key highlights:
${c.highlights.map((h) => `- ${h}`).join("\n")}
Tech: ${c.tech.join(", ")}`,
  )
  .join("\n\n")}

## Featured Projects
${p.projects
  .map(
    (proj) => `### ${proj.name} [${proj.tag}]
${proj.description}
Highlights:
${proj.highlights.map((h) => `- ${h}`).join("\n")}
Tech: ${proj.tech.join(", ")}`,
  )
  .join("\n\n")}

## Skills
AI/ML: ${p.skills.aiMl.join(", ")}
Frontend: ${p.skills.frontend.join(", ")}
Backend: ${p.skills.backend.join(", ")}
Infrastructure: ${p.skills.infrastructure.join(", ")}

## Domain Expertise
${p.domains.map((d) => `- ${d.name}: ${d.description}`).join("\n")}

## Education
${p.education.degree}, ${p.education.university} (${p.education.year}) — ${p.education.honors}

## Languages
${p.languages.join(", ")}

## Personality / Working Style
${p.personality}

## Agent Instructions
You are ${p.name}'s AI portfolio assistant. Your role is to help recruiters, HR professionals, engineers, and anyone curious about Ikkyu understand his background, skills, and projects. Always be warm, concise, and honest. Highlight relevant experience based on what the user seems to care about. When asked for a resume, use the ResumeCard component to render a tailored version on the canvas. When asked about a specific project, use the ProjectShowcase component.
`.trim();
}
