"use client";

import * as React from "react";
import { motion } from "framer-motion";
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
  bg: "#FFFFFF",
  surface: "#FFFFFF",
  border: "rgba(0,0,0,0.08)",
  accent: "#7C3AED",
  accentDim: "rgba(124,58,237,0.65)",
  accentFill: "rgba(124,58,237,0.18)",
  accentBg: "rgba(124,58,237,0.06)",
  text: "#111827",
  muted: "#6B7280",
  grid: "rgba(0,0,0,0.08)",
};

export const SkillRadar = React.forwardRef<HTMLDivElement, SkillRadarProps>(
  ({ categories, title }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          padding: "24px 28px",
          fontFamily: "Quicksand, sans-serif",
          color: C.text,
          width: "100%",
          position: "relative",
          boxSizing: "border-box",
        }}
      >
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
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: C.accent,
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

        <motion.div
          style={{ width: "100%", height: 260, transformOrigin: "center" }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
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
                isAnimationActive
                animationBegin={150}
                animationDuration={1100}
                animationEasing="ease-out"
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
        </motion.div>

        {/* Legend row */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04, delayChildren: 0.5 } } }}
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginTop: 8,
          }}
        >
          {categories.map((c) => (
            <motion.div
              key={c.name}
              variants={{
                hidden: { opacity: 0, y: 6 },
                visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 320, damping: 22 } },
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "2px 8px",
                borderRadius: 20,
                background: C.accentBg,
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
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    );
  },
);

SkillRadar.displayName = "SkillRadar";
