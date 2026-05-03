/**
 * @file tambo.ts
 * @description Central configuration file for Tambo components and tools
 *
 * Portfolio AI agent for Ikkyu Khiw (khiw.dev).
 * Read more about Tambo at https://tambo.co/docs
 */

import { Graph, graphSchema } from "@/components/tambo/graph";
import { SelectForm, selectFormSchema } from "@/components/tambo/select-form";
import { ResumeCard, resumeCardSchema } from "@/components/tambo/resume-card";
import {
  ProjectShowcase,
  projectShowcaseSchema,
} from "@/components/tambo/project-showcase";
import {
  ContactForm,
  contactFormSchema,
} from "@/components/tambo/contact-form";
import { SkillRadar, skillRadarSchema } from "@/components/tambo/skill-radar";
import {
  TimelineCard,
  timelineCardSchema,
} from "@/components/tambo/timeline-card";
import { StatCard, statCardSchema } from "@/components/tambo/stat-card";
import { NowCard, nowCardSchema } from "@/components/tambo/now-card";
import {
  TestimonialCard,
  testimonialCardSchema,
} from "@/components/tambo/testimonial-card";
import type { TamboComponent, TamboTool } from "@tambo-ai/react";
import { z } from "zod";
import {
  getPortfolioProfile,
  getProjectDetails,
} from "@/services/portfolio-data";

/**
 * tools
 *
 * Portfolio-specific tools the AI can call to fetch Ikkyu's profile data.
 */
export const tools: TamboTool[] = [
  {
    name: "getPortfolioProfile",
    description:
      "Get Ikkyu's complete portfolio profile including career history, skills, projects, education, and contact info. Call this when you need to answer questions about his background, experience, or generate a resume.",
    tool: getPortfolioProfile,
    inputSchema: z.object({}),
    outputSchema: z.any(),
  },
  {
    name: "getProjectDetails",
    description:
      "Get detailed information about a specific project by name, or all projects if no name is provided. Use when someone asks about a specific project like GovRAG, AgentFlow, or FinSight.",
    tool: getProjectDetails,
    inputSchema: z.object({
      projectName: z
        .string()
        .optional()
        .describe("Name of the project to look up (partial match works)"),
    }),
    outputSchema: z.any(),
  },
];

/**
 * components
 *
 * Tambo components the AI can render on the canvas.
 */
export const components: TamboComponent[] = [
  {
    name: "ResumeCard",
    description:
      "Render a tailored resume card on the canvas when a recruiter, HR person, or anyone asks for Ikkyu's resume or CV. Customize the summary, targetRole, emphasis, and requesterType based on context. Always render this component when asked for a resume — do not just list info as text.",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component: ResumeCard as any,
    propsSchema: resumeCardSchema,
  },
  {
    name: "ProjectShowcase",
    description:
      "Render a detailed project card on the canvas when someone asks about a specific project. Use this for GovRAG, AgentFlow, FinSight AI, LogiTrack, or any other project. Always render this component when showcasing a project — do not just describe it in text.",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component: ProjectShowcase as any,
    propsSchema: projectShowcaseSchema,
  },
  {
    name: "Graph",
    description:
      "Render a chart (bar, line, or pie) when the user asks for data visualization. Use for showing skill distributions, timeline comparisons, or any numerical data.",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component: Graph as any,
    propsSchema: graphSchema,
  },
  {
    name: "SelectForm",
    description:
      "ALWAYS use this component instead of listing options as bullet points in text. Whenever you need to ask the user a question with choices, use this component. For yes/no or single-choice questions, use mode='single'. For multi-select questions, use mode='multi'.",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component: SelectForm as any,
    propsSchema: selectFormSchema,
  },
  {
    name: "ContactForm",
    description:
      "Render an interactive contact form on the canvas when a visitor wants to reach out, hire, or get in touch with Ikkyu. Use this when someone expresses interest in hiring, collaborating, or contacting Ikkyu. The form captures name, email, company, role, and a message. You can optionally prefill fields if the user has already provided that information in the conversation.",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component: ContactForm as any,
    propsSchema: contactFormSchema,
  },
  {
    name: "SkillRadar",
    description:
      "Render a radar/spider chart visualizing Ikkyu's skill proficiencies by category. Use this when someone asks about his technical strengths, skill breakdown, or how strong he is in different areas. Provide 4–8 categories with scores 0–100. Example categories: 'AI / Agents', 'Full-Stack', 'DevOps / Cloud', 'Data Engineering', 'Leadership', 'Thai Gov Stack'. Always use this instead of listing skills as text when the question is about skill levels or technical profile.",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component: SkillRadar as any,
    propsSchema: skillRadarSchema,
  },
  {
    name: "TimelineCard",
    description:
      "Render a vertical timeline of career or education milestones. Use this when someone asks about Ikkyu's career history, work journey, progression over time, or educational background. Order entries newest-first. Include date ranges, role titles, companies/institutions, and short descriptions. Prefer this over listing career history as plain text.",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component: TimelineCard as any,
    propsSchema: timelineCardSchema,
  },
  {
    name: "StatCard",
    description:
      "Render a compact grid of key stats and numbers about Ikkyu. Use this for at-a-glance summaries when someone asks for highlights, quick facts, or a snapshot of his experience. Example stats: years of experience, number of projects shipped, number of AI agents built, government systems deployed. Use 3–6 stats with short labels and bold values.",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component: StatCard as any,
    propsSchema: statCardSchema,
  },
  {
    name: "NowCard",
    description:
      "Render a 'What I'm Working On Now' card showing Ikkyu's current focus areas as a bulleted list. Use this when someone asks 'what are you working on?', 'what's your current focus?', 'what are you up to lately?', or any present-tense status question. Pull the items from the 'Now' section in the portfolio context.",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component: NowCard as any,
    propsSchema: nowCardSchema,
  },
  {
    name: "TestimonialCard",
    description:
      "Render 1–3 recommendations / testimonials about Ikkyu in a stacked card layout. Use this when someone asks for recommendations, testimonials, references, social proof, or 'what do people say about working with him?'. Pull quotes from the Recommendations section in the portfolio context — choose the 1–3 most relevant to the asker's role.",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component: TestimonialCard as any,
    propsSchema: testimonialCardSchema,
  },
];
