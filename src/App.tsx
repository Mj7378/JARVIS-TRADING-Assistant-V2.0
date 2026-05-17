import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Send, 
  LayoutDashboard, 
  MessageSquare, 
  ClipboardList, 
  TrendingUp, 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp,
  Plus,
  Trash2,
  Calendar,
  Activity,
  Layers,
  Zap,
  Target,
  ArrowUpRight,
  Cpu,
  BarChart3,
  Dna,
  DollarSign
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

// --- THEME & CONSTANTS ---
const T = {
  bg: "#080806", 
  surface: "#111008", 
  surface2: "#181410",
  border: "#c9a84c15", 
  borderHover: "#c9a84c40",
  gold: "#c9a84c", 
  goldDim: "#8a7a5a", 
  goldFaint: "#3a3020",
  text: "#e0d8c8", 
  textDim: "#8a7a5a", 
  textFaint: "#3a3020",
  green: "#4caf80", 
  red: "#c9504c", 
  blue: "#4c9ac9", 
  teal: "#4cc9a8",
};

const TOPIC_KEYS = {
  trading: ["gold", "xauusd", "trade", "chart", "ob", "fvg", "bos", "choch", "entry", "sl", "tp", "buy", "sell", "market", "price", "london", "session", "order block", "liquidity", "h1", "h4", "m15", "gft", "challenge", "smc", "ict", "killzone", "sweep", "premium", "discount", "imbalance", "displacement"],
  learning: ["samjhao", "explain", "kya hai", "what is", "how", "kaise", "seekhna", "study", "concept", "theory", "batao", "matlab", "difference"],
  planning: ["plan", "roadmap", "schedule", "routine", "kya karu", "next", "week", "today", "aaj", "kal", "kab"],
};

const SESSIONS = [
  { name: "Asian", start: [5, 30], end: [10, 30], color: T.blue, emoji: "🌏", desc: "Accumulation Zone" },
  { name: "London", start: [12, 30], end: [15, 30], color: T.gold, emoji: "🇬🇧", desc: "Manipulation Phase" },
  { name: "New York", start: [17, 30], end: [22, 30], color: T.red, emoji: "🗽", desc: "Distribution Drive" },
];

const SMC_DATA = [
  { title: "📦 Order Block (OB)", color: T.gold, points: ["Institutional footprint: last candle before expansion.", "Validates ONLY with Displacement & FVG.", "H4 OB = Bias direction.", "M1 OB = Scalp execution."], tip: "Don't trade every OB. Look for the 'Liquidity Sweep' before the OB formation." },
  { title: "⚡ Fair Value Gap (FVG)", color: T.blue, points: ["Price imbalance: 3-candle gap.", "Magnet for price to 'rebalance'.", "High probability if within Premium/Discount.", "Consecutive FVGs = Strong Trend."], tip: "Check 'Consequent Encroachment' (50% level) of an FVG for refined entry." },
  { title: "🔄 Market Structure (STRUCTURE)", color: T.teal, points: ["CHoCH: Market sentiment reversal.", "BOS: Trend continuation signal.", "Inducement: False break before real move.", "Fractal nature: H1 CHoCH > M1 CHoCH."], tip: "A CHoCH without a Liquidity Sweep is likely a 'Trap'." },
  { title: "💧 Liquidity Engineering", color: T.red, points: ["BSL/SSL: Pools of resting orders.", "Equal Highs/Lows = Price magnets.", "Turtle Soup: Failed breakout entry.", "Internal vs External liquidity."], tip: "Market moves from Liquidity to Liquidity. Identify the target first." },
  { title: "📐 PD Arrays & Fibs", color: T.goldDim, points: ["Equilibrium: The 0.5 level.", "Premium: Above 0.5 (Look for Sells).", "Discount: Below 0.5 (Look for Buys).", "OTG: Optimal Trade Entry (0.62-0.79)."], tip: "Only buy in Discount. Only sell in Premium. Ignore the rest." },
  { title: "🕐 Killzone Protocols", color: T.teal, points: ["LO (London Open): High impact volatility.", "NYO (NY Open): Trend confirmation/reversal.", "Silver Bullet: High probability algorithmic window.", "Macros: Small periodic volume injections."], tip: "The best moves happen when London and NY overlapping volume hits." },
];

const SUGGESTIONS = [
  "Aaj ka bias kya hai?",
  "London protocol brief karo",
  "SMC entry checklist do",
  "Journal analysis report",
  "Remind me GFT rules",
];

// --- UTILS ---
function detectTopic(text: string) {
  const l = text.toLowerCase();
  for (const [t, keys] of Object.entries(TOPIC_KEYS)) {
    if (keys.some(k => l.includes(k))) return t;
  }
  return "general";
}

function getIST() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
}

function toMins(h: number, m: number) { return h * 60 + m; }

function fmtTime(mins: number) {
  const h = Math.floor(mins / 60), m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function getSessionStatus() {
  const ist = getIST();
  const now = toMins(ist.getHours(), ist.getMinutes());
  for (const s of SESSIONS) {
    const st = toMins(...(s.start as [number, number])), en = toMins(...(s.end as [number, number]));
    if (now >= st && now < en) return { active: s, next: null, minsLeft: en - now };
  }
  for (const s of SESSIONS) {
    const st = toMins(...(s.start as [number, number]));
    if (st > now) return { active: null, next: s, minsLeft: st - now };
  }
  return { 
    active: null, 
    next: SESSIONS[0], 
    minsLeft: (24 * 60 - toMins(getIST().getHours(), getIST().getMinutes())) + toMins(...(SESSIONS[0].start as [number, number])) 
  };
}

// --- SHADED COMPONENTS ---
function Metric({ label, value, color, icon: Icon, sub }: any) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "2px", padding: "12px 14px", flex: 1, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", right: "-10px", top: "-10px", opacity: 0.1 }}>
        {Icon && <Icon size={64} color={color} />}
      </div>
      <div style={{ fontSize: "8px", color: T.textFaint, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px", fontWeight: "bold" }}>{label}</div>
      <div style={{ fontSize: "20px", fontWeight: "bold", color, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
      {sub && <div style={{ fontSize: "7px", color: T.textDim, marginTop: "4px", letterSpacing: "1px" }}>{sub.toUpperCase()}</div>}
    </div>
  );
}

function SectionHeader({ label, icon: Icon }: any) {
  return (
    <div style={{ 
      display: "flex", 
      alignItems: "center", 
      gap: "10px", 
      borderBottom: `1px solid ${T.border}`, 
      paddingBottom: "8px", 
      marginBottom: "16px" 
    }}>
      {Icon && <Icon size={12} color={T.gold} />}
      <span style={{ fontSize: "9px", letterSpacing: "4px", color: T.goldDim, textTransform: "uppercase", fontWeight: "bold", fontFamily: "'JetBrains Mono', monospace" }}>
        {label}
      </span>
    </div>
  );
}

function MatrixVisual() {
  return (
    <div style={{ height: "60px", width: "100%", display: "flex", gap: "2px", alignItems: "flex-end", marginBottom: "15px" }}>
      {Array.from({ length: 32 }).map((_, i) => {
        return (
          <motion.div 
            key={i}
            animate={{ height: [`${20 + Math.random() * 60}%`, `${30 + Math.random() * 70}%`, `${20 + Math.random() * 60}%`], background: [T.goldFaint, T.goldDim, T.goldFaint] }}
            transition={{ duration: 1.5 + Math.random(), repeat: Infinity }}
            style={{ flex: 1, borderRadius: "1px" }}
          />
        );
      })}
    </div>
  );
}

function Msg({ msg }: any) {
  const u = msg.role === "user";
  return (
    <motion.div 
      initial={{ opacity: 0, x: u ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      style={{ display: "flex", flexDirection: "column", alignItems: u ? "flex-end" : "flex-start", marginBottom: "25px" }}
    >
      {!u && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", paddingLeft: "4px" }}>
          <div style={{ width: "24px", height: "24px", border: `1px solid ${T.gold}`, borderRadius: "2px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "bold", color: T.gold }}>J</div>
          <span style={{ fontSize: "9px", color: T.goldDim, letterSpacing: "3px", fontWeight: "bold" }}>JARVIS v2.0</span>
          <span style={{ fontSize: "8px", color: T.textFaint, letterSpacing: "1px", background: T.goldFaint, px: "6px", padding: "1px 5px", borderRadius: "1px" }}>SECURE</span>
        </div>
      )}
      <div style={{ 
        maxWidth: "85%", 
        padding: "16px 20px", 
        background: u ? T.goldFaint : T.surface, 
        border: `1px solid ${u ? T.gold + "30" : T.border}`, 
        borderRadius: "2px", 
        fontSize: "13px", 
        lineHeight: "1.8", 
        color: u ? T.gold : T.text, 
        whiteSpace: "pre-wrap",
        fontFamily: u ? "'JetBrains Mono', monospace" : "inherit",
        position: "relative"
      }}>
        {msg.content}
        {msg.sources && msg.sources.length > 0 && (
          <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: `1px solid ${T.border}`, display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {msg.sources.map((s: any, idx: number) => (
              <a key={idx} href={s.uri} target="_blank" rel="noreferrer" style={{ fontSize: "10px", color: T.goldDim, textDecoration: "none", background: T.goldFaint, padding: "2px 6px", borderRadius: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
                <TrendingUp size={10} /> {s.title || "Source"}
              </a>
            ))}
          </div>
        )}
        {u && <div style={{ position: "absolute", bottom: "-15px", right: "5px", fontSize: "8px", color: T.textFaint }}>OPERATOR: MJ</div>}
      </div>
    </motion.div>
  );
}

// --- MAIN APP ---
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [msgs, setMsgs] = useState([
    { role: "assistant", content: "Systems operational, Mj. Matrix analytics decoded.\n\nAll SMC modules online. Protocol sequence initialized. How shall we proceed, sir?", topic: "general" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [intelLoading, setIntelLoading] = useState(false);
  const [briefing, setBriefing] = useState<string | null>(null);
  const [istNow, setIstNow] = useState(getIST());
  const [sesStatus, setSesStatus] = useState(getSessionStatus());
  const [goldPrice, setGoldPrice] = useState(2345.67);
  const [phase, setPhase] = useState(1);
  const [expandedSMC, setExpandedSMC] = useState<number | null>(0);

  // Persistence
  const [trades, setTrades] = useState<any[]>(() => {
    const saved = localStorage.getItem("jarvis_v2_trades");
    return saved ? JSON.parse(saved) : [];
  });
  const [tf, setTf] = useState({ date: new Date().toISOString().split('T')[0], dir: "BUY", setup: "OB Sweep", pnl: "", notes: "" });

  useEffect(() => {
    localStorage.setItem("jarvis_v2_trades", JSON.stringify(trades));
  }, [trades]);

  // Simulated Gold Price
  useEffect(() => {
    const interval = setInterval(() => {
      setGoldPrice(prev => {
        const volatility = sesStatus.active ? (sesStatus.active.name === "London" ? 0.8 : 0.4) : 0.1;
        const change = (Math.random() - 0.5) * volatility;
        return parseFloat((prev + change).toFixed(2));
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [sesStatus]);

  // IST Sync
  useEffect(() => {
    const t = setInterval(() => {
      setIstNow(getIST());
      setSesStatus(getSessionStatus());
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (tab === "chat") bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading, tab]);

  const send = async (text?: string) => {
    const u = text || input.trim();
    if (!u || loading) return;
    setInput("");
    const topic = detectTopic(u);
    
    setMsgs(prev => [...prev, { role: "user", content: u, topic }]);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: u,
          context: {
            currentGoldPrice: goldPrice,
            session: sesStatus,
            accountSummary: {
              pnl: trades.reduce((acc, t) => acc + (parseFloat(t.pnl) || 0), 0),
              winRate: trades.length ? Math.round((trades.filter(t => parseFloat(t.pnl) >= 0).length / trades.length) * 100) : 0,
              tradesCount: trades.length
            }
          }
        }),
      });
      const data = await response.json();
      setMsgs(prev => [...prev, { role: "assistant", content: data.text || "Communication relay error.", topic, sources: data.sources }]);
    } catch (err) {
      setMsgs(prev => [...prev, { role: "assistant", content: "Bridge offline. AI response failed.", topic: "general" }]);
    } finally {
      setLoading(false);
    }
  };

  const getIntel = async () => {
    if (intelLoading) return;
    setIntelLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          type: "briefing",
          context: {
            currentGoldPrice: goldPrice,
            session: sesStatus,
            accountSummary: {
              pnl: trades.reduce((acc, t) => acc + (parseFloat(t.pnl) || 0), 0),
              winRate: trades.length ? Math.round((trades.filter(t => parseFloat(t.pnl) >= 0).length / trades.length) * 100) : 0,
              tradesCount: trades.length
            }
          }
        }),
      });
      const data = await response.json();
      setBriefing(data.text);
      // Optional: you could add sources to briefing too, but for now just text is fine
    } catch (err) {
      setBriefing("Failed to sync with intelligence grid.");
    } finally {
      setIntelLoading(false);
    }
  };

  const addTrade = () => {
    if (!tf.pnl) return;
    const added = { ...tf, id: Date.now(), result: parseFloat(tf.pnl) >= 0 ? "WIN" : "LOSS" };
    setTrades([added, ...trades]);
    setTf({ ...tf, pnl: "", notes: "" });
  };

  const deleteTrade = (id: number) => setTrades(trades.filter(t => t.id !== id));

  // Calculated Stats
  const totalPnl = useMemo(() => trades.reduce((acc, t) => acc + (parseFloat(t.pnl) || 0), 0), [trades]);
  const wins = trades.filter(t => t.result === "WIN").length;
  const winRate = trades.length ? Math.round((wins / trades.length) * 100) : 0;
  const tDays = Array.from(new Set(trades.map(t => t.date))).length;
  const targets = phase === 1 ? { profit: 400, dailyDD: 250, maxDD: 500 } : { profit: 250, dailyDD: 250, maxDD: 500 };

  const chartData = useMemo(() => {
    let bal = 5000;
    const data = [{ name: 'INIT', bal: 5000 }];
    [...trades].reverse().forEach(t => {
      bal += parseFloat(t.pnl);
      data.push({ name: t.date, bal });
    });
    return data;
  }, [trades]);

  const TABS = [
    { id: "dashboard", icon: <LayoutDashboard size={14} />, label: "MATRIX" },
    { id: "chat", icon: <MessageSquare size={14} />, label: "RELAY" },
    { id: "cheatsheet", icon: <Layers size={14} />, label: "SMC" },
    { id: "journal", icon: <ClipboardList size={14} />, label: "LOG" },
  ];

  return (
    <div className="grid-overlay" style={{ 
      height: "100vh", 
      background: T.bg, 
      fontFamily: "'Outfit', sans-serif", 
      display: "flex", 
      flexDirection: "column", 
      color: T.text, 
      overflow: "hidden" 
    }}>
      
      {/* HEADER HUD */}
      <header style={{ 
        background: "rgba(10, 8, 6, 0.98)", 
        backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${T.border}`, 
        padding: "16px 24px", 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        flexShrink: 0,
        zIndex: 100
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "36px", height: "36px", border: `2px solid ${T.gold}`, borderRadius: "1px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Activity size={18} color={T.gold} className="pulse" />
          </div>
          <div>
            <div style={{ fontSize: "16px", letterSpacing: "8px", color: T.gold, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace" }}>JARVIS</div>
            <div style={{ fontSize: "9px", color: T.textDim, letterSpacing: "3px" }}>PREMIUM ASSET MONITOR</div>
          </div>
        </div>

          <div style={{ display: "flex", gap: "40px", alignItems: "center" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "10px", color: T.gold, letterSpacing: "2px", display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end" }}>
              <TrendingUp size={10} className="pulse" /> SEARCH GROUNDING · ACTIVE
            </div>
            <div style={{ fontSize: "20px", fontWeight: "bold", fontFamily: "'JetBrains Mono', monospace" }}>
              <span style={{ color: T.textFaint }}>LIVE</span> XAUUSD
            </div>
          </div>
          
          <div style={{ textAlign: "right", borderLeft: `1px solid ${T.border}`, paddingLeft: "40px" }}>
            <div style={{ fontSize: "10px", color: T.goldDim, letterSpacing: "2px" }}>SIGNAL · WEB</div>
            <div style={{ fontSize: "20px", fontWeight: "bold", fontFamily: "'JetBrains Mono', monospace", color: T.green }}>
              STABLE
            </div>
          </div>
        </div>
      </header>

      {/* SESSION INDICATOR */}
      <div style={{ borderBottom: `1px solid ${T.border}`, background: "#111008", padding: "10px 24px", display: "flex", gap: "25px", overflowX: "auto", scrollbarWidth: "none" }}>
        {SESSIONS.map(s => {
          const isActive = sesStatus.active?.name === s.name;
          return (
            <div key={s.name} style={{ display: "flex", alignItems: "center", gap: "10px", opacity: isActive ? 1 : 0.4, transition: "opacity 0.4s" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "1px", background: s.color, boxShadow: isActive ? `0 0 15px ${s.color}` : "none" }} className={isActive ? "blink" : ""} />
              <span style={{ fontSize: "11px", color: isActive ? T.text : T.textDim, letterSpacing: "2px", fontWeight: "bold" }}>{s.name.toUpperCase()}</span>
              {isActive && <span style={{ fontSize: "10px", color: T.goldDim, fontFamily: "'JetBrains Mono', monospace" }}>{fmtTime(sesStatus.minsLeft)} REMAINING</span>}
            </div>
          );
        })}
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        
        {/* NAV RAIL */}
        <aside style={{ width: "90px", borderRight: `1px solid ${T.border}`, background: "#0a0908", display: "flex", flexDirection: "column", itemsCenter: "center", py: "30px" }}>
          {TABS.map(t => (
            <button 
              key={t.id} 
              onClick={() => setTab(t.id)} 
              style={{ 
                width: "100%", 
                padding: "25px 0", 
                background: "transparent", 
                border: "none", 
                color: tab === t.id ? T.gold : T.textFaint, 
                cursor: "pointer", 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center", 
                gap: "10px", 
                transition: "all 0.4s",
                position: "relative"
              }}
            >
              {tab === t.id && <motion.div layoutId="activeRail" style={{ position: "absolute", right: 0, top: "10px", bottom: "10px", width: "3px", background: T.gold, borderRadius: "2px 0 0 2px" }} />}
              {t.icon}
              <span style={{ fontSize: "9px", letterSpacing: "2px", fontWeight: 700 }}>{t.label}</span>
            </button>
          ))}
        </aside>

        {/* CONTENT VIEWPORT */}
        <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}>
          
          <AnimatePresence mode="wait">
            {/* ── MATRIX ── */}
            {tab === "dashboard" && (
              <motion.div 
                key="dash"
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                style={{ flex: 1, overflowY: "auto", padding: "40px", scrollbarWidth: "none" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px" }}>
                  <div>
                    <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "42px", fontStyle: "italic", fontWeight: 900, color: T.text, margin: 0 }}>The Matrix</h1>
                    <div style={{ fontSize: "11px", color: T.goldDim, letterSpacing: "6px" }}>GFT CHALLENGE SEQUENCE ACTIVE // PHASE {phase}</div>
                  </div>
                  <div style={{ display: "flex", gap: "12px" }}>
                    {[1, 2].map(p => (
                      <button 
                        key={p} 
                        onClick={() => setPhase(p)} 
                        style={{ 
                          background: phase === p ? T.gold : "transparent",
                          color: phase === p ? "#0a0a0a" : T.goldDim,
                          border: `1px solid ${T.gold}${phase === p ? "" : "30"}`,
                          padding: "8px 18px",
                          fontSize: "11px",
                          borderRadius: "1px",
                          fontWeight: "bold",
                          letterSpacing: "2px",
                          cursor: "pointer"
                        }}
                      >
                        PHASE {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: "30px" }}>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, p: "30px", padding: "30px" }}>
                      <SectionHeader label="EQUITY ALPHA TRAJECTORY" icon={TrendingUp} />
                      <div style={{ height: "260px", width: "100%", marginBottom: "20px" }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={T.gold} stopOpacity={0.5}/>
                                <stop offset="95%" stopColor={T.gold} stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="name" hide />
                            <YAxis domain={['auto', 'auto']} hide />
                            <Tooltip 
                              contentStyle={{ background: "#0a0908", border: `1px solid ${T.border}`, fontSize: '11px', borderRadius: '1px' }}
                              labelStyle={{ color: T.textDim }}
                              itemStyle={{ color: T.gold, fontWeight: 'bold' }}
                            />
                            <Area type="monotone" dataKey="bal" stroke={T.gold} strokeWidth={3} fillOpacity={1} fill="url(#eqGrad)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <div style={{ display: "flex", gap: "25px" }}>
                        <Metric label="Net Equity" value={`$${(5000 + totalPnl).toLocaleString()}`} color={T.text} icon={DollarSign} />
                        <Metric label="Yield Curve" value={`${totalPnl >= 0 ? "+" : ""}$${totalPnl}`} color={totalPnl >= 0 ? T.green : T.red} icon={TrendingUp} sub={`Target $${targets.profit}`} />
                        <Metric label="Active Days" value={`${tDays}`} color={T.blue} icon={Calendar} sub="Protocol 5-Day Min" />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
                      <div style={{ background: T.surface, border: `1px solid ${T.border}`, padding: "30px" }}>
                        <SectionHeader label="GOAL PROXIMITY" icon={Target} />
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "11px" }}>
                          <span style={{ color: T.textDim }}>Accumulation Sequence</span>
                          <span style={{ color: T.gold }}>{Math.min(100, Math.round(((totalPnl > 0 ? totalPnl : 0) / targets.profit) * 100))}%</span>
                        </div>
                        <div style={{ height: "6px", background: "#ffffff08", borderRadius: "1px", overflow: "hidden" }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, ((totalPnl > 0 ? totalPnl : 0) / targets.profit) * 100)}%` }} style={{ height: "100%", background: T.gold }} />
                        </div>
                        <div style={{ marginTop: "25px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                          <div>
                            <div style={{ fontSize: "9px", color: T.textFaint, mb: "5px" }}>HIT RATE</div>
                            <div style={{ fontSize: "22px", fontWeight: "900", color: T.text, fontFamily: "'JetBrains Mono', monospace" }}>{winRate}%</div>
                          </div>
                          <div>
                            <div style={{ fontSize: "9px", color: T.textFaint, mb: "5px" }}>EDG_FACTOR</div>
                            <div style={{ fontSize: "22px", fontWeight: "900", color: T.text, fontFamily: "'JetBrains Mono', monospace" }}>{(wins / (trades.length - wins || 1)).toFixed(2)}</div>
                          </div>
                        </div>
                      </div>

                      <div style={{ background: T.surface, border: `1px solid ${T.red + "30"}`, padding: "30px" }}>
                        <SectionHeader label="RISK SHIELD" icon={ShieldAlert} />
                        <div style={{ fontSize: "10px", color: T.textFaint, marginBottom: "20px" }}>SYSTEM STABILITY MONITOR</div>
                        <div style={{ marginBottom: "20px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", marginBottom: "6px" }}>
                            <span>DAILY_DD_LIMIT</span>
                            <span style={{ color: T.red }}>$250 MAX</span>
                          </div>
                          <div style={{ height: "2px", background: "#ffffff05" }}>
                            <div style={{ height: "100%", width: "0%", background: T.red }} />
                          </div>
                        </div>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", marginBottom: "6px" }}>
                            <span>TOTAL_DD_EXPOSURE</span>
                            <span style={{ color: T.red }}>$${totalPnl < 0 ? Math.abs(totalPnl) : 0} / $500</span>
                          </div>
                          <div style={{ height: "2px", background: "#ffffff05" }}>
                            <motion.div animate={{ width: `${Math.min(100, (Math.abs(totalPnl < 0 ? totalPnl : 0) / targets.maxDD) * 100)}%` }} style={{ height: "100%", background: T.red }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, padding: "30px" }}>
                      <SectionHeader label="QUANT ANALYTICS" icon={Zap} />
                      <MatrixVisual />
                      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        {["H4", "H1", "M15"].map(tf => (
                          <div key={tf} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0a0908", padding: "12px 16px", borderLeft: `3px solid ${Math.random() > 0.4 ? T.green : T.red}` }}>
                            <span style={{ fontSize: "12px", fontWeight: "bold", fontFamily: "'JetBrains Mono', monospace" }}>{tf} TREND</span>
                            <span style={{ fontSize: "11px", color: Math.random() > 0.4 ? T.green : T.red, fontWeight: 700 }}>{Math.random() > 0.4 ? "BULL_EXPANSION" : "BEAR_CONTRACTION"}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ background: T.surface, border: `1px solid ${T.goldFaint}`, padding: "30px", display: "flex", flexDirection: "column", gap: "20px" }}>
                        <SectionHeader label="JARVIS INTELLIGENCE" icon={Cpu} />
                        
                        {!briefing ? (
                          <div style={{ fontSize: "12px", lineHeight: "1.7", color: T.textDim, fontStyle: "italic" }}>
                            "Sir, market dispersion metrics suggest a possible Liquidity Grab at session open. Protocols recommend observing the M15 FVG for displacement before execution."
                          </div>
                        ) : (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ fontSize: "12px", lineHeight: "1.7", color: T.text, background: "#0a0908", padding: "15px", borderLeft: `2px solid ${T.gold}`, position: "relative" }}
                          >
                            <div style={{ position: "absolute", top: "-8px", right: "10px", background: T.bg, padding: "0 5px", fontSize: "8px", color: T.gold, letterSpacing: "1px" }}>LIVE_INTEL</div>
                            {briefing}
                          </motion.div>
                        )}

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                          <button 
                            onClick={getIntel} 
                            disabled={intelLoading}
                            style={{ 
                              background: T.gold, 
                              border: "none", 
                              color: "#0a0a0a", 
                              padding: "12px", 
                              fontSize: "11px", 
                              letterSpacing: "2px", 
                              fontWeight: "bold", 
                              cursor: "pointer",
                              opacity: intelLoading ? 0.5 : 1,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "8px"
                            }}
                          >
                            <TrendingUp size={14} />
                            {intelLoading ? "SYNCING..." : "SYNC REAL-TIME INTEL"}
                          </button>
                          <button onClick={() => setTab("chat")} style={{ background: "transparent", border: `1px solid ${T.gold}`, color: T.gold, padding: "12px", fontSize: "11px", letterSpacing: "2px", fontWeight: "bold", cursor: "pointer" }}>
                            OPEN RELAY
                          </button>
                        </div>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* ── RELAY ── */}
            {tab === "chat" && (
              <motion.div 
                key="relay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
              >
                <div style={{ padding: "24px 35px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                   <div>
                    <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "42px", fontStyle: "italic", fontWeight: 900, color: T.text, margin: 0 }}>The Relay</h1>
                    <div style={{ fontSize: "11px", color: T.goldDim, letterSpacing: "6px" }}>SECURE QUANTUM CHANNEL ENCRYPTED</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "1px", background: T.green }} className="blink" />
                    <span style={{ fontSize: "10px", letterSpacing: "3px", fontWeight: 900 }}>AI_CORE_ONLINE</span>
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "35px", scrollbarWidth: "none" }}>
                  {msgs.map((m, i) => <Msg key={i} msg={m} />)}
                  {loading && (
                    <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "30px" }}>
                      <div style={{ width: "24px", height: "24px", border: `1px solid ${T.gold}`, borderRadius: "1px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "bold", color: T.gold }}>J</div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        {[0, 1, 2].map(d => <motion.div key={d} animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: d * 0.2 }} style={{ width: "5px", height: "5px", background: T.gold, borderRadius: "50%" }} />)}
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                <div style={{ padding: "0 35px 15px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                   {SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => send(s)} style={{ background: "transparent", border: `1px solid ${T.border}`, color: T.textDim, padding: "8px 16px", borderRadius: "1px", fontSize: "11px", cursor: "pointer", transition: "all 0.3s" }} onMouseEnter={e => (e.currentTarget.style.color = T.gold)} onMouseLeave={e => (e.currentTarget.style.color = T.textDim)}>{s}</button>
                   ))}
                </div>

                <div style={{ padding: "10px 35px 35px" }}>
                   <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "1px", padding: "15px 25px", display: "flex", alignItems: "flex-end", gap: "20px" }}>
                    <textarea 
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                      placeholder="Input alpha request to JARVIS..."
                      style={{ flex: 1, background: "transparent", border: "none", color: T.text, fontSize: "15px", fontFamily: "inherit", resize: "none", outline: "none", maxHeight: "180px", lineHeight: "1.6" }}
                    />
                    <button onClick={() => send()} disabled={loading || !input.trim()} style={{ background: loading || !input.trim() ? "transparent" : T.gold, color: loading || !input.trim() ? T.goldFaint : "#0a0a0a", border: `2px solid ${T.gold}`, borderRadius: "1px", padding: "10px 30px", fontSize: "11px", fontWeight: 900, letterSpacing: "3px", cursor: "pointer", transition: "all 0.3s" }}>
                      {loading ? "···" : "EXECUTE"}
                    </button>
                   </div>
                </div>
              </motion.div>
            )}

            {/* ── ACADEMY ── */}
            {tab === "cheatsheet" && (
              <motion.div 
                key="smc"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                style={{ flex: 1, overflowY: "auto", padding: "40px", scrollbarWidth: "none" }}
              >
                 <div style={{ marginBottom: "40px" }}>
                    <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "42px", fontStyle: "italic", fontWeight: 900, color: T.text, margin: 0 }}>The Academy</h1>
                    <div style={{ fontSize: "11px", color: T.goldDim, letterSpacing: "6px" }}>SMC ARCHITECTURAL BLUEPRINTS // HOUSED BY JARVIS</div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" }}>
                    {SMC_DATA.map((item, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setExpandedSMC(expandedSMC === idx ? null : idx)}
                        style={{ 
                          background: T.surface, 
                          border: `1px solid ${expandedSMC === idx ? item.color + "60" : T.border}`, 
                          borderRadius: "1px", 
                          padding: "25px", 
                          cursor: "pointer",
                          transition: "all 0.3s"
                        }}
                      >
                         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                             <div style={{ width: "4px", height: "20px", background: item.color }} />
                             <span style={{ fontSize: "16px", fontWeight: 900, color: item.color, letterSpacing: "1px" }}>{item.title}</span>
                          </div>
                          {expandedSMC === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>

                        <AnimatePresence>
                          {expandedSMC === idx && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                              <div style={{ marginTop: "20px" }}>
                                {item.points.map((p, i) => (
                                  <div key={i} style={{ fontSize: "12px", color: T.textDim, marginBottom: "10px", display: "flex", gap: "12px", lineHeight: "1.6" }}>
                                    <div style={{ width: "8px", height: "8px", border: `1px solid ${item.color}`, transform: "rotate(45deg)", flexShrink: 0, mt: "4px", marginTop: "4px" }} /> {p}
                                  </div>
                                ))}
                                <div style={{ background: "#0a0908", padding: "16px", border: `1px dashed ${item.color}40`, mt: "20px", marginTop: "20px", borderRadius: "1px", position: "relative" }}>
                                   <div style={{ position: "absolute", top: "-8px", left: "15px", background: "#0a0908", px: "8px", padding: "0 8px", fontSize: "9px", color: item.color, fontWeight: "bold", letterSpacing: "2px" }}>ADVISORY</div>
                                   <div style={{ fontSize: "11px", color: T.text, fontStyle: "italic", lineHeight: "1.5" }}>{item.tip}</div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>

                  <div style={{ mt: "50px", marginTop: "50px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "25px" }}>
                     {[
                       { label: "Market Bias", val: "Check Daily Expansion" },
                       { label: "POI Selection", val: "H1 Premium/Discount" },
                       { label: "Entry Trigger", val: "M1 CHoCH Sweep" }
                     ].map(r => (
                       <div key={r.label} style={{ textAlign: "center", border: `1px solid ${T.border}`, padding: "20px" }}>
                          <div style={{ fontSize: "9px", color: T.textFaint, letterSpacing: "3px", mb: "8px" }}>{r.label.toUpperCase()}</div>
                          <div style={{ fontSize: "14px", fontWeight: "bold", color: T.gold, letterSpacing: "1px" }}>{r.val}</div>
                       </div>
                     ))}
                  </div>
              </motion.div>
            )}

            {/* ── LOG ── */}
            {tab === "journal" && (
              <motion.div 
                key="log"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ flex: 1, display: "flex", padding: "40px", gap: "40px", overflow: "hidden" }}
              >
                 <div style={{ width: "350px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "30px" }}>
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, padding: "30px" }}>
                      <SectionHeader label="ENTRY RECORD PROTOCOL" icon={Plus} />
                      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                         <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                           <div>
                              <label style={{ fontSize: "9px", color: T.textFaint, letterSpacing: "1px", display: "block", mb: "5px" }}>DATE</label>
                              <input type="date" value={tf.date} onChange={e => setTf({...tf, date: e.target.value})} style={{ background: "#0a0908", border: `1px solid ${T.border}`, color: T.text, fontSize: "12px", padding: "10px", width: "100%", outline: "none", borderRadius: "1px" }} />
                           </div>
                           <div>
                              <label style={{ fontSize: "9px", color: T.textFaint, letterSpacing: "1px", display: "block", mb: "5px" }}>P&L ALPHA ($)</label>
                              <input type="number" placeholder="+/-" value={tf.pnl} onChange={e => setTf({...tf, pnl: e.target.value})} style={{ background: "#0a0908", border: `1px solid ${T.border}`, color: T.text, fontSize: "12px", padding: "10px", width: "100%", outline: "none", borderRadius: "1px" }} />
                           </div>
                         </div>
                         <div>
                            <label style={{ fontSize: "9px", color: T.textFaint, letterSpacing: "1px", display: "block", mb: "5px" }}>SETUP CONFIG</label>
                            <select value={tf.setup} onChange={e => setTf({...tf, setup: e.target.value})} style={{ background: "#0a0908", border: `1px solid ${T.border}`, color: T.text, fontSize: "12px", padding: "10px", width: "100%", outline: "none", borderRadius: "1px" }}>
                              {["OB Sweep", "FVG Entry", "BOS Extension", "CHoCH Flip", "Inducement Pull"].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                         </div>
                         <div>
                            <label style={{ fontSize: "9px", color: T.textFaint, letterSpacing: "1px", display: "block", mb: "5px" }}>VECTOR DIRECTION</label>
                            <div style={{ display: "flex", gap: "10px" }}>
                               {["BUY", "SELL"].map(d => (
                                 <button key={d} onClick={() => setTf({...tf, dir: d})} style={{ flex: 1, background: tf.dir === d ? (d === "BUY" ? T.green : T.red) : "transparent", color: tf.dir === d ? "#0a0a0a" : T.textDim, border: `1px solid ${d === "BUY" ? T.green : T.red}${tf.dir === d ? "" : "30"}`, padding: "12px", fontSize: "11px", fontWeight: "bold", cursor: "pointer", transition: "all 0.3s" }}>{d}</button>
                               ))}
                            </div>
                         </div>
                         <button onClick={addTrade} disabled={!tf.pnl} style={{ marginTop: "15px", background: T.gold, border: "none", color: "#0a0a0a", padding: "15px", fontSize: "11px", fontWeight: 900, letterSpacing: "3px", cursor: "pointer", opacity: !tf.pnl ? 0.3 : 1 }}>LOG SEQUENCE</button>
                      </div>
                    </div>

                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, padding: "30px" }}>
                       <SectionHeader label="ALPHA METRICS" icon={BarChart3} />
                       <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                             <span style={{ color: T.textDim }}>Logged Sequencies</span>
                             <span style={{ fontWeight: "bold", fontFamily: "'JetBrains Mono', monospace" }}>{trades.length}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                             <span style={{ color: T.textDim }}>Accumulated Yield</span>
                             <span style={{ fontWeight: "bold", color: totalPnl >= 0 ? T.green : T.red, fontFamily: "'JetBrains Mono', monospace" }}>${totalPnl}</span>
                          </div>
                           <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                             <span style={{ color: T.textDim }}>Accuracy Phase</span>
                             <span style={{ fontWeight: "bold", color: T.gold, fontFamily: "'JetBrains Mono', monospace" }}>{winRate}%</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, padding: "30px", display: "flex", flexDirection: "column" }}>
                    <SectionHeader label="EXECUTION BLOCKS ARCHIVE" icon={Dna} />
                    <div style={{ flex: 1, overflowY: "auto", pr: "15px", paddingRight: "15px", scrollbarWidth: "none" }}>
                       {trades.length === 0 ? (
                         <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: T.textFaint, fontSize: "13px", opacity: 0.5, border: `1px dashed ${T.border}` }}>Archive empty. No logs saved.</div>
                       ) : (
                         trades.map(t => (
                           <div key={t.id} style={{ display: "grid", gridTemplateColumns: "120px 1fr 120px 50px", alignItems: "center", padding: "20px", borderBottom: `1px solid ${T.border}`, background: "#0a090840", transition: "all 0.3s" }}>
                              <div style={{ fontSize: "12px", color: T.textDim, fontFamily: "'JetBrains Mono', monospace" }}>{t.date}</div>
                              <div>
                                 <div style={{ fontSize: "14px", fontWeight: "bold", color: t.dir === "BUY" ? T.green : T.red, letterSpacing: "1px" }}>{t.dir} · {t.setup}</div>
                                 <div style={{ fontSize: "10px", color: T.textFaint }}>OPERATOR_LOG: MJ</div>
                              </div>
                              <div style={{ fontSize: "16px", fontWeight: "bold", textAlign: "right", color: parseFloat(t.pnl) >= 0 ? T.green : T.red, fontFamily: "'JetBrains Mono', monospace" }}>
                                {parseFloat(t.pnl) >= 0 ? "+" : ""}{t.pnl}
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <button onClick={() => deleteTrade(t.id)} style={{ background: "transparent", border: "none", color: "#ff444440", cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={e => (e.currentTarget.style.color = "#ff4444")} onMouseLeave={e => (e.currentTarget.style.color = "#ff444440")}><Trash2 size={16} /></button>
                              </div>
                           </div>
                         ))
                       )}
                    </div>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>

        </main>
      </div>

      {/* FOOTER METRICS */}
      <footer style={{ borderTop: `1px solid ${T.border}`, padding: "8px 24px", background: "#0a0908", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "9px", color: T.textFaint, letterSpacing: "2px" }}>
        <div>SYSTEM: AIS-JARVIS-MJ-01 // SECURITY: QUANTUM_AES</div>
        <div style={{ display: "flex", gap: "20px" }}>
          <span>CORES: 32_ACTIVE</span>
          <span>LATENCY: 1.4MS</span>
          <span style={{ color: T.goldDim }}>Mj_PROTOCOL_v2.0_LOADED</span>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        .pulse { animation: pulse_fx 2.5s infinite; }
        .blink { animation: blink_fx 1.8s infinite; }
        @keyframes pulse_fx { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.15); opacity: 0.6; } }
        @keyframes blink_fx { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }
        select { -webkit-appearance: none; appearance: none; cursor: pointer; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.8) sepia(100%) saturate(1000%) hue-rotate(5deg); cursor: pointer; }
        * { scrollbar-width: none; }
        ::-webkit-scrollbar { display: none; }
      `}} />
    </div>
  );
}
