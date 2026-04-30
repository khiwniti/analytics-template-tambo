import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { getPortfolioProfile, type PortfolioProfile } from "../services/portfolio-data";

const C = {
  primary: "#0a0e17", surface: "rgba(255,255,255,0.03)", surfaceHover: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.08)", borderHover: "rgba(52,211,153,0.2)",
  accent: "#34D399", accentDim: "rgba(52,211,153,0.5)", accentBg: "rgba(52,211,153,0.05)",
  textBright: "#e2e8f0", text: "#94a3b8", muted: "#64748b", faint: "#475569", ghost: "rgba(255,255,255,0.15)",
  skelBase: "rgba(255,255,255,0.05)", skelShine: "rgba(255,255,255,0.10)",
};
const F = { sans: "'Quicksand',system-ui,sans-serif", mono: "'JetBrains Mono','Geist Mono',monospace", thai: "'Sarabun','Noto Sans Thai',sans-serif" };

const SUGGESTIONS = [
  "What's your most impressive AI project?",
  "Walk me through your full-stack skills",
  "How do you approach AI agent architecture?",
  "What industries have you worked in?",
  "Tell me about your government AI work",
  "What makes you unique as a developer?",
];

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [v, setV] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); o.disconnect(); } }, { threshold: 0.08 });
    o.observe(el);
    return () => o.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ opacity: v ? 1 : 0, transform: v ? "none" : "translateY(18px)", transition: `all 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}s` }}>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.accent, boxShadow: `0 0 10px ${C.accentDim}` }} />
      <span style={{ fontFamily: F.mono, fontSize: 10, color: C.accentDim, letterSpacing: 3, textTransform: "uppercase" }}>{children}</span>
    </div>
  );
}

function Pill({ children, on }: { children: React.ReactNode; on?: boolean }) {
  return (
    <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 9, fontFamily: F.mono, background: on ? C.accentBg : C.surface, border: `1px solid ${on ? "rgba(52,211,153,0.2)" : C.border}`, color: on ? C.accent : C.ghost, cursor: "default" }}>
      {children}
    </span>
  );
}

function Skel({ w = "100%", h = 14, radius = 6, style: extra }: { w?: number | string; h?: number; radius?: number; style?: React.CSSProperties }) {
  return (
    <div style={{ width: w, height: h, borderRadius: radius, background: C.skelBase, backgroundImage: `linear-gradient(90deg,${C.skelBase} 0%,${C.skelShine} 50%,${C.skelBase} 100%)`, backgroundSize: "200% 100%", animation: "shimmer 1.6s ease-in-out infinite", flexShrink: 0, ...extra }} />
  );
}

function ChatStarter() {
  const [, navigate] = useLocation();
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);

  const goToChat = (message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;
    sessionStorage.setItem("tambo-pending-message", trimmed);
    navigate("/chat");
  };

  return (
    <div style={{ width: "100%", maxWidth: 520, marginTop: 36 }}>
      <div style={{ marginBottom: 10, fontFamily: F.mono, fontSize: 9, color: C.accentDim, letterSpacing: 3, textTransform: "uppercase", textAlign: "center" }}>
        Ask me anything · Powered by AI
      </div>

      {/* Input */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", background: C.surface, border: `1px solid ${focused ? C.accent : C.border}`, borderRadius: 12, transition: "border-color 0.2s", padding: "10px 14px", gap: 10 }}>
        <span style={{ fontSize: 14, color: C.accentDim, flexShrink: 0 }}>💬</span>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={e => { if (e.key === "Enter") goToChat(input); }}
          placeholder="Ask about my skills, projects, or experience..."
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            color: C.textBright, fontFamily: F.sans, fontSize: 13, fontWeight: 500,
          }}
        />
        <button
          onClick={() => goToChat(input)}
          disabled={!input.trim()}
          style={{
            flexShrink: 0, padding: "5px 14px", borderRadius: 8,
            background: input.trim() ? C.accent : "transparent",
            border: `1px solid ${input.trim() ? C.accent : C.border}`,
            color: input.trim() ? C.primary : C.faint,
            fontFamily: F.mono, fontSize: 11, fontWeight: 700,
            cursor: input.trim() ? "pointer" : "default", transition: "all 0.2s",
          }}
        >
          →
        </button>
      </div>

      {/* Suggestion chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10, justifyContent: "center" }}>
        {SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            onClick={() => goToChat(s)}
            style={{
              padding: "5px 12px", borderRadius: 20, fontSize: 10, fontFamily: F.mono,
              background: C.surface, border: `1px solid ${C.border}`,
              color: C.ghost, cursor: "pointer", transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; e.currentTarget.style.background = C.accentBg; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.ghost; e.currentTarget.style.background = C.surface; }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

type ContactFormState = { name: string; email: string; company: string; role: string; message: string };
type SubmitStatus = "idle" | "loading" | "success" | "error";

function ContactSection() {
  const [form, setForm] = useState<ContactFormState>({ name: "", email: "", company: "", role: "", message: "" });
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [focused, setFocused] = useState<string | null>(null);

  const set = useCallback((field: keyof ContactFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
      const res = await fetch(`${base}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (res.ok && data.success) {
        setStatus("success");
        setForm({ name: "", email: "", company: "", role: "", message: "" });
      } else {
        setStatus("error");
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Please check your connection.");
    }
  };

  const inp = (field: keyof ContactFormState): React.CSSProperties => ({
    background: "rgba(255,255,255,0.04)", border: `1px solid ${focused === field ? C.accent : C.border}`,
    borderRadius: 8, padding: "10px 14px", color: C.textBright, fontFamily: F.sans, fontSize: 13,
    outline: "none", width: "100%", boxSizing: "border-box", transition: "border-color 0.2s",
  });

  const onFocus = (field: string) => () => setFocused(field);
  const onBlur = () => setFocused(null);

  if (status === "success") {
    return (
      <div style={{ padding: "40px 32px", borderRadius: 16, background: C.accentBg, border: "1px solid rgba(52,211,153,0.2)", textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.textBright, marginBottom: 6 }}>Message Sent!</div>
        <div style={{ fontSize: 13, color: C.muted }}>Thanks for reaching out. Ikkyu will get back to you soon.</div>
        <button onClick={() => setStatus("idle")} style={{ marginTop: 20, padding: "8px 20px", borderRadius: 8, background: "transparent", border: `1px solid ${C.accent}`, color: C.accent, fontFamily: F.mono, fontSize: 11, cursor: "pointer" }}>
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, fontFamily: F.mono, color: C.accentDim, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Name <span style={{ color: C.accent }}>*</span></div>
          <input value={form.name} onChange={set("name")} onFocus={onFocus("name")} onBlur={onBlur} placeholder="Jane Smith" required style={inp("name")} />
        </div>
        <div>
          <div style={{ fontSize: 10, fontFamily: F.mono, color: C.accentDim, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Email <span style={{ color: C.accent }}>*</span></div>
          <input type="email" value={form.email} onChange={set("email")} onFocus={onFocus("email")} onBlur={onBlur} placeholder="jane@company.com" required style={inp("email")} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, fontFamily: F.mono, color: C.accentDim, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Company</div>
          <input value={form.company} onChange={set("company")} onFocus={onFocus("company")} onBlur={onBlur} placeholder="Acme Corp" style={inp("company")} />
        </div>
        <div>
          <div style={{ fontSize: 10, fontFamily: F.mono, color: C.accentDim, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Role / Position</div>
          <input value={form.role} onChange={set("role")} onFocus={onFocus("role")} onBlur={onBlur} placeholder="CTO / Recruiter" style={inp("role")} />
        </div>
      </div>
      <div>
        <div style={{ fontSize: 10, fontFamily: F.mono, color: C.accentDim, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Message <span style={{ color: C.accent }}>*</span></div>
        <textarea value={form.message} onChange={set("message")} onFocus={onFocus("message")} onBlur={onBlur} placeholder="Tell Ikkyu about the opportunity or project..." required rows={4}
          style={{ ...inp("message"), resize: "vertical" as const, minHeight: 100 }} />
      </div>
      {status === "error" && (
        <div style={{ fontSize: 12, color: "#f87171", padding: "8px 12px", borderRadius: 8, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>{errorMsg}</div>
      )}
      <button type="submit" disabled={status === "loading" || !form.name || !form.email || !form.message}
        style={{ padding: "12px 24px", borderRadius: 10, border: "none", background: form.name && form.email && form.message ? C.accent : "rgba(255,255,255,0.05)", color: form.name && form.email && form.message ? C.primary : C.faint, fontFamily: F.mono, fontSize: 12, fontWeight: 700, cursor: form.name && form.email && form.message ? "pointer" : "default", transition: "all 0.2s", letterSpacing: 1 }}>
        {status === "loading" ? "Sending..." : "Send Message →"}
      </button>
    </form>
  );
}

export default function HomePage() {
  const [profile, setProfile] = useState<PortfolioProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [contentVisible, setContentVisible] = useState(false);

  useEffect(() => {
    getPortfolioProfile()
      .then(data => {
        setProfile(data);
        setLoading(false);
        requestAnimationFrame(() => requestAnimationFrame(() => setContentVisible(true)));
      })
      .catch(() => {
        setLoading(false);
        requestAnimationFrame(() => requestAnimationFrame(() => setContentVisible(true)));
      });
  }, []);

  const STATS = profile
    ? [
        { n: String(profile.stats.live), l: "Live" },
        { n: String(profile.stats.projects), l: "Projects" },
        { n: String(profile.stats.workers), l: "Workers" },
        { n: String(profile.stats.industries), l: "Industries" },
      ]
    : [{ n:"29",l:"Live" },{ n:"50",l:"Projects" },{ n:"47",l:"Workers" },{ n:"9",l:"Industries" }];

  const CAREER = profile
    ? profile.career.map(c => ({ y: c.year, t: c.role, c: c.company, d: c.description, hi: c.highlight ?? false }))
    : [
        { y:"2025–Now", t:"Associate Solution Architect", c:"Bangkok Silicon (BKS)", d:"AI/ML consulting, government digital transformation, BIM agentic frameworks, DDPM disaster platforms, Royal Rainmaking AI, hospitality intelligence.", hi:true },
        { y:"2024–Now", t:"Lead Data & AI Engineer", c:"Libralytics (Freelance)", d:"AI agents for restaurant marketing, MLOps (Docker/K8s), full-stack pipelines, FastAPI, Apache Airflow, Next.js.", hi:false },
        { y:"2019–Now", t:"CFD/FEA Specialist", c:"Freelance (7+ years)", d:"ANSYS Fluent/CFX, COMSOL, OpenFOAM, Moldex3D. Aerodynamics, turbomachinery, HVAC, multiphase flows, heat transfer.", hi:false },
        { y:"2025", t:"Data Engineer", c:"Tipco Asphalt", d:"Azure Data Factory, Synapse Analytics, Oracle-to-cloud migration, LLM integration.", hi:false },
        { y:"2023", t:"Service Dev Specialist", c:"Q-CHANG", d:"SOPs, GMV forecasting (regression), Python sentiment analysis, supplier management.", hi:false },
        { y:"2022–23", t:"Future Leader (FLP 12)", c:"Charoen Pokphand Group", d:"24-cavity mold → 300K pcs/day. +2.9M Baht sales. Power BI. Reported to CP Shareman Executive.", hi:false },
        { y:"2021–22", t:"Nuclear Engineer", c:"Thailand Institute of Nuclear Technology", d:"Radiopharmaceutical production (I-131). ISO 9001, GMP. Data science for preventive maintenance.", hi:false },
        { y:"2021", t:"Mechanical Design Engineer", c:"Arçelik Hitachi", d:"ANSYS & Moldex3D stress/fatigue analysis. Prototype testing with Japanese lab. FBF640→720.", hi:false },
        { y:"2019–21", t:"Mechanical Engineer", c:"MACS", d:"EPC at Bangchack Refinery. QC Welding (ASME IX). AutoCAD Plant 3D.", hi:false },
      ];

  const PROJECTS = profile
    ? profile.projects.map(p => ({ n: p.name, u: p.url, tag: p.tag, d: p.description }))
    : [
        { n:"CarbonBIM", u:"https://bim.getintheq.space", tag:"BIM+AI", d:"AI carbon calculator — IFC upload, 104+ TGO emission factors" },
        { n:"EarthCast AI", u:"https://earthcast-ai.vercel.app", tag:"Earth", d:"AI weather forecast — PINNs + FourCastNet + CesiumJS" },
        { n:"Facility Manager", u:"https://facility-management-app-mocha.vercel.app", tag:"3D", d:"Full-stack building management with 3D viewer" },
        { n:"NDWC Smart Alert", u:"https://ndwc-smart-alert.vercel.app", tag:"Gov", d:"Thailand flood monitoring & AI water alerts" },
        { n:"GDAS Disaster", u:"https://gdas-ai-disaster-watch.vercel.app", tag:"Gov", d:"DDPM multi-hazard early warning (14 types, CAP v1.2)" },
        { n:"NT Facility 3D", u:"https://nt-facility-3-d-manager-new-ui.vercel.app", tag:"Telecom", d:"National Telecom 3D facility (xeokit/Three.js)" },
      ];

  const DOMAINS = profile
    ? profile.domains.map(d => ({ i: d.icon, l: d.label, d: d.detail }))
    : [
        { i:"◆", l:"BIM & Construction", d:"IFC, EN 15978, TGO, EDGE, TREES, BOQ-to-cost" },
        { i:"◇", l:"Weather & Earth Science", d:"FourCastNet, PINNs, GFS, CesiumJS, NOAA" },
        { i:"▣", l:"Thai Government", d:"DDPM, TPQI, NSDF, NDWC, Rainmaking, AOT" },
        { i:"△", l:"Hospitality & F&B", d:"BiteBase, HotelCSI, Wongnai, LINE MAN" },
      ];

  const SKILLS = profile
    ? profile.skills.map(s => ({ c: s.category, s: s.items }))
    : [
        { c:"AI / Agents", s:["LangGraph","Claude Sonnet","Qwen3","MCP","A2A","Huggingface","Typhoon","PINNs","DeepXDE"] },
        { c:"Full-Stack", s:["Next.js","React","TypeScript","Tailwind","FastAPI","Express","shadcn/ui"] },
        { c:"Data / Cloud", s:["PostgreSQL","MongoDB","Azure","Airflow","Docker","K8s","Pandas","Power BI","Tableau"] },
        { c:"Engineering", s:["ANSYS Fluent","COMSOL","OpenFOAM","Moldex3D","SolidWorks","AutoCAD","CFD","FEA"] },
        { c:"Platforms", s:["Vercel","Cloudflare Workers","Supabase","LINE OA","Postman","Git","LangSmith"] },
      ];

  const SIDE_PROJECTS = profile
    ? profile.sideProjects
    : [{ name: "kidpen.org", url: "https://kidpen.org", description: "Free, open-source STEM education platform for Thai students." }];

  const edu = profile?.education;

  return (
    <div style={{ background: C.primary, color: C.text, fontFamily: F.sans, minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&family=Sarabun:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box}
        ::selection{background:rgba(52,211,153,0.3);color:#e2e8f0}
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:${C.primary}} ::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px}
        a{color:${C.accent};text-decoration:none}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
      `}</style>

      {/* ══ HERO ══ */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", padding: "0 24px" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 300, background: "rgba(52,211,153,0.02)", borderRadius: "50%", filter: "blur(120px)", pointerEvents: "none" }} />
        <Reveal><div style={{ fontSize: "clamp(32px,6vw,56px)", fontWeight: 700, color: C.textBright, textAlign: "center", lineHeight: 1.1 }}>Hey 👋 I'm Ikkyu</div></Reveal>
        <Reveal delay={0.1}><div style={{ marginTop: 24, textAlign: "center" }}>
          <span style={{ background: C.accent, color: C.primary, padding: "4px 8px", borderRadius: 6, fontWeight: 700, fontSize: 15 }}>AI-Augmented</span>
          <span style={{ color: C.text, fontSize: 17, marginLeft: 8, fontWeight: 500 }}>Full-Stack Developer</span>
        </div></Reveal>
        <Reveal delay={0.15}><p style={{ marginTop: 12, fontSize: 14, color: C.muted }}>AI Agent Architect<span style={{ color: C.accentDim, marginLeft: 2, animation: "pulse 2s infinite" }}>|</span></p></Reveal>
        <Reveal delay={0.2}><div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 24, fontSize: 12, color: C.muted }}>
          <span>📍 Bangkok, Thailand 🇹🇭</span><span style={{ color: C.border }}>·</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: C.surface, border: `1px solid ${C.border}` }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", animation: "pulse 2s infinite" }} />Available</span>
        </div></Reveal>
        <Reveal delay={0.25}><div style={{ display: "flex", gap: 24, marginTop: 28 }}>
          {loading
            ? [0,1,2,3].map(i => (
                <div key={i} style={{ textAlign: "center" }}>
                  <Skel w={40} h={22} radius={4} style={{ margin: "0 auto" }} />
                  <Skel w={52} h={9} radius={3} style={{ marginTop: 6 }} />
                </div>
              ))
            : STATS.map((s, i) => (
                <div key={i} style={{ textAlign: "center", opacity: contentVisible ? 1 : 0, transition: "opacity 0.5s ease" }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: C.accentDim, fontFamily: F.mono }}>{s.n}</div>
                  <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 2, marginTop: 2, color: C.muted }}>{s.l}</div>
                </div>
              ))
          }
        </div></Reveal>
        <Reveal delay={0.3}><div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 6, marginTop: 24, maxWidth: 420 }}>
          {["LangGraph", "Claude Sonnet", "Qwen3", "MCP", "FastAPI", "Next.js", "TypeScript", "Cloudflare"].map((t, i) => <Pill key={i}>{t}</Pill>)}
        </div></Reveal>

        {/* ── Chat Starter ── */}
        <Reveal delay={0.35}><ChatStarter /></Reveal>

        <Reveal delay={0.4}><div style={{ display: "flex", gap: 8, marginTop: 24 }}>
          {["About", "Projects", "Skills", "Contact"].map((b, i) => (
            <button key={i} onClick={() => document.getElementById(b.toLowerCase())?.scrollIntoView({ behavior: "smooth" })}
              style={{ padding: "8px 20px", borderRadius: 6, border: `2px solid ${C.border}`, background: "transparent", color: C.text, fontSize: 13, fontWeight: 700, fontFamily: F.sans, cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text; }}
            >{b}</button>
          ))}
        </div></Reveal>
        <Reveal delay={0.45}><div style={{ display: "flex", gap: 6, marginTop: 20 }}>
          {[{ l: "G", u: "https://github.com/getintheQ", t: "GitHub" }, { l: "in", u: "https://linkedin.com/in/getintheq", t: "LinkedIn" }, { l: "@", u: "mailto:kiw.brw@gmail.com", t: "Email" }, { l: "↗", u: "https://www.khiw.dev/api/resume", t: "Resume" }].map((s, i) => (
            <a key={i} href={s.u} target="_blank" rel="noopener noreferrer" title={s.t}
              style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${C.border}`, color: C.ghost, fontSize: 11, fontFamily: F.mono, transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; e.currentTarget.style.background = C.accentBg; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.ghost; e.currentTarget.style.background = "transparent"; }}
            >{s.l}</a>
          ))}
        </div></Reveal>
      </section>

      {/* ══ ABOUT ══ */}
      <section id="about" style={{ maxWidth: 700, margin: "0 auto", padding: "80px 24px" }}>
        <Reveal><Label>About</Label></Reveal>
        <Reveal delay={0.05}><h2 style={{ fontSize: 28, fontWeight: 700, color: C.textBright, marginBottom: 24, lineHeight: 1.2 }}>From Mechanical Engineer<br />to AI Architect</h2></Reveal>
        <Reveal delay={0.1}><div style={{ fontSize: 14, lineHeight: 1.9, display: "flex", flexDirection: "column", gap: 16 }}>
          {profile
            ? profile.summary.split(". ").reduce<string[][]>((acc, s, i) => {
                const chunk = Math.floor(i / 2);
                if (!acc[chunk]) acc[chunk] = [];
                acc[chunk].push(s);
                return acc;
              }, []).map((sentences, i) => (
                <p key={i}>{sentences.join(". ")}{sentences[sentences.length - 1].endsWith(".") ? "" : "."}</p>
              ))
            : <>
                <p>I graduated with First Class Honors in Mechanical Engineering from Naresuan University in 2019 — not knowing my career would take me from welding inspections at oil refineries to building AI disaster warning systems for the Thai government.</p>
                <p>My path wound through <span style={{ color: C.textBright }}>Bangchack Refinery</span> (ASME welding), <span style={{ color: C.textBright }}>Hitachi refrigerator design</span> (ANSYS & Moldex3D), <span style={{ color: C.textBright }}>nuclear radiopharmaceuticals</span> (I-131 at TINT), and <span style={{ color: C.textBright }}>CP Group's injection molding</span> (300K pieces/day).</p>
                <p>Today I work at the intersection of <span style={{ color: C.accent }}>AI agent architecture</span>, <span style={{ color: C.accent }}>engineering simulation</span>, and <span style={{ color: C.accent }}>Thai government digital transformation</span>.</p>
              </>
          }
        </div></Reveal>
      </section>

      {/* ══ CAREER ══ */}
      <section style={{ maxWidth: 700, margin: "0 auto", padding: "40px 24px 80px" }}>
        <Reveal><Label>Career</Label></Reveal>
        <Reveal delay={0.05}><h2 style={{ fontSize: 28, fontWeight: 700, color: C.textBright, marginBottom: 32 }}>Timeline</h2></Reveal>
        {loading
          ? [0,1,2,3,4].map(i => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 16, padding: "16px 0", borderBottom: i < 4 ? `1px solid ${C.border}` : "none" }}>
                <Skel w={48} h={11} radius={3} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Skel w="60%" h={14} radius={4} />
                  <Skel w="40%" h={10} radius={3} />
                  <Skel w="90%" h={10} radius={3} />
                </div>
              </div>
            ))
          : CAREER.map((c, i) => (
          <Reveal key={i} delay={0.03 * i}>
            <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 16, padding: "16px 0", borderBottom: i < CAREER.length - 1 ? `1px solid ${C.border}` : "none", transition: "background 0.2s", borderRadius: 4 }}
              onMouseEnter={e => (e.currentTarget.style.background = C.surface)}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <div style={{ fontFamily: F.mono, fontSize: 11, color: c.hi ? C.accent : C.muted, fontWeight: 500, paddingTop: 3 }}>{c.y}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.textBright }}>{c.t}</div>
                <div style={{ fontSize: 12, color: c.hi ? C.accent : C.muted, fontWeight: 500, marginTop: 2 }}>{c.c}</div>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginTop: 6 }}>{c.d}</div>
              </div>
            </div>
          </Reveal>
        ))}
        <Reveal delay={0.3}><div style={{ marginTop: 24, padding: "16px 20px", borderRadius: 10, background: C.accentBg, border: "1px solid rgba(52,211,153,0.1)" }}>
          <div style={{ fontSize: 13, color: C.accent, fontWeight: 700 }}>Education</div>
          <div style={{ fontSize: 13, color: C.text, marginTop: 4 }}>
            {edu ? `${edu.degree} — ${edu.university} (${edu.years})` : "B.Eng Mechanical Engineering — Naresuan University (2015–2019)"}
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
            {edu ? `${edu.honors} · ${edu.languages}` : "GPA 3.50, First Class Honors · EF SET C2 (72/100) · Thai (Native)"}
          </div>
        </div></Reveal>
      </section>

      {/* ══ PROJECTS ══ */}
      <section id="projects" style={{ maxWidth: 700, margin: "0 auto", padding: "40px 24px 80px" }}>
        <Reveal><Label>Projects</Label></Reveal>
        <Reveal delay={0.05}><h2 style={{ fontSize: 28, fontWeight: 700, color: C.textBright, marginBottom: 8 }}>Selected Work</h2></Reveal>
        <Reveal delay={0.08}><p style={{ fontSize: 12, color: C.muted, marginBottom: 24 }}>From {profile ? `${profile.stats.projects}+` : "50+"} Vercel deployments and {profile ? profile.stats.workers : 47} Cloudflare Workers</p></Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }}>
          {loading
            ? [0,1,2,3,4,5].map(i => (
                <div key={i} style={{ padding: "14px", borderRadius: 10, background: C.surface, border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Skel w="55%" h={13} radius={4} />
                    <Skel w={32} h={18} radius={9} />
                  </div>
                  <Skel w="90%" h={10} radius={3} />
                  <Skel w="70%" h={10} radius={3} />
                  <Skel w="50%" h={9} radius={3} />
                </div>
              ))
            : PROJECTS.map((p, i) => (
              <Reveal key={i} delay={0.03 * i}>
                <a href={p.u} target="_blank" rel="noopener noreferrer"
                  style={{ display: "block", padding: "14px", borderRadius: 10, background: C.surface, border: `1px solid ${C.border}`, textDecoration: "none", color: C.text, transition: "all 0.25s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.background = C.surfaceHover; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "none"; e.currentTarget.style.background = C.surface; }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.textBright }}>{p.n}</div>
                    <Pill on>{p.tag}</Pill>
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5, marginBottom: 6 }}>{p.d}</div>
                  <div style={{ fontSize: 9, fontFamily: F.mono, color: C.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.u.replace("https://", "")}</div>
                </a>
              </Reveal>
            ))
          }
        </div>
      </section>

      {/* ══ DOMAINS ══ */}
      <section style={{ maxWidth: 700, margin: "0 auto", padding: "40px 24px 80px" }}>
        <Reveal><Label>Expertise</Label></Reveal>
        <Reveal delay={0.05}><h2 style={{ fontSize: 28, fontWeight: 700, color: C.textBright, marginBottom: 24 }}>Industry Domains</h2></Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {DOMAINS.map((d, i) => (
            <Reveal key={i} delay={0.05 * i}>
              <div style={{ padding: "14px", borderRadius: 10, background: C.surface, border: `1px solid ${C.border}`, transition: "all 0.25s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.background = C.surfaceHover; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.surface; }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: C.accent }}>{d.i}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.textBright }}>{d.l}</span>
                </div>
                <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.6, fontFamily: F.mono }}>{d.d}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══ SKILLS ══ */}
      <section id="skills" style={{ maxWidth: 700, margin: "0 auto", padding: "40px 24px 80px" }}>
        <Reveal><Label>Skills</Label></Reveal>
        <Reveal delay={0.05}><h2 style={{ fontSize: 28, fontWeight: 700, color: C.textBright, marginBottom: 24 }}>Tech Stack</h2></Reveal>
        {loading
          ? [0,1,2,3,4].map(i => (
              <div key={i} style={{ marginBottom: 18 }}>
                <Skel w={80} h={10} radius={3} style={{ marginBottom: 10 }} />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {[52,68,44,72,56,60].map((w, j) => <Skel key={j} w={w} h={22} radius={11} />)}
                </div>
              </div>
            ))
          : SKILLS.map((s, i) => (
              <Reveal key={i} delay={0.05 * i}><div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 10, fontFamily: F.mono, color: C.accentDim, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>{s.c}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{s.s.map((t, j) => <Pill key={j}>{t}</Pill>)}</div>
              </div></Reveal>
            ))
        }
      </section>

      {/* ══ SIDE PROJECTS ══ */}
      <section style={{ maxWidth: 700, margin: "0 auto", padding: "40px 24px 80px" }}>
        <Reveal><Label>Open Source</Label></Reveal>
        <Reveal delay={0.05}><h2 style={{ fontSize: 28, fontWeight: 700, color: C.textBright, marginBottom: 24 }}>Passion Projects</h2></Reveal>
        {loading
          ? [0,1].map(i => (
              <div key={i} style={{ padding: "18px", borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`, marginBottom: 10, borderLeft: `3px solid ${C.accent}`, display: "flex", flexDirection: "column", gap: 8 }}>
                <Skel w="45%" h={14} radius={4} />
                <Skel w="85%" h={10} radius={3} />
                <Skel w="70%" h={10} radius={3} />
                <Skel w="38%" h={9} radius={3} />
              </div>
            ))
          : SIDE_PROJECTS.map((p, i) => (
              <Reveal key={i} delay={0.08 * i}>
                <div style={{ padding: "18px", borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`, marginBottom: 10, borderLeft: `3px solid ${C.accent}` }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: C.accent }}>{p.name}</span>
                  </div>
                  <p style={{ fontSize: 12, color: C.text, lineHeight: 1.7, marginBottom: 6 }}>{p.description}</p>
                  {p.url && <span style={{ fontSize: 10, fontFamily: F.mono, color: C.faint }}>{p.url.replace("https://", "")}</span>}
                </div>
              </Reveal>
            ))
        }
      </section>

      {/* ══ CONTACT ══ */}
      <section id="contact" style={{ maxWidth: 700, margin: "0 auto", padding: "40px 24px 80px" }}>
        <Reveal><Label>Contact</Label></Reveal>
        <Reveal delay={0.05}><h2 style={{ fontSize: 28, fontWeight: 700, color: C.textBright, marginBottom: 8 }}>Want to work together?</h2></Reveal>
        <Reveal delay={0.08}><p style={{ fontSize: 14, color: C.muted, marginBottom: 32, lineHeight: 1.7 }}>Recruiters, collaborators, and interesting humans welcome. Fill out the form below or reach out via <a href="mailto:kiw.brw@gmail.com" style={{ color: C.accent }}>kiw.brw@gmail.com</a>.</p></Reveal>
        <Reveal delay={0.1}><ContactSection /></Reveal>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ padding: "20px 24px 32px", textAlign: "center", borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 6 }}>
          {[{ l: "GitHub", u: "https://github.com/getintheQ" }, { l: "LinkedIn", u: "https://linkedin.com/in/getintheq" }, { l: "Email", u: "mailto:kiw.brw@gmail.com" }, { l: "Resume", u: "https://www.khiw.dev/api/resume" }].map((s, i) => (
            <a key={i} href={s.u} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 12, color: C.muted, textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = C.accent)}
              onMouseLeave={e => (e.currentTarget.style.color = C.muted)}>{s.l}</a>
          ))}
        </div>
        <p style={{ fontSize: 11, color: C.faint }}>
          © 2026 · {profile ? profile.stats.projects : 50} Vercel Projects · {profile ? profile.stats.workers : 47} Cloudflare Workers · {profile ? profile.stats.industries : 9} Industries
        </p>
      </footer>
    </div>
  );
}
