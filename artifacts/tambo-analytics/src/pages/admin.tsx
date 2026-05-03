import { useState, useEffect, useCallback } from "react";
import { type PortfolioProfile, clearPortfolioCache } from "../services/portfolio-data";

const C = {
  primary: "#FFFFFF",
  surface: "#FFFFFF",
  surface2: "#F5F3FF",
  border: "rgba(0,0,0,0.08)",
  accent: "#7C3AED",
  accentDim: "rgba(124,58,237,0.65)",
  accentBg: "rgba(124,58,237,0.08)",
  accentBorder: "1px solid rgba(124,58,237,0.35)",
  red: "#f87171",
  redBg: "rgba(248,113,113,0.08)",
  redBorder: "rgba(248,113,113,0.2)",
  textBright: "#111827",
  text: "#374151",
  muted: "#6B7280",
  faint: "#9CA3AF",
};
const F = {
  sans: "'Quicksand',system-ui,sans-serif",
  mono: "'JetBrains Mono','Geist Mono',monospace",
};

const API_BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

type SaveStatus = "idle" | "saving" | "saved" | "error";
type AuthState = "unknown" | "checking" | "authenticated" | "unauthenticated";

async function checkToken(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/portfolio/auth-check`, {
      headers: { "x-admin-token": token },
    });
    return res.ok;
  } catch {
    return false;
  }
}

function inputStyle(focused: boolean): React.CSSProperties {
  return {
    background: "#FFFFFF",
    border: `1px solid ${focused ? C.accent : C.border}`,
    borderRadius: 8,
    padding: "8px 12px",
    color: C.textBright,
    fontFamily: F.sans,
    fontSize: 13,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ fontSize: 10, fontFamily: F.mono, color: C.accentDim, letterSpacing: 2, textTransform: "uppercase", marginBottom: 5 }}>
      {children}{required && <span style={{ color: C.accent, marginLeft: 3 }}>*</span>}
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, paddingBottom: 10, borderBottom: `1px solid ${C.border}` }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.accent }} />
      <span style={{ fontFamily: F.mono, fontSize: 11, color: C.accentDim, letterSpacing: 3, textTransform: "uppercase" }}>{children}</span>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  required,
  multiline,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
}) {
  const [focused, setFocused] = useState(false);
  const style = inputStyle(focused);
  return (
    <div style={{ marginBottom: 14 }}>
      <FieldLabel required={required}>{label}</FieldLabel>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          rows={rows}
          style={{ ...style, resize: "vertical", minHeight: rows * 24 }}
        />
      ) : (
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={style}
        />
      )}
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const [focused, setFocused] = useState(false);
  const [raw, setRaw] = useState(String(value));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const str = e.target.value;
    setRaw(str);
    const parsed = parseInt(str, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    setFocused(false);
    const parsed = parseInt(raw, 10);
    if (isNaN(parsed) || parsed < 0) {
      setRaw(String(value));
    }
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <FieldLabel>{label}</FieldLabel>
      <input
        type="number"
        min="0"
        value={raw}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        style={inputStyle(focused)}
      />
    </div>
  );
}

function ItemsArrayField({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [focused, setFocused] = useState<number | null>(null);
  return (
    <div style={{ marginBottom: 14 }}>
      <FieldLabel>{label}</FieldLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 6 }}>
            <input
              value={item}
              onChange={e => {
                const next = [...items];
                next[i] = e.target.value;
                onChange(next);
              }}
              onFocus={() => setFocused(i)}
              onBlur={() => setFocused(null)}
              placeholder={placeholder}
              style={{ ...inputStyle(focused === i), flex: 1 }}
            />
            <button
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.redBorder}`, background: C.redBg, color: C.red, fontFamily: F.mono, fontSize: 11, cursor: "pointer" }}
            >✕</button>
          </div>
        ))}
        <button
          onClick={() => onChange([...items, ""])}
          style={{ alignSelf: "flex-start", padding: "4px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontFamily: F.mono, fontSize: 10, cursor: "pointer" }}
        >+ Add item</button>
      </div>
    </div>
  );
}

type Tab = "profile" | "career" | "projects" | "skills" | "domains" | "now" | "testimonials" | "education" | "contact" | "submissions";

const TABS: { id: Tab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "career", label: "Career" },
  { id: "projects", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "domains", label: "Domains" },
  { id: "now", label: "Now" },
  { id: "testimonials", label: "Recommendations" },
  { id: "education", label: "Education" },
  { id: "contact", label: "Contact" },
  { id: "submissions", label: "Submissions" },
];

type ContactSubmission = {
  id: number;
  name: string;
  email: string;
  company?: string | null;
  role?: string | null;
  message: string;
  ipAddress?: string | null;
  createdAt: string;
};

function LoginGate({ onLogin }: { onLogin: (token: string) => void }) {
  const [token, setToken] = useState("");
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    setLoading(true);
    setError("");
    const valid = await checkToken(token.trim());
    setLoading(false);
    if (valid) {
      onLogin(token.trim());
    } else {
      setError("Invalid admin token. Please try again.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.sans }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');*{box-sizing:border-box}`}</style>
      <div style={{ width: "100%", maxWidth: 380, padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: C.accentBg, border: `1px solid rgba(176,89,58,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 20 }}>🔒</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.textBright, marginBottom: 6 }}>Admin Access</div>
          <div style={{ fontSize: 13, color: C.muted }}>Enter your admin token to edit your portfolio</div>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <FieldLabel required>Admin Token</FieldLabel>
            <input
              type="password"
              autoComplete="current-password"
              value={token}
              onChange={e => setToken(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Enter your PORTFOLIO_ADMIN_TOKEN"
              style={inputStyle(focused)}
            />
          </div>
          {error && (
            <div style={{ fontSize: 12, color: C.red, padding: "8px 12px", borderRadius: 8, background: C.redBg, border: `1px solid ${C.redBorder}` }}>{error}</div>
          )}
          <button
            type="submit"
            disabled={!token.trim() || loading}
            style={{ padding: "12px 24px", borderRadius: 10, border: "none", background: token.trim() ? C.accent : "#F5F3FF", color: token.trim() ? "#FFFFFF" : C.faint, fontFamily: F.mono, fontSize: 12, fontWeight: 700, cursor: token.trim() ? "pointer" : "default", transition: "all 0.2s", letterSpacing: 1 }}
          >{loading ? "Verifying..." : "Unlock →"}</button>
        </form>
      </div>
    </div>
  );
}

function SaveButton({ status, onClick, size = "sm" }: { status: SaveStatus; onClick: () => void; size?: "sm" | "lg" }) {
  const saved = status === "saved";
  const label = status === "saving" ? "Saving..." : saved ? "✓ Saved" : status === "error" ? "Retry Save" : "Save Changes";
  return (
    <button
      onClick={onClick}
      disabled={status === "saving"}
      style={{
        padding: size === "lg" ? "10px 28px" : "8px 20px",
        borderRadius: size === "lg" ? 10 : 8,
        border: saved ? C.accentBorder : "none",
        background: saved ? C.accentBg : C.accent,
        color: saved ? C.accent : C.primary,
        fontFamily: F.mono,
        fontSize: size === "lg" ? 12 : 11,
        fontWeight: 700,
        cursor: status === "saving" ? "default" : "pointer",
        transition: "all 0.2s",
        letterSpacing: 0.5,
      }}
    >{label}</button>
  );
}

export default function AdminPage() {
  const [authState, setAuthState] = useState<AuthState>("unknown");
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<PortfolioProfile | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState("");
  const [dataLoading, setDataLoading] = useState(false);
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [submissionsError, setSubmissionsError] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("admin-token");
    if (!stored) {
      setAuthState("unauthenticated");
      return;
    }
    setAuthState("checking");
    checkToken(stored).then(valid => {
      if (valid) {
        setToken(stored);
        setAuthState("authenticated");
      } else {
        sessionStorage.removeItem("admin-token");
        setAuthState("unauthenticated");
      }
    });
  }, []);

  useEffect(() => {
    if (authState !== "authenticated" || !token) return;
    setDataLoading(true);
    fetch(`${API_BASE}/api/portfolio`)
      .then(r => r.json())
      .then((data: PortfolioProfile) => { setProfile(data); setDataLoading(false); })
      .catch(() => setDataLoading(false));
  }, [authState, token]);

  useEffect(() => {
    if (activeTab !== "submissions" || authState !== "authenticated" || !token) return;
    setSubmissionsLoading(true);
    setSubmissionsError("");
    fetch(`${API_BASE}/api/admin/contacts`, {
      headers: { "x-admin-token": token },
    })
      .then(async r => {
        if (r.status === 401) {
          setSubmissionsLoading(false);
          handleLogout();
          return;
        }
        const data = await r.json() as { contacts?: ContactSubmission[]; error?: string };
        if (!r.ok || !data.contacts) {
          setSubmissionsError(data.error ?? "Failed to load submissions");
        } else {
          setSubmissions(data.contacts);
        }
        setSubmissionsLoading(false);
      })
      .catch(() => {
        setSubmissionsError("Network error. Could not load submissions.");
        setSubmissionsLoading(false);
      });
  }, [activeTab, authState, token]);

  const handleLogin = useCallback((t: string) => {
    sessionStorage.setItem("admin-token", t);
    setToken(t);
    setAuthState("authenticated");
  }, []);

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem("admin-token");
    setToken(null);
    setProfile(null);
    setAuthState("unauthenticated");
  }, []);

  const save = useCallback(async () => {
    if (!profile || !token) return;
    setSaveStatus("saving");
    setSaveError("");
    try {
      const res = await fetch(`${API_BASE}/api/portfolio`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify(profile),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (res.status === 401) {
        handleLogout();
        setSaveStatus("idle");
        return;
      }
      if (res.ok && data.success) {
        clearPortfolioCache();
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2500);
      } else {
        setSaveStatus("error");
        setSaveError(data.error ?? "Save failed. Please try again.");
      }
    } catch {
      setSaveStatus("error");
      setSaveError("Network error. Check your connection.");
    }
  }, [profile, token, handleLogout]);

  const setField = <K extends keyof PortfolioProfile>(key: K, value: PortfolioProfile[K]) => {
    setProfile(p => p ? { ...p, [key]: value } : p);
  };

  if (authState === "unknown" || authState === "checking") {
    return (
      <div style={{ minHeight: "100vh", background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.mono, fontSize: 12, color: C.muted }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');*{box-sizing:border-box}`}</style>
        Checking session...
      </div>
    );
  }

  if (authState === "unauthenticated") {
    return <LoginGate onLogin={handleLogin} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: C.primary, color: C.text, fontFamily: F.sans }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');*{box-sizing:border-box}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:${C.primary}}::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px}`}</style>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: C.primary, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16 }}>⚙️</span>
          <span style={{ fontFamily: F.mono, fontSize: 13, color: C.textBright, fontWeight: 700 }}>Portfolio Admin</span>
          <span style={{ fontFamily: F.mono, fontSize: 10, color: C.accentDim, background: C.accentBg, padding: "2px 8px", borderRadius: 20, border: `1px solid rgba(176,89,58,0.2)` }}>LIVE EDIT</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {saveStatus === "error" && saveError && (
            <span style={{ fontSize: 11, color: C.red, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{saveError}</span>
          )}
          <SaveButton status={saveStatus} onClick={save} />
          <button
            onClick={handleLogout}
            style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontFamily: F.mono, fontSize: 10, cursor: "pointer" }}
          >Log out</button>
        </div>
      </div>

      <div style={{ display: "flex", minHeight: "calc(100vh - 57px)" }}>
        {/* Sidebar */}
        <div style={{ width: 160, flexShrink: 0, borderRight: `1px solid ${C.border}`, padding: "16px 0" }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 20px", background: activeTab === tab.id ? C.accentBg : "transparent", border: "none", borderLeft: `2px solid ${activeTab === tab.id ? C.accent : "transparent"}`, color: activeTab === tab.id ? C.accent : C.muted, fontFamily: F.mono, fontSize: 11, cursor: "pointer", transition: "all 0.15s", letterSpacing: 0.5 }}
            >{tab.label}</button>
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto", maxHeight: "calc(100vh - 57px)" }}>
          {dataLoading && (
            <div style={{ textAlign: "center", color: C.muted, paddingTop: 60 }}>
              <div style={{ fontSize: 24, marginBottom: 12 }}>⏳</div>
              <div style={{ fontFamily: F.mono, fontSize: 12 }}>Loading portfolio data...</div>
            </div>
          )}

          {!dataLoading && profile && (
            <>
              {/* ── Profile ── */}
              {activeTab === "profile" && (
                <div>
                  <SectionHeader>Profile & Identity</SectionHeader>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
                    <TextField label="Full Name" value={profile.name} onChange={v => setField("name", v)} required />
                    <TextField label="Handle" value={profile.handle} onChange={v => setField("handle", v)} />
                    <TextField label="Title" value={profile.title} onChange={v => setField("title", v)} required />
                    <TextField label="Location" value={profile.location} onChange={v => setField("location", v)} />
                    <TextField label="Email" value={profile.email} onChange={v => setField("email", v)} />
                    <TextField label="Website" value={profile.website} onChange={v => setField("website", v)} />
                    <TextField label="GitHub" value={profile.github} onChange={v => setField("github", v)} />
                    <TextField label="LinkedIn" value={profile.linkedin} onChange={v => setField("linkedin", v)} />
                    <TextField label="Resume URL" value={profile.resume} onChange={v => setField("resume", v)} />
                  </div>
                  <TextField label="Summary" value={profile.summary} onChange={v => setField("summary", v)} multiline rows={5} required />

                  <div style={{ marginTop: 8 }}>
                    <SectionHeader>Stats</SectionHeader>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0 20px" }}>
                      <NumberField label="Live Apps" value={profile.stats.live} onChange={v => setField("stats", { ...profile.stats, live: v })} />
                      <NumberField label="Projects" value={profile.stats.projects} onChange={v => setField("stats", { ...profile.stats, projects: v })} />
                      <NumberField label="Workers" value={profile.stats.workers} onChange={v => setField("stats", { ...profile.stats, workers: v })} />
                      <NumberField label="Industries" value={profile.stats.industries} onChange={v => setField("stats", { ...profile.stats, industries: v })} />
                    </div>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <SectionHeader>Side Projects</SectionHeader>
                    {profile.sideProjects.map((sp, i) => (
                      <div key={i} style={{ padding: "14px 16px", background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                          <span style={{ fontFamily: F.mono, fontSize: 10, color: C.accentDim }}>SIDE PROJECT {i + 1}</span>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              onClick={() => { const next = [...profile.sideProjects]; [next[i - 1], next[i]] = [next[i], next[i - 1]]; setField("sideProjects", next); }}
                              disabled={i === 0}
                              style={{ padding: "2px 8px", borderRadius: 4, border: `1px solid ${C.border}`, background: "transparent", color: i === 0 ? C.faint : C.muted, fontFamily: F.mono, fontSize: 10, cursor: i === 0 ? "default" : "pointer", opacity: i === 0 ? 0.4 : 1 }}
                            >↑</button>
                            <button
                              onClick={() => { const next = [...profile.sideProjects]; [next[i], next[i + 1]] = [next[i + 1], next[i]]; setField("sideProjects", next); }}
                              disabled={i === profile.sideProjects.length - 1}
                              style={{ padding: "2px 8px", borderRadius: 4, border: `1px solid ${C.border}`, background: "transparent", color: i === profile.sideProjects.length - 1 ? C.faint : C.muted, fontFamily: F.mono, fontSize: 10, cursor: i === profile.sideProjects.length - 1 ? "default" : "pointer", opacity: i === profile.sideProjects.length - 1 ? 0.4 : 1 }}
                            >↓</button>
                            <button onClick={() => setField("sideProjects", profile.sideProjects.filter((_, j) => j !== i))} style={{ padding: "2px 8px", borderRadius: 4, border: `1px solid ${C.redBorder}`, background: C.redBg, color: C.red, fontFamily: F.mono, fontSize: 10, cursor: "pointer" }}>Remove</button>
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                          <TextField label="Name" value={sp.name} onChange={v => { const next = [...profile.sideProjects]; next[i] = { ...sp, name: v }; setField("sideProjects", next); }} />
                          <TextField label="URL" value={sp.url} onChange={v => { const next = [...profile.sideProjects]; next[i] = { ...sp, url: v }; setField("sideProjects", next); }} />
                        </div>
                        <TextField label="Description" value={sp.description} onChange={v => { const next = [...profile.sideProjects]; next[i] = { ...sp, description: v }; setField("sideProjects", next); }} multiline rows={2} />
                      </div>
                    ))}
                    <button onClick={() => setField("sideProjects", [...profile.sideProjects, { name: "", url: "", description: "" }])} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontFamily: F.mono, fontSize: 10, cursor: "pointer" }}>+ Add Side Project</button>
                  </div>
                </div>
              )}

              {/* ── Career ── */}
              {activeTab === "career" && (
                <div>
                  <SectionHeader>Career Timeline</SectionHeader>
                  {profile.career.map((c, i) => (
                    <div key={i} style={{ padding: "14px 16px", background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <span style={{ fontFamily: F.mono, fontSize: 10, color: C.accentDim }}>ENTRY {i + 1}{c.highlight ? " ★ HIGHLIGHT" : ""}</span>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => { const next = [...profile.career]; [next[i - 1], next[i]] = [next[i], next[i - 1]]; setField("career", next); }}
                            disabled={i === 0}
                            style={{ padding: "2px 8px", borderRadius: 4, border: `1px solid ${C.border}`, background: "transparent", color: i === 0 ? C.faint : C.muted, fontFamily: F.mono, fontSize: 10, cursor: i === 0 ? "default" : "pointer", opacity: i === 0 ? 0.4 : 1 }}
                          >↑</button>
                          <button
                            onClick={() => { const next = [...profile.career]; [next[i], next[i + 1]] = [next[i + 1], next[i]]; setField("career", next); }}
                            disabled={i === profile.career.length - 1}
                            style={{ padding: "2px 8px", borderRadius: 4, border: `1px solid ${C.border}`, background: "transparent", color: i === profile.career.length - 1 ? C.faint : C.muted, fontFamily: F.mono, fontSize: 10, cursor: i === profile.career.length - 1 ? "default" : "pointer", opacity: i === profile.career.length - 1 ? 0.4 : 1 }}
                          >↓</button>
                          <button
                            onClick={() => { const next = [...profile.career]; next[i] = { ...c, highlight: !c.highlight }; setField("career", next); }}
                            style={{ padding: "2px 8px", borderRadius: 4, border: `1px solid ${c.highlight ? "rgba(176,89,58,0.3)" : C.border}`, background: c.highlight ? C.accentBg : "transparent", color: c.highlight ? C.accent : C.muted, fontFamily: F.mono, fontSize: 10, cursor: "pointer" }}
                          >{c.highlight ? "★ Featured" : "☆ Feature"}</button>
                          <button onClick={() => setField("career", profile.career.filter((_, j) => j !== i))} style={{ padding: "2px 8px", borderRadius: 4, border: `1px solid ${C.redBorder}`, background: C.redBg, color: C.red, fontFamily: F.mono, fontSize: 10, cursor: "pointer" }}>Remove</button>
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr", gap: "0 16px" }}>
                        <TextField label="Year" value={c.year} onChange={v => { const next = [...profile.career]; next[i] = { ...c, year: v }; setField("career", next); }} />
                        <TextField label="Role" value={c.role} onChange={v => { const next = [...profile.career]; next[i] = { ...c, role: v }; setField("career", next); }} />
                        <TextField label="Company" value={c.company} onChange={v => { const next = [...profile.career]; next[i] = { ...c, company: v }; setField("career", next); }} />
                      </div>
                      <TextField label="Description" value={c.description} onChange={v => { const next = [...profile.career]; next[i] = { ...c, description: v }; setField("career", next); }} multiline rows={2} />
                    </div>
                  ))}
                  <button onClick={() => setField("career", [...profile.career, { year: "", role: "", company: "", description: "", highlight: false }])} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontFamily: F.mono, fontSize: 10, cursor: "pointer" }}>+ Add Career Entry</button>
                </div>
              )}

              {/* ── Projects ── */}
              {activeTab === "projects" && (
                <div>
                  <SectionHeader>Projects</SectionHeader>
                  {profile.projects.map((p, i) => (
                    <div key={i} style={{ padding: "14px 16px", background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <span style={{ fontFamily: F.mono, fontSize: 10, color: C.accentDim }}>PROJECT {i + 1}</span>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => { const next = [...profile.projects]; [next[i - 1], next[i]] = [next[i], next[i - 1]]; setField("projects", next); }}
                            disabled={i === 0}
                            style={{ padding: "2px 8px", borderRadius: 4, border: `1px solid ${C.border}`, background: "transparent", color: i === 0 ? C.faint : C.muted, fontFamily: F.mono, fontSize: 10, cursor: i === 0 ? "default" : "pointer", opacity: i === 0 ? 0.4 : 1 }}
                          >↑</button>
                          <button
                            onClick={() => { const next = [...profile.projects]; [next[i], next[i + 1]] = [next[i + 1], next[i]]; setField("projects", next); }}
                            disabled={i === profile.projects.length - 1}
                            style={{ padding: "2px 8px", borderRadius: 4, border: `1px solid ${C.border}`, background: "transparent", color: i === profile.projects.length - 1 ? C.faint : C.muted, fontFamily: F.mono, fontSize: 10, cursor: i === profile.projects.length - 1 ? "default" : "pointer", opacity: i === profile.projects.length - 1 ? 0.4 : 1 }}
                          >↓</button>
                          <button onClick={() => setField("projects", profile.projects.filter((_, j) => j !== i))} style={{ padding: "2px 8px", borderRadius: 4, border: `1px solid ${C.redBorder}`, background: C.redBg, color: C.red, fontFamily: F.mono, fontSize: 10, cursor: "pointer" }}>Remove</button>
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: "0 16px" }}>
                        <TextField label="Name" value={p.name} onChange={v => { const next = [...profile.projects]; next[i] = { ...p, name: v }; setField("projects", next); }} />
                        <TextField label="Tag" value={p.tag} onChange={v => { const next = [...profile.projects]; next[i] = { ...p, tag: v }; setField("projects", next); }} />
                      </div>
                      <TextField label="URL" value={p.url} onChange={v => { const next = [...profile.projects]; next[i] = { ...p, url: v }; setField("projects", next); }} />
                      <TextField label="Slug (optional, for /projects/:slug)" value={p.slug ?? ""} onChange={v => { const next = [...profile.projects]; next[i] = { ...p, slug: v || undefined }; setField("projects", next); }} />
                      <TextField label="Description" value={p.description} onChange={v => { const next = [...profile.projects]; next[i] = { ...p, description: v }; setField("projects", next); }} multiline rows={2} />

                      {/* Case study editor — collapsible */}
                      <details style={{ marginTop: 12, paddingTop: 12, borderTop: `1px dashed ${C.border}` }}>
                        <summary style={{ cursor: "pointer", fontFamily: F.mono, fontSize: 10, color: C.accentDim, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12, userSelect: "none" }}>
                          {p.caseStudy ? "▾ Case Study (filled)" : "▸ Add Case Study"}
                        </summary>
                        <div style={{ marginTop: 8, padding: "12px 14px", background: C.accentBg, borderRadius: 8, border: C.accentBorder }}>
                          {(() => {
                            const cs = p.caseStudy ?? {};
                            const updateCS = (patch: Partial<typeof cs>) => {
                              const next = [...profile.projects];
                              const merged = { ...cs, ...patch };
                              // Drop the caseStudy entirely if every field is empty
                              const isEmpty =
                                !merged.problem && !merged.approach && !merged.architecture &&
                                (!merged.tech || merged.tech.length === 0) &&
                                (!merged.outcomes || merged.outcomes.length === 0) &&
                                (!merged.images || merged.images.length === 0);
                              next[i] = { ...p, caseStudy: isEmpty ? undefined : merged };
                              setField("projects", next);
                            };
                            const outcomes = cs.outcomes ?? [];
                            const images = cs.images ?? [];
                            return (
                              <>
                                <TextField label="Problem" value={cs.problem ?? ""} onChange={v => updateCS({ problem: v || undefined })} multiline rows={3} />
                                <TextField label="Approach" value={cs.approach ?? ""} onChange={v => updateCS({ approach: v || undefined })} multiline rows={3} />
                                <TextField label="Architecture (text or ASCII diagram)" value={cs.architecture ?? ""} onChange={v => updateCS({ architecture: v || undefined })} multiline rows={6} />
                                <ItemsArrayField label="Tech (one per row)" items={cs.tech ?? []} onChange={v => updateCS({ tech: v.length ? v : undefined })} placeholder="e.g. React, IFC.js" />

                                {/* Outcomes — label / value repeater */}
                                <div style={{ marginBottom: 14 }}>
                                  <FieldLabel>Outcomes (label + value)</FieldLabel>
                                  {outcomes.map((o, oi) => (
                                    <div key={oi} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 36px", gap: 6, marginBottom: 6 }}>
                                      <input
                                        value={o.label}
                                        onChange={e => updateCS({ outcomes: outcomes.map((x, j) => j === oi ? { ...x, label: e.target.value } : x) })}
                                        placeholder="Label (e.g. Speedup)"
                                        style={inputStyle(false)}
                                      />
                                      <input
                                        value={o.value}
                                        onChange={e => updateCS({ outcomes: outcomes.map((x, j) => j === oi ? { ...x, value: e.target.value } : x) })}
                                        placeholder="Value (e.g. 16,000×)"
                                        style={inputStyle(false)}
                                      />
                                      <button
                                        onClick={() => updateCS({ outcomes: outcomes.filter((_, j) => j !== oi).length ? outcomes.filter((_, j) => j !== oi) : undefined })}
                                        style={{ padding: 0, borderRadius: 4, border: `1px solid ${C.redBorder}`, background: C.redBg, color: C.red, fontFamily: F.mono, fontSize: 14, cursor: "pointer" }}
                                        aria-label="Remove outcome"
                                      >×</button>
                                    </div>
                                  ))}
                                  <button
                                    onClick={() => updateCS({ outcomes: [...outcomes, { label: "", value: "" }] })}
                                    style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontFamily: F.mono, fontSize: 10, cursor: "pointer" }}
                                  >+ Add outcome</button>
                                </div>

                                {/* Images — src / caption repeater */}
                                <div style={{ marginBottom: 4 }}>
                                  <FieldLabel>Images (src + caption)</FieldLabel>
                                  {images.map((img, ii) => (
                                    <div key={ii} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 36px", gap: 6, marginBottom: 6 }}>
                                      <input
                                        value={img.src}
                                        onChange={e => updateCS({ images: images.map((x, j) => j === ii ? { ...x, src: e.target.value } : x) })}
                                        placeholder="https://… (image URL)"
                                        style={inputStyle(false)}
                                      />
                                      <input
                                        value={img.caption ?? ""}
                                        onChange={e => updateCS({ images: images.map((x, j) => j === ii ? { ...x, caption: e.target.value || undefined } : x) })}
                                        placeholder="Caption (optional)"
                                        style={inputStyle(false)}
                                      />
                                      <button
                                        onClick={() => updateCS({ images: images.filter((_, j) => j !== ii).length ? images.filter((_, j) => j !== ii) : undefined })}
                                        style={{ padding: 0, borderRadius: 4, border: `1px solid ${C.redBorder}`, background: C.redBg, color: C.red, fontFamily: F.mono, fontSize: 14, cursor: "pointer" }}
                                        aria-label="Remove image"
                                      >×</button>
                                    </div>
                                  ))}
                                  <button
                                    onClick={() => updateCS({ images: [...images, { src: "" }] })}
                                    style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontFamily: F.mono, fontSize: 10, cursor: "pointer" }}
                                  >+ Add image</button>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </details>
                    </div>
                  ))}
                  <button onClick={() => setField("projects", [...profile.projects, { name: "", url: "", tag: "", description: "" }])} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontFamily: F.mono, fontSize: 10, cursor: "pointer" }}>+ Add Project</button>
                </div>
              )}

              {/* ── Skills ── */}
              {activeTab === "skills" && (
                <div>
                  <SectionHeader>Skill Categories</SectionHeader>
                  {profile.skills.map((s, i) => (
                    <div key={i} style={{ padding: "14px 16px", background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <span style={{ fontFamily: F.mono, fontSize: 10, color: C.accentDim }}>CATEGORY {i + 1}</span>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => { const next = [...profile.skills]; [next[i - 1], next[i]] = [next[i], next[i - 1]]; setField("skills", next); }}
                            disabled={i === 0}
                            style={{ padding: "2px 8px", borderRadius: 4, border: `1px solid ${C.border}`, background: "transparent", color: i === 0 ? C.faint : C.muted, fontFamily: F.mono, fontSize: 10, cursor: i === 0 ? "default" : "pointer", opacity: i === 0 ? 0.4 : 1 }}
                          >↑</button>
                          <button
                            onClick={() => { const next = [...profile.skills]; [next[i], next[i + 1]] = [next[i + 1], next[i]]; setField("skills", next); }}
                            disabled={i === profile.skills.length - 1}
                            style={{ padding: "2px 8px", borderRadius: 4, border: `1px solid ${C.border}`, background: "transparent", color: i === profile.skills.length - 1 ? C.faint : C.muted, fontFamily: F.mono, fontSize: 10, cursor: i === profile.skills.length - 1 ? "default" : "pointer", opacity: i === profile.skills.length - 1 ? 0.4 : 1 }}
                          >↓</button>
                          <button onClick={() => setField("skills", profile.skills.filter((_, j) => j !== i))} style={{ padding: "2px 8px", borderRadius: 4, border: `1px solid ${C.redBorder}`, background: C.redBg, color: C.red, fontFamily: F.mono, fontSize: 10, cursor: "pointer" }}>Remove</button>
                        </div>
                      </div>
                      <TextField label="Category Name" value={s.category} onChange={v => { const next = [...profile.skills]; next[i] = { ...s, category: v }; setField("skills", next); }} />
                      <ItemsArrayField label="Skills (one per row)" items={s.items} onChange={v => { const next = [...profile.skills]; next[i] = { ...s, items: v }; setField("skills", next); }} placeholder="e.g. TypeScript" />
                    </div>
                  ))}
                  <button onClick={() => setField("skills", [...profile.skills, { category: "", items: [] }])} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontFamily: F.mono, fontSize: 10, cursor: "pointer" }}>+ Add Category</button>
                </div>
              )}

              {/* ── Domains ── */}
              {activeTab === "domains" && (
                <div>
                  <SectionHeader>Domain Expertise</SectionHeader>
                  {profile.domains.map((d, i) => (
                    <div key={i} style={{ padding: "14px 16px", background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <span style={{ fontFamily: F.mono, fontSize: 10, color: C.accentDim }}>DOMAIN {i + 1}</span>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => { const next = [...profile.domains]; [next[i - 1], next[i]] = [next[i], next[i - 1]]; setField("domains", next); }}
                            disabled={i === 0}
                            style={{ padding: "2px 8px", borderRadius: 4, border: `1px solid ${C.border}`, background: "transparent", color: i === 0 ? C.faint : C.muted, fontFamily: F.mono, fontSize: 10, cursor: i === 0 ? "default" : "pointer", opacity: i === 0 ? 0.4 : 1 }}
                          >↑</button>
                          <button
                            onClick={() => { const next = [...profile.domains]; [next[i], next[i + 1]] = [next[i + 1], next[i]]; setField("domains", next); }}
                            disabled={i === profile.domains.length - 1}
                            style={{ padding: "2px 8px", borderRadius: 4, border: `1px solid ${C.border}`, background: "transparent", color: i === profile.domains.length - 1 ? C.faint : C.muted, fontFamily: F.mono, fontSize: 10, cursor: i === profile.domains.length - 1 ? "default" : "pointer", opacity: i === profile.domains.length - 1 ? 0.4 : 1 }}
                          >↓</button>
                          <button onClick={() => setField("domains", profile.domains.filter((_, j) => j !== i))} style={{ padding: "2px 8px", borderRadius: 4, border: `1px solid ${C.redBorder}`, background: C.redBg, color: C.red, fontFamily: F.mono, fontSize: 10, cursor: "pointer" }}>Remove</button>
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: "0 16px" }}>
                        <TextField label="Icon" value={d.icon} onChange={v => { const next = [...profile.domains]; next[i] = { ...d, icon: v }; setField("domains", next); }} />
                        <TextField label="Label" value={d.label} onChange={v => { const next = [...profile.domains]; next[i] = { ...d, label: v }; setField("domains", next); }} />
                      </div>
                      <TextField label="Detail" value={d.detail} onChange={v => { const next = [...profile.domains]; next[i] = { ...d, detail: v }; setField("domains", next); }} />
                    </div>
                  ))}
                  <button onClick={() => setField("domains", [...profile.domains, { icon: "○", label: "", detail: "" }])} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontFamily: F.mono, fontSize: 10, cursor: "pointer" }}>+ Add Domain</button>
                </div>
              )}

              {/* ── Now ── */}
              {activeTab === "now" && (
                <div>
                  <SectionHeader>Now — current focus</SectionHeader>
                  <p style={{ fontSize: 12, color: C.muted, marginBottom: 16, lineHeight: 1.6 }}>
                    Short status update shown on the home page and quoted by the AI when asked "what are you working on now?". Keep each item to one line.
                  </p>
                  <TextField
                    label="Last updated (YYYY-MM-DD)"
                    value={profile.now?.lastUpdated ?? ""}
                    onChange={v => setField("now", { lastUpdated: v, items: profile.now?.items ?? [] })}
                  />
                  <div style={{ marginBottom: 14 }}>
                    <FieldLabel>Items (one per row, sortable)</FieldLabel>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {(profile.now?.items ?? []).map((item, i) => {
                        const items = profile.now?.items ?? [];
                        const move = (delta: number) => {
                          const next = [...items];
                          const j = i + delta;
                          if (j < 0 || j >= next.length) return;
                          [next[i], next[j]] = [next[j], next[i]];
                          setField("now", { lastUpdated: profile.now?.lastUpdated ?? "", items: next });
                        };
                        return (
                          <div key={i} style={{ display: "flex", gap: 6 }}>
                            <input
                              value={item}
                              onChange={e => {
                                const next = [...items];
                                next[i] = e.target.value;
                                setField("now", { lastUpdated: profile.now?.lastUpdated ?? "", items: next });
                              }}
                              placeholder="What are you focused on right now?"
                              style={{ ...inputStyle(false), flex: 1 }}
                            />
                            <button
                              onClick={() => move(-1)}
                              disabled={i === 0}
                              style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: i === 0 ? C.faint : C.muted, fontFamily: F.mono, fontSize: 11, cursor: i === 0 ? "default" : "pointer", opacity: i === 0 ? 0.4 : 1 }}
                            >↑</button>
                            <button
                              onClick={() => move(1)}
                              disabled={i === items.length - 1}
                              style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: i === items.length - 1 ? C.faint : C.muted, fontFamily: F.mono, fontSize: 11, cursor: i === items.length - 1 ? "default" : "pointer", opacity: i === items.length - 1 ? 0.4 : 1 }}
                            >↓</button>
                            <button
                              onClick={() => {
                                const next = items.filter((_, j) => j !== i);
                                setField("now", { lastUpdated: profile.now?.lastUpdated ?? "", items: next });
                              }}
                              style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.redBorder}`, background: C.redBg, color: C.red, fontFamily: F.mono, fontSize: 11, cursor: "pointer" }}
                            >✕</button>
                          </div>
                        );
                      })}
                      <button
                        onClick={() => {
                          const items = profile.now?.items ?? [];
                          setField("now", {
                            lastUpdated: profile.now?.lastUpdated ?? new Date().toISOString().slice(0, 10),
                            items: [...items, ""],
                          });
                        }}
                        style={{ alignSelf: "flex-start", padding: "4px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontFamily: F.mono, fontSize: 10, cursor: "pointer" }}
                      >+ Add item</button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Recommendations / Testimonials ── */}
              {activeTab === "testimonials" && (
                <div>
                  <SectionHeader>Recommendations</SectionHeader>
                  <p style={{ fontSize: 12, color: C.muted, marginBottom: 16, lineHeight: 1.6 }}>
                    Quotes shown on the home page and quoted by the AI when asked for references or social proof.
                  </p>
                  {(profile.testimonials ?? []).map((t, i) => {
                    const list = profile.testimonials ?? [];
                    return (
                      <div key={i} style={{ padding: "14px 16px", background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                          <span style={{ fontFamily: F.mono, fontSize: 10, color: C.accentDim }}>QUOTE {i + 1}</span>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              onClick={() => { const next = [...list]; [next[i - 1], next[i]] = [next[i], next[i - 1]]; setField("testimonials", next); }}
                              disabled={i === 0}
                              style={{ padding: "2px 8px", borderRadius: 4, border: `1px solid ${C.border}`, background: "transparent", color: i === 0 ? C.faint : C.muted, fontFamily: F.mono, fontSize: 10, cursor: i === 0 ? "default" : "pointer", opacity: i === 0 ? 0.4 : 1 }}
                            >↑</button>
                            <button
                              onClick={() => { const next = [...list]; [next[i], next[i + 1]] = [next[i + 1], next[i]]; setField("testimonials", next); }}
                              disabled={i === list.length - 1}
                              style={{ padding: "2px 8px", borderRadius: 4, border: `1px solid ${C.border}`, background: "transparent", color: i === list.length - 1 ? C.faint : C.muted, fontFamily: F.mono, fontSize: 10, cursor: i === list.length - 1 ? "default" : "pointer", opacity: i === list.length - 1 ? 0.4 : 1 }}
                            >↓</button>
                            <button
                              onClick={() => setField("testimonials", list.filter((_, j) => j !== i))}
                              style={{ padding: "2px 8px", borderRadius: 4, border: `1px solid ${C.redBorder}`, background: C.redBg, color: C.red, fontFamily: F.mono, fontSize: 10, cursor: "pointer" }}
                            >Remove</button>
                          </div>
                        </div>
                        <TextField
                          label="Quote"
                          value={t.quote}
                          multiline
                          rows={3}
                          onChange={v => { const next = [...list]; next[i] = { ...t, quote: v }; setField("testimonials", next); }}
                        />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                          <TextField
                            label="Author"
                            value={t.author}
                            onChange={v => { const next = [...list]; next[i] = { ...t, author: v }; setField("testimonials", next); }}
                          />
                          <TextField
                            label="Title"
                            value={t.title}
                            onChange={v => { const next = [...list]; next[i] = { ...t, title: v }; setField("testimonials", next); }}
                          />
                          <TextField
                            label="Company (optional)"
                            value={t.company ?? ""}
                            onChange={v => { const next = [...list]; next[i] = { ...t, company: v || undefined }; setField("testimonials", next); }}
                          />
                          <TextField
                            label="LinkedIn URL (optional)"
                            value={t.linkedinUrl ?? ""}
                            onChange={v => { const next = [...list]; next[i] = { ...t, linkedinUrl: v || undefined }; setField("testimonials", next); }}
                          />
                        </div>
                        <TextField
                          label="Avatar URL (optional, https://…)"
                          value={t.avatarUrl ?? ""}
                          onChange={v => { const next = [...list]; next[i] = { ...t, avatarUrl: v || undefined }; setField("testimonials", next); }}
                        />
                      </div>
                    );
                  })}
                  <button
                    onClick={() => setField("testimonials", [...(profile.testimonials ?? []), { quote: "", author: "", title: "" }])}
                    style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontFamily: F.mono, fontSize: 10, cursor: "pointer" }}
                  >+ Add Recommendation</button>
                </div>
              )}

              {/* ── Education ── */}
              {activeTab === "education" && (
                <div>
                  <SectionHeader>Education</SectionHeader>
                  <TextField label="Degree" value={profile.education.degree} onChange={v => setField("education", { ...profile.education, degree: v })} />
                  <TextField label="University" value={profile.education.university} onChange={v => setField("education", { ...profile.education, university: v })} />
                  <TextField label="Years" value={profile.education.years} onChange={v => setField("education", { ...profile.education, years: v })} />
                  <TextField label="Honors / GPA" value={profile.education.honors} onChange={v => setField("education", { ...profile.education, honors: v })} />
                  <TextField label="Languages" value={profile.education.languages} onChange={v => setField("education", { ...profile.education, languages: v })} />
                </div>
              )}

              {/* ── Contact ── */}
              {activeTab === "contact" && (
                <div>
                  <SectionHeader>Contact Details</SectionHeader>
                  <TextField label="Email" value={profile.contact.email} onChange={v => setField("contact", { ...profile.contact, email: v })} />
                  <TextField label="GitHub URL" value={profile.contact.github} onChange={v => setField("contact", { ...profile.contact, github: v })} />
                  <TextField label="LinkedIn URL" value={profile.contact.linkedin} onChange={v => setField("contact", { ...profile.contact, linkedin: v })} />
                  <TextField label="Resume URL" value={profile.contact.resume} onChange={v => setField("contact", { ...profile.contact, resume: v })} />
                </div>
              )}

              {/* Bottom save bar */}
              {activeTab !== "submissions" && (
                <div style={{ marginTop: 32, paddingTop: 20, borderTop: `1px solid ${C.border}`, display: "flex", gap: 12, alignItems: "center" }}>
                  <SaveButton status={saveStatus} onClick={save} size="lg" />
                  {saveStatus === "saved" && <span style={{ fontSize: 12, color: C.accent }}>Changes saved and live immediately.</span>}
                  {saveStatus === "error" && <span style={{ fontSize: 12, color: C.red }}>{saveError}</span>}
                </div>
              )}
            </>
          )}

          {/* ── Submissions ── rendered independently of portfolio data loading */}
          {activeTab === "submissions" && authState === "authenticated" && (
            <div>
              <SectionHeader>Contact Form Submissions</SectionHeader>
              {submissionsLoading && (
                <div style={{ textAlign: "center", color: C.muted, paddingTop: 60 }}>
                  <div style={{ fontSize: 24, marginBottom: 12 }}>⏳</div>
                  <div style={{ fontFamily: F.mono, fontSize: 12 }}>Loading submissions...</div>
                </div>
              )}
              {submissionsError && (
                <div style={{ fontSize: 13, color: C.red, padding: "12px 16px", borderRadius: 8, background: C.redBg, border: `1px solid ${C.redBorder}` }}>{submissionsError}</div>
              )}
              {!submissionsLoading && !submissionsError && submissions.length === 0 && (
                <div style={{ textAlign: "center", color: C.muted, paddingTop: 60 }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
                  <div style={{ fontFamily: F.mono, fontSize: 12 }}>No submissions yet.</div>
                </div>
              )}
              {!submissionsLoading && submissions.map((s) => (
                <div key={s.id} style={{ padding: "18px 20px", background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: C.textBright, marginBottom: 2 }}>{s.name}</div>
                      <a href={`mailto:${s.email}`} style={{ fontSize: 12, color: C.accent, fontFamily: F.mono, textDecoration: "none" }}>{s.email}</a>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: C.muted, fontFamily: F.mono }}>
                        {new Date(s.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </div>
                      <div style={{ fontSize: 10, color: C.faint, fontFamily: F.mono, marginTop: 2 }}>
                        {new Date(s.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                  {(s.company || s.role) && (
                    <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
                      {s.company && (
                        <div>
                          <span style={{ fontSize: 9, fontFamily: F.mono, color: C.accentDim, letterSpacing: 2, textTransform: "uppercase" }}>Company </span>
                          <span style={{ fontSize: 12, color: C.text }}>{s.company}</span>
                        </div>
                      )}
                      {s.role && (
                        <div>
                          <span style={{ fontSize: 9, fontFamily: F.mono, color: C.accentDim, letterSpacing: 2, textTransform: "uppercase" }}>Role </span>
                          <span style={{ fontSize: 12, color: C.text }}>{s.role}</span>
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, marginTop: 4 }}>
                    <div style={{ fontSize: 9, fontFamily: F.mono, color: C.accentDim, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Message</div>
                    <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{s.message}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
