import { useState, useRef, useEffect } from "react";
import { useMcpServers } from "@/components/tambo/mcp-config-modal";
import {
  MessageInput,
  MessageInputSubmitButton,
  MessageInputTextarea,
} from "@/components/tambo/message-input";
import { ScrollableMessageContainer } from "@/components/tambo/scrollable-message-container";
import {
  ThreadContent,
  ThreadContentMessages,
} from "@/components/tambo/thread-content";
import {
  ThreadContainer,
  useThreadContainerContext,
} from "@/components/tambo/thread-container";
import ComponentsCanvas from "@/components/ui/components-canvas";
import { InteractableCanvasDetails } from "@/components/ui/interactable-canvas-details";
import { InteractableTabs } from "@/components/ui/interactable-tabs";
import { useAnonymousUserKey } from "@/lib/use-anonymous-user-key";
import { components, tools } from "@/lib/tambo";
import { TamboProvider, useTambo, useTamboThreadInput } from "@tambo-ai/react";
import { TamboMcpProvider } from "@tambo-ai/react/mcp";
import { buildPortfolioContextText } from "@/services/portfolio-data";
import type { ListResourceItem } from "@tambo-ai/react";
import { useParams } from "wouter";

const PENDING_KEY = "tambo-pending-message";
const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const STARTER_CHIPS = [
  "Show me your top 3 projects",
  "What's your AI agent stack?",
  "Walk me through your career",
  "Skill profile, please",
  "Why hire you?",
  "Government work?",
];

/** Tracks viewport ≤ 640px so the chat panel can render as a full-width sheet. */
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 640px)").matches
      : false
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

/** True when the current Tambo thread has no messages yet. */
function useIsEmptyThread(): boolean {
  const tambo = useTambo() as unknown as {
    thread?: { messages?: unknown[] };
    messages?: unknown[];
  };
  const messages = tambo.thread?.messages ?? tambo.messages ?? [];
  return messages.length === 0;
}

/**
 * Reads the URL param threadId on mount and switches to that thread.
 * Then watches currentThreadId and reflects it back into the URL
 * using replaceState (no router re-render / no page transition).
 */
function ThreadUrlSync({ initialThreadId }: { initialThreadId?: string }) {
  const { switchThread, currentThreadId } = useTambo();
  const switched = useRef(false);

  // Switch to the thread specified in the URL on first render
  useEffect(() => {
    if (switched.current || !initialThreadId) return;
    switched.current = true;
    switchThread(initialThreadId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync currentThreadId → URL without triggering a route transition
  useEffect(() => {
    if (!currentThreadId) return;
    const desired = `${BASE}/chat/${currentThreadId}`;
    if (window.location.pathname !== desired) {
      window.history.replaceState(null, "", desired);
    }
  }, [currentThreadId]);

  return null;
}

function AutoSubmitPendingMessage({ onAutoSubmit }: { onAutoSubmit?: () => void }) {
  const { setValue, submit } = useTamboThreadInput();
  const submitted = useRef(false);

  useEffect(() => {
    if (submitted.current) return;
    const pending = sessionStorage.getItem(PENDING_KEY);
    if (!pending) return;
    sessionStorage.removeItem(PENDING_KEY);
    submitted.current = true;
    onAutoSubmit?.();

    const timer = setTimeout(async () => {
      try {
        setValue(pending);
        await new Promise((r) => setTimeout(r, 80));
        await submit();
      } catch {
        // silent — user can still type manually
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [setValue, submit, onAutoSubmit]);

  return null;
}

/**
 * Page-level welcome overlay shown over the canvas when the thread has no
 * messages. Visible BEFORE the user opens the floating chat panel — clicking
 * a starter chip both opens the panel and submits the message.
 */
function CanvasWelcomeOverlay({
  onChipClick,
  isMobile,
}: {
  onChipClick: (text: string) => void;
  isMobile: boolean;
}) {
  const isEmpty = useIsEmptyThread();
  if (!isEmpty) return null;

  return (
    <div
      style={{
        position: "fixed",
        // Center horizontally; sit just above the FAB so it never overlaps the toggle
        left: "50%",
        transform: "translateX(-50%)",
        bottom: isMobile
          ? "calc(96px + env(safe-area-inset-bottom, 0px))"
          : 168,
        width: "min(560px, calc(100vw - 32px))",
        zIndex: 40,
        padding: "20px 22px",
        background: "rgba(13,17,23,0.78)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: "1px solid rgba(52,211,153,0.22)",
        borderRadius: 18,
        boxShadow:
          "0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(52,211,153,0.06)",
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 10,
          color: "rgba(52,211,153,0.65)",
          letterSpacing: 3,
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        ask me anything
      </div>
      <p
        style={{
          fontSize: 14,
          color: "#e2e8f0",
          lineHeight: 1.55,
          margin: 0,
          marginBottom: 14,
          fontFamily: "Quicksand, sans-serif",
        }}
      >
        Hey 👋 I'm <strong style={{ color: "#34D399" }}>Ikkyu's portfolio AI</strong>.
        Pick a starter below — I'll render visual cards on this canvas as I answer.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {STARTER_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => onChipClick(chip)}
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              border: "1px solid rgba(52,211,153,0.28)",
              background: "rgba(52,211,153,0.07)",
              color: "#34D399",
              fontFamily: "Quicksand, sans-serif",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              transition: "background 0.15s, transform 0.1s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(52,211,153,0.16)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(52,211,153,0.07)";
            }}
          >
            {chip}
          </button>
        ))}
      </div>
      <p
        style={{
          marginTop: 12,
          marginBottom: 0,
          fontSize: 10,
          fontFamily: "JetBrains Mono, monospace",
          color: "rgba(148,163,184,0.55)",
          letterSpacing: 1.5,
        }}
      >
        Or press <span style={{ color: "#34D399" }}>/</span> or{" "}
        <span style={{ color: "#34D399" }}>⌘K</span> to type your own
      </p>
    </div>
  );
}

function ChatWidget() {
  const { containerRef } = useThreadContainerContext();
  const { setValue, submit } = useTamboThreadInput();
  const isMobile = useIsMobile();
  // Lazy initializer — open immediately if there's a pending message
  const [open, setOpen] = useState(() => !!sessionStorage.getItem(PENDING_KEY));

  // Open the chat, set the chip text, and submit
  const handleChipSubmit = async (text: string) => {
    setOpen(true);
    try {
      setValue(text);
      // Wait a frame for the panel to mount before submit
      await new Promise((r) => setTimeout(r, 80));
      await submit();
    } catch {
      // silent — user can retype if needed
    }
  };

  // Global keyboard shortcut: Cmd/Ctrl+K or "/" focuses the chat input
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const isTyping =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        target?.isContentEditable;

      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      const isSlash = e.key === "/" && !isTyping;

      if (!isCmdK && !isSlash) return;

      e.preventDefault();
      setOpen(true);

      // Wait for the panel to mount/transition, then focus the editable area
      setTimeout(() => {
        const wrapper = document.querySelector(
          '[data-slot="message-input-textarea"]'
        ) as HTMLElement | null;
        const editable =
          wrapper?.querySelector('[contenteditable="true"]') as HTMLElement | null;
        editable?.focus();
      }, 60);
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Sizing: full-width sheet on mobile, fixed widget on desktop
  const panelWidth = isMobile ? "calc(100vw - 16px)" : 340;
  const panelHeight = isMobile ? "min(72vh, 520px)" : 420;
  const panelRight = isMobile ? 8 : 16;
  const closedBottom = isMobile ? "-100vh" : -700;
  const openBottom = isMobile
    ? "calc(80px + env(safe-area-inset-bottom, 0px))"
    : 148;
  const fabBottom = isMobile
    ? "calc(16px + env(safe-area-inset-bottom, 0px))"
    : 84;

  return (
    <>
      {/* Page-level welcome overlay (only when thread is empty) */}
      <CanvasWelcomeOverlay onChipClick={handleChipSubmit} isMobile={isMobile} />

      {/* ── Headless transparent chat panel ── */}
      <div
        role="dialog"
        aria-label="Chat with Ikkyu's portfolio AI"
        aria-hidden={!open}
        style={{
          position: "fixed",
          bottom: open ? openBottom : closedBottom,
          right: panelRight,
          zIndex: 50,
          width: panelWidth,
          height: panelHeight,
          maxWidth: "100vw",
          display: "flex",
          flexDirection: "column",
          transition: "bottom 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.25s",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
      >
        <ThreadContainer
          ref={containerRef}
          disableSidebarSpacing
          className="!bg-transparent !border-0 !shadow-none"
          style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", background: "transparent" }}
        >
          <AutoSubmitPendingMessage onAutoSubmit={() => setOpen(true)} />

          {/* Scrollable messages — transparent, bubbles float over canvas */}
          <ScrollableMessageContainer
            className="!bg-transparent"
            style={{ flex: 1, padding: "8px 4px", overflowY: "auto", background: "transparent" }}
          >
            <ThreadContent>
              <ThreadContentMessages />
            </ThreadContent>
          </ScrollableMessageContainer>

          {/* Floating pill input at the bottom of messages */}
          <div style={{ flexShrink: 0, paddingTop: 8, paddingBottom: 4 }}>
            <MessageInput>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 8,
                  background: "rgba(13,17,23,0.85)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid rgba(52,211,153,0.25)",
                  borderRadius: 24,
                  padding: "8px 10px 8px 16px",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(52,211,153,0.08)",
                }}
              >
                <MessageInputTextarea
                  placeholder="Ask anything about Ikkyu... (press / or ⌘K)"
                  style={{
                    flex: 1,
                    minHeight: 20,
                    maxHeight: 80,
                    resize: "none",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "#e6edf3",
                    fontSize: 13,
                    fontFamily: "Quicksand, sans-serif",
                  }}
                />
                <MessageInputSubmitButton
                  style={{ flexShrink: 0, alignSelf: "flex-end" }}
                />
              </div>
            </MessageInput>
          </div>
        </ThreadContainer>
      </div>

      {/* ── Toggle FAB — sits above the ComponentsCanvas "Clear Canvas" button ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "fixed",
          bottom: fabBottom,
          right: isMobile ? 12 : 16,
          zIndex: 53,
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: "hsl(var(--primary))",
          color: "hsl(var(--primary-foreground))",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: open ? 22 : 18,
          boxShadow: "0 4px 20px hsl(var(--primary) / 0.5)",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.boxShadow =
            "0 6px 28px hsl(var(--primary) / 0.7)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow =
            "0 4px 20px hsl(var(--primary) / 0.5)";
        }}
        title={open ? "Close chat" : "Chat with Ikkyu's AI (press / or ⌘K)"}
      >
        {open ? "✕" : "💬"}
      </button>
    </>
  );
}

const portfolioContextHelpers = {
  getPortfolioContext: () => buildPortfolioContextText(),
};

const SYSTEM_CONTEXT_URI = "system://portfolio-context";

const systemContextResource: ListResourceItem = {
  uri: SYSTEM_CONTEXT_URI,
  name: "Portfolio Context",
  description:
    "Ikkyu Khiw's complete portfolio profile, career history, projects, skills, and AI agent persona instructions.",
  mimeType: "text/plain",
};

async function listSystemResources() {
  return [systemContextResource];
}

async function getSystemResource(uri: string) {
  if (uri === SYSTEM_CONTEXT_URI) {
    return {
      contents: [{ uri, mimeType: "text/plain", text: await buildPortfolioContextText() }],
    };
  }
  return { contents: [] };
}

export default function ChatPage() {
  const mcpServers = useMcpServers();
  const userKey = useAnonymousUserKey();
  const { threadId } = useParams<{ threadId?: string }>();

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      <TamboProvider
        apiKey={import.meta.env.VITE_TAMBO_API_KEY!}
        tamboUrl={import.meta.env.VITE_TAMBO_URL}
        userKey={userKey}
        components={components}
        tools={tools}
        mcpServers={mcpServers}
        contextHelpers={portfolioContextHelpers}
        resources={[systemContextResource]}
        listResources={listSystemResources}
        getResource={getSystemResource}
      >
        <TamboMcpProvider>
          {/* Sync thread ↔ URL */}
          <ThreadUrlSync initialThreadId={threadId} />

          {/* Hidden Tambo interactables — needed for AI canvas control */}
          <div style={{ display: "none" }}>
            <InteractableTabs interactableId="Tabs" />
            <InteractableCanvasDetails interactableId="CanvasDetails" />
          </div>

          {/* Full-viewport canvas */}
          <div
            style={{ position: "absolute", inset: 0 }}
          >
            <ComponentsCanvas className="w-full h-full" />
          </div>

          {/* Floating chat widget + page-level welcome overlay */}
          <ChatWidget />
        </TamboMcpProvider>
      </TamboProvider>
    </div>
  );
}
