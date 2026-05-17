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
  DollarSign,
  Share2,
  History,
  Info,
  Clock,
  Briefcase,
  Smile,
  AlertTriangle,
  Flame,
  List,
  Book,
  Wrench,
  Users,
  Settings,
  Bell,
  HelpCircle,
  Search,
  Filter,
  Download,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { toPng } from "html-to-image";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Markdown from "react-markdown";

// --- UTILS ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- THEME & CONSTANTS ---
const T = {
  bg: "#05070a",
  surface: "#0c0e14",
  surface2: "#151921",
  border: "rgba(255, 255, 255, 0.06)",
  borderHover: "rgba(255, 255, 255, 0.12)",
  gold: "#c9a84c", // Restoration of JARVIS Gold
  goldDim: "#8a7a5a",
  goldFaint: "rgba(201, 168, 76, 0.1)",
  text: "#f8fafc",
  textDim: "#94a3b8",
  textFaint: "#475569",
  green: "#10b981",
  red: "#ef4444",
  blue: "#3b82f6",
  teal: "#14b8a6",
  purple: "#8b5cf6",
};

interface Message {
  role: "user" | "assistant";
  content: string;
  topic?: string;
  sources?: string[];
}

const EMOTIONS = [
  { icon: Smile, label: "Calm", color: T.teal },
  { icon: Target, label: "Focused", color: T.blue },
  { icon: Flame, label: "Greed", color: T.red },
  { icon: ShieldAlert, label: "Fear", color: T.purple },
  { icon: Info, label: "Neutral", color: T.textDim },
];

const SESSIONS = [
  {
    name: "Asian",
    start: [5, 30],
    end: [10, 30],
    color: T.blue,
    emoji: "🌏",
    desc: "Accumulation Zone",
  },
  {
    name: "London",
    start: [12, 30],
    end: [15, 30],
    color: T.gold,
    emoji: "🇬🇧",
    desc: "Manipulation Phase",
  },
  {
    name: "New York",
    start: [17, 30],
    end: [22, 30],
    color: T.purple,
    emoji: "🗽",
    desc: "Distribution Drive",
  },
];

const SMC_DATA = [
  {
    title: "📦 Order Block (OB)",
    color: T.gold,
    points: [
      "Institutional footprint: last candle before expansion.",
      "Validates ONLY with Displacement & FVG.",
      "H4 OB = Bias direction.",
      "M1 OB = Scalp execution.",
    ],
    tip: "Don't trade every OB. Look for the 'Liquidity Sweep' before the OB formation.",
  },
  {
    title: "⚡ Fair Value Gap (FVG)",
    color: T.blue,
    points: [
      "Price imbalance: 3-candle gap.",
      "Magnet for price to 'rebalance'.",
      "High probability if within Premium/Discount.",
      "Consecutive FVGs = Strong Trend.",
    ],
    tip: "Check 'Consequent Encroachment' (50% level) of an FVG for refined entry.",
  },
  {
    title: "🔄 Market Structure (STRUCTURE)",
    color: T.teal,
    points: [
      "CHoCH: Market sentiment reversal.",
      "BOS: Trend continuation signal.",
      "Inducement: False break before real move.",
      "Fractal nature: H1 CHoCH > M1 CHoCH.",
    ],
    tip: "A CHoCH without a Liquidity Sweep is likely a 'Trap'.",
  },
  {
    title: "💧 Liquidity Engineering",
    color: T.red,
    points: [
      "BSL/SSL: Pools of resting orders.",
      "Equal Highs/Lows = Price magnets.",
      "Turtle Soup: Failed breakout entry.",
      "Internal vs External liquidity.",
    ],
    tip: "Market moves from Liquidity to Liquidity. Identify the target first.",
  },
  {
    title: "📐 PD Arrays & Fibs",
    color: T.textDim,
    points: [
      "Equilibrium: The 0.5 level.",
      "Premium: Above 0.5 (Look for Sells).",
      "Discount: Below 0.5 (Look for Buys).",
      "OTG: Optimal Trade Entry (0.62-0.79).",
    ],
    tip: "Only buy in Discount. Only sell in Premium. Ignore the rest.",
  },
  {
    title: "🕐 Killzone Protocols",
    color: T.purple,
    points: [
      "LO (London Open): High impact volatility.",
      "NYO (NY Open): Trend confirmation/reversal.",
      "Silver Bullet: High probability algorithmic window.",
      "Macros: Small periodic volume injections.",
    ],
    tip: "The best moves happen when London and NY overlapping volume hits.",
  },
];

const SUGGESTIONS = [
  "Aaj ka bias kya hai?",
  "Analyze current XAU price",
  "Last 10 trades recap",
  "London protocol brief karo",
  "SMC entry checklist do",
];

// --- CORE UTILS ---
function getIST() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
  );
}

function toMins(h: number, m: number) {
  return h * 60 + m;
}

function fmtTime(mins: number) {
  const h = Math.floor(mins / 60),
    m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function getSessionStatus() {
  const ist = getIST();
  const now = toMins(ist.getHours(), ist.getMinutes());
  for (const s of SESSIONS) {
    const st = toMins(...(s.start as [number, number])),
      en = toMins(...(s.end as [number, number]));
    if (now >= st && now < en)
      return { active: s, next: null, minsLeft: en - now };
  }
  for (const s of SESSIONS) {
    const st = toMins(...(s.start as [number, number]));
    if (st > now) return { active: null, next: s, minsLeft: st - now };
  }
  return {
    active: null,
    next: SESSIONS[0],
    minsLeft:
      24 * 60 -
      toMins(getIST().getHours(), getIST().getMinutes()) +
      toMins(...(SESSIONS[0].start as [number, number])),
  };
}

// --- REUSABLE UI COMPONENTS ---
function SectionHeader({ label, icon: Icon, action }: any) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: `1px solid ${T.border}`,
        paddingBottom: "12px",
        marginBottom: "20px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {Icon && <Icon size={14} color={T.gold} />}
        <span
          style={{
            fontSize: "10px",
            letterSpacing: "5px",
            color: T.gold,
            textTransform: "uppercase",
            fontWeight: 800,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {label}
        </span>
      </div>
      {action}
    </div>
  );
}

function StatBox({ label, value, sub, color = T.text, icon: Icon }: any) {
  return (
    <div
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        padding: "20px",
        borderRadius: "1px",
        flex: 1,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "15px",
        }}
      >
        <div
          style={{
            fontSize: "9px",
            color: T.textFaint,
            letterSpacing: "2px",
            fontWeight: "bold",
          }}
        >
          {label.toUpperCase()}
        </div>
        {Icon && <Icon size={14} color={T.goldFaint} />}
      </div>
      <div
        style={{
          fontSize: "24px",
          fontWeight: 900,
          color,
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontSize: "9px",
            color: T.textDim,
            marginTop: "6px",
            letterSpacing: "1px",
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, color, sub }: any) {
  return (
    <div style={{ flex: 1 }}>
      <div
        style={{
          fontSize: "8px",
          color: T.textFaint,
          letterSpacing: "1px",
          textTransform: "uppercase",
          marginBottom: "4px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "18px",
          fontWeight: "bold",
          color,
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {value}
      </div>
      {sub && <div style={{ fontSize: "7px", color: T.textDim }}>{sub}</div>}
    </div>
  );
}

const BACKTEST_STRATEGIES = [
  "ICT Silver Bullet",
  "SMC Unicorn",
  "Turtle Soup",
  "London Power Hour",
  "NY Momentum",
];

const PRE_TRADE_CHECKLIST = [
  "Liquidity Sweep detected?",
  "Market Structure Shift (CHoCH)?",
  "Price in Premium/Discount?",
  "FVG or OB respected?",
  "Risk/Reward at least 1:2?",
];

// --- MAIN APP ---
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [msgs, setMsgs] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Systems operational, Mj. Matrix analytics decoded.\n\nAll SMC modules online. Protocol sequence initialized. How shall we proceed, sir?",
      topic: "general",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [intelLoading, setIntelLoading] = useState(false);
  const [signalLoading, setSignalLoading] = useState(false);
  const [briefing, setBriefing] = useState<string | null>(null);
  const [aiSignal, setAiSignal] = useState<any>(null);

  const [istNow, setIstNow] = useState(getIST());
  const [sesStatus, setSesStatus] = useState(getSessionStatus());
  const [goldPrice, setGoldPrice] = useState(2345.67);
  const [priceTick, setPriceTick] = useState(0);

  // Simulated Real-time Price Ticks
  useEffect(() => {
    const t = setInterval(() => {
      setPriceTick((prev) => prev + (Math.random() - 0.5) * 0.1);
    }, 2000);
    return () => clearInterval(t);
  }, []);

  const liveGold = useMemo(
    () => (goldPrice + priceTick).toFixed(2),
    [goldPrice, priceTick],
  );
  const [phase, setPhase] = useState(1);
  const [expandedSMC, setExpandedSMC] = useState<number | null>(null);

  // Position Sizer State
  const [calc, setCalc] = useState({
    bal: 5000,
    risk: 1,
    sl: 20,
    price: 2345.67,
  });
  const posSize = useMemo(() => {
    const riskAmt = calc.bal * (calc.risk / 100);
    const size = riskAmt / (calc.sl * 10); // Standard Gold Lot Size math: 1 lot = $1/pip
    return { riskAmt, size: size.toFixed(2), units: (size * 100).toFixed(0) };
  }, [calc]);

  // Persistence
  const [trades, setTrades] = useState<any[]>(() => {
    const saved = localStorage.getItem("jarvis_v3_trades");
    return saved ? JSON.parse(saved) : [];
  });

  const [backtests, setBacktests] = useState<any[]>(() => {
    const saved = localStorage.getItem("jarvis_v3_backtests");
    return saved ? JSON.parse(saved) : [];
  });

  const [tf, setTf] = useState({
    date: new Date().toISOString().split("T")[0],
    dir: "BUY",
    setup: "OB Sweep",
    pnl: "",
    rr: "2",
    emotion: "Neutral",
    tags: "",
    notes: "",
    rating: 5,
    checklist: [] as string[],
  });

  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(
    () => localStorage.setItem("jarvis_v3_trades", JSON.stringify(trades)),
    [trades],
  );
  useEffect(
    () =>
      localStorage.setItem("jarvis_v3_backtests", JSON.stringify(backtests)),
    [backtests],
  );

  const neuralSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      // Simulate finding new records in a "MT5 Link"
      const mockNew = [
        {
          id: Date.now(),
          date: new Date().toISOString().split("T")[0],
          dir: "BUY",
          setup: "Neural Pulse",
          pnl: "120.50",
          rr: "3.1",
          emotion: "Focused",
          notes: "MT5 Auto-Synced: Logic match 98%",
          rating: 8,
        },
      ];
      setTrades((prev) => [...mockNew, ...prev]);
      setIsSyncing(false);
      setBriefing(
        "Matrix Synced. +1 new execution record decrypted from MT5 uplink.",
      );
    }, 2000);
  };

  // Sync Timer
  useEffect(() => {
    const t = setInterval(() => {
      setIstNow(getIST());
      setSesStatus(getSessionStatus());
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const send = async (text?: string) => {
    const u = text || input.trim();
    if (!u || loading) return;
    setInput("");
    setMsgs((prev) => [...prev, { role: "user", content: u }]);
    setLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: u,
          context: { pnl: totalPnl, winRate, trades: trades.length },
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMsgs((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.text || "Communication relay error.",
            topic: "general",
          },
        ]);
        return;
      }

      setMsgs((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.text,
          topic: "general",
          sources: data.sources,
        },
      ]);
    } catch (err) {
      setMsgs((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Bridge offline. AI relay failed.",
          topic: "error",
        },
      ]);
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
            session: sesStatus,
            trades: trades.slice(0, 5),
            stats: { pnl: totalPnl, winRate, pf: stats.pf },
          },
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setBriefing(data.text || "Briefing relay error.");
        return;
      }

      setBriefing(data.text);
    } catch (err) {
      setBriefing("Intel sync failed.");
    } finally {
      setIntelLoading(false);
    }
  };

  const getSignal = async () => {
    if (signalLoading) return;
    setSignalLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "signal",
          message:
            "Analyze current XAUUSD price action for a high-probability SMC setup.",
          context: {
            price: liveGold,
            session: sesStatus.active?.name || "OFF_SESSION",
          },
        }),
      });
      const data = await response.json();
      if (response.ok) setAiSignal(data.text);
    } catch (err) {
      console.error("Signal sync failed.");
    } finally {
      setSignalLoading(false);
    }
  };

  const addTrade = (isBacktest = false) => {
    if (!tf.pnl) return;
    const added = {
      ...tf,
      id: Date.now(),
      result: parseFloat(tf.pnl) >= 0 ? "WIN" : "LOSS",
    };
    if (isBacktest) setBacktests([added, ...backtests]);
    else setTrades([added, ...trades]);
    setTf({
      date: new Date().toISOString().split("T")[0],
      dir: "BUY",
      setup: "OB Sweep",
      pnl: "",
      rr: "2",
      emotion: "Neutral",
      tags: "",
      notes: "",
      rating: 5,
      checklist: [],
    });
  };

  const toggleCheck = (item: string) => {
    setTf((prev) => ({
      ...prev,
      checklist: prev.checklist.includes(item)
        ? prev.checklist.filter((i) => i !== item)
        : [...prev.checklist, item],
    }));
  };

  // --- ANALYTICS ---
  const stats = useMemo(() => {
    const list = trades;
    if (!list.length)
      return {
        pnl: 0,
        winRate: 0,
        pf: 0,
        avgWin: 0,
        avgLoss: 0,
        mdd: 0,
        sessionData: [],
      };
    const pnl = list.reduce((a, b) => a + parseFloat(b.pnl), 0);
    const wins = list
      .filter((t) => parseFloat(t.pnl) > 0)
      .map((t) => parseFloat(t.pnl));
    const losses = list
      .filter((t) => parseFloat(t.pnl) < 0)
      .map((t) => Math.abs(parseFloat(t.pnl)));
    const grossP = wins.reduce((a, b) => a + b, 0);
    const grossL = losses.reduce((a, b) => a + b, 0);

    let peak = 5000,
      bal = 5000,
      mdd = 0;
    [...list].reverse().forEach((t) => {
      bal += parseFloat(t.pnl);
      if (bal > peak) peak = bal;
      if (peak - bal > mdd) mdd = peak - bal;
    });

    const sessionStats: Record<string, { count: number; pnl: number }> = {
      Asian: { count: 0, pnl: 0 },
      London: { count: 0, pnl: 0 },
      "New York": { count: 0, pnl: 0 },
    };

    list.forEach((t) => {
      // For mock logic, we'll assign randomly or based on setup name if time isn't explicitly in the trade object
      // In a real app, 'date' would have time. Here we'll distribute based on setup hash
      const setupIndex = t.setup.charCodeAt(0) % 3;
      const session =
        setupIndex === 0 ? "Asian" : setupIndex === 1 ? "London" : "New York";
      sessionStats[session].count++;
      sessionStats[session].pnl += parseFloat(t.pnl);
    });

    return {
      pnl,
      winRate: Math.round((wins.length / list.length) * 100),
      pf: grossL === 0 ? grossP.toFixed(2) : (grossP / grossL).toFixed(2),
      avgWin: wins.length ? (grossP / wins.length).toFixed(2) : 0,
      avgLoss: losses.length ? (grossL / losses.length).toFixed(2) : 0,
      mdd: mdd.toFixed(2),
      expectancy: (
        (wins.length / list.length) * (grossP / (wins.length || 1)) -
        (losses.length / list.length) * (grossL / (losses.length || 1))
      ).toFixed(2),
      sessionData: Object.entries(sessionStats).map(([name, data]) => ({
        name,
        count: data.count,
        pnl: data.pnl,
      })),
    };
  }, [trades]);

  const totalPnl = stats.pnl;
  const winRate = stats.winRate;
  const targets =
    phase === 1 ? { profit: 400, maxDD: 500 } : { profit: 250, maxDD: 500 };

  const chartData = useMemo(() => {
    let bal = 5000;
    const data = [{ name: "S", bal: 5000 }];
    [...trades].reverse().forEach((t) => {
      bal += parseFloat(t.pnl);
      data.push({ name: t.date, bal });
    });
    return data;
  }, [trades]);

  // Share Card
  const cardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const [shareTrade, setShareTrade] = useState<any>(null);

  const downloadCard = async () => {
    if (!cardRef.current) return;
    const dataUrl = await toPng(cardRef.current);
    const link = document.createElement("a");
    link.download = `JARVIS-TX-${shareTrade.id}.png`;
    link.href = dataUrl;
    link.click();
  };

  const TABS = [
    { id: "dashboard", icon: LayoutDashboard, label: "MATRIX" },
    { id: "analytics", icon: BarChart3, label: "QUANT" },
    { id: "tactical", icon: Zap, label: "TACTICAL" },
    { id: "journal", icon: ClipboardList, label: "LOG" },
    { id: "backtest", icon: History, label: "TEST" },
    { id: "chat", icon: MessageSquare, label: "RELAY" },
    { id: "cheatsheet", icon: Layers, label: "SMC" },
  ];

  return (
    <div
      className="grid-overlay"
      style={{
        height: "100vh",
        background: T.bg,
        fontFamily: "'Outfit', sans-serif",
        display: "flex",
        flexDirection: "column",
        color: T.text,
        overflow: "hidden",
      }}
    >
      {/* HUD HEADER */}
      <header
        style={{
          background: T.surface,
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${T.border}`,
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              border: `2px solid ${T.gold}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Activity size={18} color={T.gold} className="pulse" />
          </div>
          <div>
            <div
              style={{
                fontSize: "16px",
                letterSpacing: "8px",
                color: T.gold,
                fontWeight: 900,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              JARVIS v2.0
            </div>
            <div
              style={{
                fontSize: "9px",
                color: T.textDim,
                letterSpacing: "3px",
              }}
            >
              OPERATOR: MJ | GFT PROTOCOL
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "40px", alignItems: "center" }}>
          <div style={{ textAlign: "right" }}>
            <div
              style={{ fontSize: "10px", color: T.goldDim, letterSpacing: "2px" }}
            >
              XAUUSD · LIVE
            </div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                fontFamily: "'JetBrains Mono', monospace",
                color: T.gold,
              }}
            >
              ${liveGold}
              <span
                style={{
                  fontSize: "10px",
                  color: priceTick >= 0 ? T.green : T.red,
                  marginLeft: "8px",
                }}
              >
                {priceTick >= 0 ? "▲" : "▼"} {Math.abs(priceTick).toFixed(2)}
              </span>
            </div>
          </div>
          <div
            style={{ borderLeft: `1px solid ${T.border}`, paddingLeft: "40px" }}
          >
            <div>
              <div style={{ fontSize: "10px", color: T.goldDim }}>BAL</div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                ${(5000 + totalPnl).toLocaleString()}
              </div>
            </div>
          </div>
          <div
            style={{ borderLeft: `1px solid ${T.border}`, paddingLeft: "40px" }}
          >
            <div style={{ fontSize: "10px", color: T.goldDim }}>WIN%</div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                fontFamily: "'JetBrains Mono', monospace",
                color: T.gold,
              }}
            >
              {winRate}%
            </div>
          </div>
        </div>
      </header>

      {/* SESSIONS */}
      <div
        style={{
          borderBottom: `1px solid ${T.border}`,
          background: T.surface,
          padding: "10px 24px",
          display: "flex",
          gap: "25px",
          overflowX: "auto",
        }}
      >
        {SESSIONS.map((s) => {
          const isActive = sesStatus.active?.name === s.name;
          return (
            <div
              key={s.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                opacity: isActive ? 1 : 0.3,
              }}
            >
              <div
                style={{ width: "8px", height: "8px", background: s.color }}
                className={isActive ? "blink" : ""}
              />
              <span
                style={{
                  fontSize: "11px",
                  color: isActive ? T.text : T.textDim,
                  letterSpacing: "2px",
                  fontWeight: "bold",
                }}
              >
                {s.name.toUpperCase()}
              </span>
              {isActive && (
                <span
                  style={{
                    fontSize: "10px",
                    color: T.goldDim,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {fmtTime(sesStatus.minsLeft)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* NAV */}
        <aside
          style={{
            width: "70px",
            borderRight: `1px solid ${T.border}`,
            background: T.bg,
            display: "flex",
            flexDirection: "column",
            paddingTop: "20px",
          }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                width: "100%",
                padding: "20px 0",
                background: "transparent",
                border: "none",
                color: tab === t.id ? T.gold : T.textFaint,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                position: "relative",
              }}
            >
              {tab === t.id && (
                <motion.div
                  layoutId="activeRail"
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "10px",
                    bottom: "10px",
                    width: "3px",
                    background: T.gold,
                  }}
                />
              )}
              <t.icon size={14} />
              <span
                style={{ fontSize: "8px", letterSpacing: "2px", fontWeight: 700 }}
              >
                {t.label}
              </span>
            </button>
          ))}
        </aside>

        {/* CONTENT */}
        <main
          style={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <AnimatePresence mode="wait">
            {tab === "dashboard" && (
              <motion.div
                key="dash"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ flex: 1, overflowY: "auto", padding: "40px" }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1.5fr",
                    gap: "30px",
                    marginBottom: "30px",
                  }}
                >
                  {/* SYNC STATUS */}
                  <div
                    style={{
                      background: T.surface,
                      border: `1px solid ${T.border}`,
                      padding: "25px",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      className="scanline"
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "2px",
                        background: T.goldFaint,
                        zIndex: 1,
                      }}
                    />
                    <SectionHeader label="NEURAL SYNC" icon={Dna} />
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "20px",
                        marginTop: "20px",
                      }}
                    >
                      <div
                        style={{
                          width: "80px",
                          height: "80px",
                          borderRadius: "50%",
                          border: `2px solid ${T.goldFaint}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          position: "relative",
                        }}
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 10,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          style={{
                            position: "absolute",
                            inset: -4,
                            border: `2px dashed ${T.gold}`,
                            borderRadius: "50%",
                            opacity: 0.3,
                          }}
                        />
                        <div
                          style={{
                            fontSize: "24px",
                            fontWeight: 900,
                            color: T.gold,
                          }}
                        >
                          98%
                        </div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: "10px",
                            color: T.textDim,
                            letterSpacing: "1px",
                            marginBottom: "4px",
                          }}
                        >
                          COGNITIVE ALIGNMENT
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: "bold",
                            color: T.green,
                          }}
                        >
                          OPTIMAL STATE
                        </div>
                        <div
                          style={{
                            fontSize: "9px",
                            color: T.textFaint,
                            marginTop: "8px",
                          }}
                        >
                          Binaural beats active. <br /> Heart Rate: 68 BPM
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ACCOUNT PHASE */}
                  <div
                    style={{
                      background: T.surface,
                      border: `1px solid ${T.border}`,
                      padding: "25px",
                    }}
                  >
                    <SectionHeader label="PHASE STATUS" icon={Layers} />
                    <div style={{ marginTop: "20px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "10px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "11px",
                            color: T.textDim,
                            fontWeight: "bold",
                          }}
                        >
                          FUNDED CHALLENGE: {phase === 1 ? "PHASE 1" : "PHASE 2"}
                        </span>
                        <span style={{ fontSize: "11px", color: T.gold }}>
                          {Math.round((totalPnl / targets.profit) * 100)}%
                        </span>
                      </div>
                      <div
                        style={{
                          height: "6px",
                          background: "#ffffff05",
                          borderRadius: "3px",
                          overflow: "hidden",
                        }}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.min(100, (totalPnl / targets.profit) * 100)}%`,
                          }}
                          style={{ height: "100%", background: T.gold }}
                        />
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "15px",
                          marginTop: "20px",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "8px", color: T.textFaint }}>
                            PROFIT TARGET
                          </div>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: "bold",
                              color: T.gold,
                            }}
                          >
                            ${targets.profit}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: "8px", color: T.textFaint }}>
                            MAX DRAWDOWN
                          </div>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: "bold",
                              color: T.red,
                            }}
                          >
                            -${targets.maxDD}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* JARVIS BRIEFING */}
                  <div
                    style={{
                      background: T.surface,
                      border: `1px solid ${T.gold}20`,
                      padding: "25px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "9px",
                        color: T.gold,
                        letterSpacing: "4px",
                        marginBottom: "10px",
                        fontWeight: 900,
                      }}
                    >
                      JARVIS INTELLIGENCE BRIEF
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        lineHeight: "1.6",
                        color: T.textDim,
                        fontStyle: "italic",
                      }}
                    >
                      "Good afternoon, Operator MJ. London session is currently
                      manipulating Asian highs. I've detected institutional
                      liquidity clusters at 2348.10. Patience is requested."
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.8fr 1fr",
                    gap: "30px",
                  }}
                >
                  {/* MAIN CHART / LIVE FEED */}
                  <div
                    style={{
                      background: T.surface,
                      border: `1px solid ${T.border}`,
                      padding: "30px",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <SectionHeader label="ALPHA PERFORMANCE" icon={TrendingUp} />
                    <div style={{ flex: 1, minHeight: "300px" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient
                              id="colorBal"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor={T.gold}
                                stopOpacity={0.15}
                              />
                              <stop
                                offset="95%"
                                stopColor={T.gold}
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="name" hide />
                          <YAxis
                            hide
                            domain={["dataMin - 100", "dataMax + 100"]}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "#000",
                              border: `1px solid ${T.border}`,
                              color: T.gold,
                            }}
                          />
                          <Area
                            type="stepAfter"
                            dataKey="bal"
                            stroke={T.gold}
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorBal)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* ACTIVE DATA FEED */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "30px",
                    }}
                  >
                    <div
                      style={{
                        background: T.surface,
                        border: `1px solid ${T.border}`,
                        padding: "30px",
                      }}
                    >
                      <SectionHeader label="LIVE MARKET FEED" icon={Activity} />
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "15px",
                        }}
                      >
                        {[
                          "Asian Liquidity Sweep Detected",
                          "H4 FVG Rebalancing In Progress",
                          "Institutional Volume Spike: XAUUSD",
                          "NY Killzone Protocols Armed",
                        ].map((log, i) => (
                          <div
                            key={i}
                            style={{
                              fontSize: "11px",
                              color: i === 0 ? T.green : T.textDim,
                              display: "flex",
                              gap: "10px",
                            }}
                          >
                            <span style={{ color: T.textFaint }}>
                              [{new Date().toLocaleTimeString()}]
                            </span>
                            <span>{log}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div
                      style={{
                        background: T.surface,
                        border: `1px solid ${T.border}`,
                        padding: "30px",
                      }}
                    >
                      <SectionHeader label="RAPID METRICS" icon={History} />
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "20px",
                        }}
                      >
                        <Metric
                          label="Total Alpha"
                          value={`$${totalPnl.toFixed(0)}`}
                          color={totalPnl >= 0 ? T.green : T.red}
                        />
                        <Metric
                          label="Success Rate"
                          value={`${winRate}%`}
                          color={T.gold}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* QUANT */}
            {tab === "analytics" && (
              <motion.div
                key="quant"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ flex: 1, overflowY: "auto", padding: "40px" }}
              >
                <SectionHeader label="POWERFUL ANALYTICS" icon={BarChart3} />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "20px",
                    marginBottom: "40px",
                  }}
                >
                  <StatBox label="PF" value={stats.pf} />
                  <StatBox
                    label="Avg Win"
                    value={`$${stats.avgWin}`}
                    color={T.green}
                  />
                  <StatBox
                    label="Avg Loss"
                    value={`$${stats.avgLoss}`}
                    color={T.red}
                  />
                  <StatBox label="Expectancy" value={`$${stats.expectancy}`} />
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.6fr 1fr",
                    gap: "30px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "30px",
                    }}
                  >
                    <div
                      style={{
                        background: T.surface,
                        border: `1px solid ${T.border}`,
                        padding: "30px",
                      }}
                    >
                      <SectionHeader
                        label="DISTRIBUTION BY SESSION"
                        icon={Clock}
                      />
                      <div style={{ height: "240px" }}>
                        <ResponsiveContainer>
                          <BarChart data={stats.sessionData}>
                            <XAxis
                              dataKey="name"
                              stroke={T.textFaint}
                              fontSize={10}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip
                              contentStyle={{
                                background: "#000",
                                border: `1px solid ${T.border}`,
                              }}
                            />
                            <Bar dataKey="pnl" fill={T.gold}>
                              {stats.sessionData.map(
                                (entry: any, index: number) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={entry.pnl >= 0 ? T.green : T.red}
                                    opacity={0.8}
                                  />
                                ),
                              )}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "40px",
                          marginTop: "20px",
                        }}
                      >
                        {stats.sessionData.map((s: any) => (
                          <div key={s.name}>
                            <div
                              style={{
                                fontSize: "9px",
                                color: T.textFaint,
                                letterSpacing: "1px",
                              }}
                            >
                              {s.name.toUpperCase()}
                            </div>
                            <div
                              style={{
                                fontSize: "16px",
                                fontWeight: "bold",
                                color: s.pnl >= 0 ? T.green : T.red,
                              }}
                            >
                              ${s.pnl.toFixed(0)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div
                      style={{
                        background: T.surface,
                        border: `1px solid ${T.border}`,
                        padding: "30px",
                      }}
                    >
                      <SectionHeader
                        label="PERFORMANCE CALENDAR"
                        icon={Calendar}
                      />
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(7, 1fr)",
                          gap: "8px",
                        }}
                      >
                        {Array.from({ length: 28 }).map((_, i) => {
                          const intensity = Math.random();
                          return (
                            <div
                              key={i}
                              style={{
                                height: "40px",
                                background:
                                  intensity > 0.7
                                    ? T.green
                                    : intensity > 0.4
                                      ? T.goldFaint
                                      : "#ffffff05",
                                border: `1px solid ${T.border}`,
                                opacity: intensity,
                              }}
                            />
                          );
                        })}
                      </div>
                      <div
                        style={{
                          marginTop: "15px",
                          fontSize: "9px",
                          color: T.textFaint,
                          textAlign: "right",
                        }}
                      >
                        LAST 28 SESSIONS NEURAL HEATMAP
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "30px",
                    }}
                  >
                    <div
                      style={{
                        background: T.surface,
                        border: `1px solid ${T.border}`,
                        padding: "30px",
                      }}
                    >
                      <SectionHeader label="EMOTIONAL PROFILE" icon={Smile} />
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "16px",
                        }}
                      >
                        {EMOTIONS.map((e) => {
                          const count = trades.filter(
                            (x) => x.emotion === e.label,
                          ).length;
                          const pct = trades.length
                            ? (count / trades.length) * 100
                            : 0;
                          return (
                            <div key={e.label}>
                              <div
                                style={{
                                  fontSize: "11px",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  marginBottom: "6px",
                                }}
                              >
                                <span
                                  style={{
                                    color: e.color,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                  }}
                                >
                                  <e.icon size={10} /> {e.label}
                                </span>
                                <span style={{ color: T.textDim }}>
                                  {count} trades
                                </span>
                              </div>
                              <div
                                style={{
                                  height: "3px",
                                  background: "#ffffff05",
                                }}
                              >
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  style={{
                                    height: "100%",
                                    background: e.color,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div
                      style={{
                        background: T.surface,
                        border: `1px solid ${T.border}`,
                        padding: "30px",
                      }}
                    >
                      <SectionHeader label="STREAK MONITOR" icon={Zap} />
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "20px",
                        }}
                      >
                        <Metric
                          label="Current Streak"
                          value="3"
                          color={T.green}
                          sub="WINS"
                        />
                        <Metric
                          label="Best Streak"
                          value="8"
                          color={T.gold}
                          sub="WINS"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TACTICAL */}
            {tab === "tactical" && (
              <motion.div
                key="tactical"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ flex: 1, padding: "40px", overflowY: "auto" }}
              >
                <SectionHeader label="TACTICAL COMPUTATIONS" icon={Zap} />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1.5fr",
                    gap: "40px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "25px",
                    }}
                  >
                    <div
                      style={{
                        background: T.surface,
                        border: `1px solid ${T.border}`,
                        padding: "30px",
                      }}
                    >
                      <SectionHeader label="POSITION SIZER" icon={Target} />
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "15px",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: "9px",
                              color: T.textFaint,
                              marginBottom: "5px",
                            }}
                          >
                            BALANCE ($)
                          </div>
                          <input
                            type="number"
                            value={calc.bal}
                            onChange={(e) =>
                              setCalc({
                                ...calc,
                                bal: parseFloat(e.target.value),
                              })
                            }
                            style={{
                              background: "#000",
                              border: `1px solid ${T.border}`,
                              color: "#fff",
                              padding: "12px",
                              width: "100%",
                            }}
                          />
                        </div>
                        <div style={{ display: "flex", gap: "15px" }}>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontSize: "9px",
                                color: T.textFaint,
                                marginBottom: "5px",
                              }}
                            >
                              RISK (%)
                            </div>
                            <input
                              type="number"
                              value={calc.risk}
                              onChange={(e) =>
                                setCalc({
                                  ...calc,
                                  risk: parseFloat(e.target.value),
                                })
                              }
                              style={{
                                background: "#000",
                                border: `1px solid ${T.border}`,
                                color: "#fff",
                                padding: "12px",
                                width: "100%",
                              }}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontSize: "9px",
                                color: T.textFaint,
                                marginBottom: "5px",
                              }}
                            >
                              SL (PIPS/GOLD $)
                            </div>
                            <input
                              type="number"
                              value={calc.sl}
                              onChange={(e) =>
                                setCalc({
                                  ...calc,
                                  sl: parseFloat(e.target.value),
                                })
                              }
                              style={{
                                background: "#000",
                                border: `1px solid ${T.border}`,
                                color: "#fff",
                                padding: "12px",
                                width: "100%",
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          marginTop: "30px",
                          borderTop: `1px solid ${T.border}`,
                          paddingTop: "20px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "10px",
                          }}
                        >
                          <span style={{ fontSize: "11px", color: T.textDim }}>
                            RISK AMOUNT
                          </span>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: "bold",
                              color: T.red,
                            }}
                          >
                            ${posSize.riskAmt.toFixed(2)}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span style={{ fontSize: "11px", color: T.textDim }}>
                            RECOMMENDED LOTS
                          </span>
                          <span
                            style={{
                              fontSize: "24px",
                              fontWeight: "bold",
                              color: T.gold,
                            }}
                          >
                            {posSize.size}
                          </span>
                        </div>
                        <div
                          style={{
                            textAlign: "right",
                            fontSize: "9px",
                            color: T.textFaint,
                          }}
                        >
                          UNITS: {posSize.units}k
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "25px",
                    }}
                  >
                    <div
                      style={{
                        background: T.surface,
                        border: `1px solid ${T.gold}20`,
                        padding: "30px",
                      }}
                    >
                      <SectionHeader label="NEURAL ADVISORY" icon={Cpu} />
                      <div style={{ marginBottom: "20px" }}>
                        <div
                          className="markdown-body"
                          style={{
                            fontSize: "11px",
                            color: T.textDim,
                            lineHeight: "1.6",
                            marginBottom: "20px",
                            background: T.bg,
                            padding: "18px",
                            borderLeft: `2px solid ${T.gold}`,
                            maxHeight: "300px",
                            overflowY: "auto",
                          }}
                        >
                          {aiSignal ? (
                            <Markdown>{aiSignal}</Markdown>
                          ) : (
                            "Sir, initiate market decryption to generate high-probability trade vectors."
                          )}
                        </div>
                        <button
                          onClick={getSignal}
                          disabled={signalLoading}
                          style={{
                            width: "100%",
                            background: T.gold,
                            border: "none",
                            padding: "14px",
                            fontWeight: "bold",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "10px",
                            color: "#000",
                          }}
                        >
                          {signalLoading ? (
                            <Activity size={16} className="blink" />
                          ) : (
                            <Zap size={16} />
                          )}
                          {signalLoading
                            ? "DECRYPTING MATRIX..."
                            : "GENERATE NEURAL SIGNAL"}
                        </button>
                      </div>
                    </div>

                    <div
                      style={{
                        background: T.surface,
                        border: `1px solid ${T.border}`,
                        padding: "30px",
                      }}
                    >
                      <SectionHeader label="MARKET BIAS SCAN" icon={Search} />
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "15px",
                        }}
                      >
                        {[
                          {
                            pair: "XAUUSD",
                            bias: "BULLISH",
                            str: 85,
                            reason: "H4 FVG Rejection",
                          },
                          {
                            pair: "EURUSD",
                            bias: "NEUTRAL",
                            str: 50,
                            reason: "Inside Asian Range",
                          },
                          {
                            pair: "GBPUSD",
                            bias: "BEARISH",
                            str: 72,
                            reason: "Daily Liquidity Sweep",
                          },
                        ].map((b) => (
                          <div
                            key={b.pair}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "12px",
                              background: "#ffffff05",
                              borderLeft: `2px solid ${b.bias === "BULLISH" ? T.green : b.bias === "BEARISH" ? T.red : T.textDim}`,
                            }}
                          >
                            <div>
                              <div
                                style={{ fontSize: "12px", fontWeight: "bold" }}
                              >
                                {b.pair}
                              </div>
                              <div
                                style={{ fontSize: "9px", color: T.textFaint }}
                              >
                                {b.reason}
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div
                                style={{
                                  fontSize: "11px",
                                  fontWeight: "bold",
                                  color:
                                    b.bias === "BULLISH"
                                      ? T.green
                                      : b.bias === "BEARISH"
                                        ? T.red
                                        : T.textDim,
                                }}
                              >
                                {b.bias}
                              </div>
                              <div
                                style={{ fontSize: "9px", color: T.textFaint }}
                              >
                                STRENGTH: {b.str}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* SYSTEM STATUS FOOTER */}
                <div
                  style={{
                    marginTop: "40px",
                    display: "flex",
                    gap: "20px",
                    borderTop: `1px solid ${T.border}`,
                    paddingTop: "20px",
                  }}
                >
                  {[
                    {
                      label: "CORE PROCESSOR",
                      value: "STABLE",
                      color: T.green,
                    },
                    { label: "NEURAL LOAD", value: "24.5%", color: T.gold },
                    { label: "MARKET UPLINK", value: "ACTIVE", color: T.blue },
                    { label: "LATENCY", value: "12ms", color: T.teal },
                  ].map((s) => (
                    <div
                      key={s.label}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <div
                        style={{
                          width: "4px",
                          height: "4px",
                          background: s.color,
                          borderRadius: "50%",
                        }}
                        className="pulse"
                      />
                      <span
                        style={{
                          fontSize: "8px",
                          color: T.textFaint,
                          letterSpacing: "1px",
                        }}
                      >
                        {s.label}:
                      </span>
                      <span
                        style={{
                          fontSize: "9px",
                          color: s.color,
                          fontWeight: "bold",
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {s.value}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* LOG */}
            {tab === "journal" && (
              <motion.div
                key="log"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  flex: 1,
                  display: "flex",
                  padding: "40px",
                  gap: "40px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: "400px",
                    flexShrink: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                    overflowY: "auto",
                    paddingRight: "10px",
                  }}
                >
                  <div
                    style={{
                      background: T.surface,
                      border: `1px solid ${T.border}`,
                      padding: "30px",
                    }}
                  >
                    <SectionHeader label="LOG EXECUTION" icon={Plus} />
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                      }}
                    >
                      <div style={{ display: "flex", gap: "10px" }}>
                        <input
                          type="date"
                          value={tf.date}
                          onChange={(e) =>
                            setTf({ ...tf, date: e.target.value })
                          }
                          style={{
                            background: "#000",
                            border: `1px solid ${T.border}`,
                            color: "#fff",
                            padding: "10px",
                            flex: 1,
                            fontSize: "12px",
                          }}
                        />
                        <select
                          value={tf.dir}
                          onChange={(e) =>
                            setTf({ ...tf, dir: e.target.value })
                          }
                          style={{
                            background: "#000",
                            border: `2px solid ${tf.dir === "BUY" ? T.green : T.red}40`,
                            color: tf.dir === "BUY" ? T.green : T.red,
                            padding: "10px",
                            fontWeight: "bold",
                          }}
                        >
                          <option value="BUY">LONG</option>
                          <option value="SELL">SHORT</option>
                        </select>
                      </div>

                      <div style={{ display: "flex", gap: "10px" }}>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: "9px",
                              color: T.textFaint,
                              marginBottom: "5px",
                            }}
                          >
                            PNL ($)
                          </div>
                          <input
                            placeholder="0.00"
                            type="number"
                            value={tf.pnl}
                            onChange={(e) =>
                              setTf({ ...tf, pnl: e.target.value })
                            }
                            style={{
                              background: "#000",
                              border: `1px solid ${T.border}`,
                              color: "#fff",
                              padding: "10px",
                              width: "100%",
                            }}
                          />
                        </div>
                        <div style={{ width: "100px" }}>
                          <div
                            style={{
                              fontSize: "9px",
                              color: T.textFaint,
                              marginBottom: "5px",
                            }}
                          >
                            R:R
                          </div>
                          <input
                            placeholder="2.0"
                            value={tf.rr}
                            onChange={(e) =>
                              setTf({ ...tf, rr: e.target.value })
                            }
                            style={{
                              background: "#000",
                              border: `1px solid ${T.border}`,
                              color: "#fff",
                              padding: "10px",
                              width: "100%",
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            fontSize: "9px",
                            color: T.textFaint,
                            marginBottom: "8px",
                          }}
                        >
                          PRE-TRADE CHECKLIST
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}
                        >
                          {PRE_TRADE_CHECKLIST.map((item) => (
                            <label
                              key={item}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                cursor: "pointer",
                                padding: "8px",
                                background: "#ffffff05",
                                fontSize: "11px",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={tf.checklist.includes(item)}
                                onChange={() => toggleCheck(item)}
                                style={{ accentColor: T.gold }}
                              />
                              <span
                                style={{
                                  opacity: tf.checklist.includes(item)
                                    ? 1
                                    : 0.5,
                                }}
                              >
                                {item}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "10px" }}>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: "9px",
                              color: T.textFaint,
                              marginBottom: "5px",
                            }}
                          >
                            EMOTION
                          </div>
                          <select
                            value={tf.emotion}
                            onChange={(e) =>
                              setTf({ ...tf, emotion: e.target.value })
                            }
                            style={{
                              background: "#000",
                              border: `1px solid ${T.border}`,
                              color: "#fff",
                              padding: "10px",
                              width: "100%",
                              fontSize: "12px",
                            }}
                          >
                            {EMOTIONS.map((e) => (
                              <option key={e.label} value={e.label}>
                                {e.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div style={{ width: "80px" }}>
                          <div
                            style={{
                              fontSize: "9px",
                              color: T.textFaint,
                              marginBottom: "5px",
                            }}
                          >
                            RATING
                          </div>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={tf.rating}
                            onChange={(e) =>
                              setTf({
                                ...tf,
                                rating: parseInt(e.target.value) || 0,
                              })
                            }
                            style={{
                              background: "#000",
                              border: `1px solid ${T.border}`,
                              color: "#fff",
                              padding: "10px",
                              width: "100%",
                            }}
                          />
                        </div>
                      </div>
                      <textarea
                        placeholder="Trade notes / entry logic summary..."
                        value={tf.notes}
                        onChange={(e) =>
                          setTf({ ...tf, notes: e.target.value })
                        }
                        style={{
                          background: "#000",
                          border: `1px solid ${T.border}`,
                          color: "#fff",
                          padding: "10px",
                          height: "80px",
                          resize: "none",
                          fontSize: "12px",
                        }}
                      />
                      <input
                        placeholder="Tags (e.g. news, highvol, lowrisk)"
                        value={tf.tags}
                        onChange={(e) => setTf({ ...tf, tags: e.target.value })}
                        style={{
                          background: "#000",
                          border: `1px solid ${T.border}`,
                          color: "#fff",
                          padding: "10px",
                          fontSize: "12px",
                        }}
                      />

                      <button
                        onClick={() => addTrade()}
                        style={{
                          background: T.gold,
                          border: "none",
                          color: "#000",
                          padding: "14px",
                          fontWeight: "bold",
                          cursor: "pointer",
                          marginTop: "10px",
                        }}
                      >
                        EXECUTE LOG SEQUENCE
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    flex: 1,
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    padding: "30px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <SectionHeader label="EXECUTION ARCHIVE" icon={Dna} />
                  <div style={{ flex: 1, overflowY: "auto" }}>
                    {trades.length === 0 && (
                      <div
                        style={{
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: T.textFaint,
                          fontSize: "12px",
                          border: `1px dashed ${T.border}`,
                        }}
                      >
                        No archive data found.
                      </div>
                    )}
                    {trades.map((t) => (
                      <div
                        key={t.id}
                        style={{
                          display: "flex",
                          gap: "20px",
                          padding: "20px 0",
                          borderBottom: `1px solid ${T.border}`,
                        }}
                      >
                        <div
                          style={{
                            width: "50px",
                            height: "50px",
                            background: T.bg,
                            border: `1px solid ${t.pnl >= 0 ? T.green : T.red}40`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexDirection: "column",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: "bold",
                              color: t.pnl >= 0 ? T.green : T.red,
                            }}
                          >
                            {t.pnl >= 0 ? "W" : "L"}
                          </span>
                          <span style={{ fontSize: "8px", color: T.textDim }}>
                            {t.rating}/10
                          </span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: "5px",
                            }}
                          >
                            <div
                              style={{ fontSize: "13px", fontWeight: "bold" }}
                            >
                              XAUUSD · {t.dir} · {t.setup}
                            </div>
                            <div
                              style={{
                                fontSize: "18px",
                                fontWeight: "bold",
                                color: parseFloat(t.pnl) >= 0 ? T.green : T.red,
                              }}
                            >
                              {parseFloat(t.pnl) >= 0 ? "+" : ""}${t.pnl}
                            </div>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: "10px",
                              alignItems: "center",
                              marginBottom: "8px",
                            }}
                          >
                            <span
                              style={{ fontSize: "10px", color: T.textDim }}
                            >
                              {t.date}
                            </span>
                            <span
                              style={{
                                fontSize: "10px",
                                background: "#ffffff08",
                                padding: "2px 6px",
                                color: T.gold,
                              }}
                            >
                              RR 1:{t.rr}
                            </span>
                            <span
                              style={{
                                fontSize: "10px",
                                background: "#ffffff08",
                                padding: "2px 6px",
                                color: T.blue,
                              }}
                            >
                              {t.emotion}
                            </span>
                            {t.tags &&
                              t.tags.split(",").map((tag: string) => (
                                <span
                                  key={tag}
                                  style={{
                                    fontSize: "10px",
                                    background: "#ffffff05",
                                    padding: "2px 6px",
                                    color: T.teal,
                                  }}
                                >
                                  #{tag.trim()}
                                </span>
                              ))}
                          </div>
                          {t.notes && (
                            <div
                              style={{
                                fontSize: "11px",
                                color: T.textDim,
                                fontStyle: "italic",
                                lineHeight: "1.5",
                              }}
                            >
                              "{t.notes}"
                            </div>
                          )}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: "15px",
                            alignItems: "start",
                          }}
                        >
                          <button
                            onClick={() => {
                              setShareTrade(t);
                              setSharing(true);
                            }}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: T.gold,
                              cursor: "pointer",
                              padding: "5px",
                            }}
                          >
                            <Share2 size={14} />
                          </button>
                          <button
                            onClick={() =>
                              setTrades(trades.filter((x) => x.id !== t.id))
                            }
                            style={{
                              background: "transparent",
                              border: "none",
                              color: T.red,
                              cursor: "pointer",
                              opacity: 0.3,
                              padding: "5px",
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TEST */}
            {tab === "backtest" && (
              <motion.div
                key="test"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  flex: 1,
                  padding: "40px",
                  display: "flex",
                  gap: "40px",
                }}
              >
                <div style={{ width: "400px", flexShrink: 0 }}>
                  <div
                    style={{
                      background: T.surface,
                      border: `1px solid ${T.border}`,
                      padding: "30px",
                    }}
                  >
                    <SectionHeader label="SIMULATION PROTOCOL" icon={History} />
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "9px",
                            color: T.textFaint,
                            marginBottom: "5px",
                          }}
                        >
                          STRATEGY
                        </div>
                        <select
                          style={{
                            background: "#000",
                            border: `1px solid ${T.border}`,
                            color: "#fff",
                            padding: "10px",
                            width: "100%",
                          }}
                        >
                          {BACKTEST_STRATEGIES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: "9px",
                              color: T.textFaint,
                              marginBottom: "5px",
                            }}
                          >
                            RESULT ($)
                          </div>
                          <input
                            placeholder="0.00"
                            type="number"
                            value={tf.pnl}
                            onChange={(e) =>
                              setTf({ ...tf, pnl: e.target.value })
                            }
                            style={{
                              background: "#000",
                              border: `1px solid ${T.border}`,
                              color: "#fff",
                              padding: "10px",
                              width: "100%",
                            }}
                          />
                        </div>
                        <div style={{ width: "100px" }}>
                          <div
                            style={{
                              fontSize: "9px",
                              color: T.textFaint,
                              marginBottom: "5px",
                            }}
                          >
                            R:R
                          </div>
                          <input
                            placeholder="2.0"
                            value={tf.rr}
                            onChange={(e) =>
                              setTf({ ...tf, rr: e.target.value })
                            }
                            style={{
                              background: "#000",
                              border: `1px solid ${T.border}`,
                              color: "#fff",
                              padding: "10px",
                              width: "100%",
                            }}
                          />
                        </div>
                      </div>
                      <textarea
                        placeholder="Observation / what went wrong?"
                        style={{
                          background: "#000",
                          border: `1px solid ${T.border}`,
                          color: "#fff",
                          padding: "10px",
                          height: "80px",
                          resize: "none",
                        }}
                      />
                      <button
                        onClick={() => addTrade(true)}
                        style={{
                          background: T.blue,
                          border: "none",
                          color: "#000",
                          padding: "14px",
                          fontWeight: "bold",
                          cursor: "pointer",
                        }}
                      >
                        COMMIT SIMULATION
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: "30px",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "20px",
                    }}
                  >
                    <StatBox label="Sample Size" value={backtests.length} />
                    <StatBox
                      label="Success Rate"
                      value={`${backtests.length ? Math.round((backtests.filter((x) => parseFloat(x.pnl) > 0).length / backtests.length) * 100) : 0}%`}
                      color={T.blue}
                    />
                    <StatBox
                      label="Total Alpha"
                      value={`$${backtests.reduce((a, b) => a + parseFloat(b.pnl), 0).toFixed(0)}`}
                      color={T.gold}
                    />
                  </div>
                  <div
                    style={{
                      background: T.surface,
                      border: `1px solid ${T.border}`,
                      padding: "30px",
                      flex: 1,
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <SectionHeader label="COGNITIVE ANALYSIS" icon={Cpu} />
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          padding: "12px",
                          background: "#ffffff05",
                          borderLeft: `2px solid ${T.gold}`,
                        }}
                      >
                        <div
                          style={{
                            fontSize: "10px",
                            color: T.gold,
                            fontWeight: "bold",
                            marginBottom: "4px",
                          }}
                        >
                          STREAK OVERVIEW
                        </div>
                        <div style={{ fontSize: "11px", color: T.textDim }}>
                          Sir, current streak is 3. Mathematical probability
                          suggests continuation if London Liquidity is
                          respected.
                        </div>
                      </div>
                      <div
                        style={{
                          padding: "12px",
                          background: "#ffffff05",
                          borderLeft: `2px solid ${stats.winRate > 60 ? T.green : T.red}`,
                        }}
                      >
                        <div
                          style={{
                            fontSize: "10px",
                            color: stats.winRate > 60 ? T.green : T.red,
                            fontWeight: "bold",
                            marginBottom: "4px",
                          }}
                        >
                          EFFICIENCY PROTOCOL
                        </div>
                        <div style={{ fontSize: "11px", color: T.textDim }}>
                          Yield efficiency at {stats.pf} PF. Neutralizing losses
                          during Asian session is recommended.
                        </div>
                      </div>
                      <div
                        style={{
                          padding: "12px",
                          background: "#ffffff05",
                          borderLeft: `2px solid ${T.blue}`,
                        }}
                      >
                        <div
                          style={{
                            fontSize: "10px",
                            color: T.blue,
                            fontWeight: "bold",
                            marginBottom: "4px",
                          }}
                        >
                          SMC SIGNAL SYNC
                        </div>
                        <div style={{ fontSize: "11px", color: T.textDim }}>
                          OB Rejection confirmed on H1. M1 Shift pending for NY
                          entry.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      background: T.surface,
                      border: `1px solid ${T.border}`,
                      padding: "30px",
                      flex: 1,
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <SectionHeader label="BACKTEST CHRONICLES" icon={History} />
                    <div style={{ flex: 1, overflowY: "auto" }}>
                      {backtests.map((bt) => (
                        <div
                          key={bt.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "15px 0",
                            borderBottom: `1px solid #ffffff05`,
                          }}
                        >
                          <div style={{ fontSize: "11px" }}>
                            <div style={{ fontWeight: "bold", color: T.blue }}>
                              {bt.setup}
                            </div>
                            <div style={{ color: T.textDim }}>
                              RR 1:{bt.rr} ·{" "}
                              {new Date(bt.id).toLocaleDateString()}
                            </div>
                          </div>
                          <div
                            style={{
                              fontSize: "16px",
                              fontWeight: "bold",
                              color: parseFloat(bt.pnl) >= 0 ? T.green : T.red,
                            }}
                          >
                            {parseFloat(bt.pnl) >= 0 ? "+" : ""}${bt.pnl}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* RELAY */}
            {tab === "chat" && (
              <motion.div
                key="chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ flex: 1, display: "flex", flexDirection: "column" }}
              >
                <div style={{ flex: 1, overflowY: "auto", padding: "40px" }}>
                  {msgs.map((m, i) => (
                    <div
                      key={i}
                      style={{
                        marginBottom: "25px",
                        textAlign: m.role === "user" ? "right" : "left",
                      }}
                    >
                      <div
                        style={{
                          display: "inline-block",
                          maxWidth: "80%",
                          padding: "15px 20px",
                          background:
                            m.role === "user" ? T.goldFaint : T.surface,
                          border: `1px solid ${T.border}`,
                          color: m.role === "user" ? T.gold : T.text,
                          fontSize: "14px",
                          lineHeight: "1.6",
                        }}
                      >
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div style={{ fontSize: "11px", color: T.goldDim }}>
                      JARVIS SYNCING...
                    </div>
                  )}
                </div>
                <div
                  style={{
                    padding: "30px 40px",
                    borderTop: `1px solid ${T.border}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      marginBottom: "15px",
                    }}
                  >
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        style={{
                          background: "transparent",
                          border: `1px solid ${T.border}`,
                          color: T.textFaint,
                          fontSize: "9px",
                          padding: "5px 10px",
                          cursor: "pointer",
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <div
                    style={{
                      background: T.surface,
                      border: `1px solid ${T.border}`,
                      padding: "10px",
                      display: "flex",
                      gap: "15px",
                    }}
                  >
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && send()}
                      placeholder="Relay alpha request..."
                      style={{
                        flex: 1,
                        background: "transparent",
                        border: "none",
                        color: "#fff",
                        outline: "none",
                        padding: "10px",
                      }}
                    />
                    <button
                      onClick={() => send()}
                      style={{
                        background: T.gold,
                        border: "none",
                        color: "#000",
                        padding: "10px 20px",
                        fontWeight: "bold",
                        cursor: "pointer",
                      }}
                    >
                      EXECUTE
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SMC */}
            {tab === "cheatsheet" && (
              <motion.div
                key="smc"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ flex: 1, overflowY: "auto", padding: "40px" }}
              >
                <SectionHeader label="SMC BLUEPRINTS" icon={Dna} />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "25px",
                  }}
                >
                  {SMC_DATA.map((item, i) => (
                    <div
                      key={i}
                      onClick={() =>
                        setExpandedSMC(expandedSMC === i ? null : i)
                      }
                      style={{
                        background: T.surface,
                        border: `1px solid ${T.border}`,
                        padding: "20px",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontWeight: "bold", color: item.color }}>
                        {item.title}
                      </div>
                      {expandedSMC === i && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          style={{ overflow: "hidden", marginTop: "15px" }}
                        >
                          {item.points.map((p) => (
                            <div
                              key={p}
                              style={{
                                fontSize: "11px",
                                color: T.textDim,
                                marginBottom: "5px",
                              }}
                            >
                              {p}
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* SHARE CARD */}
      <AnimatePresence>
        {sharing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.9)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "20px",
              }}
            >
              <div
                ref={cardRef}
                style={{
                  width: "350px",
                  background: T.bg,
                  border: `3px solid ${T.gold}`,
                  padding: "40px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "10px",
                    color: T.gold,
                    letterSpacing: "5px",
                    marginBottom: "20px",
                  }}
                >
                  JARVIS v2.0
                </div>
                <div
                  style={{
                    fontSize: "20px",
                    color: T.textFaint,
                    marginBottom: "10px",
                  }}
                >
                  EXEC_LOG: {shareTrade?.date}
                </div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "bold",
                    marginBottom: "5px",
                  }}
                >
                  XAUUSD · {shareTrade?.setup}
                </div>
                <div
                  style={{
                    fontSize: "42px",
                    fontWeight: "900",
                    color: shareTrade?.pnl >= 0 ? T.green : T.red,
                    margin: "30px 0",
                  }}
                >
                  {shareTrade?.pnl >= 0 ? "+" : ""}${shareTrade?.pnl}
                </div>
                <div style={{ fontSize: "11px", color: T.textDim }}>
                  RR 1:{shareTrade?.rr} · {shareTrade?.emotion}
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={downloadCard}
                  style={{
                    background: T.gold,
                    border: "none",
                    color: "#000",
                    padding: "10px 20px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  SAVE IMAGE
                </button>
                <button
                  onClick={() => setSharing(false)}
                  style={{
                    background: "transparent",
                    border: `1px solid ${T.border}`,
                    color: "#fff",
                    padding: "10px 20px",
                    cursor: "pointer",
                  }}
                >
                  CLOSE
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .pulse { animation: p 2.5s infinite; }
        .blink { animation: b 1.8s infinite; }
        @keyframes p { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        @keyframes b { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }
        * { scrollbar-width: none; }
        ::-webkit-scrollbar { display: none; }
      `,
        }}
      />
    </div>
  );
}
