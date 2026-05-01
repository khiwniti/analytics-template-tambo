"use client";

import * as React from "react";
import { z } from "zod";

export const projectShowcaseSchema = z.object({
  projectName: z.string().describe("Name of the project"),
  tag: z.string().describe("Short category tag, e.g. 'AI · Government'"),
  description: z
    .string()
    .describe("2-3 sentence description of the project and its impact"),
  url: z.string().optional().describe("Live link or GitHub URL for the project"),
  highlights: z
    .array(z.string())
    .describe(
      "3-5 bullet point highlights: key technical achievements, scale, or impact",
    ),
  tech: z
    .array(z.string())
    .optional()
    .describe("Technologies used, e.g. ['Python', 'React', 'LangChain']"),
});

export type ProjectShowcaseProps = z.infer<typeof projectShowcaseSchema>;

const C = {
  bg: "#0d1117",
  surface: "#161b22",
  border: "rgba(52,211,153,0.15)",
  borderHover: "rgba(52,211,153,0.35)",
  accent: "#34D399",
  accentDim: "rgba(52,211,153,0.6)",
  text: "#e6edf3",
  muted: "#8b949e",
  tag: "rgba(52,211,153,0.12)",
};

export const ProjectShowcase = React.forwardRef<
  HTMLDivElement,
  ProjectShowcaseProps
>((props, ref) => {
  const { projectName, tag, description, url, highlights = [], tech = [] } = props;
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      ref={ref}
      style={{
        background: C.bg,
        border: `1px solid ${hovered ? C.borderHover : C.border}`,
        borderRadius: 16,
        padding: "24px 28px",
        fontFamily: "Quicksand, sans-serif",
        color: C.text,
        maxWidth: 480,
        boxShadow: hovered
          ? "0 12px 48px rgba(52,211,153,0.14), 0 0 0 1px rgba(52,211,153,0.1) inset"
          : "0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(52,211,153,0.06) inset",
        transition: "all 0.25s cubic-bezier(0.22,1,0.36,1)",
        cursor: url ? "pointer" : "default",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => {
        if (url) window.open(url, "_blank", "noopener,noreferrer");
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
          background: hovered
            ? "linear-gradient(90deg, transparent, rgba(52,211,153,0.9) 30%, rgba(52,211,153,1) 50%, rgba(52,211,153,0.9) 70%, transparent)"
            : "linear-gradient(90deg, transparent, rgba(52,211,153,0.5) 30%, rgba(52,211,153,0.7) 50%, rgba(52,211,153,0.5) 70%, transparent)",
          borderRadius: "16px 16px 0 0",
          transition: "opacity 0.25s",
        }}
      />

      {/* Subtle accent glow top-left */}
      <div
        style={{
          position: "absolute",
          top: -40,
          left: -40,
          width: 160,
          height: 160,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 800,
              color: C.text,
              lineHeight: 1.2,
            }}
          >
            {projectName}
          </h3>
          <span
            style={{
              display: "inline-block",
              marginTop: 6,
              padding: "2px 10px",
              borderRadius: 20,
              fontSize: 9,
              fontFamily: "JetBrains Mono, monospace",
              background: C.tag,
              border: `1px solid ${C.border}`,
              color: C.accent,
            }}
          >
            {tag}
          </span>
        </div>
        {url && (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: `1px solid ${C.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              flexShrink: 0,
              transition: "background 0.2s",
              background: hovered ? "rgba(52,211,153,0.15)" : C.surface,
            }}
            title={url}
          >
            ↗
          </div>
        )}
      </div>

      {/* Description */}
      <p
        style={{
          margin: "0 0 16px 0",
          fontSize: 13,
          color: C.muted,
          lineHeight: 1.65,
        }}
      >
        {description}
      </p>

      {/* Highlights */}
      <div
        style={{
          marginBottom: tech?.length ? 16 : 0,
          padding: "12px 14px",
          background: C.surface,
          borderRadius: 10,
          border: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            fontSize: 8,
            fontFamily: "JetBrains Mono, monospace",
            color: C.accentDim,
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Highlights
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {highlights.map((h, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                fontSize: 12,
                color: C.text,
                lineHeight: 1.5,
                marginBottom: i < highlights.length - 1 ? 6 : 0,
              }}
            >
              <span style={{ color: C.accent, flexShrink: 0, marginTop: 1 }}>
                ▸
              </span>
              {h}
            </li>
          ))}
        </ul>
      </div>

      {/* Tech stack */}
      {tech && tech.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {tech.map((t) => (
            <span
              key={t}
              style={{
                padding: "2px 8px",
                borderRadius: 20,
                fontSize: 9,
                fontFamily: "JetBrains Mono, monospace",
                background: "rgba(139,148,158,0.1)",
                border: "1px solid rgba(139,148,158,0.2)",
                color: C.muted,
              }}
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});

ProjectShowcase.displayName = "ProjectShowcase";
