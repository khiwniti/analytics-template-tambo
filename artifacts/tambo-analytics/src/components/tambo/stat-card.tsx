"use client";

import * as React from "react";
import { z } from "zod";

export const statCardSchema = z.object({
  stats: z
    .array(
      z.object({
        label: z.string().describe("Short label, e.g. 'Years Experience'"),
        value: z.string().describe("The main value to display, e.g. '8+' or '30'"),
        unit: z
          .string()
          .optional()
          .describe("Optional suffix, e.g. 'projects', 'countries'"),
      }),
    )
    .describe(
      "Array of key metrics or stats. 3–6 items work best in a 2–3 column grid.",
    ),
  title: z
    .string()
    .optional()
    .describe("Heading above the stat grid, e.g. 'By the Numbers'"),
});

export type StatCardProps = z.infer<typeof statCardSchema>;

const C = {
  bg: "#0d1117",
  surface: "#161b22",
  border: "rgba(52,211,153,0.15)",
  borderHover: "rgba(52,211,153,0.30)",
  accent: "#34D399",
  accentDim: "rgba(52,211,153,0.55)",
  text: "#e6edf3",
  muted: "#8b949e",
};

function StatItem({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? "rgba(52,211,153,0.06)"
          : C.surface,
        border: `1px solid ${hovered ? C.borderHover : C.border}`,
        borderRadius: 12,
        padding: "16px 14px",
        textAlign: "center",
        transition: "all 0.2s ease",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow blob */}
      <div
        style={{
          position: "absolute",
          bottom: -20,
          left: "50%",
          transform: "translateX(-50%)",
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: hovered
            ? "radial-gradient(circle, rgba(52,211,153,0.12) 0%, transparent 70%)"
            : "none",
          transition: "all 0.3s",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: C.accent,
          lineHeight: 1,
          fontFamily: "Quicksand, sans-serif",
          letterSpacing: -1,
        }}
      >
        {value}
        {unit && (
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: C.accentDim,
              marginLeft: 2,
            }}
          >
            {unit}
          </span>
        )}
      </div>

      <div
        style={{
          fontSize: 10,
          fontFamily: "JetBrains Mono, monospace",
          color: C.muted,
          marginTop: 6,
          textTransform: "uppercase",
          letterSpacing: 1.5,
          lineHeight: 1.3,
        }}
      >
        {label}
      </div>
    </div>
  );
}

export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ stats, title }, ref) => {
    const cols = stats.length <= 2 ? 2 : stats.length === 4 ? 2 : 3;

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
        {/* Top-left glow */}
        <div
          style={{
            position: "absolute",
            top: -50,
            left: -50,
            width: 180,
            height: 180,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {title && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: C.accent,
                  boxShadow: `0 0 6px ${C.accentDim}`,
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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 8,
          }}
        >
          {stats.map((stat, i) => (
            <StatItem key={i} {...stat} />
          ))}
        </div>
      </div>
    );
  },
);

StatCard.displayName = "StatCard";
