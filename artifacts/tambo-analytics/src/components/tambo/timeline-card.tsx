"use client";

import * as React from "react";
import { z } from "zod";

export const timelineCardSchema = z.object({
  entries: z
    .array(
      z.object({
        date: z.string().describe("Date or year, e.g. '2023–2025' or 'Jan 2022'"),
        title: z.string().describe("Role, degree, or milestone title"),
        subtitle: z
          .string()
          .optional()
          .describe("Company, institution, or location"),
        description: z
          .string()
          .optional()
          .describe("Short description or key achievement"),
      }),
    )
    .describe(
      "Timeline entries ordered from newest to oldest. Use for career history, education milestones, or any chronological story.",
    ),
  title: z
    .string()
    .optional()
    .describe("Heading above the timeline, e.g. 'Career Journey'"),
});

export type TimelineCardProps = z.infer<typeof timelineCardSchema>;

const C = {
  bg: "#0d1117",
  surface: "#161b22",
  border: "rgba(52,211,153,0.15)",
  accent: "#34D399",
  accentDim: "rgba(52,211,153,0.55)",
  text: "#e6edf3",
  muted: "#8b949e",
  tag: "rgba(52,211,153,0.10)",
};

export const TimelineCard = React.forwardRef<HTMLDivElement, TimelineCardProps>(
  ({ entries, title }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          background: "rgba(13,17,23,0.35)",
          border: "1px solid rgba(52,211,153,0.10)",
          borderRadius: 16,
          padding: "24px 28px",
          fontFamily: "Quicksand, sans-serif",
          color: C.text,
          width: "100%",
          position: "relative",
          overflow: "hidden",
          boxSizing: "border-box",
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
              "linear-gradient(90deg, transparent, rgba(52,211,153,0.7) 30%, rgba(52,211,153,0.9) 50%, rgba(52,211,153,0.7) 70%, transparent)",
            borderRadius: "16px 16px 0 0",
          }}
        />
        {/* Glow top-right */}
        <div
          style={{
            position: "absolute",
            top: -50,
            right: -50,
            width: 180,
            height: 180,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {title && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: C.accent,
                  boxShadow: `0 0 6px ${C.accentDim}`,
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
                {title}
              </span>
            </div>
          </div>
        )}

        <div style={{ position: "relative" }}>
          {entries.map((entry, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 16,
                paddingBottom: i < entries.length - 1 ? 20 : 0,
                position: "relative",
              }}
            >
              {/* Spine */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flexShrink: 0,
                  width: 16,
                }}
              >
                {/* Dot */}
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: i === 0 ? C.accent : C.surface,
                    border: `2px solid ${i === 0 ? C.accent : C.border}`,
                    boxShadow: i === 0 ? `0 0 8px ${C.accentDim}` : "none",
                    flexShrink: 0,
                    marginTop: 3,
                    zIndex: 1,
                  }}
                />
                {/* Line */}
                {i < entries.length - 1 && (
                  <div
                    style={{
                      flex: 1,
                      width: 1,
                      background: `linear-gradient(to bottom, ${C.border}, transparent)`,
                      marginTop: 4,
                    }}
                  />
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Date badge */}
                <div
                  style={{
                    display: "inline-block",
                    padding: "1px 8px",
                    borderRadius: 20,
                    fontSize: 9,
                    fontFamily: "JetBrains Mono, monospace",
                    background: C.tag,
                    border: `1px solid ${C.border}`,
                    color: i === 0 ? C.accent : C.muted,
                    marginBottom: 6,
                  }}
                >
                  {entry.date}
                </div>

                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: C.text,
                    lineHeight: 1.3,
                    marginBottom: entry.subtitle ? 2 : entry.description ? 4 : 0,
                  }}
                >
                  {entry.title}
                </div>

                {entry.subtitle && (
                  <div
                    style={{
                      fontSize: 11,
                      color: C.accent,
                      marginBottom: entry.description ? 4 : 0,
                    }}
                  >
                    {entry.subtitle}
                  </div>
                )}

                {entry.description && (
                  <div
                    style={{
                      fontSize: 11,
                      color: C.muted,
                      lineHeight: 1.55,
                    }}
                  >
                    {entry.description}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },
);

TimelineCard.displayName = "TimelineCard";
