import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "./supabase";

const CATEGORIES = ["Food", "Transport", "School", "Entertainment", "Savings", "Other"];
const CAT_COLORS = {
  Food: "#C8B89A", Transport: "#A89880", School: "#D4C4A8",
  Entertainment: "#B8A888", Savings: "#E8DCC8", Other: "#987860",
};
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

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
// "Other:Haircut" → "Haircut"
function displayCategory(category) {
  if (category && category.startsWith("Other:")) return category.slice(6).trim();
  return category;
}
// Always use Other color for custom subcategories
function catColor(category) {
  if (category && category.startsWith("Other:")) return CAT_COLORS["Other"];
  return CAT_COLORS[category] || CAT_COLORS["Other"];
}

const G = {
  bg: "linear-gradient(160deg, #0A1F0A 0%, #0D2B0D 45%, #081808 100%)",
  glass: "rgba(232,220,200,0.05)",
  glassBorder: "rgba(232,220,200,0.12)",
  text: "#EDE8DC",
  textSub: "rgba(237,232,220,0.6)",
  textMuted: "rgba(237,232,220,0.35)",
  accent: "#D4C4A0",
  red: "#C47A6A",
  green: "#A8C898",
  yellow: "#D4B878",
  cream: "#EDE8DC",
};

const glass = (extra = {}) => ({
  background: G.glass,
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border: `1px solid ${G.glassBorder}`,
  borderRadius: 16,
  ...extra,
});

const inputSt = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 10,
  border: `1px solid rgba(232,220,200,0.14)`,
  background: "rgba(232,220,200,0.04)",
  color: G.text,
  fontSize: 13,
  outline: "none",
  fontFamily: "'EB Garamond', 'Georgia', 'Times New Roman', serif",
};

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [wallet, setWallet] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState("overview");
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());

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

  const [editBudgetCat, setEditBudgetCat] = useState("Food");
  const [editBudgetAmt, setEditBudgetAmt] = useState("");

  // ── Load all data from Supabase on mount ──
  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      const [txRes, goalsRes, walletRes, budgetsRes] = await Promise.all([
        supabase.from("transactions").select("*").order("date", { ascending: false }),
        supabase.from("goals").select("*").order("created_at", { ascending: true }),
        supabase.from("wallet").select("*").order("date", { ascending: false }),
        supabase.from("budgets").select("*"),
      ]);
      if (txRes.data) setTransactions(txRes.data);
      if (goalsRes.data) setGoals(goalsRes.data);
      if (walletRes.data) setWallet(walletRes.data);
      if (budgetsRes.data) {
        const map = {};
        budgetsRes.data.forEach(b => { map[b.category] = b.amount; });
        setBudgets(map);
      }
      setLoading(false);
    }
    loadAll();
  }, []);

  // ── Derived data ──
  const allMonths = () => {
    const keys = new Set(transactions.map(t => getMonthKey(t.date)));
    keys.add(currentMonthKey());
    return [...keys].sort();
  };

  const txForMonth = (key) => transactions.filter(t => getMonthKey(t.date) === key);
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
    const standardRows = CATEGORIES.map(cat => {
      const budget = budgets[cat] || 0;
      const spent = spending[cat] || 0;
      const remaining = budget - spent;
      const p = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
      return { cat, displayCat: cat, budget, spent, remaining, p };
    }).filter(d => d.budget > 0 || d.spent > 0);

    // Custom Other:xxx entries shown individually
    const otherRows = Object.keys(spending)
      .filter(k => k.startsWith("Other:"))
      .map(k => ({ cat: k, displayCat: displayCategory(k), budget: 0, spent: spending[k], remaining: 0, p: 0 }));

    return [...standardRows, ...otherRows];
  };

  const chartData = () => allMonths().slice(-6).map(m => ({
    month: monthLabel(m).split(" ")[0],
    Income: txForMonth(m).filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0),
    Expenses: txForMonth(m).filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0),
  }));

  const walletBalance = wallet.reduce((s, w) => w.type === "add" ? s + w.amount : s - w.amount, 0);

  // ── CRUD ──
  async function addIncome() {
    if (!incAmount || !incDate) return alert("Enter amount and date.");
    const tx = { id: uid(), type: "income", amount: parseFloat(incAmount), date: incDate, description: incNote || "Allowance", category: "Income" };
    const { error } = await supabase.from("transactions").insert(tx);
    if (error) return alert("Error: " + error.message);
    setTransactions(s => [tx, ...s]);
    setIncAmount(""); setIncNote("");
  }

  async function addExpense() {
    if (!expAmount || !expDate) return alert("Enter amount and date.");
    if (expCat === "Other" && !expOtherLabel.trim()) return alert("Please specify what this expense is.");
    const category = expCat === "Other" ? `Other:${expOtherLabel.trim()}` : expCat;
    const tx = { id: uid(), type: "expense", amount: parseFloat(expAmount), date: expDate, description: expDesc || displayCategory(category), category };
    const { error } = await supabase.from("transactions").insert(tx);
    if (error) return alert("Error: " + error.message);
    setTransactions(s => [tx, ...s]);
    setExpAmount(""); setExpDesc(""); setExpOtherLabel("");
  }

  async function addGoal() {
    if (!goalName || !goalTarget) return alert("Enter goal name and target.");
    const g = { id: uid(), name: goalName, target: parseFloat(goalTarget), saved: 0 };
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
    const entry = { id: uid(), type: walletType, amount: parseFloat(walletAmt), description: walletDesc || (walletType === "add" ? "Added money" : "Spent money"), date: walletDate };
    const { error } = await supabase.from("wallet").insert(entry);
    if (error) return alert("Error: " + error.message);
    setWallet(s => [entry, ...s]);
    setWalletAmt(""); setWalletDesc("");
  }

  async function saveBudget() {
    if (!editBudgetAmt) return;
    const { error } = await supabase.from("budgets").upsert({ category: editBudgetCat, amount: parseFloat(editBudgetAmt) });
    if (error) return alert("Error: " + error.message);
    setBudgets(s => ({ ...s, [editBudgetCat]: parseFloat(editBudgetAmt) }));
    setEditBudgetAmt("");
  }

  async function deleteTx(id) {
    await supabase.from("transactions").delete().eq("id", id);
    setTransactions(s => s.filter(t => t.id !== id));
  }
  async function deleteGoal(id) {
    await supabase.from("goals").delete().eq("id", id);
    setGoals(s => s.filter(g => g.id !== id));
  }
  async function deleteWallet(id) {
    await supabase.from("wallet").delete().eq("id", id);
    setWallet(s => s.filter(w => w.id !== id));
  }

  const tabs = ["overview", "add", "expenses", "goals", "wallet"];
  const tabIcons = { overview: "⌂", add: "+", expenses: "≡", goals: "◎", wallet: "◇" };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: G.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'EB Garamond', Georgia, serif", color: G.textMuted, fontSize: 16, letterSpacing: 1 }}>
      Loading your budget...
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", width: "100vw", background: G.bg, fontFamily: "'EB Garamond', 'Georgia', 'Times New Roman', serif", color: G.text, overflowX: "hidden" }}>
      <div style={{ position: "fixed", top: -100, left: -60, width: 400, height: 400, borderRadius: "50%", background: "rgba(168,200,152,0.06)", filter: "blur(100px)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: -80, right: -50, width: 360, height: 360, borderRadius: "50%", background: "rgba(212,196,160,0.05)", filter: "blur(90px)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", minHeight: "100vh", padding: "24px 32px 90px", boxSizing: "border-box" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 2.5, color: G.textMuted, textTransform: "uppercase", marginBottom: 2 }}>Budget Tracker</div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, color: G.cream }}>{monthLabel(selectedMonth)}</div>
          </div>
          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ ...inputSt, width: "auto", fontSize: 12, padding: "7px 14px", cursor: "pointer" }}>
            {allMonths().map(m => <option key={m} value={m} style={{ background: "#0D2B0D" }}>{monthLabel(m)}</option>)}
          </select>
        </div>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, width: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ ...glass({ padding: "28px 26px", position: "relative", overflow: "hidden" }) }}>
                <div style={{ position: "absolute", top: -30, right: -30, width: 180, height: 180, borderRadius: "50%", background: "rgba(212,196,160,0.06)", filter: "blur(30px)" }} />
                <div style={{ fontSize: 10, color: G.textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>Remaining Balance</div>
                <div style={{ fontSize: 52, fontWeight: 700, letterSpacing: -2, color: balColor, marginBottom: 22 }}>₱{balance.toLocaleString()}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  {[
                    { label: "Allowance", val: `₱${income.toLocaleString()}`, color: G.green },
                    { label: "Spent", val: `₱${expenses.toLocaleString()}`, color: G.red },
                    { label: "Used", val: `${pct}%`, color: G.yellow },
                  ].map(m => (
                    <div key={m.label} style={{ background: "rgba(232,220,200,0.05)", borderRadius: 12, padding: "12px 14px" }}>
                      <div style={{ fontSize: 10, color: G.textMuted, marginBottom: 4 }}>{m.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 600, color: m.color }}>{m.val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16 }}>
                  <div style={{ height: 3, background: "rgba(232,220,200,0.08)", borderRadius: 2 }}>
                    <div style={{ height: 3, width: `${pct}%`, borderRadius: 2, background: `linear-gradient(90deg, ${G.accent}, ${balColor})`, transition: "width 0.6s ease" }} />
                  </div>
                </div>
              </div>

              <div style={{ ...glass({ padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }) }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(212,196,160,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: G.accent }}>◇</div>
                  <div>
                    <div style={{ fontSize: 10, color: G.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>Wallet</div>
                    <div style={{ fontSize: 18, fontWeight: 600 }}>₱{walletBalance.toLocaleString()}</div>
                  </div>
                </div>
                <button onClick={() => setTab("wallet")} style={{ background: "rgba(232,220,200,0.06)", border: `1px solid ${G.glassBorder}`, color: G.textSub, fontSize: 12, padding: "7px 16px", borderRadius: 20, cursor: "pointer", fontFamily: "inherit" }}>View →</button>
              </div>

              <div style={{ ...glass({ padding: "20px 22px" }), flex: 1 }}>
                <div style={{ fontSize: 10, color: G.textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16 }}>6-Month History</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData()} barGap={4} barCategoryGap="30%">
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "rgba(237,232,220,0.4)" }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ background: "rgba(10,31,10,0.97)", border: `1px solid rgba(232,220,200,0.15)`, borderRadius: 10, fontSize: 12, color: G.text }} formatter={v => `₱${v.toLocaleString()}`} cursor={{ fill: "rgba(232,220,200,0.03)" }} />
                    <Bar dataKey="Income" fill="rgba(168,200,152,0.65)" radius={[4,4,0,0]} />
                    <Bar dataKey="Expenses" fill="rgba(196,122,106,0.6)" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", gap: 18, marginTop: 10 }}>
                  {[["rgba(168,200,152,0.65)","Income"],["rgba(196,122,106,0.6)","Expenses"]].map(([c,l]) => (
                    <div key={l} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 9, height: 9, borderRadius: 2, background: c }} />
                      <span style={{ fontSize: 12, color: G.textMuted }}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ ...glass({ padding: "20px 22px" }), flex: 1 }}>
                <div style={{ fontSize: 10, color: G.textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16 }}>Category Breakdown</div>
                {catBudgetData().length === 0 && (
                  <div style={{ textAlign: "center", color: G.textMuted, fontSize: 13, padding: "24px 0" }}>
                    No data yet —{" "}
                    <span style={{ color: G.accent, cursor: "pointer", textDecoration: "underline" }} onClick={() => setTab("add")}>add a transaction</span>
                  </div>
                )}
                {catBudgetData().map(({ cat, displayCat, budget, spent, remaining, p }) => {
                  const color = catColor(cat);
                  const over = budget > 0 && spent > budget;
                  return (
                    <div key={cat} style={{ marginBottom: 18 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                          <span style={{ fontSize: 14, fontWeight: 500 }}>{displayCat}</span>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 13, color: over ? G.red : G.textSub }}>
                            ₱{spent.toLocaleString()}{budget > 0 && <span style={{ color: G.textMuted }}> / ₱{budget.toLocaleString()}</span>}
                          </div>
                          {budget > 0 && (
                            <div style={{ fontSize: 11, color: over ? G.red : G.green, fontWeight: 600 }}>
                              {over ? `−₱${Math.abs(remaining).toLocaleString()} over` : `₱${remaining.toLocaleString()} left`}
                            </div>
                          )}
                        </div>
                      </div>
                      {budget > 0 && (
                        <div style={{ height: 4, background: "rgba(232,220,200,0.07)", borderRadius: 2 }}>
                          <div style={{ height: 4, width: `${Math.min(100, p)}%`, borderRadius: 2, background: over ? G.red : color, transition: "width 0.5s ease" }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={glass({ padding: "20px 22px" })}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 10, color: G.textMuted, letterSpacing: 1.5, textTransform: "uppercase" }}>Recent</div>
                  <button onClick={() => setTab("expenses")} style={{ background: "transparent", border: "none", color: G.accent, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>See all →</button>
                </div>
                {txForMonth(selectedMonth).length === 0 && <div style={{ textAlign: "center", color: G.textMuted, fontSize: 12, padding: "16px 0" }}>No transactions yet</div>}
                {txForMonth(selectedMonth).sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 6).map(t => {
                  const isInc = t.type === "income";
                  const color = isInc ? G.green : catColor(t.category);
                  const d = new Date(t.date);
                  return (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(232,220,200,0.05)" }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color, flexShrink: 0 }}>{isInc ? "↑" : "↓"}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.description}</div>
                        <div style={{ fontSize: 11, color: G.textMuted }}>{isInc ? "Income" : displayCategory(t.category)} · {(d.getMonth()+1)}/{d.getDate()}</div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: isInc ? G.green : G.red }}>{isInc ? "+" : "-"}₱{t.amount.toLocaleString()}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ADD */}
        {tab === "add" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, width: "100%" }}>
            <div style={glass({ padding: "24px" })}>
              <SectionTitle icon="↑" iconBg="rgba(168,200,152,0.14)" iconColor={G.green} title="Add Income" />
              <Row>
                <Field label="Amount (₱)"><input style={inputSt} type="number" placeholder="500" value={incAmount} onChange={e => setIncAmount(e.target.value)} /></Field>
                <Field label="Date"><input style={inputSt} type="date" value={incDate} onChange={e => setIncDate(e.target.value)} /></Field>
              </Row>
              <div style={{ marginTop: 12 }}>
                <Field label="Note"><input style={inputSt} type="text" placeholder="e.g. Weekly allowance" value={incNote} onChange={e => setIncNote(e.target.value)} /></Field>
              </div>
              <Btn onClick={addIncome} style={{ marginTop: 16 }}>Add income</Btn>
            </div>

            <div style={glass({ padding: "24px" })}>
              <SectionTitle icon="↓" iconBg="rgba(196,122,106,0.14)" iconColor={G.red} title="Add Expense" />
              <Row>
                <Field label="Amount (₱)"><input style={inputSt} type="number" placeholder="80" value={expAmount} onChange={e => setExpAmount(e.target.value)} /></Field>
                <Field label="Category">
                  <select style={inputSt} value={expCat} onChange={e => { setExpCat(e.target.value); setExpOtherLabel(""); }}>
                    {CATEGORIES.map(c => <option key={c} style={{ background: "#0D2B0D" }}>{c}</option>)}
                  </select>
                </Field>
              </Row>

              {/* ── "Other" specification field ── */}
              {expCat === "Other" && (
                <div style={{ marginTop: 12 }}>
                  <Field label="✦ What is this expense?">
                    <input
                      style={{ ...inputSt, borderColor: "rgba(212,196,160,0.4)", background: "rgba(212,196,160,0.06)" }}
                      type="text"
                      placeholder="e.g. Haircut, Medicine, Gift, Fare..."
                      value={expOtherLabel}
                      onChange={e => setExpOtherLabel(e.target.value)}
                      autoFocus
                    />
                  </Field>
                </div>
              )}

              <Row style={{ marginTop: 12 }}>
                <Field label="Description (optional)"><input style={inputSt} type="text" placeholder="e.g. Jollibee lunch" value={expDesc} onChange={e => setExpDesc(e.target.value)} /></Field>
                <Field label="Date"><input style={inputSt} type="date" value={expDate} onChange={e => setExpDate(e.target.value)} /></Field>
              </Row>
              <Btn onClick={addExpense} style={{ marginTop: 16 }}>Add expense</Btn>
            </div>

            <div style={glass({ padding: "24px" })}>
              <SectionTitle icon="⊟" iconBg="rgba(212,196,160,0.1)" iconColor={G.accent} title="Set Category Budget" />
              <Row>
                <Field label="Category">
                  <select style={inputSt} value={editBudgetCat} onChange={e => setEditBudgetCat(e.target.value)}>
                    {CATEGORIES.map(c => <option key={c} style={{ background: "#0D2B0D" }}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Monthly limit (₱)">
                  <input style={inputSt} type="number" placeholder={budgets[editBudgetCat] || "500"} value={editBudgetAmt} onChange={e => setEditBudgetAmt(e.target.value)} />
                </Field>
              </Row>
              <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 8 }}>
                {CATEGORIES.filter(c => budgets[c]).map(c => (
                  <div key={c} style={{ background: "rgba(232,220,200,0.05)", border: `1px solid ${G.glassBorder}`, borderRadius: 8, padding: "5px 12px", fontSize: 12, color: G.textSub }}>
                    {c}: <span style={{ color: G.accent }}>₱{budgets[c].toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <Btn onClick={saveBudget} style={{ marginTop: 16 }}>Save budget</Btn>
            </div>

            <div style={glass({ padding: "24px" })}>
              <SectionTitle icon="◎" iconBg="rgba(212,184,120,0.14)" iconColor={G.yellow} title="New Savings Goal" />
              <Row>
                <Field label="Goal name"><input style={inputSt} type="text" placeholder="e.g. New shoes" value={goalName} onChange={e => setGoalName(e.target.value)} /></Field>
                <Field label="Target (₱)"><input style={inputSt} type="number" placeholder="1500" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} /></Field>
              </Row>
              <Btn onClick={addGoal} style={{ marginTop: 16 }}>Create goal</Btn>
            </div>
          </div>
        )}

        {/* EXPENSES */}
        {tab === "expenses" && (
          <div style={{ ...glass({ padding: "24px" }), width: "100%" }}>
            <div style={{ fontSize: 10, color: G.textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 18 }}>Transactions — {monthLabel(selectedMonth)}</div>
            {txForMonth(selectedMonth).length === 0 && <div style={{ textAlign: "center", color: G.textMuted, padding: "40px 0", fontSize: 14 }}>No transactions this month</div>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }}>
              {txForMonth(selectedMonth).sort((a,b) => new Date(b.date) - new Date(a.date)).map(t => {
                const isInc = t.type === "income";
                const color = isInc ? G.green : catColor(t.category);
                const d = new Date(t.date);
                return (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0", borderBottom: "1px solid rgba(232,220,200,0.05)" }}>
                    <div style={{ width: 38, height: 38, borderRadius: 11, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, color, flexShrink: 0 }}>{isInc ? "↑" : "↓"}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.description}</div>
                      <div style={{ fontSize: 11, color: G.textMuted }}>{isInc ? "Income" : displayCategory(t.category)} · {(d.getMonth()+1)}/{d.getDate()}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: isInc ? G.green : G.red }}>{isInc ? "+" : "-"}₱{t.amount.toLocaleString()}</div>
                    <button onClick={() => deleteTx(t.id)} style={{ background: "rgba(196,122,106,0.1)", border: "1px solid rgba(196,122,106,0.22)", color: G.red, borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>×</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* GOALS */}
        {tab === "goals" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, width: "100%" }}>
            <div style={{ ...glass({ padding: "24px" }), gridColumn: "1 / -1" }}>
              <div style={{ fontSize: 10, color: G.textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16 }}>Savings Goals</div>
              {goals.length === 0 && <div style={{ textAlign: "center", color: G.textMuted, padding: "24px 0", fontSize: 14 }}>No goals yet. Add one below!</div>}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 }}>
                {goals.map(g => {
                  const p = Math.min(100, Math.round((g.saved / g.target) * 100));
                  const color = p >= 100 ? G.green : p >= 50 ? G.accent : G.yellow;
                  return (
                    <div key={g.id} style={{ background: "rgba(232,220,200,0.04)", borderRadius: 14, padding: "16px 18px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <span style={{ fontSize: 15, fontWeight: 600 }}>{g.name}</span>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{ fontSize: 13, color, fontWeight: 600 }}>{p}%</span>
                          <button onClick={() => deleteGoal(g.id)} style={{ background: "rgba(196,122,106,0.1)", border: "1px solid rgba(196,122,106,0.22)", color: G.red, borderRadius: 7, width: 26, height: 26, cursor: "pointer", fontSize: 14 }}>×</button>
                        </div>
                      </div>
                      <div style={{ height: 5, background: "rgba(232,220,200,0.07)", borderRadius: 3, marginBottom: 8 }}>
                        <div style={{ height: 5, width: `${p}%`, borderRadius: 3, background: `linear-gradient(90deg, ${color}88, ${color})`, transition: "width 0.5s ease" }} />
                      </div>
                      <div style={{ fontSize: 12, color: G.textMuted }}>₱{g.saved.toLocaleString()} · ₱{Math.max(0, g.target - g.saved).toLocaleString()} to go · Target ₱{g.target.toLocaleString()}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {goals.length > 0 && (
              <div style={glass({ padding: "24px" })}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Add money to a goal</div>
                <Row>
                  <Field label="Goal">
                    <select style={inputSt} value={goalAddId} onChange={e => setGoalAddId(e.target.value)}>
                      <option value="" style={{ background: "#0D2B0D" }}>Select goal</option>
                      {goals.map(g => <option key={g.id} value={g.id} style={{ background: "#0D2B0D" }}>{g.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Amount (₱)"><input style={inputSt} type="number" placeholder="200" value={goalAddAmt} onChange={e => setGoalAddAmt(e.target.value)} /></Field>
                </Row>
                <Btn onClick={addToGoal} style={{ marginTop: 14 }}>Add to goal</Btn>
              </div>
            )}

            <div style={glass({ padding: "24px" })}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>New goal</div>
              <Row>
                <Field label="Goal name"><input style={inputSt} type="text" placeholder="e.g. New shoes" value={goalName} onChange={e => setGoalName(e.target.value)} /></Field>
                <Field label="Target (₱)"><input style={inputSt} type="number" placeholder="1500" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} /></Field>
              </Row>
              <Btn onClick={addGoal} style={{ marginTop: 14 }}>Create goal</Btn>
            </div>
          </div>
        )}

        {/* WALLET */}
        {tab === "wallet" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, width: "100%" }}>
            <div style={{ ...glass({ padding: "28px 26px", position: "relative", overflow: "hidden" }), gridColumn: "1 / -1" }}>
              <div style={{ position: "absolute", top: -25, right: -25, width: 140, height: 140, borderRadius: "50%", background: "rgba(212,196,160,0.07)", filter: "blur(30px)" }} />
              <div style={{ fontSize: 10, color: G.textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>My Wallet</div>
              <div style={{ fontSize: 48, fontWeight: 700, letterSpacing: -2, color: walletBalance >= 0 ? G.green : G.red, marginBottom: 4 }}>₱{walletBalance.toLocaleString()}</div>
              <div style={{ fontSize: 13, color: G.textMuted }}>Cash you personally keep track of</div>
            </div>

            <div style={glass({ padding: "24px" })}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Add entry</div>
              <Row>
                <Field label="Type">
                  <select style={inputSt} value={walletType} onChange={e => setWalletType(e.target.value)}>
                    <option value="add" style={{ background: "#0D2B0D" }}>+ Added money</option>
                    <option value="spend" style={{ background: "#0D2B0D" }}>- Spent money</option>
                  </select>
                </Field>
                <Field label="Amount (₱)"><input style={inputSt} type="number" placeholder="100" value={walletAmt} onChange={e => setWalletAmt(e.target.value)} /></Field>
              </Row>
              <Row style={{ marginTop: 12 }}>
                <Field label="Description"><input style={inputSt} type="text" placeholder="e.g. Saved from lunch" value={walletDesc} onChange={e => setWalletDesc(e.target.value)} /></Field>
                <Field label="Date"><input style={inputSt} type="date" value={walletDate} onChange={e => setWalletDate(e.target.value)} /></Field>
              </Row>
              <Btn onClick={addWallet} style={{ marginTop: 16 }}>Save entry</Btn>
            </div>

            <div style={glass({ padding: "24px" })}>
              <div style={{ fontSize: 10, color: G.textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16 }}>History</div>
              {wallet.length === 0 && <div style={{ textAlign: "center", color: G.textMuted, padding: "24px 0", fontSize: 14 }}>No entries yet</div>}
              {[...wallet].sort((a,b) => new Date(b.date) - new Date(a.date)).map(w => {
                const isAdd = w.type === "add";
                const d = new Date(w.date);
                return (
                  <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: "1px solid rgba(232,220,200,0.05)" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: isAdd ? "rgba(168,200,152,0.12)" : "rgba(196,122,106,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, color: isAdd ? G.green : G.red, flexShrink: 0 }}>{isAdd ? "↑" : "↓"}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{w.description}</div>
                      <div style={{ fontSize: 11, color: G.textMuted }}>{(d.getMonth()+1)}/{d.getDate()}/{d.getFullYear()}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: isAdd ? G.green : G.red }}>{isAdd ? "+" : "-"}₱{w.amount.toLocaleString()}</div>
                    <button onClick={() => deleteWallet(w.id)} style={{ background: "rgba(196,122,106,0.1)", border: "1px solid rgba(196,122,106,0.22)", color: G.red, borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 15 }}>×</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 10, display: "flex", justifyContent: "center", padding: "0 32px 18px" }}>
        <div style={{ background: "rgba(10,31,10,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: `1px solid ${G.glassBorder}`, padding: "8px 12px", display: "flex", gap: 4, borderRadius: 28, width: "100%", boxShadow: "0 8px 40px rgba(0,0,0,0.7)" }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "9px 8px", borderRadius: 18, border: "none", cursor: "pointer", background: tab === t ? "rgba(212,196,160,0.14)" : "transparent", color: tab === t ? G.accent : G.textMuted, transition: "all 0.2s" }}>
              <span style={{ fontSize: 18 }}>{tabIcons[t]}</span>
              <span style={{ fontSize: 11, fontWeight: tab === t ? 600 : 400, textTransform: "capitalize", fontFamily: "sans-serif" }}>{t}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({ children, style = {} }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, ...style }}>{children}</div>;
}
function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 10, color: "rgba(237,232,220,0.38)", letterSpacing: 0.5 }}>{label}</label>
      {children}
    </div>
  );
}
function SectionTitle({ icon, iconBg, iconColor, title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div style={{ width: 32, height: 32, borderRadius: 10, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, color: iconColor }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
    </div>
  );
}
function Btn({ onClick, children, style = {} }) {
  return (
    <button onClick={onClick} style={{ width: "100%", padding: "12px", borderRadius: 13, background: "rgba(212,196,160,0.13)", border: "1px solid rgba(212,196,160,0.28)", color: "#EDE8DC", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'EB Garamond', 'Georgia', 'Times New Roman', serif", backdropFilter: "blur(10px)", transition: "all 0.15s", ...style }}>{children}</button>
  );
}