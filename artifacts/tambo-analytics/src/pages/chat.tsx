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
import { TamboProvider, useTamboThreadInput } from "@tambo-ai/react";
import { TamboMcpProvider } from "@tambo-ai/react/mcp";

const PENDING_KEY = "tambo-pending-message";

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
  const [open, setOpen] = useState(false);
  const { containerRef } = useThreadContainerContext();

  // Auto-open when there's a pending message
  useEffect(() => {
    if (sessionStorage.getItem(PENDING_KEY)) {
      setOpen(true);
    }
  }, []);

  return (
    <>
      {/* ── Chat Panel ── */}
      <div
        style={{
          position: "fixed",
          bottom: open ? 136 : -600,
          right: 16,
          zIndex: 50,
          width: 340,
          height: 460,
          display: "flex",
          flexDirection: "column",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          border: "1px solid hsl(var(--border))",
          background: "hsl(var(--card))",
          transition: "bottom 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.25s",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: "1px solid hsl(var(--border))",
            background: "hsl(var(--card))",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "hsl(var(--primary))",
                display: "inline-block",
                animation: "pulse 2s infinite",
                boxShadow: "0 0 8px hsl(var(--primary) / 0.6)",
              }}
            />
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "hsl(var(--card-foreground))",
                fontFamily: "var(--font-sans)",
              }}
            >
              Ask Ikkyu's AI
            </span>
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "hsl(var(--muted-foreground))",
              fontSize: 18,
              lineHeight: 1,
              padding: "2px 6px",
              borderRadius: 6,
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "hsl(var(--card-foreground))")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "hsl(var(--muted-foreground))")
            }
          >
            ×
          </button>
        </div>

        {/* Messages + Input */}
        <ThreadContainer
          ref={containerRef}
          disableSidebarSpacing
          style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}
        >
          <AutoSubmitPendingMessage />

          <ScrollableMessageContainer
            style={{ flex: 1, padding: "12px", overflowY: "auto" }}
          >
            <ThreadContent>
              <ThreadContentMessages />
            </ThreadContent>
          </ScrollableMessageContainer>

          {/* Input area */}
          <div
            style={{
              padding: "10px 12px",
              borderTop: "1px solid hsl(var(--border))",
              flexShrink: 0,
            }}
          >
            <MessageInput>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 8,
                  background: "hsl(var(--muted))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                  padding: "8px 10px",
                }}
              >
                <MessageInputTextarea
                  placeholder="Ask anything about Ikkyu..."
                  style={{ flex: 1, minHeight: 20, maxHeight: 100, resize: "none" }}
                />
                <MessageInputSubmitButton
                  style={{ flexShrink: 0, alignSelf: "flex-end" }}
                />
              </div>
            </MessageInput>
          </div>
        </ThreadContainer>
      </div>

      {/* ── Toggle FAB ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "fixed",
          bottom: 72,
          right: 16,
          zIndex: 51,
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

export default function ChatPage() {
  const mcpServers = useMcpServers();
  const userKey = useAnonymousUserKey();

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      <TamboProvider
        apiKey={import.meta.env.VITE_TAMBO_API_KEY!}
        tamboUrl={import.meta.env.VITE_TAMBO_URL}
        userKey={userKey}
        components={components}
        tools={tools}
        mcpServers={mcpServers}
      >
        <TamboMcpProvider>
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
