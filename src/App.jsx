import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "./supabase";

// ── Mobile hook ──
function useMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

const STD_CATEGORIES = ["Food", "Transport", "School", "Entertainment", "Savings"];
const STD_COLORS = {
  Food: "#C8A96E", Transport: "#8B7FD4", School: "#7BAF8E",
  Entertainment: "#C47A6A", Savings: "#D4B878",
};
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const CUSTOM_PALETTE = ["#C47A6A","#8B7FD4","#7BAF8E","#C8A96E","#6B9BBF","#B87FAE","#7FAF9A","#D4956A","#9BAF6E","#AF7FA4"];
const CURRENCIES = ["₱","$","€","£","¥","₩","₹","฿","₫","Rp"];

function uid() { return Math.random().toString(36).slice(2, 9); }
function todayStr() { return new Date().toISOString().split("T")[0]; }
function getMonthKey(date) {
  const d = new Date(date);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}
function monthLabel(key) {
  const [y, m] = key.split("-");
  return MONTHS[parseInt(m) - 1] + " " + y;
}
function currentMonthKey() {
  const n = new Date();
  return n.getFullYear() + "-" + String(n.getMonth() + 1).padStart(2, "0");
}
function displayCategory(cat) {
  if (!cat) return cat;
  if (cat.startsWith("Other:")) return cat.slice(6).trim();
  return cat;
}
function getInitials(name) {
  return name.slice(0, 2).toUpperCase();
}
function hashColor(str) {
  const palette = ["#C8A96E","#8B7FD4","#7BAF8E","#C47A6A","#6B9BBF","#B87FAE","#D4B878","#D4956A"];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

const dark = {
  bg: "linear-gradient(160deg, #0f0f1a 0%, #1a1225 45%, #0a0a14 100%)",
  glass: "rgba(200,190,255,0.04)", glassBorder: "rgba(200,190,255,0.10)",
  text: "#EDE8DC", textSub: "rgba(237,232,220,0.6)", textMuted: "rgba(237,232,220,0.32)",
  accent: "#C8A96E", accentSoft: "rgba(200,169,110,0.12)",
  red: "#C47A6A", green: "#7BAF8E", yellow: "#D4B878", indigo: "#8B7FD4", cream: "#EDE8DC",
  inputBg: "rgba(200,190,255,0.04)", navBg: "rgba(10,8,20,0.88)", tooltipBg: "rgba(10,8,20,0.97)",
  cardHover: "rgba(200,190,255,0.07)",
};
const light = {
  bg: "linear-gradient(160deg, #f5f0e8 0%, #ede5d5 45%, #f8f3ea 100%)",
  glass: "rgba(120,90,40,0.05)", glassBorder: "rgba(120,90,40,0.14)",
  text: "#2C2416", textSub: "rgba(44,36,22,0.65)", textMuted: "rgba(44,36,22,0.38)",
  accent: "#8B5E20", accentSoft: "rgba(139,94,32,0.1)",
  red: "#B85042", green: "#4A8C62", yellow: "#9A7A20", indigo: "#5B4FB5", cream: "#2C2416",
  inputBg: "rgba(255,250,240,0.85)", navBg: "rgba(240,230,210,0.93)", tooltipBg: "rgba(245,240,232,0.98)",
  cardHover: "rgba(120,90,40,0.08)",
};

// ─────────────────────────────────────────────
// PROFILE SELECTOR SCREEN
// ─────────────────────────────────────────────
function ProfileScreen({ onSelect, isDark, setIsDark }) {
  const isMobile = useMobile();
  const G = isDark ? dark : light;
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newCurrency, setNewCurrency] = useState("₱");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("profiles").select("*").order("created_at", { ascending: true })
      .then(({ data }) => { if (data) setProfiles(data); setLoading(false); });
  }, []);

  async function createProfile() {
    if (!newUsername.trim()) return setError("Please enter a username.");
    const username = newUsername.trim(); // case-sensitive, keep as-is
    const exists = profiles.some(p => p.username === username);
    if (exists) return setError(`"${username}" already exists. Usernames are case-sensitive.`);
    setSaving(true);
    const { error: err } = await supabase.from("profiles").insert({ username, currency: newCurrency });
    if (err) { setError("Error: " + err.message); setSaving(false); return; }
    const newProfile = { username, currency: newCurrency };
    setProfiles(s => [...s, newProfile]);
    setCreating(false);
    setNewUsername(""); setNewCurrency("₱"); setError("");
    setSaving(false);
    onSelect(newProfile);
  }

  const glassStyle = (extra = {}) => ({
    background: G.glass, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    border: `1px solid ${G.glassBorder}`, borderRadius: 16, ...extra,
  });

  const inputSt = {
    width: "100%", padding: "11px 14px", borderRadius: 11,
    border: `1px solid ${G.glassBorder}`, background: G.inputBg,
    color: G.text, fontSize: 15, outline: "none",
    fontFamily: "'EB Garamond', Georgia, serif",
  };

  return (
    <div style={{ minHeight: "100vh", width: "100vw", background: G.bg, fontFamily: "'EB Garamond', Georgia, serif", color: G.text, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: isMobile ? "24px 16px" : "40px 24px", boxSizing: "border-box", transition: "background 0.3s, color 0.3s" }}>
      {/* Blobs */}
      <div style={{ position: "fixed", top: -80, left: -60, width: 300, height: 300, borderRadius: "50%", background: isDark ? "rgba(139,127,212,0.08)" : "rgba(139,94,32,0.06)", filter: "blur(90px)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -60, right: -40, width: 260, height: 260, borderRadius: "50%", background: isDark ? "rgba(200,169,110,0.07)" : "rgba(200,169,110,0.09)", filter: "blur(80px)", pointerEvents: "none" }} />

      {/* Theme toggle top-right */}
      <div style={{ position: "fixed", top: 20, right: 20 }}>
        <button className="theme-toggle" onClick={() => setIsDark(d => !d)} style={{ background: isDark ? "rgba(139,127,212,0.25)" : "rgba(139,94,32,0.2)" }} />
      </div>

      <div style={{ width: "100%", maxWidth: isMobile ? "100%" : 480, position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: G.textMuted, textTransform: "uppercase", marginBottom: 8 }}>Budget Tracker</div>
          <div style={{ fontSize: isMobile ? 28 : 34, fontWeight: 700, color: G.cream, letterSpacing: -1, marginBottom: 8 }}>Who's budgeting?</div>
          <div style={{ fontSize: 14, color: G.textMuted }}>Select a profile to continue</div>
        </div>

        {/* Profile cards */}
        {loading ? (
          <div style={{ textAlign: "center", color: G.textMuted, padding: "32px 0" }}>Loading profiles...</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {profiles.map(p => {
              const avatarColor = hashColor(p.username);
              return (
                <button key={p.username} onClick={() => onSelect(p)} style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "16px 18px",
                  background: G.glass, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                  border: `1px solid ${G.glassBorder}`, borderRadius: 14,
                  color: G.text, cursor: "pointer", fontFamily: "inherit",
                  textAlign: "left", width: "100%", transition: "all 0.18s",
                }}>
                  {/* Avatar */}
                  <div style={{ width: 46, height: 46, borderRadius: 13, background: `${avatarColor}25`, border: `2px solid ${avatarColor}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: avatarColor, flexShrink: 0 }}>
                    {getInitials(p.username)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{p.username}</div>
                    <div style={{ fontSize: 12, color: G.textMuted, marginTop: 2 }}>Currency: {p.currency}</div>
                  </div>
                  <div style={{ fontSize: 18, color: G.textMuted }}>→</div>
                </button>
              );
            })}
          </div>
        )}

        {/* Create new profile */}
        {!creating ? (
          <button onClick={() => setCreating(true)} style={{
            width: "100%", padding: "14px", borderRadius: 14,
            background: G.accentSoft, border: `1px solid ${G.accent}40`,
            color: G.accent, fontSize: 15, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <span style={{ fontSize: 20, lineHeight: 1 }}>+</span> New Profile
          </button>
        ) : (
          <div style={glassStyle({ padding: "22px" })}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: G.cream }}>Create Profile</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 10, color: G.textMuted, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Username</label>
                <input
                  style={inputSt}
                  type="text"
                  placeholder="e.g. Kieffer"
                  value={newUsername}
                  onChange={e => { setNewUsername(e.target.value); setError(""); }}
                  autoFocus
                  onKeyDown={e => e.key === "Enter" && createProfile()}
                />
                <div style={{ fontSize: 11, color: G.textMuted, marginTop: 5 }}>⚠ Case-sensitive — "Kieffer" and "kieffer" are different profiles</div>
              </div>

              <div>
                <label style={{ fontSize: 10, color: G.textMuted, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Currency</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {CURRENCIES.map(c => (
                    <button key={c} onClick={() => setNewCurrency(c)} style={{
                      padding: "7px 14px", borderRadius: 9, fontSize: 14, fontWeight: 600,
                      border: `1px solid ${newCurrency === c ? G.accent : G.glassBorder}`,
                      background: newCurrency === c ? G.accentSoft : "transparent",
                      color: newCurrency === c ? G.accent : G.textMuted,
                      cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                    }}>{c}</button>
                  ))}
                </div>
              </div>

              {error && <div style={{ fontSize: 12, color: G.red, padding: "8px 12px", background: `${G.red}12`, borderRadius: 8 }}>{error}</div>}

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button onClick={() => { setCreating(false); setNewUsername(""); setError(""); }} style={{ flex: 1, padding: "11px", borderRadius: 11, background: "transparent", border: `1px solid ${G.glassBorder}`, color: G.textMuted, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                <button onClick={createProfile} disabled={saving} style={{ flex: 2, padding: "11px", borderRadius: 11, background: G.accentSoft, border: `1px solid ${G.accent}50`, color: G.accent, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  {saving ? "Creating..." : "Create Profile"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
export default function App() {
  const isMobile = useMobile();
  const [isDark, setIsDark] = useState(true);
  const [activeProfile, setActiveProfile] = useState(null); // { username, currency }
  const G = isDark ? dark : light;

  // All data states
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [wallet, setWallet] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [loading, setLoading] = useState(false);

  const [tab, setTab] = useState("overview");
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());

  // Forms
  const [incAmount, setIncAmount] = useState("");
  const [incDate, setIncDate] = useState(todayStr());
  const [incNote, setIncNote] = useState("");

  const [expAmount, setExpAmount] = useState("");
  const [expCat, setExpCat] = useState("Food");
  const [expOtherLabel, setExpOtherLabel] = useState("");
  const [expDesc, setExpDesc] = useState("");
  const [expDate, setExpDate] = useState(todayStr());

  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalAddId, setGoalAddId] = useState("");
  const [goalAddAmt, setGoalAddAmt] = useState("");

  const [walletDesc, setWalletDesc] = useState("");
  const [walletAmt, setWalletAmt] = useState("");
  const [walletType, setWalletType] = useState("add");
  const [walletDate, setWalletDate] = useState(todayStr());

  const [budgetCatType, setBudgetCatType] = useState("standard");
  const [budgetStdCat, setBudgetStdCat] = useState("Food");
  const [budgetCustomName, setBudgetCustomName] = useState("");
  const [budgetAmt, setBudgetAmt] = useState("");

  const CUR = activeProfile?.currency || "₱";

  useEffect(() => {
    document.documentElement.classList.toggle("light", !isDark);
  }, [isDark]);

  // Load data whenever profile changes
  useEffect(() => {
    if (!activeProfile) return;
    async function loadAll() {
      setLoading(true);
      const p = activeProfile.username;
      const [txRes, goalsRes, walletRes, budgetsRes] = await Promise.all([
        supabase.from("transactions").select("*").eq("profile", p).order("date", { ascending: false }),
        supabase.from("goals").select("*").eq("profile", p).order("created_at", { ascending: true }),
        supabase.from("wallet").select("*").eq("profile", p).order("date", { ascending: false }),
        supabase.from("budgets").select("*").eq("profile", p),
      ]);
      if (txRes.data) setTransactions(txRes.data);
      if (goalsRes.data) setGoals(goalsRes.data);
      if (walletRes.data) setWallet(walletRes.data);
      if (budgetsRes.data) {
        const map = {};
        budgetsRes.data.forEach(b => {
          map[b.category] = { amount: b.amount, color: b.color || STD_COLORS[b.category] || "#8B7FD4", isCustom: b.is_custom || false };
        });
        setBudgets(map);
      }
      setLoading(false);
    }
    loadAll();
    setTab("overview");
    setSelectedMonth(currentMonthKey());
  }, [activeProfile]);

  function switchProfile() {
    setActiveProfile(null);
    setTransactions([]); setGoals([]); setWallet([]); setBudgets({});
  }

  // ── Derived ──
  const customCats = Object.entries(budgets).filter(([,v]) => v.isCustom).map(([k,v]) => ({ name: k, ...v }));
  const allExpenseCategories = [...STD_CATEGORIES, ...customCats.map(c => c.name), "Other"];

  const allMonths = () => {
    const keys = new Set(transactions.map(t => getMonthKey(t.date)));
    keys.add(currentMonthKey());
    return [...keys].sort();
  };

  const txForMonth = key => transactions.filter(t => getMonthKey(t.date) === key);
  const income = txForMonth(selectedMonth).filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = txForMonth(selectedMonth).filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = income - expenses;
  const pct = income > 0 ? Math.min(100, Math.round((expenses / income) * 100)) : 0;
  const balColor = balance < 0 ? G.red : balance < income * 0.1 ? G.yellow : G.green;

  const catSpending = () => {
    const map = {};
    txForMonth(selectedMonth).filter(t => t.type === "expense").forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return map;
  };

  const catBudgetData = () => {
    const spending = catSpending();
    const rows = [];
    STD_CATEGORIES.forEach(cat => {
      const b = budgets[cat];
      const budget = b?.amount || 0;
      const spent = spending[cat] || 0;
      if (budget === 0 && spent === 0) return;
      const remaining = budget - spent;
      const p = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
      rows.push({ cat, displayCat: cat, budget, spent, remaining, p, color: STD_COLORS[cat] || G.accent });
    });
    customCats.forEach(c => {
      const budget = c.amount || 0;
      const directSpent = spending[c.name] || 0;
      const otherKey = Object.keys(spending).find(k => k.startsWith("Other:") && k.slice(6).trim().toLowerCase() === c.name.toLowerCase());
      const spent = directSpent + (otherKey ? spending[otherKey] : 0);
      if (budget === 0 && spent === 0) return;
      const remaining = budget - spent;
      const p = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
      rows.push({ cat: c.name, displayCat: c.name, budget, spent, remaining, p, color: c.color });
    });
    Object.keys(spending).filter(k => k.startsWith("Other:")).forEach(k => {
      const label = k.slice(6).trim();
      if (customCats.some(c => c.name.toLowerCase() === label.toLowerCase())) return;
      rows.push({ cat: k, displayCat: label, budget: 0, spent: spending[k], remaining: 0, p: 0, color: G.indigo });
    });
    return rows;
  };

  const chartData = () => allMonths().slice(-6).map(m => ({
    month: monthLabel(m).split(" ")[0],
    Income: txForMonth(m).filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0),
    Expenses: txForMonth(m).filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0),
  }));

  const walletBalance = wallet.reduce((s, w) => w.type === "add" ? s + w.amount : s - w.amount, 0);

  // ── CRUD ──
  const P = activeProfile?.username;

  async function addIncome() {
    if (!incAmount || !incDate) return alert("Enter amount and date.");
    const tx = { id: uid(), type: "income", amount: parseFloat(incAmount), date: incDate, description: incNote || "Allowance", category: "Income", profile: P };
    const { error } = await supabase.from("transactions").insert(tx);
    if (error) return alert("Error: " + error.message);
    setTransactions(s => [tx, ...s]);
    setIncAmount(""); setIncNote("");
  }

  async function addExpense() {
    if (!expAmount || !expDate) return alert("Enter amount and date.");
    if (expCat === "Other" && !expOtherLabel.trim()) return alert("Please specify what this expense is.");
    let category = expCat;
    if (expCat === "Other") {
      const matchedCustom = customCats.find(c => c.name.toLowerCase() === expOtherLabel.trim().toLowerCase());
      category = matchedCustom ? matchedCustom.name : `Other:${expOtherLabel.trim()}`;
    }
    const tx = { id: uid(), type: "expense", amount: parseFloat(expAmount), date: expDate, description: expDesc || displayCategory(category), category, profile: P };
    const { error } = await supabase.from("transactions").insert(tx);
    if (error) return alert("Error: " + error.message);
    setTransactions(s => [tx, ...s]);
    setExpAmount(""); setExpDesc(""); setExpOtherLabel("");
  }

  async function saveBudget() {
    if (!budgetAmt) return alert("Enter a budget amount.");
    let catKey, isCustom, color;
    if (budgetCatType === "standard") {
      catKey = budgetStdCat; isCustom = false; color = STD_COLORS[budgetStdCat];
    } else {
      if (!budgetCustomName.trim()) return alert("Enter a category name.");
      catKey = budgetCustomName.trim(); isCustom = true;
      color = budgets[catKey]?.color || CUSTOM_PALETTE[customCats.length % CUSTOM_PALETTE.length];
    }
    const { error } = await supabase.from("budgets").upsert({ category: catKey, amount: parseFloat(budgetAmt), color, is_custom: isCustom, profile: P });
    if (error) return alert("Error: " + error.message);
    setBudgets(s => ({ ...s, [catKey]: { amount: parseFloat(budgetAmt), color, isCustom } }));
    setBudgetAmt("");
    if (budgetCatType === "custom") setBudgetCustomName("");
  }

  async function deleteBudget(catKey) {
    const { error } = await supabase.from("budgets").delete().eq("category", catKey).eq("profile", P);
    if (error) return alert("Error: " + error.message);
    setBudgets(s => { const n = { ...s }; delete n[catKey]; return n; });
  }

  async function addGoal() {
    if (!goalName || !goalTarget) return alert("Enter goal name and target.");
    const g = { id: uid(), name: goalName, target: parseFloat(goalTarget), saved: 0, profile: P };
    const { error } = await supabase.from("goals").insert(g);
    if (error) return alert("Error: " + error.message);
    setGoals(s => [...s, g]);
    setGoalName(""); setGoalTarget("");
  }

  async function addToGoal() {
    if (!goalAddId || !goalAddAmt) return alert("Select a goal and enter amount.");
    const goal = goals.find(g => g.id === goalAddId);
    const newSaved = Math.min(goal.target, goal.saved + parseFloat(goalAddAmt));
    const { error } = await supabase.from("goals").update({ saved: newSaved }).eq("id", goalAddId);
    if (error) return alert("Error: " + error.message);
    setGoals(s => s.map(g => g.id === goalAddId ? { ...g, saved: newSaved } : g));
    setGoalAddAmt("");
  }

  async function addWallet() {
    if (!walletAmt || !walletDate) return alert("Enter amount and date.");
    const entry = { id: uid(), type: walletType, amount: parseFloat(walletAmt), description: walletDesc || (walletType === "add" ? "Added money" : "Spent money"), date: walletDate, profile: P };
    const { error } = await supabase.from("wallet").insert(entry);
    if (error) return alert("Error: " + error.message);
    setWallet(s => [entry, ...s]);
    setWalletAmt(""); setWalletDesc("");
  }

  async function deleteTx(id) { await supabase.from("transactions").delete().eq("id", id); setTransactions(s => s.filter(t => t.id !== id)); }
  async function deleteGoal(id) { await supabase.from("goals").delete().eq("id", id); setGoals(s => s.filter(g => g.id !== id)); }
  async function deleteWallet(id) { await supabase.from("wallet").delete().eq("id", id); setWallet(s => s.filter(w => w.id !== id)); }

  // ── Style helpers ──
  const glassStyle = (extra = {}) => ({
    background: G.glass, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    border: `1px solid ${G.glassBorder}`, borderRadius: isMobile ? 14 : 16, ...extra,
  });

  const inputSt = {
    width: "100%", padding: isMobile ? "10px 12px" : "9px 12px", borderRadius: 10,
    border: `1px solid ${G.glassBorder}`, background: G.inputBg,
    color: G.text, fontSize: isMobile ? 14 : 13, outline: "none",
    fontFamily: "'EB Garamond', Georgia, serif",
  };

  const grid2 = { display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 14 : 20, width: "100%" };
  const tabs = ["overview", "add", "expenses", "goals", "wallet"];
  const tabIcons = { overview: "⌂", add: "+", expenses: "≡", goals: "◎", wallet: "◇" };

  // ── Show profile selector if no active profile ──
  if (!activeProfile) {
    return <ProfileScreen onSelect={setActiveProfile} isDark={isDark} setIsDark={setIsDark} />;
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: G.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'EB Garamond', Georgia, serif", color: G.textMuted, fontSize: 16, letterSpacing: 1, gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: "50%", border: `2px solid ${G.glassBorder}`, borderTop: `2px solid ${G.accent}`, animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      Loading {activeProfile.username}'s budget...
    </div>
  );

  const avatarColor = hashColor(activeProfile.username);

  return (
    <div style={{ minHeight: "100vh", width: "100vw", background: G.bg, fontFamily: "'EB Garamond', Georgia, serif", color: G.text, overflowX: "hidden", transition: "background 0.3s, color 0.3s" }}>
      <div style={{ position: "fixed", top: -100, left: -60, width: isMobile ? 260 : 400, height: isMobile ? 260 : 400, borderRadius: "50%", background: isDark ? "rgba(139,127,212,0.07)" : "rgba(139,94,32,0.05)", filter: "blur(100px)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: -80, right: -50, width: isMobile ? 220 : 360, height: isMobile ? 220 : 360, borderRadius: "50%", background: isDark ? "rgba(200,169,110,0.06)" : "rgba(200,169,110,0.08)", filter: "blur(90px)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", minHeight: "100vh", padding: isMobile ? "18px 16px 80px" : "24px 32px 90px", boxSizing: "border-box" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isMobile ? 20 : 28, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Profile avatar + switch button */}
            <button onClick={switchProfile} title="Switch Profile" style={{
              display: "flex", alignItems: "center", gap: 9, padding: "7px 12px 7px 7px",
              background: G.glass, border: `1px solid ${G.glassBorder}`, borderRadius: 28,
              cursor: "pointer", color: G.text, fontFamily: "inherit", transition: "all 0.18s",
            }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: `${avatarColor}25`, border: `2px solid ${avatarColor}60`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: avatarColor, flexShrink: 0 }}>
                {getInitials(activeProfile.username)}
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.2 }}>{activeProfile.username}</div>
                <div style={{ fontSize: 9, color: G.textMuted, letterSpacing: 0.5 }}>switch ↗</div>
              </div>
            </button>
            <div>
              <div style={{ fontSize: 9, letterSpacing: 3, color: G.textMuted, textTransform: "uppercase", marginBottom: 1 }}>Budget Tracker</div>
              <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 700, letterSpacing: -0.5, color: G.cream }}>{monthLabel(selectedMonth)}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12 }}>{isDark ? "🌙" : "☀️"}</span>
              <button className="theme-toggle" onClick={() => setIsDark(d => !d)} style={{ background: isDark ? "rgba(139,127,212,0.25)" : "rgba(139,94,32,0.2)" }} />
            </div>
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ ...inputSt, width: "auto", fontSize: 11, padding: "6px 10px", cursor: "pointer" }}>
              {allMonths().map(m => <option key={m} value={m} style={{ background: isDark ? "#0f0f1a" : "#f5f0e8" }}>{monthLabel(m)}</option>)}
            </select>
          </div>
        </div>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div style={grid2}>
            <div style={{ ...glassStyle({ padding: isMobile ? "22px 18px" : "28px 26px", position: "relative", overflow: "hidden" }) }}>
              <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: `${G.accent}0A`, filter: "blur(40px)" }} />
              <div style={{ fontSize: 9, color: G.textMuted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Remaining Balance</div>
              <div style={{ fontSize: isMobile ? 36 : 50, fontWeight: 700, letterSpacing: -2, color: balColor, marginBottom: 18 }}>{CUR}{balance.toLocaleString()}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[
                  { label: "Allowance", val: `${CUR}${income.toLocaleString()}`, color: G.green },
                  { label: "Spent", val: `${CUR}${expenses.toLocaleString()}`, color: G.red },
                  { label: "Used", val: `${pct}%`, color: G.yellow },
                ].map(m => (
                  <div key={m.label} style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 9, color: G.textMuted, marginBottom: 3 }}>{m.label}</div>
                    <div style={{ fontSize: isMobile ? 13 : 16, fontWeight: 600, color: m.color }}>{m.val}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14 }}>
                <div style={{ height: 3, background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)", borderRadius: 2 }}>
                  <div style={{ height: 3, width: `${pct}%`, borderRadius: 2, background: `linear-gradient(90deg, ${G.accent}, ${balColor})`, transition: "width 0.6s ease" }} />
                </div>
              </div>
            </div>

            <div style={{ ...glassStyle({ padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }) }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: G.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, color: G.accent }}>◇</div>
                <div>
                  <div style={{ fontSize: 9, color: G.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>Wallet</div>
                  <div style={{ fontSize: isMobile ? 15 : 17, fontWeight: 600 }}>{CUR}{walletBalance.toLocaleString()}</div>
                </div>
              </div>
              <button onClick={() => setTab("wallet")} style={{ background: G.accentSoft, border: `1px solid ${G.glassBorder}`, color: G.accent, fontSize: 12, padding: "6px 14px", borderRadius: 18, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>View →</button>
            </div>

            <div style={glassStyle({ padding: isMobile ? "16px" : "20px 22px" })}>
              <div style={{ fontSize: 9, color: G.textMuted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>Category Breakdown</div>
              {catBudgetData().length === 0 && (
                <div style={{ textAlign: "center", color: G.textMuted, fontSize: 13, padding: "20px 0" }}>
                  No data yet — <span style={{ color: G.accent, cursor: "pointer", textDecoration: "underline" }} onClick={() => setTab("add")}>add a transaction</span>
                </div>
              )}
              {catBudgetData().map(({ cat, displayCat, budget, spent, remaining, p, color }) => {
                const over = budget > 0 && spent > budget;
                return (
                  <div key={cat} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{displayCat}</span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 12, color: over ? G.red : G.textSub }}>{CUR}{spent.toLocaleString()}{budget > 0 && <span style={{ color: G.textMuted }}> / {CUR}{budget.toLocaleString()}</span>}</div>
                        {budget > 0 && <div style={{ fontSize: 10, color: over ? G.red : G.green, fontWeight: 600 }}>{over ? `−${CUR}${Math.abs(remaining).toLocaleString()} over` : `${CUR}${remaining.toLocaleString()} left`}</div>}
                      </div>
                    </div>
                    {budget > 0 && (
                      <div style={{ height: 3, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", borderRadius: 2 }}>
                        <div style={{ height: 3, width: `${Math.min(100, p)}%`, borderRadius: 2, background: over ? G.red : color, transition: "width 0.5s ease" }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={glassStyle({ padding: isMobile ? "16px" : "20px 22px" })}>
              <div style={{ fontSize: 9, color: G.textMuted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>6-Month History</div>
              <ResponsiveContainer width="100%" height={isMobile ? 150 : 190}>
                <BarChart data={chartData()} barGap={3} barCategoryGap="30%">
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: G.textMuted }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: G.tooltipBg, border: `1px solid ${G.glassBorder}`, borderRadius: 10, fontSize: 12, color: G.text }} formatter={v => `${CUR}${v.toLocaleString()}`} cursor={{ fill: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)" }} />
                  <Bar dataKey="Income" fill={`${G.green}AA`} radius={[4,4,0,0]} />
                  <Bar dataKey="Expenses" fill={`${G.red}99`} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
                {[[`${G.green}AA`,"Income"],[`${G.red}99`,"Expenses"]].map(([c,l]) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                    <span style={{ fontSize: 11, color: G.textMuted }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ ...glassStyle({ padding: isMobile ? "16px" : "20px 22px" }), ...(isMobile ? {} : { gridColumn: "1 / -1" }) }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 9, color: G.textMuted, letterSpacing: 2, textTransform: "uppercase" }}>Recent Transactions</div>
                <button onClick={() => setTab("expenses")} style={{ background: "transparent", border: "none", color: G.accent, fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>See all →</button>
              </div>
              {txForMonth(selectedMonth).length === 0 && <div style={{ textAlign: "center", color: G.textMuted, fontSize: 12, padding: "14px 0" }}>No transactions yet</div>}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0 28px" }}>
                {txForMonth(selectedMonth).sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, isMobile ? 5 : 8).map(t => {
                  const isInc = t.type === "income";
                  const color = isInc ? G.green : (budgets[t.category]?.color || (t.category?.startsWith("Other:") ? G.indigo : STD_COLORS[t.category] || G.indigo));
                  const d = new Date(t.date);
                  return (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: `1px solid ${G.glassBorder}` }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color, flexShrink: 0 }}>{isInc ? "↑" : "↓"}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.description}</div>
                        <div style={{ fontSize: 10, color: G.textMuted }}>{isInc ? "Income" : displayCategory(t.category)} · {(d.getMonth()+1)}/{d.getDate()}</div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: isInc ? G.green : G.red, whiteSpace: "nowrap" }}>{isInc ? "+" : "-"}{CUR}{t.amount.toLocaleString()}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── ADD ── */}
        {tab === "add" && (
          <div style={grid2}>
            <div style={glassStyle({ padding: isMobile ? "18px" : "24px" })}>
              <SectionTitle G={G} icon="↑" iconBg={`${G.green}20`} iconColor={G.green} title="Add Income" />
              <MRow isMobile={isMobile}>
                <Field G={G} label={`Amount (${CUR})`}><input style={inputSt} type="number" placeholder="500" value={incAmount} onChange={e => setIncAmount(e.target.value)} /></Field>
                <Field G={G} label="Date"><input style={inputSt} type="date" value={incDate} onChange={e => setIncDate(e.target.value)} /></Field>
              </MRow>
              <div style={{ marginTop: 12 }}><Field G={G} label="Note"><input style={inputSt} type="text" placeholder="e.g. Weekly allowance" value={incNote} onChange={e => setIncNote(e.target.value)} /></Field></div>
              <Btn G={G} onClick={addIncome} style={{ marginTop: 16 }}>Add income</Btn>
            </div>

            <div style={glassStyle({ padding: isMobile ? "18px" : "24px" })}>
              <SectionTitle G={G} icon="↓" iconBg={`${G.red}20`} iconColor={G.red} title="Add Expense" />
              <MRow isMobile={isMobile}>
                <Field G={G} label={`Amount (${CUR})`}><input style={inputSt} type="number" placeholder="80" value={expAmount} onChange={e => setExpAmount(e.target.value)} /></Field>
                <Field G={G} label="Category">
                  <select style={inputSt} value={expCat} onChange={e => { setExpCat(e.target.value); setExpOtherLabel(""); }}>
                    {allExpenseCategories.map(c => <option key={c} style={{ background: isDark ? "#0f0f1a" : "#f5f0e8" }}>{c}</option>)}
                  </select>
                </Field>
              </MRow>
              {expCat === "Other" && (
                <div style={{ marginTop: 12 }}>
                  <Field G={G} label="✦ What is this expense?">
                    <input style={{ ...inputSt, borderColor: G.accent, background: G.accentSoft }} type="text" placeholder="e.g. Haircut, Medicine, Gift..." value={expOtherLabel} onChange={e => setExpOtherLabel(e.target.value)} autoFocus />
                  </Field>
                  {expOtherLabel && customCats.some(c => c.name.toLowerCase() === expOtherLabel.trim().toLowerCase()) && (
                    <div style={{ marginTop: 5, fontSize: 11, color: G.green }}>✓ Matches your "{expOtherLabel.trim()}" budget</div>
                  )}
                </div>
              )}
              <MRow isMobile={isMobile} style={{ marginTop: 12 }}>
                <Field G={G} label="Description (optional)"><input style={inputSt} type="text" placeholder="e.g. Jollibee lunch" value={expDesc} onChange={e => setExpDesc(e.target.value)} /></Field>
                <Field G={G} label="Date"><input style={inputSt} type="date" value={expDate} onChange={e => setExpDate(e.target.value)} /></Field>
              </MRow>
              <Btn G={G} onClick={addExpense} style={{ marginTop: 16 }}>Add expense</Btn>
            </div>

            <div style={glassStyle({ padding: isMobile ? "18px" : "24px" })}>
              <SectionTitle G={G} icon="⊟" iconBg={G.accentSoft} iconColor={G.accent} title="Set Category Budget" />
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {["standard","custom"].map(type => (
                  <button key={type} onClick={() => setBudgetCatType(type)} style={{ flex: 1, padding: "7px", borderRadius: 9, border: `1px solid ${budgetCatType === type ? G.accent : G.glassBorder}`, background: budgetCatType === type ? G.accentSoft : "transparent", color: budgetCatType === type ? G.accent : G.textMuted, fontSize: isMobile ? 11 : 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    {type === "standard" ? "Standard" : "Custom"}
                  </button>
                ))}
              </div>
              <MRow isMobile={isMobile}>
                <Field G={G} label={budgetCatType === "standard" ? "Category" : "Category Name"}>
                  {budgetCatType === "standard"
                    ? <select style={inputSt} value={budgetStdCat} onChange={e => setBudgetStdCat(e.target.value)}>{STD_CATEGORIES.map(c => <option key={c} style={{ background: isDark ? "#0f0f1a" : "#f5f0e8" }}>{c}</option>)}</select>
                    : <input style={inputSt} type="text" placeholder="e.g. Bills, Rent, Gym..." value={budgetCustomName} onChange={e => setBudgetCustomName(e.target.value)} />
                  }
                </Field>
                <Field G={G} label={`Monthly limit (${CUR})`}><input style={inputSt} type="number" placeholder="500" value={budgetAmt} onChange={e => setBudgetAmt(e.target.value)} /></Field>
              </MRow>
              <Btn G={G} onClick={saveBudget} style={{ marginTop: 16 }}>Save budget</Btn>
              {Object.keys(budgets).length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 9, color: G.textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>Current Budgets</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {Object.entries(budgets).map(([cat, b]) => (
                      <div key={cat} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", borderRadius: 9, padding: "8px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 7, height: 7, borderRadius: "50%", background: b.color || G.accent }} />
                          <span style={{ fontSize: 13, color: G.textSub }}>{cat}</span>
                          {b.isCustom && <span style={{ fontSize: 9, color: G.indigo, background: `${G.indigo}18`, borderRadius: 4, padding: "1px 6px" }}>custom</span>}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 13, color: G.accent, fontWeight: 600 }}>{CUR}{b.amount.toLocaleString()}</span>
                          <button onClick={() => deleteBudget(cat)} style={{ background: `${G.red}18`, border: `1px solid ${G.red}40`, color: G.red, borderRadius: 6, width: 24, height: 24, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={glassStyle({ padding: isMobile ? "18px" : "24px" })}>
              <SectionTitle G={G} icon="◎" iconBg={`${G.yellow}20`} iconColor={G.yellow} title="New Savings Goal" />
              <MRow isMobile={isMobile}>
                <Field G={G} label="Goal name"><input style={inputSt} type="text" placeholder="e.g. New shoes" value={goalName} onChange={e => setGoalName(e.target.value)} /></Field>
                <Field G={G} label={`Target (${CUR})`}><input style={inputSt} type="number" placeholder="1500" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} /></Field>
              </MRow>
              <Btn G={G} onClick={addGoal} style={{ marginTop: 16 }}>Create goal</Btn>
            </div>
          </div>
        )}

        {/* ── EXPENSES ── */}
        {tab === "expenses" && (
          <div style={{ ...glassStyle({ padding: isMobile ? "16px" : "24px" }), width: "100%" }}>
            <div style={{ fontSize: 9, color: G.textMuted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Transactions — {monthLabel(selectedMonth)}</div>
            {txForMonth(selectedMonth).length === 0 && <div style={{ textAlign: "center", color: G.textMuted, padding: "36px 0", fontSize: 14 }}>No transactions this month</div>}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0 28px" }}>
              {txForMonth(selectedMonth).sort((a,b) => new Date(b.date) - new Date(a.date)).map(t => {
                const isInc = t.type === "income";
                const color = isInc ? G.green : (budgets[t.category]?.color || (t.category?.startsWith("Other:") ? G.indigo : STD_COLORS[t.category] || G.indigo));
                const d = new Date(t.date);
                return (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", borderBottom: `1px solid ${G.glassBorder}` }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color, flexShrink: 0 }}>{isInc ? "↑" : "↓"}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.description}</div>
                      <div style={{ fontSize: 10, color: G.textMuted }}>{isInc ? "Income" : displayCategory(t.category)} · {(d.getMonth()+1)}/{d.getDate()}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: isInc ? G.green : G.red, whiteSpace: "nowrap" }}>{isInc ? "+" : "-"}{CUR}{t.amount.toLocaleString()}</div>
                    <button onClick={() => deleteTx(t.id)} style={{ background: `${G.red}18`, border: `1px solid ${G.red}40`, color: G.red, borderRadius: 7, width: 28, height: 28, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>×</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── GOALS ── */}
        {tab === "goals" && (
          <div style={grid2}>
            <div style={{ ...glassStyle({ padding: isMobile ? "16px" : "24px" }), gridColumn: isMobile ? "1" : "1 / -1" }}>
              <div style={{ fontSize: 9, color: G.textMuted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>Savings Goals</div>
              {goals.length === 0 && <div style={{ textAlign: "center", color: G.textMuted, padding: "20px 0", fontSize: 14 }}>No goals yet. Add one below!</div>}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                {goals.map(g => {
                  const p = Math.min(100, Math.round((g.saved / g.target) * 100));
                  const color = p >= 100 ? G.green : p >= 50 ? G.accent : G.yellow;
                  return (
                    <div key={g.id} style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", borderRadius: 13, padding: "15px 16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{g.name}</span>
                        <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                          <span style={{ fontSize: 13, color, fontWeight: 600 }}>{p}%</span>
                          <button onClick={() => deleteGoal(g.id)} style={{ background: `${G.red}18`, border: `1px solid ${G.red}40`, color: G.red, borderRadius: 6, width: 24, height: 24, cursor: "pointer", fontSize: 13 }}>×</button>
                        </div>
                      </div>
                      <div style={{ height: 4, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", borderRadius: 3, marginBottom: 7 }}>
                        <div style={{ height: 4, width: `${p}%`, borderRadius: 3, background: `linear-gradient(90deg, ${color}88, ${color})`, transition: "width 0.5s ease" }} />
                      </div>
                      <div style={{ fontSize: 11, color: G.textMuted }}>{CUR}{g.saved.toLocaleString()} · {CUR}{Math.max(0, g.target - g.saved).toLocaleString()} to go · Target {CUR}{g.target.toLocaleString()}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            {goals.length > 0 && (
              <div style={glassStyle({ padding: isMobile ? "18px" : "24px" })}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Add money to a goal</div>
                <MRow isMobile={isMobile}>
                  <Field G={G} label="Goal"><select style={inputSt} value={goalAddId} onChange={e => setGoalAddId(e.target.value)}><option value="" style={{ background: isDark ? "#0f0f1a" : "#f5f0e8" }}>Select goal</option>{goals.map(g => <option key={g.id} value={g.id} style={{ background: isDark ? "#0f0f1a" : "#f5f0e8" }}>{g.name}</option>)}</select></Field>
                  <Field G={G} label={`Amount (${CUR})`}><input style={inputSt} type="number" placeholder="200" value={goalAddAmt} onChange={e => setGoalAddAmt(e.target.value)} /></Field>
                </MRow>
                <Btn G={G} onClick={addToGoal} style={{ marginTop: 14 }}>Add to goal</Btn>
              </div>
            )}
            <div style={glassStyle({ padding: isMobile ? "18px" : "24px" })}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>New goal</div>
              <MRow isMobile={isMobile}>
                <Field G={G} label="Goal name"><input style={inputSt} type="text" placeholder="e.g. New shoes" value={goalName} onChange={e => setGoalName(e.target.value)} /></Field>
                <Field G={G} label={`Target (${CUR})`}><input style={inputSt} type="number" placeholder="1500" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} /></Field>
              </MRow>
              <Btn G={G} onClick={addGoal} style={{ marginTop: 14 }}>Create goal</Btn>
            </div>
          </div>
        )}

        {/* ── WALLET ── */}
        {tab === "wallet" && (
          <div style={grid2}>
            <div style={{ ...glassStyle({ padding: isMobile ? "22px 18px" : "28px 26px", position: "relative", overflow: "hidden" }), gridColumn: isMobile ? "1" : "1 / -1" }}>
              <div style={{ position: "absolute", top: -25, right: -25, width: 140, height: 140, borderRadius: "50%", background: `${G.accent}0A`, filter: "blur(30px)" }} />
              <div style={{ fontSize: 9, color: G.textMuted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>My Wallet</div>
              <div style={{ fontSize: isMobile ? 34 : 46, fontWeight: 700, letterSpacing: -2, color: walletBalance >= 0 ? G.green : G.red, marginBottom: 4 }}>{CUR}{walletBalance.toLocaleString()}</div>
              <div style={{ fontSize: 12, color: G.textMuted }}>Cash you personally keep track of</div>
            </div>
            <div style={glassStyle({ padding: isMobile ? "18px" : "24px" })}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Add entry</div>
              <MRow isMobile={isMobile}>
                <Field G={G} label="Type"><select style={inputSt} value={walletType} onChange={e => setWalletType(e.target.value)}><option value="add" style={{ background: isDark ? "#0f0f1a" : "#f5f0e8" }}>+ Added money</option><option value="spend" style={{ background: isDark ? "#0f0f1a" : "#f5f0e8" }}>- Spent money</option></select></Field>
                <Field G={G} label={`Amount (${CUR})`}><input style={inputSt} type="number" placeholder="100" value={walletAmt} onChange={e => setWalletAmt(e.target.value)} /></Field>
              </MRow>
              <MRow isMobile={isMobile} style={{ marginTop: 12 }}>
                <Field G={G} label="Description"><input style={inputSt} type="text" placeholder="e.g. Saved from lunch" value={walletDesc} onChange={e => setWalletDesc(e.target.value)} /></Field>
                <Field G={G} label="Date"><input style={inputSt} type="date" value={walletDate} onChange={e => setWalletDate(e.target.value)} /></Field>
              </MRow>
              <Btn G={G} onClick={addWallet} style={{ marginTop: 16 }}>Save entry</Btn>
            </div>
            <div style={glassStyle({ padding: isMobile ? "18px" : "24px" })}>
              <div style={{ fontSize: 9, color: G.textMuted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>History</div>
              {wallet.length === 0 && <div style={{ textAlign: "center", color: G.textMuted, padding: "20px 0", fontSize: 14 }}>No entries yet</div>}
              {[...wallet].sort((a,b) => new Date(b.date) - new Date(a.date)).map(w => {
                const isAdd = w.type === "add";
                const d = new Date(w.date);
                return (
                  <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${G.glassBorder}` }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: isAdd ? `${G.green}18` : `${G.red}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: isAdd ? G.green : G.red, flexShrink: 0 }}>{isAdd ? "↑" : "↓"}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 500 }}>{w.description}</div>
                      <div style={{ fontSize: 10, color: G.textMuted }}>{(d.getMonth()+1)}/{d.getDate()}/{d.getFullYear()}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: isAdd ? G.green : G.red, whiteSpace: "nowrap" }}>{isAdd ? "+" : "-"}{CUR}{w.amount.toLocaleString()}</div>
                    <button onClick={() => deleteWallet(w.id)} style={{ background: `${G.red}18`, border: `1px solid ${G.red}40`, color: G.red, borderRadius: 7, width: 28, height: 28, cursor: "pointer", fontSize: 14 }}>×</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom nav ── */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 10, padding: isMobile ? "0 12px 12px" : "0 32px 18px" }}>
        <div style={{ background: G.navBg, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: `1px solid ${G.glassBorder}`, padding: isMobile ? "6px 8px" : "8px 12px", display: "flex", gap: isMobile ? 2 : 4, borderRadius: isMobile ? 22 : 28, width: "100%", boxShadow: `0 8px 40px ${isDark ? "rgba(0,0,0,0.6)" : "rgba(80,50,10,0.12)"}` }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: isMobile ? "7px 4px" : "9px 8px", borderRadius: isMobile ? 14 : 18, border: "none", cursor: "pointer", background: tab === t ? G.accentSoft : "transparent", color: tab === t ? G.accent : G.textMuted, transition: "all 0.2s" }}>
              <span style={{ fontSize: isMobile ? 16 : 18 }}>{tabIcons[t]}</span>
              <span style={{ fontSize: isMobile ? 9 : 11, fontWeight: tab === t ? 600 : 400, textTransform: "capitalize", fontFamily: "sans-serif" }}>{t}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MRow({ isMobile, children, style = {} }) {
  return <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 10 : 12, ...style }}>{children}</div>;
}
function Field({ G, label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 10, color: G.textMuted, letterSpacing: 0.5 }}>{label}</label>
      {children}
    </div>
  );
}
function SectionTitle({ G, icon, iconBg, iconColor, title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: iconColor }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
    </div>
  );
}
function Btn({ G, onClick, children, style = {} }) {
  return (
    <button onClick={onClick} style={{ width: "100%", padding: "11px", borderRadius: 12, background: G.accentSoft, border: `1px solid ${G.accent}40`, color: G.accent, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'EB Garamond', Georgia, serif", transition: "all 0.15s", ...style }}>{children}</button>
  );
}