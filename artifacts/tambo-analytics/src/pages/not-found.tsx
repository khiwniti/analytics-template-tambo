import { Link } from "wouter";

const C = {
  primary: "#0a0e17",
  surface: "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.08)",
  accent: "#34D399",
  accentDim: "rgba(52,211,153,0.5)",
  textBright: "#e2e8f0",
  text: "#94a3b8",
  muted: "#64748b",
  faint: "#475569",
};
const F = {
  sans: "'Quicksand',system-ui,sans-serif",
  mono: "'JetBrains Mono','Geist Mono',monospace",
};

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.primary,
        color: C.text,
        fontFamily: F.sans,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated dot grid backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle, rgba(52,211,153,0.18) 1.5px, transparent 1.5px)",
          backgroundSize: "28px 28px",
          opacity: 0.5,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          maxWidth: 520,
          width: "100%",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Big mono numerals */}
        <div
          style={{
            fontFamily: F.mono,
            fontSize: "clamp(72px, 18vw, 144px)",
            fontWeight: 600,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            background: `linear-gradient(135deg, ${C.accent} 0%, rgba(52,211,153,0.4) 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: 16,
            textShadow: `0 0 60px ${C.accentDim}`,
          }}
        >
          404
        </div>

        {/* mono subtitle */}
        <div
          style={{
            fontFamily: F.mono,
            fontSize: 11,
            color: C.accentDim,
            letterSpacing: 4,
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          ROUTE NOT FOUND
        </div>

        <h1
          style={{
            fontSize: 28,
            fontWeight: 600,
            color: C.textBright,
            marginBottom: 12,
            letterSpacing: "-0.01em",
          }}
        >
          This page is off the map
        </h1>

        <p
          style={{
            fontSize: 14,
            color: C.muted,
            lineHeight: 1.6,
            marginBottom: 32,
            maxWidth: 380,
            margin: "0 auto 32px",
          }}
        >
          The URL you tried doesn't exist — but Ikkyu's portfolio agent does.
          Head home for the full story, or jump straight into the chat.
        </p>

        {/* CTAs */}
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/"
            style={{
              padding: "11px 22px",
              borderRadius: 10,
              background: `linear-gradient(135deg, rgba(52,211,153,0.22) 0%, rgba(52,211,153,0.06) 100%)`,
              border: `1px solid ${C.accentDim}`,
              color: C.accent,
              fontFamily: F.sans,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              cursor: "pointer",
              boxShadow: `0 4px 20px rgba(52,211,153,0.12)`,
              transition: "transform 0.15s",
              display: "inline-block",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            ← Back to portfolio
          </Link>
          <Link
            href="/chat"
            onClick={() => {
              // Pre-seed the chat with a question relevant to landing on a 404
              try {
                sessionStorage.setItem(
                  "tambo-pending-message",
                  "What pages does this site have?"
                );
              } catch {
                // sessionStorage may be unavailable (private mode); ignore
              }
            }}
            style={{
              padding: "11px 22px",
              borderRadius: 10,
              background: "transparent",
              border: `1px solid ${C.border}`,
              color: C.text,
              fontFamily: F.sans,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              cursor: "pointer",
              transition: "border-color 0.2s, color 0.2s",
              display: "inline-block",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.accentDim;
              e.currentTarget.style.color = C.textBright;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.color = C.text;
            }}
          >
            Talk to the AI →
          </Link>
        </div>

        {/* mono breadcrumb */}
        <div
          style={{
            marginTop: 40,
            fontFamily: F.mono,
            fontSize: 10,
            color: C.faint,
            letterSpacing: 2,
          }}
        >
          khiw.dev / 404
        </div>
      </div>
    </div>
  );
}
