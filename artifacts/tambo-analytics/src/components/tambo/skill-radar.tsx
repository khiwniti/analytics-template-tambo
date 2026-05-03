"use client";

import * as React from "react";
import { z } from "zod";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export const skillRadarSchema = z.object({
  categories: z
    .array(
      z.object({
        name: z.string().describe("Skill category name, e.g. 'Frontend'"),
        value: z
          .number()
          .min(0)
          .max(100)
          .describe("Proficiency 0–100"),
      }),
    )
    .describe(
      "Array of skill categories with proficiency scores. Use 4–8 categories for best readability.",
    ),
  title: z
    .string()
    .optional()
    .describe("Optional heading above the radar chart, e.g. 'Skill Profile'"),
});

export type SkillRadarProps = z.infer<typeof skillRadarSchema>;

const C = {
  bg: "#0d1117",
  surface: "#161b22",
  border: "rgba(52,211,153,0.15)",
  accent: "#34D399",
  accentDim: "rgba(52,211,153,0.55)",
  accentFill: "rgba(52,211,153,0.15)",
  text: "#e6edf3",
  muted: "#8b949e",
  grid: "rgba(52,211,153,0.12)",
};

export const SkillRadar = React.forwardRef<HTMLDivElement, SkillRadarProps>(
  ({ categories, title }, ref) => {
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
        {/* Corner glow */}
        <div
          style={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(52,211,153,0.07) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {title && (
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
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

        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={categories} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
              <PolarGrid
                stroke={C.grid}
                strokeDasharray="3 3"
              />
              <PolarAngleAxis
                dataKey="name"
                tick={{
                  fontSize: 10,
                  fontFamily: "JetBrains Mono, monospace",
                  fill: C.muted,
                }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={false}
                axisLine={false}
                tickCount={5}
              />
              <Radar
                name="Proficiency"
                dataKey="value"
                stroke={C.accent}
                strokeWidth={1.5}
                fill={C.accentFill}
                dot={{ r: 3, fill: C.accent, strokeWidth: 0 }}
              />
              <Tooltip
                contentStyle={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 11,
                  color: C.text,
                }}
                formatter={(value: number) => [`${value}%`, "Proficiency"]}
                labelStyle={{ color: C.accent }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend row */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginTop: 8,
          }}
        >
          {categories.map((c) => (
            <div
              key={c.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "2px 8px",
                borderRadius: 20,
                background: "rgba(52,211,153,0.08)",
                border: `1px solid ${C.border}`,
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  fontFamily: "JetBrains Mono, monospace",
                  color: C.muted,
                }}
              >
                {c.name}
              </span>
              <span
                style={{
                  fontSize: 9,
                  fontFamily: "JetBrains Mono, monospace",
                  color: C.accent,
                  fontWeight: 700,
                }}
              >
                {c.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  },
);

SkillRadar.displayName = "SkillRadar";
