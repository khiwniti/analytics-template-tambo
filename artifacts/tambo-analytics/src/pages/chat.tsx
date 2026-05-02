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

function AutoSubmitPendingMessage() {
  const { setValue, submit } = useTamboThreadInput();
  const submitted = useRef(false);

  useEffect(() => {
    if (submitted.current) return;
    const pending = sessionStorage.getItem(PENDING_KEY);
    if (!pending) return;
    sessionStorage.removeItem(PENDING_KEY);
    submitted.current = true;

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
  }, [setValue, submit]);

  return null;
}

function FloatingChat() {
  // Lazy initializer — open immediately if there's a pending message
  const [open, setOpen] = useState(() => !!sessionStorage.getItem(PENDING_KEY));
  const { containerRef } = useThreadContainerContext();

  return (
    <>
      {/* ── Headless transparent chat panel ── */}
      <div
        style={{
          position: "fixed",
          bottom: open ? 148 : -700,
          right: 16,
          zIndex: 50,
          width: 340,
          height: 420,
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
          <AutoSubmitPendingMessage />

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
                  placeholder="Ask anything about Ikkyu..."
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
          bottom: 84,
          right: 16,
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
        title={open ? "Close chat" : "Chat with Ikkyu's AI"}
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

          {/* Floating chat widget */}
          <FloatingChat />
        </TamboMcpProvider>
      </TamboProvider>
    </div>
  );
}
