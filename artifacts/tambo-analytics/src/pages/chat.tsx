import { useEffect, useRef } from "react";
import { useMcpServers } from "@/components/tambo/mcp-config-modal";
import { MessageThreadFull } from "@/components/tambo/message-thread-full";
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

    // Give the thread a moment to initialize before submitting
    const timer = setTimeout(async () => {
      try {
        setValue(pending);
        // Another tick so the value propagates
        await new Promise(r => setTimeout(r, 80));
        await submit();
      } catch {
        // If auto-submit fails the user can still type it manually
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [setValue, submit]);

  return null;
}

export default function ChatPage() {
  const mcpServers = useMcpServers();
  const userKey = useAnonymousUserKey();

  return (
    <div className="h-screen flex flex-col overflow-hidden relative">
      <TamboProvider
        apiKey={import.meta.env.VITE_TAMBO_API_KEY!}
        tamboUrl={import.meta.env.VITE_TAMBO_URL}
        userKey={userKey}
        components={components}
        tools={tools}
        mcpServers={mcpServers}
      >
        <TamboMcpProvider>
          <AutoSubmitPendingMessage />
          <div className="flex h-full overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <MessageThreadFull />
            </div>
            <div className="hidden md:block w-[60%] overflow-auto">
              <InteractableTabs interactableId="Tabs" />
              <InteractableCanvasDetails interactableId="CanvasDetails" />
              <ComponentsCanvas className="h-full" />
            </div>
          </div>
        </TamboMcpProvider>
      </TamboProvider>
    </div>
  );
}
