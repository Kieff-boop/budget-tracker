import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "./supabase";

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
function getInitials(name) { return (name || "?").slice(0, 2).toUpperCase(); }
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
};
const light = {
  bg: "linear-gradient(160deg, #f5f0e8 0%, #ede5d5 45%, #f8f3ea 100%)",
  glass: "rgba(120,90,40,0.05)", glassBorder: "rgba(120,90,40,0.14)",
  text: "#2C2416", textSub: "rgba(44,36,22,0.65)", textMuted: "rgba(44,36,22,0.38)",
  accent: "#8B5E20", accentSoft: "rgba(139,94,32,0.1)",
  red: "#B85042", green: "#4A8C62", yellow: "#9A7A20", indigo: "#5B4FB5", cream: "#2C2416",
  inputBg: "rgba(255,250,240,0.85)", navBg: "rgba(240,230,210,0.93)", tooltipBg: "rgba(245,240,232,0.98)",
};

// ─────────────────────────────────────────────
// AUTH SCREEN
// ─────────────────────────────────────────────
function AuthScreen({ isDark, setIsDark, onAuth }) {
  const isMobile = useMobile();
  const G = isDark ? dark : light;
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPass, setShowPass] = useState(false);

  const glassStyle = (extra = {}) => ({
    background: G.glass, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    border: `1px solid ${G.glassBorder}`, borderRadius: 18, ...extra,
  });
  const inputSt = {
    width: "100%", padding: "12px 14px", borderRadius: 11,
    border: `1px solid ${G.glassBorder}`, background: G.inputBg,
    color: G.text, fontSize: 15, outline: "none",
    fontFamily: "'EB Garamond', Georgia, serif", boxSizing: "border-box",
  };

  async function handleSubmit() {
    setError(""); setMessage("");
    if (!email.trim() || !password.trim()) return setError("Please fill in all fields.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true);
    if (mode === "signup") {
      // Sign up WITHOUT auto-creating a profile — user does that on the profile screen
      const { data, error: err } = await supabase.auth.signUp({ email: email.trim(), password });
      if (err) { setError(err.message); setLoading(false); return; }
      if (data.user) {
        setMessage("Account created! You can now log in.");
        setMode("login");
      }
    } else {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (err) { setError(err.message); setLoading(false); return; }
      if (data.user) onAuth(data.user);
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", width: "100vw", background: G.bg, fontFamily: "'EB Garamond', Georgia, serif", color: G.text, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: isMobile ? "24px 16px" : "40px 24px", boxSizing: "border-box", transition: "background 0.3s, color 0.3s" }}>
      <div style={{ position: "fixed", top: -80, left: -60, width: 300, height: 300, borderRadius: "50%", background: isDark ? "rgba(139,127,212,0.08)" : "rgba(139,94,32,0.06)", filter: "blur(90px)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -60, right: -40, width: 260, height: 260, borderRadius: "50%", background: isDark ? "rgba(200,169,110,0.07)" : "rgba(200,169,110,0.09)", filter: "blur(80px)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", top: 20, right: 20, zIndex: 10 }}>
        <button onClick={() => setIsDark(d => !d)} style={{ width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer", background: isDark ? "rgba(139,127,212,0.4)" : "rgba(139,94,32,0.3)", position: "relative" }}>
          <div style={{ position: "absolute", top: 3, left: isDark ? 3 : 19, width: 16, height: 16, borderRadius: "50%", background: isDark ? "#8B7FD4" : "#8B5E20", transition: "left 0.2s" }} />
        </button>
      </div>
      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: G.textMuted, textTransform: "uppercase", marginBottom: 8 }}>Budget Tracker</div>
          <div style={{ fontSize: isMobile ? 28 : 34, fontWeight: 700, color: G.cream, letterSpacing: -1, marginBottom: 6 }}>
            {mode === "login" ? "Welcome back" : "Create account"}
          </div>
          <div style={{ fontSize: 14, color: G.textMuted }}>
            {mode === "login" ? "Sign in to your budget" : "Start tracking your budget"}
          </div>
        </div>
        <div style={{ display: "flex", background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", borderRadius: 12, padding: 4, marginBottom: 24, border: `1px solid ${G.glassBorder}` }}>
          {["login","signup"].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(""); setMessage(""); }} style={{ flex: 1, padding: "9px", borderRadius: 9, border: "none", background: mode === m ? G.accentSoft : "transparent", color: mode === m ? G.accent : G.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
              {m === "login" ? "Log In" : "Sign Up"}
            </button>
          ))}
        </div>
        <div style={glassStyle({ padding: "28px 24px" })}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 10, color: G.textMuted, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Email</label>
              <input style={inputSt} type="email" placeholder="you@email.com" value={email} onChange={e => { setEmail(e.target.value); setError(""); }} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: G.textMuted, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Password</label>
              <div style={{ position: "relative" }}>
                <input style={{ ...inputSt, paddingRight: 44 }} type={showPass ? "text" : "password"} placeholder="Min. 6 characters" value={password} onChange={e => { setPassword(e.target.value); setError(""); }} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
                <button onClick={() => setShowPass(s => !s)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: G.textMuted, cursor: "pointer", fontSize: 14, padding: 0 }}>
                  {showPass ? "🙈" : "👁"}
                </button>
              </div>
            </div>
            {error && <div style={{ fontSize: 12, color: G.red, padding: "10px 14px", background: `${G.red}12`, borderRadius: 9, border: `1px solid ${G.red}25` }}>⚠ {error}</div>}
            {message && <div style={{ fontSize: 12, color: G.green, padding: "10px 14px", background: `${G.green}12`, borderRadius: 9, border: `1px solid ${G.green}25` }}>✓ {message}</div>}
            <button onClick={handleSubmit} disabled={loading} style={{ width: "100%", padding: "13px", borderRadius: 12, background: G.accentSoft, border: `1px solid ${G.accent}50`, color: G.accent, fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "all 0.15s", marginTop: 4, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Please wait..." : mode === "login" ? "Log In" : "Create Account"}
            </button>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: G.textMuted }}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <span style={{ color: G.accent, cursor: "pointer", fontWeight: 600 }} onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setMessage(""); }}>
            {mode === "login" ? "Sign up" : "Log in"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PROFILE SELECTOR
// ─────────────────────────────────────────────
function ProfileScreen({ authUser, isDark, setIsDark, onSelect, onSignOut }) {
  const isMobile = useMobile();
  const G = isDark ? dark : light;
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newCurrency, setNewCurrency] = useState("₱");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // profile username to confirm delete

  useEffect(() => {
    supabase.from("profiles").select("*")
      .eq("owner_id", authUser.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => { if (data) setProfiles(data); setLoading(false); });
  }, [authUser.id]);

  async function createProfile() {
    if (!newUsername.trim()) return setError("Please enter a name.");
    const username = newUsername.trim();
    const exists = profiles.some(p => p.username.toLowerCase() === username.toLowerCase());
    if (exists) return setError(`"${username}" already exists.`);
    setSaving(true);
    // Use insert (not upsert) to avoid constraint issues
    const { data, error: err } = await supabase.from("profiles").insert({
      username, currency: newCurrency, owner_id: authUser.id,
    }).select().single();
    if (err) { setError("Error: " + err.message); setSaving(false); return; }
    const newProfile = data || { username, currency: newCurrency, owner_id: authUser.id };
    setProfiles(s => [...s, newProfile]);
    setCreating(false);
    setNewUsername(""); setNewCurrency("₱"); setError("");
    setSaving(false);
    onSelect(newProfile);
  }

  async function deleteProfile(username) {
    // Delete all data associated with this profile first
    const oid = authUser.id;
    await Promise.all([
      supabase.from("transactions").delete().eq("owner_id", oid).eq("profile", username),
      supabase.from("goals").delete().eq("owner_id", oid).eq("profile", username),
      supabase.from("wallet").delete().eq("owner_id", oid).eq("profile", username),
      supabase.from("budgets").delete().eq("owner_id", oid).eq("profile", username),
    ]);
    // Then delete the profile itself
    await supabase.from("profiles").delete().eq("owner_id", oid).eq("username", username);
    setProfiles(s => s.filter(p => p.username !== username));
    setConfirmDelete(null);
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
      <div style={{ position: "fixed", top: -80, left: -60, width: 300, height: 300, borderRadius: "50%", background: isDark ? "rgba(139,127,212,0.08)" : "rgba(139,94,32,0.06)", filter: "blur(90px)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -60, right: -40, width: 260, height: 260, borderRadius: "50%", background: isDark ? "rgba(200,169,110,0.07)" : "rgba(200,169,110,0.09)", filter: "blur(80px)", pointerEvents: "none" }} />

      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px" }}>
        <div style={{ fontSize: 11, color: G.textMuted }}>Logged in as <span style={{ color: G.accent }}>{authUser.email}</span></div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => setIsDark(d => !d)} style={{ width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer", background: isDark ? "rgba(139,127,212,0.4)" : "rgba(139,94,32,0.3)", position: "relative" }}>
            <div style={{ position: "absolute", top: 3, left: isDark ? 3 : 19, width: 16, height: 16, borderRadius: "50%", background: isDark ? "#8B7FD4" : "#8B5E20", transition: "left 0.2s" }} />
          </button>
          <button onClick={onSignOut} style={{ background: `${G.red}15`, border: `1px solid ${G.red}30`, color: G.red, fontSize: 12, padding: "6px 14px", borderRadius: 18, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>Sign out</button>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ ...glassStyle({ padding: "28px 24px" }), maxWidth: 360, width: "100%", background: isDark ? "rgba(20,12,30,0.97)" : "rgba(245,240,232,0.97)" }}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: G.cream }}>Delete "{confirmDelete}"?</div>
            <div style={{ fontSize: 13, color: G.textMuted, marginBottom: 22, lineHeight: 1.6 }}>
              This will permanently delete this profile and <strong style={{ color: G.red }}>all its transactions, goals, wallet entries, and budgets</strong>. This cannot be undone.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: "11px", borderRadius: 11, background: "transparent", border: `1px solid ${G.glassBorder}`, color: G.textMuted, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              <button onClick={() => deleteProfile(confirmDelete)} style={{ flex: 1, padding: "11px", borderRadius: 11, background: `${G.red}18`, border: `1px solid ${G.red}40`, color: G.red, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Delete Profile</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ width: "100%", maxWidth: isMobile ? "100%" : 480, position: "relative", zIndex: 1, marginTop: 40 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: G.textMuted, textTransform: "uppercase", marginBottom: 8 }}>Budget Tracker</div>
          <div style={{ fontSize: isMobile ? 26 : 32, fontWeight: 700, color: G.cream, letterSpacing: -1, marginBottom: 6 }}>Who's budgeting?</div>
          <div style={{ fontSize: 13, color: G.textMuted }}>Your account — select or add a profile</div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", color: G.textMuted, padding: "32px 0" }}>Loading profiles...</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
            {profiles.map(p => {
              const avatarColor = hashColor(p.username);
              return (
                <div key={p.username} style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", background: G.glass, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: `1px solid ${G.glassBorder}`, borderRadius: 14 }}>
                  {/* Clickable profile area */}
                  <button onClick={() => onSelect(p)} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, background: "transparent", border: "none", cursor: "pointer", color: G.text, fontFamily: "inherit", textAlign: "left", padding: 0 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${avatarColor}25`, border: `2px solid ${avatarColor}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: avatarColor, flexShrink: 0 }}>
                      {getInitials(p.username)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{p.username}</div>
                      <div style={{ fontSize: 12, color: G.textMuted, marginTop: 2 }}>Currency: {p.currency}</div>
                    </div>
                    <div style={{ fontSize: 18, color: G.textMuted }}>→</div>
                  </button>
                  {/* Delete button */}
                  <button onClick={() => setConfirmDelete(p.username)} title="Delete profile" style={{ width: 32, height: 32, borderRadius: 9, background: `${G.red}12`, border: `1px solid ${G.red}30`, color: G.red, cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>×</button>
                </div>
              );
            })}
          </div>
        )}

        {!creating ? (
          <button onClick={() => setCreating(true)} style={{ width: "100%", padding: "13px", borderRadius: 14, background: G.accentSoft, border: `1px solid ${G.accent}40`, color: G.accent, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Add Profile
          </button>
        ) : (
          <div style={glassStyle({ padding: "22px" })}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: G.cream }}>New Profile</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 10, color: G.textMuted, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Name</label>
                <input style={inputSt} type="text" placeholder="e.g. Alex" value={newUsername} onChange={e => { setNewUsername(e.target.value); setError(""); }} autoFocus onKeyDown={e => e.key === "Enter" && createProfile()} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: G.textMuted, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Currency</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {CURRENCIES.map(c => (
                    <button key={c} onClick={() => setNewCurrency(c)} style={{ padding: "7px 13px", borderRadius: 9, fontSize: 14, fontWeight: 600, border: `1px solid ${newCurrency === c ? G.accent : G.glassBorder}`, background: newCurrency === c ? G.accentSoft : "transparent", color: newCurrency === c ? G.accent : G.textMuted, cursor: "pointer", fontFamily: "inherit" }}>{c}</button>
                  ))}
                </div>
              </div>
              {error && <div style={{ fontSize: 12, color: G.red, padding: "8px 12px", background: `${G.red}12`, borderRadius: 8 }}>{error}</div>}
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button onClick={() => { setCreating(false); setNewUsername(""); setError(""); }} style={{ flex: 1, padding: "10px", borderRadius: 11, background: "transparent", border: `1px solid ${G.glassBorder}`, color: G.textMuted, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                <button onClick={createProfile} disabled={saving} style={{ flex: 2, padding: "10px", borderRadius: 11, background: G.accentSoft, border: `1px solid ${G.accent}50`, color: G.accent, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{saving ? "Saving..." : "Create"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN BUDGET APP
// ─────────────────────────────────────────────
function BudgetApp({ authUser, activeProfile, onSwitchProfile, onSignOut, isDark, setIsDark }) {
  const isMobile = useMobile();
  const G = isDark ? dark : light;
  const CUR = activeProfile?.currency || "₱";
  const P = activeProfile?.username;
  const OID = authUser.id;

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

  const [budgetCatType, setBudgetCatType] = useState("standard");
  const [budgetStdCat, setBudgetStdCat] = useState("Food");
  const [budgetCustomName, setBudgetCustomName] = useState("");
  const [budgetAmt, setBudgetAmt] = useState("");

  useEffect(() => {
    document.documentElement.classList.toggle("light", !isDark);
  }, [isDark]);

  useEffect(() => {
    if (!activeProfile) return;
    async function loadAll() {
      setLoading(true);
      const [txRes, goalsRes, walletRes, budgetsRes] = await Promise.all([
        supabase.from("transactions").select("*").eq("owner_id", OID).eq("profile", P).order("date", { ascending: false }),
        supabase.from("goals").select("*").eq("owner_id", OID).eq("profile", P).order("created_at", { ascending: true }),
        supabase.from("wallet").select("*").eq("owner_id", OID).eq("profile", P).order("date", { ascending: false }),
        supabase.from("budgets").select("*").eq("owner_id", OID).eq("profile", P),
      ]);
      if (txRes.data) setTransactions(txRes.data);
      if (goalsRes.data) setGoals(goalsRes.data);
      if (walletRes.data) setWallet(walletRes.data);
      if (budgetsRes.data) {
        const map = {};
        budgetsRes.data.forEach(b => { map[b.category] = { amount: b.amount, color: b.color || STD_COLORS[b.category] || "#8B7FD4", isCustom: b.is_custom || false }; });
        setBudgets(map);
      }
      setLoading(false);
    }
    loadAll();
    setTab("overview");
    setSelectedMonth(currentMonthKey());
  }, [activeProfile, OID, P]);

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
    txForMonth(selectedMonth).filter(t => t.type === "expense").forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return map;
  };

  const catBudgetData = () => {
    const spending = catSpending();
    const rows = [];
    STD_CATEGORIES.forEach(cat => {
      const b = budgets[cat]; const budget = b?.amount || 0; const spent = spending[cat] || 0;
      if (budget === 0 && spent === 0) return;
      const remaining = budget - spent; const p = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
      rows.push({ cat, displayCat: cat, budget, spent, remaining, p, color: STD_COLORS[cat] || G.accent });
    });
    customCats.forEach(c => {
      const budget = c.amount || 0; const directSpent = spending[c.name] || 0;
      const otherKey = Object.keys(spending).find(k => k.startsWith("Other:") && k.slice(6).trim().toLowerCase() === c.name.toLowerCase());
      const spent = directSpent + (otherKey ? spending[otherKey] : 0);
      if (budget === 0 && spent === 0) return;
      const remaining = budget - spent; const p = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
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

  async function addIncome() {
    if (!incAmount || !incDate) return alert("Enter amount and date.");
    const tx = { id: uid(), type: "income", amount: parseFloat(incAmount), date: incDate, description: incNote || "Allowance", category: "Income", profile: P, owner_id: OID };
    const { error } = await supabase.from("transactions").insert(tx);
    if (error) return alert("Error: " + error.message);
    setTransactions(s => [tx, ...s]); setIncAmount(""); setIncNote("");
  }

  async function addExpense() {
    if (!expAmount || !expDate) return alert("Enter amount and date.");
    if (expCat === "Other" && !expOtherLabel.trim()) return alert("Please specify what this expense is.");
    let category = expCat;
    if (expCat === "Other") {
      const match = customCats.find(c => c.name.toLowerCase() === expOtherLabel.trim().toLowerCase());
      category = match ? match.name : `Other:${expOtherLabel.trim()}`;
    }
    const tx = { id: uid(), type: "expense", amount: parseFloat(expAmount), date: expDate, description: expDesc || displayCategory(category), category, profile: P, owner_id: OID };
    const { error } = await supabase.from("transactions").insert(tx);
    if (error) return alert("Error: " + error.message);
    setTransactions(s => [tx, ...s]); setExpAmount(""); setExpDesc(""); setExpOtherLabel("");
  }

  async function saveBudget() {
    if (!budgetAmt) return alert("Enter a budget amount.");
    let catKey, isCustom, color;
    if (budgetCatType === "standard") { catKey = budgetStdCat; isCustom = false; color = STD_COLORS[budgetStdCat]; }
    else { if (!budgetCustomName.trim()) return alert("Enter a category name."); catKey = budgetCustomName.trim(); isCustom = true; color = budgets[catKey]?.color || CUSTOM_PALETTE[customCats.length % CUSTOM_PALETTE.length]; }
    const { error } = await supabase.from("budgets").upsert({ category: catKey, amount: parseFloat(budgetAmt), color, is_custom: isCustom, profile: P, owner_id: OID });
    if (error) return alert("Error: " + error.message);
    setBudgets(s => ({ ...s, [catKey]: { amount: parseFloat(budgetAmt), color, isCustom } }));
    setBudgetAmt(""); if (budgetCatType === "custom") setBudgetCustomName("");
  }

  async function deleteBudget(catKey) {
    await supabase.from("budgets").delete().eq("category", catKey).eq("owner_id", OID).eq("profile", P);
    setBudgets(s => { const n = { ...s }; delete n[catKey]; return n; });
  }

  async function addGoal() {
    if (!goalName || !goalTarget) return alert("Enter goal name and target.");
    const g = { id: uid(), name: goalName, target: parseFloat(goalTarget), saved: 0, profile: P, owner_id: OID };
    const { error } = await supabase.from("goals").insert(g);
    if (error) return alert("Error: " + error.message);
    setGoals(s => [...s, g]); setGoalName(""); setGoalTarget("");
  }

  async function addToGoal() {
    if (!goalAddId || !goalAddAmt) return alert("Select a goal and enter amount.");
    const goal = goals.find(g => g.id === goalAddId);
    const newSaved = Math.min(goal.target, goal.saved + parseFloat(goalAddAmt));
    await supabase.from("goals").update({ saved: newSaved }).eq("id", goalAddId);
    setGoals(s => s.map(g => g.id === goalAddId ? { ...g, saved: newSaved } : g)); setGoalAddAmt("");
  }

  async function addWallet() {
    if (!walletAmt || !walletDate) return alert("Enter amount and date.");
    const entry = { id: uid(), type: walletType, amount: parseFloat(walletAmt), description: walletDesc || (walletType === "add" ? "Added money" : "Spent money"), date: walletDate, profile: P, owner_id: OID };
    const { error } = await supabase.from("wallet").insert(entry);
    if (error) return alert("Error: " + error.message);
    setWallet(s => [entry, ...s]); setWalletAmt(""); setWalletDesc("");
  }

  async function deleteTx(id) { await supabase.from("transactions").delete().eq("id", id); setTransactions(s => s.filter(t => t.id !== id)); }
  async function deleteGoal(id) { await supabase.from("goals").delete().eq("id", id); setGoals(s => s.filter(g => g.id !== id)); }
  async function deleteWallet(id) { await supabase.from("wallet").delete().eq("id", id); setWallet(s => s.filter(w => w.id !== id)); }

  const glassStyle = (extra = {}) => ({ background: G.glass, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: `1px solid ${G.glassBorder}`, borderRadius: isMobile ? 14 : 16, ...extra });
  const inputSt = { width: "100%", padding: isMobile ? "10px 12px" : "9px 12px", borderRadius: 10, border: `1px solid ${G.glassBorder}`, background: G.inputBg, color: G.text, fontSize: isMobile ? 14 : 13, outline: "none", fontFamily: "'EB Garamond', Georgia, serif" };
  const grid2 = { display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 14 : 20, width: "100%" };
  const tabs = ["overview", "add", "expenses", "goals", "wallet"];
  const tabIcons = { overview: "⌂", add: "+", expenses: "≡", goals: "◎", wallet: "◇" };
  const avatarColor = hashColor(P || "");

  if (loading) return (
    <div style={{ minHeight: "100vh", background: G.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'EB Garamond', Georgia, serif", color: G.textMuted, fontSize: 16, gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: `2px solid ${G.glassBorder}`, borderTop: `2px solid ${G.accent}`, animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      Loading {P}'s budget...
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", width: "100vw", background: G.bg, fontFamily: "'EB Garamond', Georgia, serif", color: G.text, overflowX: "hidden", transition: "background 0.3s, color 0.3s" }}>
      <div style={{ position: "fixed", top: -100, left: -60, width: isMobile ? 260 : 400, height: isMobile ? 260 : 400, borderRadius: "50%", background: isDark ? "rgba(139,127,212,0.07)" : "rgba(139,94,32,0.05)", filter: "blur(100px)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: -80, right: -50, width: isMobile ? 220 : 360, height: isMobile ? 220 : 360, borderRadius: "50%", background: isDark ? "rgba(200,169,110,0.06)" : "rgba(200,169,110,0.08)", filter: "blur(90px)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", minHeight: "100vh", padding: isMobile ? "18px 16px 80px" : "24px 32px 90px", boxSizing: "border-box" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isMobile ? 20 : 28, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={onSwitchProfile} title="Switch Profile" style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 12px 7px 7px", background: G.glass, border: `1px solid ${G.glassBorder}`, borderRadius: 28, cursor: "pointer", color: G.text, fontFamily: "inherit", transition: "all 0.18s" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: `${avatarColor}25`, border: `2px solid ${avatarColor}60`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: avatarColor, flexShrink: 0 }}>{getInitials(P)}</div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.2, color: G.text }}>{P}</div>
                <div style={{ fontSize: 9, color: G.textMuted }}>switch ↗</div>
              </div>
            </button>
            <div>
              <div style={{ fontSize: 9, letterSpacing: 3, color: G.textMuted, textTransform: "uppercase", marginBottom: 1 }}>Budget Tracker</div>
              <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 700, letterSpacing: -0.5, color: G.cream }}>{monthLabel(selectedMonth)}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12 }}>{isDark ? "🌙" : "☀️"}</span>
            <button onClick={() => setIsDark(d => !d)} style={{ width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer", background: isDark ? "rgba(139,127,212,0.4)" : "rgba(139,94,32,0.3)", position: "relative" }}>
              <div style={{ position: "absolute", top: 3, left: isDark ? 3 : 19, width: 16, height: 16, borderRadius: "50%", background: isDark ? "#8B7FD4" : "#8B5E20", transition: "left 0.2s" }} />
            </button>
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ ...inputSt, width: "auto", fontSize: 11, padding: "6px 10px", cursor: "pointer" }}>
              {allMonths().map(m => <option key={m} value={m} style={{ background: isDark ? "#0f0f1a" : "#f5f0e8" }}>{monthLabel(m)}</option>)}
            </select>
            {!isMobile && <button onClick={onSignOut} style={{ background: `${G.red}15`, border: `1px solid ${G.red}30`, color: G.red, fontSize: 11, padding: "6px 12px", borderRadius: 16, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>Sign out</button>}
          </div>
        </div>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div style={grid2}>
            <div style={{ ...glassStyle({ padding: isMobile ? "22px 18px" : "28px 26px", position: "relative", overflow: "hidden" }) }}>
              <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: `${G.accent}0A`, filter: "blur(40px)" }} />
              <div style={{ fontSize: 9, color: G.textMuted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Remaining Balance</div>
              <div style={{ fontSize: isMobile ? 36 : 50, fontWeight: 700, letterSpacing: -2, color: balColor, marginBottom: 18 }}>{CUR}{balance.toLocaleString()}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[{ label: "Allowance", val: `${CUR}${income.toLocaleString()}`, color: G.green }, { label: "Spent", val: `${CUR}${expenses.toLocaleString()}`, color: G.red }, { label: "Used", val: `${pct}%`, color: G.yellow }].map(m => (
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
              {catBudgetData().length === 0 && <div style={{ textAlign: "center", color: G.textMuted, fontSize: 13, padding: "20px 0" }}>No data yet — <span style={{ color: G.accent, cursor: "pointer", textDecoration: "underline" }} onClick={() => setTab("add")}>add a transaction</span></div>}
              {catBudgetData().map(({ cat, displayCat, budget, spent, remaining, p, color }) => {
                const over = budget > 0 && spent > budget;
                return (
                  <div key={cat} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}><div style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0 }} /><span style={{ fontSize: 13, fontWeight: 500 }}>{displayCat}</span></div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 12, color: over ? G.red : G.textSub }}>{CUR}{spent.toLocaleString()}{budget > 0 && <span style={{ color: G.textMuted }}> / {CUR}{budget.toLocaleString()}</span>}</div>
                        {budget > 0 && <div style={{ fontSize: 10, color: over ? G.red : G.green, fontWeight: 600 }}>{over ? `−${CUR}${Math.abs(remaining).toLocaleString()} over` : `${CUR}${remaining.toLocaleString()} left`}</div>}
                      </div>
                    </div>
                    {budget > 0 && <div style={{ height: 3, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", borderRadius: 2 }}><div style={{ height: 3, width: `${Math.min(100, p)}%`, borderRadius: 2, background: over ? G.red : color, transition: "width 0.5s ease" }} /></div>}
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
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: c }} /><span style={{ fontSize: 11, color: G.textMuted }}>{l}</span></div>
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

        {/* ADD */}
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
                    <input style={{ ...inputSt, borderColor: G.accent, background: G.accentSoft }} type="text" placeholder="e.g. Haircut, Medicine..." value={expOtherLabel} onChange={e => setExpOtherLabel(e.target.value)} autoFocus />
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
                    : <input style={inputSt} type="text" placeholder="e.g. Bills, Rent..." value={budgetCustomName} onChange={e => setBudgetCustomName(e.target.value)} />
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

        {/* EXPENSES */}
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

        {/* GOALS */}
        {tab === "goals" && (
          <div style={grid2}>
            <div style={{ ...glassStyle({ padding: isMobile ? "16px" : "24px" }), gridColumn: isMobile ? "1" : "1 / -1" }}>
              <div style={{ fontSize: 9, color: G.textMuted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>Savings Goals</div>
              {goals.length === 0 && <div style={{ textAlign: "center", color: G.textMuted, padding: "20px 0", fontSize: 14 }}>No goals yet!</div>}
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

        {/* WALLET */}
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
                <Field G={G} label="Type"><select style={inputSt} value={walletType} onChange={e => setWalletType(e.target.value)}><option value="add" style={{ background: isDark ? "#0f0f1a" : "#f5f0e8" }}>+ Added</option><option value="spend" style={{ background: isDark ? "#0f0f1a" : "#f5f0e8" }}>- Spent</option></select></Field>
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
                const isAdd = w.type === "add"; const d = new Date(w.date);
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

      {/* Bottom nav */}
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

// ─────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────
export default function App() {
  const [isDark, setIsDark] = useState(true);
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeProfile, setActiveProfile] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
      if (!session) setActiveProfile(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setAuthUser(null);
    setActiveProfile(null);
  }

  if (authLoading) return (
    <div style={{ minHeight: "100vh", background: dark.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'EB Garamond', Georgia, serif", color: dark.textMuted, fontSize: 16 }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: `2px solid rgba(200,190,255,0.1)`, borderTop: `2px solid #C8A96E`, animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!authUser) return <AuthScreen isDark={isDark} setIsDark={setIsDark} onAuth={setAuthUser} />;
  if (!activeProfile) return <ProfileScreen authUser={authUser} isDark={isDark} setIsDark={setIsDark} onSelect={setActiveProfile} onSignOut={handleSignOut} />;
  return <BudgetApp authUser={authUser} activeProfile={activeProfile} onSwitchProfile={() => setActiveProfile(null)} onSignOut={handleSignOut} isDark={isDark} setIsDark={setIsDark} />;
}

function MRow({ isMobile, children, style = {} }) {
  return <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 10 : 12, ...style }}>{children}</div>;
}
function Field({ G, label, children }) {
  return <div style={{ display: "flex", flexDirection: "column", gap: 5 }}><label style={{ fontSize: 10, color: G.textMuted, letterSpacing: 0.5 }}>{label}</label>{children}</div>;
}
function SectionTitle({ G, icon, iconBg, iconColor, title }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}><div style={{ width: 30, height: 30, borderRadius: 9, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: iconColor }}>{icon}</div><div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div></div>;
}
function Btn({ G, onClick, children, style = {} }) {
  return <button onClick={onClick} style={{ width: "100%", padding: "11px", borderRadius: 12, background: G.accentSoft, border: `1px solid ${G.accent}40`, color: G.accent, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'EB Garamond', Georgia, serif", transition: "all 0.15s", ...style }}>{children}</button>;
}
