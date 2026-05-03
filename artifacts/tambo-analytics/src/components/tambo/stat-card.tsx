"use client";

import * as React from "react";
import { motion, animate } from "framer-motion";
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
  bg: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceHover: "#F5F3FF",
  border: "rgba(0,0,0,0.08)",
  borderHover: "rgba(124,58,237,0.45)",
  accent: "#7C3AED",
  accentDim: "rgba(124,58,237,0.65)",
  text: "#111827",
  muted: "#6B7280",
};

/** Animated count-up — parses leading digits, animates with spring, preserves suffix like "+", "%". */
function AnimatedNumber({ value }: { value: string }) {
  const match = value.match(/^(-?\d+(?:\.\d+)?)(.*)$/);
  const target = match ? parseFloat(match[1]) : NaN;
  const suffix = match ? match[2] : "";
  const isInt = match ? !match[1].includes(".") : true;
  const [text, setText] = React.useState<string>(
    isNaN(target) ? value : (isInt ? "0" : "0.0") + suffix,
  );
  React.useEffect(() => {
    if (isNaN(target)) {
      setText(value);
      return;
    }
    const controls = animate(0, target, {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setText((isInt ? Math.round(v) : v.toFixed(1)) + suffix),
    });
    return () => controls.stop();
  }, [target, value, isInt, suffix]);
  return <span>{text}</span>;
}

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
    <motion.div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      style={{
        background: hovered ? C.surfaceHover : C.surface,
        border: `1px solid ${hovered ? C.borderHover : C.border}`,
        borderRadius: 14,
        padding: "18px 14px",
        textAlign: "center",
        transition: "background 0.2s ease, border-color 0.2s ease",
        position: "relative",
        overflow: "hidden",
        boxShadow: hovered
          ? "0 1px 2px rgba(15,23,42,0.04), 0 12px 28px rgba(15,23,42,0.08)"
          : "0 1px 2px rgba(15,23,42,0.04), 0 6px 18px rgba(15,23,42,0.05)",
      }}
    >
      <div
        style={{
          fontSize: 30,
          fontWeight: 700,
          color: C.accent,
          lineHeight: 1,
          fontFamily: "'Fraunces', Georgia, serif",
          letterSpacing: -1,
        }}
      >
        <AnimatedNumber value={value} />
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
    </motion.div>
  );
}

export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ stats, title }, ref) => {
    const cols = stats.length <= 2 ? 2 : stats.length === 4 ? 2 : 3;

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          padding: "24px 28px",
          fontFamily: "Inter, Quicksand, system-ui, sans-serif",
          color: C.text,
          width: "100%",
          position: "relative",
          boxSizing: "border-box",
        }}
      >
        {title && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: C.accent,
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
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
          }}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 10,
          }}
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y: 14 },
                visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 22 } },
              }}
            >
              <StatItem {...stat} />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    );
  },
);

StatCard.displayName = "StatCard";
