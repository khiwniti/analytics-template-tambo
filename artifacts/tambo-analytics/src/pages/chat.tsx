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
import { useCanvasStore, generateId, type CanvasComponent } from "@/lib/canvas-storage";
import { components, tools } from "@/lib/tambo";
import { TamboProvider, useTambo, useTamboThreadInput } from "@tambo-ai/react";
import { TamboMcpProvider } from "@tambo-ai/react/mcp";
import { buildPortfolioContextText } from "@/services/portfolio-data";
import { SUGGESTIONS } from "@/lib/suggestions";
import type { ListResourceItem } from "@tambo-ai/react";
import { useParams } from "wouter";

const PENDING_KEY = "tambo-pending-message";
// Dispatched on `window` after a late writer (e.g. SharedProjectImporter)
// stashes a pending message into sessionStorage. AutoSubmitPendingMessage
// listens for this so async deep-links don't lose the auto-submit window.
const PENDING_EVENT = "tambo:pending-message-set";
const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

// Imported from shared lib so home page and /chat stay in sync
const STARTER_CHIPS = SUGGESTIONS;

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
  const { messages } = useTambo();
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
  // Stash latest callbacks in refs so the effect below can use empty deps —
  // otherwise Tambo's `setValue`/`submit` identities change when our own
  // `onAutoSubmit` triggers a re-render, causing the effect cleanup to
  // clear the 600 ms submit timer mid-flight.
  const setValueRef = useRef(setValue);
  const submitRef = useRef(submit);
  const onAutoSubmitRef = useRef(onAutoSubmit);
  useEffect(() => {
    setValueRef.current = setValue;
    submitRef.current = submit;
    onAutoSubmitRef.current = onAutoSubmit;
  }, [setValue, submit, onAutoSubmit]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tryConsume = () => {
      if (submitted.current) return;
      const pending = sessionStorage.getItem(PENDING_KEY);
      if (!pending) return;
      sessionStorage.removeItem(PENDING_KEY);
      submitted.current = true;
      onAutoSubmitRef.current?.();

      timer = setTimeout(async () => {
        try {
          setValueRef.current(pending);
          await new Promise((r) => setTimeout(r, 80));
          await submitRef.current();
        } catch {
          // silent — user can still type manually
        }
      }, 600);
    };

    // 1) Try once on mount (covers chips, starter prompts).
    tryConsume();

    // 2) Listen for late writes (covers async deep-links like
    //    SharedProjectImporter that fetch portfolio before priming the
    //    pending message).
    const handler = () => tryConsume();
    window.addEventListener(PENDING_EVENT, handler);

    return () => {
      window.removeEventListener(PENDING_EVENT, handler);
      // NOTE: don't clear the timer on cleanup — Tambo's input hook
      // re-renders us mid-flight and we still want the auto-submit to
      // land. The component remains mounted for the lifetime of the page.
    };
  }, []);

  return null;
}

/**
 * Page-level welcome overlay shown over the canvas when the thread has no
 * messages. Visible BEFORE the user opens the floating chat panel — clicking
 * a starter chip both opens the panel and submits the message.
 *
 * `isPending` is passed as a prop (not read from sessionStorage) so that
 * same-tab state changes are tracked reliably via React state in ChatWidget.
 */
function CanvasWelcomeOverlay({
  onChipClick,
  isMobile,
  isPending,
}: {
  onChipClick: (text: string) => void;
  isMobile: boolean;
  isPending: boolean;
}) {
  const isEmpty = useIsEmptyThread();

  if (!isEmpty || isPending) return null;

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
  // Track whether a pending auto-submit is in flight so the welcome overlay
  // hides before the message arrives. Owned here (not in the overlay) so
  // same-tab state changes propagate via React instead of the storage event.
  const [isPending, setIsPending] = useState(
    () => !!sessionStorage.getItem(PENDING_KEY)
  );

  // React to late writes (async deep-links like SharedProjectImporter)
  // so the chat panel pops open + welcome overlay hides without waiting
  // for AutoSubmitPendingMessage to fire onAutoSubmit.
  useEffect(() => {
    const handler = () => {
      if (sessionStorage.getItem(PENDING_KEY)) {
        setOpen(true);
        setIsPending(true);
      }
    };
    window.addEventListener(PENDING_EVENT, handler);
    return () => window.removeEventListener(PENDING_EVENT, handler);
  }, []);

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
      {/* Page-level welcome overlay (only when thread is empty + not pending) */}
      <CanvasWelcomeOverlay
        onChipClick={handleChipSubmit}
        isMobile={isMobile}
        isPending={isPending}
      />

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
          <AutoSubmitPendingMessage
            onAutoSubmit={() => {
              setOpen(true);
              setIsPending(false);
            }}
          />

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

/** Allowed component types for shared-canvas imports — must match registered Tambo components. */
const ALLOWED_SHARED_COMPONENT_TYPES = new Set<string>([
  "StatCard", "ResumeCard", "SkillRadar", "TimelineCard", "ProjectShowcase",
  "Graph", "SelectForm", "ContactForm", "NowCard", "TestimonialCard",
]);
const MAX_SHARED_COMPONENTS = 50;

/** Recursively sanitize a value: only allow http/https URLs, strip dangerous URL schemes. */
function sanitizeImportedValue(v: unknown, depth = 0): unknown {
  if (depth > 6) return null; // hard cap on nesting to avoid pathological payloads
  if (v === null || typeof v !== "object") {
    if (typeof v === "string") {
      // Block javascript:, data:, vbscript:, file: URL schemes
      const trimmed = v.trim();
      if (/^(javascript|data|vbscript|file):/i.test(trimmed)) return "";
    }
    return v;
  }
  if (Array.isArray(v)) {
    return v.slice(0, 200).map((x) => sanitizeImportedValue(x, depth + 1));
  }
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    out[k] = sanitizeImportedValue(val, depth + 1);
  }
  return out;
}

/**
 * Reads `?project=<slug>` from the URL on mount, looks up the project from
 * the live portfolio, and stashes a tailored question into sessionStorage
 * under PENDING_KEY. The existing `AutoSubmitPendingMessage` then picks it
 * up and submits it. Strips the param from the URL so a refresh doesn't
 * re-fire the same prompt.
 *
 * `onPrimed(name)` is called once when a question is queued so the page
 * can hide the welcome overlay and pass `isPending` to children.
 */
function SharedProjectImporter({ onPrimed }: { onPrimed: (name: string) => void }) {
  const consumed = useRef(false);

  useEffect(() => {
    if (consumed.current) return;
    consumed.current = true;

    const params = new URLSearchParams(window.location.search);
    const slug = params.get("project");
    if (!slug) return;

    // Always strip ?project= from the URL — even if the slug lookup fails
    // — so a refresh doesn't keep retrying. Preserves other params
    // (e.g. ?canvas=) and any hash fragment.
    const stripParam = () => {
      const p = new URLSearchParams(window.location.search);
      p.delete("project");
      const search = p.toString();
      const cleaned =
        window.location.pathname + (search ? `?${search}` : "") + window.location.hash;
      window.history.replaceState(null, "", cleaned);
    };

    let cancelled = false;
    (async () => {
      try {
        const { getProjectBySlug } = await import("@/services/portfolio-data");
        const project = await getProjectBySlug(slug);
        if (cancelled) return;
        if (!project) {
          console.warn(`[SharedProject] no project for slug "${slug}"`);
          stripParam();
          return;
        }
        const question = `Walk me through the ${project.name} project — the problem it solves, my approach, the architecture, key outcomes, and the tech stack. Render visual cards on the canvas as you go.`;
        // Don't clobber an explicit pending message that's already there.
        if (!sessionStorage.getItem(PENDING_KEY)) {
          sessionStorage.setItem(PENDING_KEY, question);
          // Notify AutoSubmitPendingMessage which already mounted before
          // this async write completed.
          window.dispatchEvent(new CustomEvent(PENDING_EVENT));
        }
        onPrimed(project.name);
        stripParam();
      } catch (err) {
        console.error("[SharedProject] failed to prime question:", err);
        stripParam();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onPrimed]);

  return null;
}

/**
 * Decodes a `?canvas=<base64url>` query param OR legacy `#c=<base64url>`
 * fragment on mount and creates a new "Shared Canvas" populated with the
 * encoded components. Runs only once and clears the param so a refresh
 * doesn't re-import. Validates+sanitizes the payload — unknown component
 * types and unsafe URL schemes are dropped. Always regenerates
 * `componentId` to avoid dedupe collisions on re-import.
 *
 * `onImported()` fires after a successful import so the page can render a
 * dismissible "shared snapshot" banner.
 */
function SharedCanvasImporter({ onImported }: { onImported: (canvasId: string) => void }) {
  const consumed = useRef(false);

  useEffect(() => {
    if (consumed.current) return;
    consumed.current = true;

    // Prefer query param (spec); fall back to legacy hash fragment.
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("canvas");
    const hashMatch = window.location.hash.match(/^#c=([A-Za-z0-9_-]+)/);
    const encoded = fromQuery ?? (hashMatch ? hashMatch[1] : null);
    if (!encoded) return;

    try {
      // base64url → base64
      const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
      const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
      const json = decodeURIComponent(escape(atob(padded)));
      const payload = JSON.parse(json) as {
        v?: number;
        name?: string;
        components?: unknown;
      };
      if (!payload || !Array.isArray(payload.components) || payload.components.length === 0) {
        console.warn("[SharedCanvas] empty/invalid payload — skipping");
        return;
      }

      // Validate + sanitize each component
      const safeComponents: CanvasComponent[] = [];
      for (const raw of payload.components.slice(0, MAX_SHARED_COMPONENTS)) {
        if (!raw || typeof raw !== "object") continue;
        const r = raw as Record<string, unknown>;
        const type = typeof r._componentType === "string" ? r._componentType : "";
        if (!ALLOWED_SHARED_COMPONENT_TYPES.has(type)) {
          console.warn(`[SharedCanvas] dropped unknown component type: ${type}`);
          continue;
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _isStreaming, _inCanvas, canvasId, componentId: _ignoredId, ...rest } = r;
        const sanitized = sanitizeImportedValue(rest) as Record<string, unknown>;
        safeComponents.push({
          ...sanitized,
          _componentType: type,
          componentId: generateId(), // always regenerate to prevent dedupe drops
        } as CanvasComponent);
      }

      if (safeComponents.length === 0) {
        console.warn("[SharedCanvas] no valid components after validation");
        return;
      }

      const store = useCanvasStore.getState();
      const rawName = typeof payload.name === "string" ? payload.name.slice(0, 80) : "";
      const name = rawName ? `${rawName} (shared)` : "Shared Canvas";
      // Create the canvas as writable so we can populate it, then lock it
      // to read-only after seeding. (createCanvas with isReadOnly=true would
      // make addComponent below a no-op.)
      const newCanvas = store.createCanvas(name);
      for (const c of safeComponents) {
        store.addComponent(newCanvas.id, c);
      }
      store.setActiveCanvas(newCanvas.id);
      // Flip into snapshot mode — the banner's "Clear snapshot" action calls
      // unlockCanvas + clearCanvas to let the visitor start their own.
      useCanvasStore.setState((state) => ({
        canvases: state.canvases.map((c) =>
          c.id === newCanvas.id ? { ...c, isReadOnly: true } : c,
        ),
      }));

      // Clear the canvas param + legacy hash so a refresh doesn't re-import.
      const cleanParams = new URLSearchParams(window.location.search);
      cleanParams.delete("canvas");
      const search = cleanParams.toString();
      window.history.replaceState(
        null,
        "",
        window.location.pathname + (search ? `?${search}` : ""),
      );
      onImported(newCanvas.id);
    } catch (err) {
      console.error("[SharedCanvas] failed to decode shared canvas:", err);
    }
  }, [onImported]);

  return null;
}

/**
 * Read-only snapshot banner. Shown while the active canvas was hydrated
 * from a `?canvas=` share link. The "Clear snapshot" action removes the
 * read-only canvas and switches to a fresh writable one so the visitor
 * can start exploring.
 */
function SharedSnapshotBanner() {
  // Derive snapshot state from the persisted store rather than ephemeral
  // React state — the canvas store is persisted via zustand/persist, so on
  // refresh `isReadOnly` survives but any importer-state would be lost.
  // Using the active canvas's `isReadOnly` flag keeps the banner / clear
  // action available across reloads.
  const activeCanvas = useCanvasStore((s) =>
    s.canvases.find((c) => c.id === s.activeCanvasId) ?? null,
  );
  if (!activeCanvas?.isReadOnly) return null;
  const snapshotCanvasId = activeCanvas.id;
  const handleClear = () => {
    const store = useCanvasStore.getState();
    // Replace the snapshot with a fresh writable canvas so the visitor
    // doesn't land on an empty board with no active canvas.
    const fresh = store.createCanvas("My canvas");
    store.setActiveCanvas(fresh.id);
    store.removeCanvas(snapshotCanvasId);
  };
  return (
    <div
      role="status"
      style={{
        position: "fixed",
        top: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 60,
        padding: "8px 14px",
        background: "rgba(13,17,23,0.85)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: "1px solid rgba(52,211,153,0.3)",
        borderRadius: 999,
        color: "#e2e8f0",
        fontSize: 12,
        fontFamily: "Quicksand, sans-serif",
        display: "flex",
        alignItems: "center",
        gap: 10,
        boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
      }}
    >
      <span style={{ color: "#34D399", fontWeight: 600 }}>Shared snapshot</span>
      <span style={{ color: "#94a3b8" }}>— read-only view of someone else's board.</span>
      <button
        onClick={handleClear}
        aria-label="Clear snapshot and start a fresh canvas"
        style={{
          marginLeft: 4,
          padding: "3px 10px",
          borderRadius: 999,
          background: "rgba(52,211,153,0.15)",
          border: "1px solid rgba(52,211,153,0.45)",
          color: "#34D399",
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 10,
          letterSpacing: 1,
          textTransform: "uppercase",
          cursor: "pointer",
        }}
      >
        Clear snapshot
      </button>
    </div>
  );
}

export default function ChatPage() {
  const mcpServers = useMcpServers();
  const userKey = useAnonymousUserKey();
  const { threadId } = useParams<{ threadId?: string }>();
  // No-op for now — kept so SharedProjectImporter has a stable callback;
  // AutoSubmitPendingMessage will pick up the message from sessionStorage.
  const handleProjectPrimed = useRef((_name: string) => {}).current;
  // No-op importer callback — the banner derives snapshot state from the
  // store's `isReadOnly` flag (which is persisted), so it survives refresh
  // even after the importer has cleared the URL param.
  const handleSnapshotImported = useRef((_id: string) => {}).current;

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      <SharedCanvasImporter onImported={handleSnapshotImported} />
      <SharedProjectImporter onPrimed={handleProjectPrimed} />
      <SharedSnapshotBanner />
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
