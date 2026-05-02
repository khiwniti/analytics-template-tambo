import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import HomePage from "@/pages/home";
import ChatPage from "@/pages/chat";
import AdminPage from "@/pages/admin";
import NotFound from "@/pages/not-found";
import { useState, useEffect, useRef } from "react";

const TRANSITION_MS = 220;
const EXIT_MS = Math.round(TRANSITION_MS * 0.7);

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

/** Map a pathname to a stable "page key" so navigating between e.g.
 *  /chat and /chat/:threadId doesn't trigger a page transition or unmount. */
function getPageKey(loc: string): string {
  if (loc === "/" || loc === "") return "home";
  if (loc.startsWith("/chat")) return "chat";
  if (loc.startsWith("/admin")) return "admin";
  return loc;
}

function AnimatedRoutes() {
  const [location] = useLocation();
  const [renderedLocation, setRenderedLocation] = useState(location);
  const [phase, setPhase] = useState<"entering" | "exiting" | "idle">("entering");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotion = useReducedMotion();

  const currentPageKey = getPageKey(location);
  const renderedPageKey = getPageKey(renderedLocation);

  useEffect(() => {
    // Only trigger a page transition when the PAGE changes (not when the
    // thread-id sub-path changes within /chat).
    if (currentPageKey === renderedPageKey) {
      // Same page — update the rendered location silently so Switch sees the
      // latest path, but skip the transition animation.
      if (location !== renderedLocation) {
        setRenderedLocation(location);
      }
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    if (reducedMotion) {
      setRenderedLocation(location);
      setPhase("idle");
      return;
    }

    setPhase("exiting");

    timerRef.current = setTimeout(() => {
      setRenderedLocation(location);
      setPhase("entering");

      timerRef.current = setTimeout(() => {
        setPhase("idle");
      }, TRANSITION_MS + 50);
    }, EXIT_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [location, currentPageKey, renderedPageKey, reducedMotion]);

  const className =
    phase === "entering" ? "page-entering" : phase === "exiting" ? "page-exiting" : "";

  return (
    <div key={renderedPageKey} className={className} style={{ minHeight: "100vh" }}>
      <Switch location={renderedLocation}>
        <Route path="/" component={HomePage} />
        <Route path="/chat" component={ChatPage} />
        <Route path="/admin" component={AdminPage} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <TooltipProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AnimatedRoutes />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
