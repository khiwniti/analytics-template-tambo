"use client";

import { useTamboComponentState } from "@tambo-ai/react";
import * as React from "react";
import { z } from "zod";

export const contactFormSchema = z.object({
  prefillName: z
    .string()
    .optional()
    .describe("Optional name to prefill in the form"),
  prefillEmail: z
    .string()
    .optional()
    .describe("Optional email to prefill in the form"),
  prefillCompany: z
    .string()
    .optional()
    .describe("Optional company to prefill in the form"),
  prefillRole: z
    .string()
    .optional()
    .describe("Optional role/job title to prefill in the form"),
  prefillMessage: z
    .string()
    .optional()
    .describe("Optional message to prefill in the form"),
});

export type ContactFormProps = z.infer<typeof contactFormSchema>;

type FormState = {
  name: string;
  email: string;
  company: string;
  role: string;
  message: string;
};

type SubmitStatus = "idle" | "loading" | "success" | "error";

const C = {
  primary: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceHover: "#F5F3FF",
  border: "rgba(0,0,0,0.08)",
  accent: "#7C3AED",
  accentDim: "rgba(124,58,237,0.65)",
  accentBg: "rgba(124,58,237,0.08)",
  textBright: "#111827",
  text: "#374151",
  muted: "#6B7280",
  faint: "#9CA3AF",
};

const F = {
  sans: "'Quicksand',system-ui,sans-serif",
  mono: "'JetBrains Mono','Geist Mono',monospace",
};

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label
        style={{
          fontSize: 11,
          fontFamily: F.mono,
          color: C.accentDim,
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        {label}
        {required && (
          <span style={{ color: C.accent, marginLeft: 3 }}>*</span>
        )}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "#FAFAF7",
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  padding: "10px 14px",
  color: C.textBright,
  fontFamily: F.sans,
  fontSize: 13,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  transition: "border-color 0.2s",
};

export const ContactForm = React.forwardRef<HTMLDivElement, ContactFormProps>(
  (
    {
      prefillName = "",
      prefillEmail = "",
      prefillCompany = "",
      prefillRole = "",
      prefillMessage = "",
    },
    ref,
  ) => {
    const [formState, setFormState] = useTamboComponentState<FormState>(
      "formState",
      {
        name: prefillName,
        email: prefillEmail,
        company: prefillCompany,
        role: prefillRole,
        message: prefillMessage,
      },
    );

    const [status, setStatus] = React.useState<SubmitStatus>("idle");
    const [errorMsg, setErrorMsg] = React.useState("");
    const [focusedField, setFocusedField] = React.useState<string | null>(null);

    const emptyForm: FormState = { name: "", email: "", company: "", role: "", message: "" };

    const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormState({ ...(formState ?? emptyForm), [field]: e.target.value } as FormState);
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formState?.name || !formState?.email || !formState?.message) return;

      setStatus("loading");
      setErrorMsg("");

      try {
        const apiBase = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
        const res = await fetch(`${apiBase}/api/contact`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formState),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setStatus("success");
          setFormState({ name: "", email: "", company: "", role: "", message: "" });
        } else {
          setStatus("error");
          setErrorMsg(data.error ?? "Something went wrong. Please try again.");
        }
      } catch {
        setStatus("error");
        setErrorMsg("Network error. Please check your connection.");
      }
    };

    const getBorderColor = (field: string) =>
      focusedField === field ? C.accent : C.border;

    if (status === "success") {
      return (
        <div
          ref={ref}
          style={{
            background: C.surface,
            border: `1px solid rgba(176,89,58,0.2)`,
            borderRadius: 16,
            padding: "40px 32px",
            textAlign: "center",
            fontFamily: F.sans,
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 16 }}>✅</div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: C.textBright,
              marginBottom: 8,
            }}
          >
            Message Sent!
          </div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
            Thanks for reaching out. Ikkyu will get back to you soon.
          </div>
          <button
            onClick={() => setStatus("idle")}
            style={{
              marginTop: 24,
              padding: "8px 20px",
              borderRadius: 8,
              background: C.accentBg,
              border: `1px solid rgba(176,89,58,0.2)`,
              color: C.accent,
              fontFamily: F.mono,
              fontSize: 11,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Send another message
          </button>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: "28px 28px",
          fontFamily: F.sans,
          width: "100%",
          maxWidth: 480,
          boxSizing: "border-box",
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: C.textBright,
              marginBottom: 4,
            }}
          >
            Want to hire Ikkyu?
          </div>
          <div style={{ fontSize: 12, color: C.muted }}>
            Leave your details and he&apos;ll get back to you.
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Name" required>
              <input
                type="text"
                value={formState?.name ?? ""}
                onChange={set("name")}
                placeholder="Jane Smith"
                required
                onFocus={() => setFocusedField("name")}
                onBlur={() => setFocusedField(null)}
                style={{ ...inputStyle, borderColor: getBorderColor("name") }}
              />
            </Field>
            <Field label="Email" required>
              <input
                type="email"
                value={formState?.email ?? ""}
                onChange={set("email")}
                placeholder="jane@company.com"
                required
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                style={{ ...inputStyle, borderColor: getBorderColor("email") }}
              />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Company">
              <input
                type="text"
                value={formState?.company ?? ""}
                onChange={set("company")}
                placeholder="Acme Corp"
                onFocus={() => setFocusedField("company")}
                onBlur={() => setFocusedField(null)}
                style={{ ...inputStyle, borderColor: getBorderColor("company") }}
              />
            </Field>
            <Field label="Role / Position">
              <input
                type="text"
                value={formState?.role ?? ""}
                onChange={set("role")}
                placeholder="CTO / HR Manager"
                onFocus={() => setFocusedField("role")}
                onBlur={() => setFocusedField(null)}
                style={{ ...inputStyle, borderColor: getBorderColor("role") }}
              />
            </Field>
          </div>

          <Field label="Message" required>
            <textarea
              value={formState?.message ?? ""}
              onChange={set("message")}
              placeholder="Tell Ikkyu about the opportunity or project..."
              required
              rows={4}
              onFocus={() => setFocusedField("message")}
              onBlur={() => setFocusedField(null)}
              style={{
                ...inputStyle,
                resize: "vertical",
                minHeight: 100,
                borderColor: getBorderColor("message"),
              }}
            />
          </Field>

          {status === "error" && (
            <div
              style={{
                fontSize: 12,
                color: "#f87171",
                padding: "8px 12px",
                borderRadius: 8,
                background: "rgba(248,113,113,0.08)",
                border: "1px solid rgba(248,113,113,0.2)",
              }}
            >
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={
              status === "loading" ||
              !formState?.name ||
              !formState?.email ||
              !formState?.message
            }
            style={{
              padding: "12px 24px",
              borderRadius: 10,
              background:
                formState?.name && formState?.email && formState?.message
                  ? C.accent
                  : "#F5F2EC",
              border: "none",
              color:
                formState?.name && formState?.email && formState?.message
                  ? "#FFFFFF"
                  : C.faint,
              fontFamily: F.mono,
              fontSize: 12,
              fontWeight: 700,
              cursor:
                formState?.name && formState?.email && formState?.message
                  ? "pointer"
                  : "default",
              transition: "all 0.2s",
              letterSpacing: 1,
            }}
          >
            {status === "loading" ? "Sending..." : "Send Message →"}
          </button>
        </form>
      </div>
    );
  },
);

ContactForm.displayName = "ContactForm";
