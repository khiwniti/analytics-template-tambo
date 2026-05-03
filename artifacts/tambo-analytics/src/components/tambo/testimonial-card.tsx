"use client";

import * as React from "react";
import { z } from "zod";

const testimonialSchema = z.object({
  quote: z.string().describe("The recommendation text, kept to 1–3 sentences."),
  author: z.string().describe("Person's name, e.g. 'Jane Smith'."),
  title: z.string().describe("Their role/title, e.g. 'Senior BIM Lead'."),
  company: z.string().optional().describe("Their company or organization."),
  avatarUrl: z
    .string()
    .optional()
    .describe("Optional avatar image URL (https only)."),
  linkedinUrl: z
    .string()
    .optional()
    .describe("Optional LinkedIn profile URL."),
});

export const testimonialCardSchema = z.object({
  testimonials: z
    .array(testimonialSchema)
    .describe("Array of 1–3 recommendations / testimonials to display."),
  title: z
    .string()
    .optional()
    .describe("Heading shown above the testimonials (default: 'Recommendations')."),
});

export type TestimonialCardProps = z.infer<typeof testimonialCardSchema>;

const C = {
  bg: "#0d1117",
  surface: "#161b22",
  border: "rgba(52,211,153,0.15)",
  accent: "#34D399",
  accentDim: "rgba(52,211,153,0.55)",
  text: "#e6edf3",
  muted: "#8b949e",
};

function isSafeUrl(url?: string): boolean {
  if (!url) return false;
  return /^https?:\/\//i.test(url.trim());
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

function Quote({ t }: { t: TestimonialCardProps["testimonials"][number] }) {
  const safeAvatar = isSafeUrl(t.avatarUrl) ? t.avatarUrl : undefined;
  const safeLinkedIn = isSafeUrl(t.linkedinUrl) ? t.linkedinUrl : undefined;
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: "16px 18px",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 6,
          left: 12,
          fontSize: 38,
          lineHeight: 1,
          color: C.accentDim,
          fontFamily: "Georgia, serif",
          opacity: 0.4,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      >
        “
      </span>
      <p
        style={{
          margin: 0,
          paddingLeft: 18,
          fontSize: 13,
          lineHeight: 1.65,
          color: C.text,
          fontStyle: "italic",
        }}
      >
        {t.quote}
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          paddingTop: 10,
          borderTop: `1px dashed ${C.border}`,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: safeAvatar
              ? `url(${safeAvatar}) center/cover`
              : "rgba(52,211,153,0.12)",
            border: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
            color: C.accent,
            fontFamily: "JetBrains Mono, monospace",
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          {!safeAvatar && initials(t.author)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: C.text,
              lineHeight: 1.3,
            }}
          >
            {t.author}
          </div>
          <div
            style={{
              fontSize: 10,
              color: C.muted,
              fontFamily: "JetBrains Mono, monospace",
              marginTop: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {t.title}
            {t.company ? ` · ${t.company}` : ""}
          </div>
        </div>
        {safeLinkedIn && (
          <a
            href={safeLinkedIn}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flexShrink: 0,
              padding: "4px 10px",
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              color: C.accent,
              fontSize: 10,
              fontFamily: "JetBrains Mono, monospace",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            in ↗
          </a>
        )}
      </div>
    </div>
  );
}

export const TestimonialCard = React.forwardRef<
  HTMLDivElement,
  TestimonialCardProps
>(({ testimonials, title }, ref) => {
  const heading = title ?? "Recommendations";
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
          top: -60,
          right: -60,
          width: 200,
          height: 200,
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
          gap: 8,
          marginBottom: 14,
        }}
      >
        <span
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
          {heading}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {testimonials.map((t, i) => (
          <Quote key={i} t={t} />
        ))}
      </div>
    </div>
  );
});

TestimonialCard.displayName = "TestimonialCard";
