"use client";

import * as React from "react";
import { z } from "zod";

export const nowCardSchema = z.object({
  items: z
    .array(z.string())
    .describe(
      "3–6 short bullet items describing what Ikkyu is focused on right now. Keep each item to one line.",
    ),
  lastUpdated: z
    .string()
    .optional()
    .describe("ISO date (YYYY-MM-DD) the items were last refreshed."),
  title: z
    .string()
    .optional()
    .describe("Heading shown above the list (default: 'What I'm Working On Now')."),
});

export type NowCardProps = z.infer<typeof nowCardSchema>;

const C = {
  bg: "#0d1117",
  border: "rgba(52,211,153,0.15)",
  accent: "#34D399",
  accentDim: "rgba(52,211,153,0.55)",
  text: "#e6edf3",
  muted: "#8b949e",
};

function formatDate(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00Z`);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export const NowCard = React.forwardRef<HTMLDivElement, NowCardProps>(
  ({ items, lastUpdated, title }, ref) => {
    const heading = title ?? "What I'm Working On Now";
    const dateLabel = formatDate(lastUpdated);
    return (
      <div
        ref={ref}
        style={{
          background: C.bg,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: "22px 26px",
          fontFamily: "Quicksand, sans-serif",
          color: C.text,
          width: "100%",
          boxSizing: "border-box",
          boxShadow:
            "0 0 0 1px rgba(52,211,153,0.08) inset, 0 8px 40px rgba(0,0,0,0.6)",
          position: "relative",
          overflow: "hidden",
        }}
      >
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

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: C.accent,
                boxShadow: `0 0 8px ${C.accentDim}`,
                animation: "nowPulse 2s ease-in-out infinite",
                display: "inline-block",
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
              Now
            </span>
          </div>
          {dateLabel && (
            <span
              style={{
                fontSize: 9,
                fontFamily: "JetBrains Mono, monospace",
                color: C.muted,
                letterSpacing: 1.5,
              }}
            >
              Updated · {dateLabel}
            </span>
          )}
        </div>

        <h3
          style={{
            margin: 0,
            marginBottom: 14,
            fontSize: 18,
            fontWeight: 700,
            color: C.text,
            lineHeight: 1.3,
          }}
        >
          {heading}
        </h3>

        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {items.map((it, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                gap: 10,
                fontSize: 13,
                lineHeight: 1.6,
                color: C.text,
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  marginTop: 7,
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: C.accent,
                  boxShadow: `0 0 6px ${C.accentDim}`,
                }}
              />
              <span>{it}</span>
            </li>
          ))}
        </ul>

        <style>{`@keyframes nowPulse{0%,100%{opacity:1}50%{opacity:0.35}}`}</style>
      </div>
    );
  },
);

NowCard.displayName = "NowCard";
