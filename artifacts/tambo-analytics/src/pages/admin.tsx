import { useState, useEffect, useCallback } from "react";
import { type PortfolioProfile, clearPortfolioCache } from "../services/portfolio-data";

const C = {
  primary: "#0a0e17",
  surface: "rgba(255,255,255,0.03)",
  surface2: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.08)",
  accent: "#34D399",
  accentDim: "rgba(52,211,153,0.5)",
  accentBg: "rgba(52,211,153,0.05)",
  accentBorder: "1px solid rgba(52,211,153,0.3)",
  red: "#f87171",
  redBg: "rgba(248,113,113,0.08)",
  redBorder: "rgba(248,113,113,0.2)",
  textBright: "#e2e8f0",
  text: "#94a3b8",
  muted: "#64748b",
  faint: "#475569",
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
    background: "rgba(255,255,255,0.04)",
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
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.accent, boxShadow: `0 0 10px ${C.accentDim}` }} />
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

type Tab = "profile" | "career" | "projects" | "skills" | "domains" | "education" | "contact";

const TABS: { id: Tab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "career", label: "Career" },
  { id: "projects", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "domains", label: "Domains" },
  { id: "education", label: "Education" },
  { id: "contact", label: "Contact" },
];

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
          <div style={{ width: 48, height: 48, borderRadius: 12, background: C.accentBg, border: `1px solid rgba(52,211,153,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 20 }}>🔒</div>
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
            style={{ padding: "12px 24px", borderRadius: 10, border: "none", background: token.trim() ? C.accent : "rgba(255,255,255,0.05)", color: token.trim() ? C.primary : C.faint, fontFamily: F.mono, fontSize: 12, fontWeight: 700, cursor: token.trim() ? "pointer" : "default", transition: "all 0.2s", letterSpacing: 1 }}
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
          <span style={{ fontFamily: F.mono, fontSize: 10, color: C.accentDim, background: C.accentBg, padding: "2px 8px", borderRadius: 20, border: `1px solid rgba(52,211,153,0.2)` }}>LIVE EDIT</span>
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
                          <button onClick={() => setField("sideProjects", profile.sideProjects.filter((_, j) => j !== i))} style={{ padding: "2px 8px", borderRadius: 4, border: `1px solid ${C.redBorder}`, background: C.redBg, color: C.red, fontFamily: F.mono, fontSize: 10, cursor: "pointer" }}>Remove</button>
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
                            onClick={() => { const next = [...profile.career]; next[i] = { ...c, highlight: !c.highlight }; setField("career", next); }}
                            style={{ padding: "2px 8px", borderRadius: 4, border: `1px solid ${c.highlight ? "rgba(52,211,153,0.3)" : C.border}`, background: c.highlight ? C.accentBg : "transparent", color: c.highlight ? C.accent : C.muted, fontFamily: F.mono, fontSize: 10, cursor: "pointer" }}
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
                        <button onClick={() => setField("projects", profile.projects.filter((_, j) => j !== i))} style={{ padding: "2px 8px", borderRadius: 4, border: `1px solid ${C.redBorder}`, background: C.redBg, color: C.red, fontFamily: F.mono, fontSize: 10, cursor: "pointer" }}>Remove</button>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: "0 16px" }}>
                        <TextField label="Name" value={p.name} onChange={v => { const next = [...profile.projects]; next[i] = { ...p, name: v }; setField("projects", next); }} />
                        <TextField label="Tag" value={p.tag} onChange={v => { const next = [...profile.projects]; next[i] = { ...p, tag: v }; setField("projects", next); }} />
                      </div>
                      <TextField label="URL" value={p.url} onChange={v => { const next = [...profile.projects]; next[i] = { ...p, url: v }; setField("projects", next); }} />
                      <TextField label="Description" value={p.description} onChange={v => { const next = [...profile.projects]; next[i] = { ...p, description: v }; setField("projects", next); }} multiline rows={2} />
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
                        <button onClick={() => setField("skills", profile.skills.filter((_, j) => j !== i))} style={{ padding: "2px 8px", borderRadius: 4, border: `1px solid ${C.redBorder}`, background: C.redBg, color: C.red, fontFamily: F.mono, fontSize: 10, cursor: "pointer" }}>Remove</button>
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
                        <button onClick={() => setField("domains", profile.domains.filter((_, j) => j !== i))} style={{ padding: "2px 8px", borderRadius: 4, border: `1px solid ${C.redBorder}`, background: C.redBg, color: C.red, fontFamily: F.mono, fontSize: 10, cursor: "pointer" }}>Remove</button>
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
              <div style={{ marginTop: 32, paddingTop: 20, borderTop: `1px solid ${C.border}`, display: "flex", gap: 12, alignItems: "center" }}>
                <SaveButton status={saveStatus} onClick={save} size="lg" />
                {saveStatus === "saved" && <span style={{ fontSize: 12, color: C.accent }}>Changes saved and live immediately.</span>}
                {saveStatus === "error" && <span style={{ fontSize: 12, color: C.red }}>{saveError}</span>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
