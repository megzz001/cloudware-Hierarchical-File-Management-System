import { useState, useRef, useCallback, useEffect } from "react";
import * as api from "./api";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const colors = {
  primary: "#004bca",
  primaryContainer: "#0061ff",
  onPrimary: "#ffffff",
  primaryFixed: "#dbe1ff",
  primaryFixedDim: "#b4c5ff",
  secondary: "#595f67",
  secondaryContainer: "#dee3ed",
  tertiary: "#774e00",
  tertiaryFixed: "#ffddb3",
  surface: "#f9f9ff",
  surfaceBright: "#f9f9ff",
  surfaceContainer: "#ebedf9",
  surfaceContainerLow: "#f1f3ff",
  surfaceContainerHigh: "#e5e8f3",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerHighest: "#dfe2ed",
  onSurface: "#181c23",
  onSurfaceVariant: "#424656",
  outline: "#737687",
  outlineVariant: "#c2c6d9",
  error: "#ba1a1a",
  inverseOnSurface: "#eef0fc",
  inverseSurface: "#2c3039",
};

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: ${colors.surface};
    color: ${colors.onSurface};
    -webkit-font-smoothing: antialiased;
  }

  .msymbol {
    font-family: 'Material Symbols Outlined';
    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
    font-size: 24px;
    line-height: 1;
    display: inline-block;
    vertical-align: middle;
  }
  .msymbol.filled { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes pulse-ring {
    0%,100% { box-shadow: 0 0 0 0 rgba(0,75,202,0.25); }
    50%      { box-shadow: 0 0 0 8px rgba(0,75,202,0); }
  }
  @keyframes floatBlob {
    0%,100% { transform: translateY(0px) scale(1); }
    50%      { transform: translateY(-20px) scale(1.04); }
  }

  .fade-up { animation: fadeUp 0.5s ease both; }
  .fade-up-1 { animation: fadeUp 0.5s 0.08s ease both; }
  .fade-up-2 { animation: fadeUp 0.5s 0.16s ease both; }
  .fade-up-3 { animation: fadeUp 0.5s 0.24s ease both; }
  .fade-up-4 { animation: fadeUp 0.5s 0.32s ease both; }

  .btn-primary {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    background: ${colors.primary}; color: ${colors.onPrimary};
    border: none; border-radius: 12px; padding: 14px 28px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 15px; font-weight: 700; cursor: pointer;
    transition: all 0.18s cubic-bezier(.4,0,.2,1);
    box-shadow: 0 2px 8px rgba(0,75,202,0.22);
  }
  .btn-primary:hover { background: #003aab; box-shadow: 0 4px 16px rgba(0,75,202,0.3); transform: translateY(-1px); }
  .btn-primary:active { transform: scale(0.97); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  .btn-ghost {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    background: transparent; color: ${colors.onSurfaceVariant};
    border: 1.5px solid ${colors.outlineVariant}; border-radius: 12px; padding: 13px 24px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 15px; font-weight: 600; cursor: pointer;
    transition: all 0.18s ease;
  }
  .btn-ghost:hover { background: ${colors.surfaceContainerHigh}; color: ${colors.onSurface}; }

  .input-field {
    width: 100%;
    padding: 13px 16px;
    border: 1.5px solid ${colors.outlineVariant};
    border-radius: 12px;
    background: ${colors.surfaceBright};
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 15px; color: ${colors.onSurface};
    outline: none;
    transition: border-color 0.18s, box-shadow 0.18s;
  }
  .input-field:focus {
    border-color: ${colors.primary};
    box-shadow: 0 0 0 3px rgba(0,75,202,0.12);
  }
  .input-field::placeholder { color: ${colors.outline}; }

  .card-lift {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .card-lift:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.10) !important;
  }

  .overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.45);
    display: flex; align-items: center; justify-content: center;
    z-index: 200; padding: 20px;
  }
`;

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 24, filled = false, style = {}, className = "" }) => (
  <span
    className={`msymbol${filled ? " filled" : ""}${className ? " " + className : ""}`}
    style={{ fontSize: size, ...style }}
  >
    {name}
  </span>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatSize = (bytes) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const formatDate = (ts) => {
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return Math.floor(diff / 60000) + "m ago";
  if (diff < 86400000) return Math.floor(diff / 3600000) + "h ago";
  return d.toLocaleDateString();
};

const getFileIcon = (type, name) => {
  if (type.startsWith("image/")) return { icon: "image", color: "#fde8f4", iconColor: "#e040a0" };
  if (type === "application/pdf" || name.endsWith(".pdf")) return { icon: "picture_as_pdf", color: "#fee2e2", iconColor: "#dc2626" };
  if (name.endsWith(".zip") || name.endsWith(".rar")) return { icon: "folder_zip", color: "#dbeafe", iconColor: "#2563eb" };
  if (name.endsWith(".xlsx") || name.endsWith(".csv")) return { icon: "table_chart", color: "#d1fae5", iconColor: "#059669" };
  if (name.endsWith(".docx") || name.endsWith(".doc")) return { icon: "description", color: "#ede9fe", iconColor: "#7c3aed" };
  if (name.endsWith(".mp4") || name.endsWith(".mov")) return { icon: "video_file", color: "#fef3c7", iconColor: "#d97706" };
  if (name.endsWith(".mp3") || name.endsWith(".wav")) return { icon: "audio_file", color: "#ecfdf5", iconColor: "#059669" };
  return { icon: "draft", color: colors.surfaceContainerHigh, iconColor: colors.onSurfaceVariant };
};

// ─── TopBar ───────────────────────────────────────────────────────────────────
const TopBar = ({ user, onNav }) => (
  <header style={{
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 24px", height: 64,
    background: colors.surface,
    borderBottom: `1px solid ${colors.outlineVariant}`,
  }}>
    <button onClick={() => onNav("dashboard")} style={{
      display: "flex", alignItems: "center", gap: 10,
      background: "none", border: "none", cursor: "pointer",
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: colors.primary,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon name="cloud" size={20} style={{ color: "#fff" }} />
      </div>
      <span style={{
        fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20,
        color: colors.primary, letterSpacing: "-0.5px",
      }}>CloudBox</span>
    </button>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <button onClick={() => onNav("profile")} style={{
        width: 34, height: 34, borderRadius: "50%",
        border: `2px solid ${colors.outlineVariant}`,
        overflow: "hidden", cursor: "pointer",
        background: colors.primaryFixed,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon name="person" size={18} style={{ color: colors.primary }} filled />
      </button>
    </div>
  </header>
);

// ─── Bottom Nav ───────────────────────────────────────────────────────────────
const BottomNav = ({ active, onNav }) => {
  const tabs = [
    { id: "dashboard", icon: "home", label: "Home" },
    { id: "files", icon: "folder", label: "My Files" },
    { id: "upload", icon: "add_circle", label: "Upload" },
    { id: "profile", icon: "person", label: "Profile" },
  ];
  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      display: "flex", justifyContent: "space-around", alignItems: "center",
      padding: "10px 8px 16px",
      background: colors.surface,
      borderTop: `1px solid ${colors.outlineVariant}`,
      zIndex: 100,
    }}>
      {tabs.map(t => {
        const isActive = active === t.id;
        return (
          <button key={t.id} onClick={() => onNav(t.id)} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            background: isActive ? colors.primaryFixed : "transparent",
            border: "none", cursor: "pointer",
            padding: "8px 16px", borderRadius: 24,
            color: isActive ? colors.primary : colors.onSurfaceVariant,
            transition: "all 0.18s ease",
          }}>
            <Icon name={t.icon} size={22} filled={isActive} style={{ color: "inherit" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "inherit" }}>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

// ═══════════════════════════════════════════════════════════════════
// PAGE 0 — HOME
// ═══════════════════════════════════════════════════════════════════
const HomePage = ({ user, onLogin, onSignup, onOpenDashboard, onUpload }) => (
  <div style={{
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px 20px 96px",
    background: `radial-gradient(circle at top left, rgba(0,75,202,0.12), transparent 30%), radial-gradient(circle at bottom right, rgba(180,197,255,0.2), transparent 32%), ${colors.surface}`,
    position: "relative",
    overflow: "hidden",
  }}>
    {[
      { top: -100, left: -120, color: "#004bca", size: 280 },
      { bottom: -140, right: -100, color: "#b4c5ff", size: 320 },
    ].map((b, i) => (
      <div key={i} style={{
        position: "absolute", borderRadius: "50%",
        width: b.size, height: b.size,
        top: b.top, left: b.left, right: b.right, bottom: b.bottom,
        background: b.color, opacity: 0.14,
        filter: "blur(70px)", zIndex: 0,
        animation: `floatBlob ${4 + i}s ease-in-out infinite`,
      }} />
    ))}

    <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 1080 }}>
      <div className="fade-up" style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 24,
        alignItems: "center",
      }}>
        <div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            padding: "8px 14px", borderRadius: 999,
            background: colors.primaryFixed,
            color: colors.primary,
            fontSize: 13, fontWeight: 700,
            marginBottom: 18,
          }}>
            <Icon name="cloud" size={18} filled /> Cloudware file vault
          </div>
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: "clamp(36px, 6vw, 64px)",
            lineHeight: 1.02,
            letterSpacing: "-1.5px",
            color: colors.onSurface,
            marginBottom: 18,
          }}>
            Keep files organized.
            <br />
            Upload only when you sign in.
          </h1>
          <p style={{ color: colors.onSurfaceVariant, fontSize: 16, lineHeight: 1.7, maxWidth: 560, marginBottom: 28 }}>
            Start on a public home page, explore the platform, and move into the upload flow only after logging in.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 28 }}>
            <button className="btn-primary" onClick={user ? onOpenDashboard : onSignup}>
              <Icon name={user ? "dashboard" : "person_add"} size={18} style={{ color: "#fff" }} />
              {user ? "Open Dashboard" : "Create Account"}
            </button>
            <button className="btn-ghost" onClick={user ? onUpload : onLogin}>
              <Icon name={user ? "cloud_upload" : "login"} size={18} />
              {user ? "Upload Files" : "Login"}
            </button>
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[
              { value: "Private upload", label: "Login required" },
              { value: "Fast access", label: "Open dashboard after sign in" },
              { value: "Simple flow", label: "Home first, action second" },
            ].map((item) => (
              <div key={item.value} style={{
                minWidth: 160,
                padding: 16,
                borderRadius: 18,
                background: "rgba(255,255,255,0.72)",
                backdropFilter: "blur(10px)",
                border: `1px solid ${colors.outlineVariant}`,
              }}>
                <p style={{ fontWeight: 800, color: colors.onSurface, marginBottom: 4 }}>{item.value}</p>
                <p style={{ fontSize: 13, color: colors.onSurfaceVariant, lineHeight: 1.5 }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="fade-up-1" style={{
          background: "rgba(255,255,255,0.88)",
          border: `1.5px solid ${colors.outlineVariant}`,
          borderRadius: 28,
          padding: 24,
          boxShadow: "0 20px 60px rgba(0,0,0,0.10)",
          backdropFilter: "blur(14px)",
        }}>
          <div style={{
            borderRadius: 20,
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryContainer})`,
            padding: 28,
            color: "#fff",
            marginBottom: 16,
          }}>
            <Icon name="lock" size={28} style={{ color: "#fff", marginBottom: 12 }} filled />
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, lineHeight: 1.05, marginBottom: 10 }}>
              Uploads stay protected.
            </h2>
            <p style={{ opacity: 0.92, lineHeight: 1.6 }}>
              If someone clicks Upload without being logged in, they will be sent to the login page first.
            </p>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {[
              { icon: "home", title: "Public home page", text: "Everyone lands here first." },
              { icon: "login", title: "Login gate", text: "Upload prompts sign in when needed." },
              { icon: "folder", title: "Private dashboard", text: "Signed-in users continue to files and upload." },
            ].map((card) => (
              <div key={card.title} style={{
                display: "flex", gap: 14, alignItems: "flex-start",
                padding: 14, borderRadius: 16,
                background: colors.surfaceContainerLow,
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 12,
                  background: colors.primaryFixed,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Icon name={card.icon} size={20} style={{ color: colors.primary }} filled />
                </div>
                <div>
                  <p style={{ fontWeight: 800, color: colors.onSurface, marginBottom: 4 }}>{card.title}</p>
                  <p style={{ fontSize: 13, color: colors.onSurfaceVariant, lineHeight: 1.5 }}>{card.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════
// PAGE 1 — SIGN UP / LOGIN
// ═══════════════════════════════════════════════════════════════════
const AuthPage = ({ onAuth, message = "", initialMode = "signup" }) => {
  const [mode, setMode] = useState(initialMode);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    if (mode === "signup" && !name) { setError("Please enter your name."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);

    try {
      const result = mode === "signup"
        ? await api.register({ name, email, password })
        : await api.login({ email, password });
      const { files, folders } = await api.fetchUserData();
      onAuth(result.user, files, folders);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "32px 20px",
      background: colors.surface,
      position: "relative", overflow: "hidden",
    }}>
      {[
        { top: -120, left: -100, color: "#004bca", size: 280 },
        { bottom: -140, right: -120, color: "#b4c5ff", size: 320 },
      ].map((b, i) => (
        <div key={i} style={{
          position: "absolute", borderRadius: "50%",
          width: b.size, height: b.size,
          top: b.top, left: b.left, right: b.right, bottom: b.bottom,
          background: b.color, opacity: 0.12,
          filter: "blur(70px)", zIndex: 0,
          animation: `floatBlob ${4 + i}s ease-in-out infinite`,
        }} />
      ))}

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 420 }}>
        <div className="fade-up" style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 18,
            background: colors.primary,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 24px rgba(0,75,202,0.3)",
            marginBottom: 20,
          }}>
            <Icon name="cloud" size={32} style={{ color: "#fff" }} />
          </div>
          <h1 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 800,
            fontSize: 26, color: colors.onSurface, letterSpacing: "-0.8px", marginBottom: 8,
          }}>
            {mode === "signup" ? "Create your CloudBox account" : "Welcome back"}
          </h1>
          <p style={{ color: colors.onSurfaceVariant, fontSize: 14, lineHeight: 1.6 }}>
            {mode === "signup" ? "Secure file management starts here." : "Sign in to access your files."}
          </p>
          {message && (
            <p style={{
              marginTop: 12,
              fontSize: 13,
              lineHeight: 1.5,
              color: colors.primary,
              background: colors.primaryFixed,
              borderRadius: 12,
              padding: "10px 12px",
            }}>
              {message}
            </p>
          )}
        </div>

        <div className="fade-up-1" style={{
          background: colors.surfaceContainerLowest,
          borderRadius: 20,
          border: `1.5px solid ${colors.outlineVariant}`,
          padding: 28,
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {mode === "signup" && (
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: colors.onSurfaceVariant, marginBottom: 6 }}>
                  Full Name
                </label>
                <div style={{ position: "relative" }}>
                  <Icon name="person" size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: colors.outline }} />
                  <input className="input-field" style={{ paddingLeft: 44 }} type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: colors.onSurfaceVariant, marginBottom: 6 }}>
                Email
              </label>
              <div style={{ position: "relative" }}>
                <Icon name="mail" size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: colors.outline }} />
                <input className="input-field" style={{ paddingLeft: 44 }} type="email" placeholder="name@email.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: colors.onSurfaceVariant, marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <Icon name="lock" size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: colors.outline }} />
                <input
                  className="input-field"
                  style={{ paddingLeft: 44, paddingRight: 48 }}
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPass(p => !p)} style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: colors.outline,
                }}>
                  <Icon name={showPass ? "visibility_off" : "visibility"} size={20} />
                </button>
              </div>
            </div>

            {error && (
              <p style={{ fontSize: 13, color: colors.error, background: "#fff0f0", borderRadius: 8, padding: "10px 14px", border: `1px solid #fca5a5` }}>
                {error}
              </p>
            )}

            <button type="submit" className="btn-primary" style={{ marginTop: 4 }} disabled={loading}>
              {loading ? (
                <>
                  <Icon name="sync" size={20} style={{ color: "#fff", animation: "spin 1s linear infinite" }} />
                  {mode === "signup" ? "Creating account..." : "Signing in..."}
                </>
              ) : (
                <>{mode === "signup" ? "Sign Up" : "Login"} <Icon name="arrow_forward" size={18} style={{ color: "#fff" }} /></>
              )}
            </button>
          </form>
        </div>

        <p className="fade-up-3" style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: colors.onSurfaceVariant }}>
          {mode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
          <button onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(""); }} style={{
            background: "none", border: "none", cursor: "pointer",
            color: colors.primary, fontWeight: 700, fontSize: 14,
          }}>
            {mode === "signup" ? "Login" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// PAGE 2 — DASHBOARD
// ═══════════════════════════════════════════════════════════════════
const DashboardPage = ({ user, files, folders, onNav }) => {
  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
  const totalMB = totalBytes / (1024 * 1024);
  const storageGB = (totalMB / 1024).toFixed(2);
  const storagePercent = Math.min((totalMB / (50 * 1024)) * 100, 100).toFixed(1);
  const recent = [...files].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);

  return (
    <div style={{ paddingTop: 80, paddingBottom: 90, minHeight: "100vh", background: colors.surface }}>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 20px" }}>

        <div className="fade-up" style={{ marginBottom: 28 }}>
          <h2 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 800,
            fontSize: 26, color: colors.onSurface, letterSpacing: "-0.6px",
          }}>Hello, {user.name}! 👋</h2>
          <p style={{ color: colors.onSurfaceVariant, marginTop: 4, fontSize: 14 }}>
            {files.length === 0 ? "Your vault is empty. Upload your first file!" : `You have ${files.length} file${files.length !== 1 ? "s" : ""} stored.`}
          </p>
        </div>

        {/* Storage Card */}
        <div className="fade-up-1 card-lift" style={{
          background: colors.surfaceContainerLowest,
          borderRadius: 20, border: `1.5px solid ${colors.outlineVariant}`,
          padding: "22px 24px", marginBottom: 20,
          boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: colors.primary }}>Storage Used</span>
            <Icon name="data_usage" size={22} style={{ color: colors.primary }} />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 16 }}>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 36, color: colors.onSurface }}>{storageGB}</span>
            <span style={{ color: colors.onSurfaceVariant, fontSize: 15 }}>GB of 50 GB</span>
          </div>
          <div style={{ height: 10, background: colors.surfaceContainerHigh, borderRadius: 10, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${storagePercent}%`,
              background: `linear-gradient(90deg, ${colors.primary}, #6699ff)`,
              borderRadius: 10, transition: "width 1s ease",
            }} />
          </div>
          <p style={{ fontSize: 12, color: colors.onSurfaceVariant, marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors.primary, display: "inline-block" }} />
            {storagePercent}% space occupied
          </p>
        </div>

        {/* Quick Actions */}
        <div className="fade-up-2" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
          {[
            { label: "Upload File", icon: "cloud_upload", bg: colors.primary, shadow: "rgba(0,75,202,0.3)", nav: "upload" },
            { label: "My Files", icon: "folder_open", bg: "#0096cc", shadow: "rgba(0,150,204,0.3)", nav: "files" },
            { label: "Profile", icon: "person", bg: "#7c52aa", shadow: "rgba(124,82,170,0.3)", nav: "profile" },
          ].map((a, i) => (
            <button key={i} onClick={() => onNav(a.nav)} style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 10, padding: "20px 8px",
              background: a.bg, color: "#fff",
              border: "none", borderRadius: 16, cursor: "pointer",
              boxShadow: `0 4px 16px ${a.shadow}`,
              transition: "all 0.18s ease",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.04)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name={a.icon} size={26} filled style={{ color: "#fff" }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700 }}>{a.label}</span>
            </button>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="fade-up-3">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: colors.onSurface, letterSpacing: "-0.3px" }}>
              Recent Files
            </h3>
            <button onClick={() => onNav("files")} style={{
              background: "none", border: "none", cursor: "pointer",
              color: colors.primary, fontSize: 13, fontWeight: 700,
              display: "flex", alignItems: "center", gap: 3,
            }}>
              View All <Icon name="chevron_right" size={16} style={{ color: colors.primary }} />
            </button>
          </div>

          {recent.length === 0 ? (
            <div style={{
              background: colors.surfaceContainerLowest, border: `1.5px dashed ${colors.outlineVariant}`,
              borderRadius: 16, padding: "32px 20px", textAlign: "center",
            }}>
              <Icon name="cloud_upload" size={40} style={{ color: colors.outline, marginBottom: 12 }} />
              <p style={{ color: colors.onSurfaceVariant, fontSize: 14 }}>No files yet. Upload something to get started!</p>
              <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => onNav("upload")}>
                Upload File <Icon name="arrow_forward" size={18} style={{ color: "#fff" }} />
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recent.map((item) => {
                const { icon, color, iconColor } = getFileIcon(item.type, item.name);
                return (
                  <div key={item.id} className="card-lift" style={{
                    display: "flex", alignItems: "center", gap: 14,
                    background: colors.surfaceContainerLowest, border: `1.5px solid ${colors.outlineVariant}`,
                    borderRadius: 16, padding: "14px 16px", cursor: "pointer",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                      background: item.type.startsWith("image/") ? "transparent" : color,
                      overflow: "hidden",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {item.type.startsWith("image/") ? (
                        <img src={item.dataUrl} alt={item.name} style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 14 }} />
                      ) : (
                        <Icon name={icon} size={24} filled style={{ color: iconColor }} />
                      )}
                    </div>
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: colors.onSurface, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.name}
                      </p>
                      <p style={{ fontSize: 12, color: colors.onSurfaceVariant, marginTop: 2 }}>{formatSize(item.size)}</p>
                    </div>
                    <span style={{ fontSize: 11, color: colors.outline, fontWeight: 600, whiteSpace: "nowrap" }}>{formatDate(item.createdAt)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// FILE VIEWER MODAL
// ═══════════════════════════════════════════════════════════════════
const FileViewerModal = ({ file, onClose }) => {
  const isImage = file.type.startsWith("image/");
  const { icon, color, iconColor } = getFileIcon(file.type, file.name);

  return (
    <div className="overlay" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: colors.surfaceContainerLowest, borderRadius: 20,
        border: `1.5px solid ${colors.outlineVariant}`,
        width: "100%", maxWidth: 480,
        boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
        overflow: "hidden",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: `1px solid ${colors.outlineVariant}`,
        }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: colors.onSurface, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: 12 }}>
            {file.name}
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: colors.onSurfaceVariant, display: "flex" }}>
            <Icon name="close" size={22} />
          </button>
        </div>

        <div style={{ padding: 20 }}>
          {isImage ? (
            <img src={file.dataUrl} alt={file.name} style={{
              width: "100%", maxHeight: 320, objectFit: "contain",
              borderRadius: 12, background: "#f5f5f5",
            }} />
          ) : (
            <div style={{
              height: 180, background: color, borderRadius: 12,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12,
            }}>
              <Icon name={icon} size={56} filled style={{ color: iconColor }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: iconColor }}>
                {file.name.split(".").pop().toUpperCase()} File
              </span>
            </div>
          )}

          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              ["Size", formatSize(file.size)],
              ["Type", file.type || "Unknown"],
              ["Uploaded", formatDate(file.createdAt)],
              ["Format", file.name.split(".").pop().toUpperCase() || "—"],
            ].map(([label, val]) => (
              <div key={label} style={{
                background: colors.surfaceContainerLow, borderRadius: 10, padding: "10px 14px",
              }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: colors.outline }}>{label}</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: colors.onSurface, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{val}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "0 20px 20px", display: "flex", gap: 10 }}>
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Close</button>
          {isImage && (
            <a href={file.dataUrl} download={file.name} className="btn-primary" style={{ flex: 1, textDecoration: "none" }}>
              <Icon name="download" size={18} style={{ color: "#fff" }} /> Download
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── New Folder Modal ─────────────────────────────────────────────
const NewFolderModal = ({ onClose, onCreate }) => {
  const [name, setName] = useState("");
  return (
    <div className="overlay" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: colors.surfaceContainerLowest, borderRadius: 20,
        border: `1.5px solid ${colors.outlineVariant}`,
        width: "100%", maxWidth: 380, padding: 24,
        boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
      }}>
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: colors.onSurface, marginBottom: 16 }}>
          New Folder
        </h3>
        <input
          className="input-field"
          placeholder="Folder name"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && name.trim() && onCreate(name.trim())}
          autoFocus
        />
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ flex: 1 }} onClick={() => name.trim() && onCreate(name.trim())} disabled={!name.trim()}>
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// PAGE 3 — MY FILES
// ═══════════════════════════════════════════════════════════════════
const FilesPage = ({ files, folders, onNav, onDeleteFile, onDeleteFolder, onAddFolder, onMoveFile }) => {
  const [search, setSearch] = useState("");
  const [viewingFile, setViewingFile] = useState(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [activeFolder, setActiveFolder] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  const displayFolders = folders.filter(f =>
    !search || f.name.toLowerCase().includes(search.toLowerCase())
  );
  const displayFiles = files.filter(f => {
    const inFolder = activeFolder ? f.folderId === activeFolder : !f.folderId;
    const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase());
    return inFolder && matchSearch;
  });

  const activeFolderObj = folders.find(f => f.id === activeFolder);
  const closeContextMenu = () => setContextMenu(null);

  useEffect(() => {
    window.addEventListener("click", closeContextMenu);
    return () => window.removeEventListener("click", closeContextMenu);
  }, []);

  return (
    <div style={{ paddingTop: 80, paddingBottom: 90, minHeight: "100vh", background: colors.surface }}>
      <style>{`
        .ctx-btn { display:flex; align-items:center; gap:8px; width:100%; background:none; border:none; padding:10px 16px; cursor:pointer; font-size:14px; font-family:'Plus Jakarta Sans',sans-serif; color:${colors.onSurface}; }
        .ctx-btn:hover { background:${colors.surfaceContainerHigh}; }
        .ctx-btn.danger { color:${colors.error}; }
      `}</style>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 20px" }}>

        <div className="fade-up" style={{ margin: "16px 0 20px" }}>
          {activeFolder && (
            <button onClick={() => setActiveFolder(null)} style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "none", border: "none", cursor: "pointer",
              color: colors.primary, fontSize: 14, fontWeight: 600, marginBottom: 12,
            }}>
              <Icon name="arrow_back" size={18} style={{ color: colors.primary }} />
              Back to All Files
            </button>
          )}
          {activeFolder && (
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color: colors.onSurface, marginBottom: 12 }}>
              📁 {activeFolderObj?.name}
            </h2>
          )}
          <div style={{ position: "relative" }}>
            <Icon name="search" size={20} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: colors.outline }} />
            <input
              className="input-field"
              style={{ paddingLeft: 44 }}
              placeholder="Search files and folders..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {!activeFolder && (
          <section className="fade-up-1" style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: colors.onSurface }}>Folders</h2>
              <button onClick={() => setShowNewFolder(true)} style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "none", border: "none", cursor: "pointer",
                color: colors.primary, fontSize: 13, fontWeight: 700,
              }}>
                <Icon name="add" size={18} style={{ color: colors.primary }} /> New Folder
              </button>
            </div>

            {displayFolders.length === 0 ? (
              <div style={{
                background: colors.surfaceContainerLowest, border: `1.5px dashed ${colors.outlineVariant}`,
                borderRadius: 16, padding: "24px 20px", textAlign: "center",
              }}>
                <Icon name="folder_open" size={36} style={{ color: colors.outline, marginBottom: 8 }} />
                <p style={{ color: colors.onSurfaceVariant, fontSize: 14 }}>No folders yet. Create one to organize your files.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {displayFolders.map((folder) => {
                  const fileCount = files.filter(f => f.folderId === folder.id).length;
                  const folderBytes = files.filter(f => f.folderId === folder.id).reduce((acc, f) => acc + f.size, 0);
                  return (
                    <div key={folder.id} className="card-lift" style={{
                      display: "flex", alignItems: "center", gap: 14,
                      background: colors.surfaceContainerLowest, border: `1.5px solid ${colors.outlineVariant}`,
                      borderRadius: 16, padding: "14px 16px", cursor: "pointer",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                    }}
                      onClick={() => setActiveFolder(folder.id)}
                      onContextMenu={e => { e.preventDefault(); setContextMenu({ type: "folder", id: folder.id, x: e.clientX, y: e.clientY }); }}
                    >
                      <div style={{
                        width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                        background: colors.primaryFixed,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Icon name="folder" size={24} filled style={{ color: colors.primary }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 700, fontSize: 15, color: colors.onSurface }}>{folder.name}</p>
                        <p style={{ fontSize: 12, color: colors.onSurfaceVariant, marginTop: 2 }}>
                          {fileCount} file{fileCount !== 1 ? "s" : ""} • {formatSize(folderBytes)}
                        </p>
                      </div>
                      <button onClick={e => { e.stopPropagation(); setContextMenu({ type: "folder", id: folder.id, x: e.clientX, y: e.clientY }); }} style={{
                        background: "none", border: "none", cursor: "pointer", color: colors.onSurfaceVariant, padding: 4,
                      }}>
                        <Icon name="more_vert" size={22} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        <section className="fade-up-2">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: colors.onSurface }}>
              {activeFolder ? "Files in this folder" : "All Files"}
            </h2>
          </div>

          {displayFiles.length === 0 ? (
            <div style={{
              background: colors.surfaceContainerLowest, border: `1.5px dashed ${colors.outlineVariant}`,
              borderRadius: 16, padding: "32px 20px", textAlign: "center",
            }}>
              <Icon name="upload_file" size={40} style={{ color: colors.outline, marginBottom: 12 }} />
              <p style={{ color: colors.onSurfaceVariant, fontSize: 14, marginBottom: 16 }}>
                {search ? "No files match your search." : "No files here yet."}
              </p>
              {!search && (
                <button className="btn-primary" onClick={() => onNav("upload")}>
                  <Icon name="cloud_upload" size={18} style={{ color: "#fff" }} /> Upload File
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {displayFiles.map((file) => {
                const { icon, color, iconColor } = getFileIcon(file.type, file.name);
                return (
                  <div key={file.id} className="card-lift" style={{
                    display: "flex", alignItems: "center", gap: 14,
                    background: colors.surfaceContainerLowest, border: `1.5px solid ${colors.outlineVariant}`,
                    borderRadius: 16, padding: "14px 16px", cursor: "pointer",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  }}
                    onClick={() => setViewingFile(file)}
                    onContextMenu={e => { e.preventDefault(); setContextMenu({ type: "file", id: file.id, x: e.clientX, y: e.clientY }); }}
                  >
                    <div style={{
                      width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                      background: file.type.startsWith("image/") ? "transparent" : color,
                      overflow: "hidden",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {file.type.startsWith("image/") ? (
                        <img src={file.dataUrl} alt={file.name} style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 14 }} />
                      ) : (
                        <Icon name={icon} size={24} filled style={{ color: iconColor }} />
                      )}
                    </div>
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: colors.onSurface, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {file.name}
                      </p>
                      <p style={{ fontSize: 12, color: colors.onSurfaceVariant, marginTop: 2 }}>
                        {formatSize(file.size)} • {formatDate(file.createdAt)}
                      </p>
                    </div>
                    <button onClick={e => { e.stopPropagation(); setContextMenu({ type: "file", id: file.id, x: e.clientX, y: e.clientY }); }} style={{
                      background: "none", border: "none", cursor: "pointer", color: colors.onSurfaceVariant, padding: 4,
                    }}>
                      <Icon name="more_vert" size={22} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* FAB */}
      <button onClick={() => onNav("upload")} style={{
        position: "fixed", bottom: 80, right: 20,
        width: 56, height: 56, borderRadius: 16,
        background: colors.primary, color: "#fff",
        border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 6px 24px rgba(0,75,202,0.35)",
        zIndex: 99, animation: "pulse-ring 3s ease-in-out infinite",
      }}>
        <Icon name="add" size={30} style={{ color: "#fff" }} />
      </button>

      {/* Context Menu */}
      {contextMenu && (
        <div style={{
          position: "fixed", top: contextMenu.y, left: Math.min(contextMenu.x, window.innerWidth - 200),
          background: colors.surfaceContainerLowest, borderRadius: 12,
          border: `1.5px solid ${colors.outlineVariant}`,
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          zIndex: 300, overflow: "hidden", minWidth: 180,
        }} onClick={e => e.stopPropagation()}>
          {contextMenu.type === "file" && folders.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: colors.outline, padding: "8px 16px 4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Move to folder</p>
              {folders.map(f => (
                <button key={f.id} className="ctx-btn" onClick={() => { onMoveFile(contextMenu.id, f.id); closeContextMenu(); }}>
                  <Icon name="folder" size={16} style={{ color: colors.primary }} /> {f.name}
                </button>
              ))}
              {files.find(f => f.id === contextMenu.id)?.folderId && (
                <button className="ctx-btn" onClick={() => { onMoveFile(contextMenu.id, null); closeContextMenu(); }}>
                  <Icon name="folder_off" size={16} style={{ color: colors.onSurfaceVariant }} /> Remove from folder
                </button>
              )}
              <div style={{ height: 1, background: colors.outlineVariant, margin: "4px 0" }} />
            </div>
          )}
          <button className="ctx-btn" onClick={() => {
            const file = files.find(f => f.id === contextMenu.id);
            if (file) setViewingFile(file);
            closeContextMenu();
          }} style={{ display: contextMenu.type === "folder" ? "none" : "flex" }}>
            <Icon name="open_in_new" size={16} style={{ color: colors.onSurfaceVariant }} /> Open
          </button>
          <button className="ctx-btn danger" onClick={() => {
            if (contextMenu.type === "file") onDeleteFile(contextMenu.id);
            else onDeleteFolder(contextMenu.id);
            closeContextMenu();
          }}>
            <Icon name="delete" size={16} style={{ color: colors.error }} /> Delete
          </button>
        </div>
      )}

      {viewingFile && <FileViewerModal file={viewingFile} onClose={() => setViewingFile(null)} />}
      {showNewFolder && <NewFolderModal onClose={() => setShowNewFolder(false)} onCreate={(name) => { onAddFolder(name); setShowNewFolder(false); }} />}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// PAGE 4 — UPLOAD
// ═══════════════════════════════════════════════════════════════════
const UploadPage = ({ folders, onNav, onUpload }) => {
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [targetFolder, setTargetFolder] = useState("");
  const fileRef = useRef();

  const handleFiles = useCallback((rawFiles) => {
    const arr = Array.from(rawFiles);
    setFiles(prev => [
      ...prev,
      ...arr.map(file => ({
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
        rawFile: file,
        folderId: targetFolder || null,
        createdAt: Date.now(),
      }))
    ]);
  }, [targetFolder]);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const f of files) {
        await onUpload({ ...f, folderId: targetFolder || f.folderId || null });
      }
      setDone(true);
    } catch (err) {
      alert(err.message || "Upload failed. Is the backend running?");
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (id) => setFiles(prev => prev.filter(f => f.id !== id));

  return (
    <div style={{ paddingTop: 80, paddingBottom: 90, minHeight: "100vh", background: colors.surface }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 20px" }}>

        <div className="fade-up" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button onClick={() => onNav("files")} style={{
            width: 40, height: 40, borderRadius: 12,
            background: colors.surfaceContainerHigh, border: "none",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="arrow_back" size={20} style={{ color: colors.onSurfaceVariant }} />
          </button>
          <h1 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 800,
            fontSize: 22, color: colors.onSurface, letterSpacing: "-0.5px",
          }}>Upload Files</h1>
        </div>

        {done ? (
          <div className="fade-up" style={{
            background: colors.surfaceContainerLowest, borderRadius: 20,
            border: `1.5px solid ${colors.outlineVariant}`, padding: 40, textAlign: "center",
            boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%", background: "#d1fae5",
              display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
            }}>
              <Icon name="check_circle" size={40} filled style={{ color: "#059669" }} />
            </div>
            <h3 style={{ fontWeight: 800, fontSize: 20, marginBottom: 8, fontFamily: "'Syne', sans-serif" }}>Upload Complete!</h3>
            <p style={{ color: colors.onSurfaceVariant, fontSize: 14, marginBottom: 24 }}>
              {files.length} file{files.length !== 1 ? "s" : ""} uploaded successfully.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button className="btn-ghost" onClick={() => { setFiles([]); setDone(false); }}>Upload More</button>
              <button className="btn-primary" onClick={() => onNav("files")}>View Files</button>
            </div>
          </div>
        ) : (
          <div className="fade-up-1" style={{
            background: colors.surfaceContainerLowest, borderRadius: 20,
            border: `1.5px solid ${colors.outlineVariant}`, overflow: "hidden",
            boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
          }}>
            <div style={{ padding: 24 }}>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? colors.primary : colors.outlineVariant}`,
                  borderRadius: 16, background: dragOver ? colors.surfaceContainerLow : colors.surface,
                  padding: "32px 20px", textAlign: "center", cursor: "pointer",
                  transition: "all 0.18s", marginBottom: 20,
                }}
              >
                <input ref={fileRef} type="file" multiple style={{ display: "none" }} onChange={e => handleFiles(e.target.files)} />
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: colors.primaryFixed,
                  display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
                }}>
                  <Icon name="upload" size={32} style={{ color: colors.primary }} />
                </div>
                <p style={{ fontWeight: 700, fontSize: 16, color: colors.onSurface, marginBottom: 6 }}>Select files to upload</p>
                <p style={{ fontSize: 13, color: colors.onSurfaceVariant }}>Drag & drop or click to browse — any file type</p>
              </div>

              {files.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: colors.onSurfaceVariant, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {files.length} file{files.length !== 1 ? "s" : ""} selected
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 240, overflowY: "auto" }}>
                    {files.map((f) => {
                      const { icon, color, iconColor } = getFileIcon(f.type, f.name);
                      return (
                        <div key={f.id} style={{
                          display: "flex", alignItems: "center", gap: 12,
                          background: colors.surfaceContainerLow, borderRadius: 12, padding: "10px 14px",
                        }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                            background: f.type.startsWith("image/") ? "transparent" : color,
                            overflow: "hidden",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            {f.type.startsWith("image/") ? (
                              <img src={f.previewUrl} alt={f.name} style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 10 }} />
                            ) : (
                              <Icon name={icon} size={20} filled style={{ color: iconColor }} />
                            )}
                          </div>
                          <div style={{ flex: 1, overflow: "hidden" }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: colors.onSurface, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</p>
                            <p style={{ fontSize: 11, color: colors.onSurfaceVariant }}>{formatSize(f.size)}</p>
                          </div>
                          <button onClick={() => removeFile(f.id)} style={{ background: "none", border: "none", cursor: "pointer", color: colors.outline, display: "flex" }}>
                            <Icon name="close" size={18} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {folders.length > 0 && (
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: colors.onSurfaceVariant, marginBottom: 6 }}>
                    Upload to folder (optional)
                  </label>
                  <select className="input-field" value={targetFolder} onChange={e => setTargetFolder(e.target.value)} style={{ paddingLeft: 16 }}>
                    <option value="">— No folder (root) —</option>
                    {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div style={{
              display: "flex", justifyContent: "flex-end", gap: 10,
              padding: "16px 24px",
              background: colors.surfaceContainerLow,
              borderTop: `1.5px solid ${colors.outlineVariant}`,
            }}>
              <button className="btn-ghost" onClick={() => onNav("files")}>Cancel</button>
              <button className="btn-primary" onClick={handleUpload} disabled={files.length === 0 || uploading}>
                {uploading ? (
                  <><Icon name="sync" size={18} style={{ color: "#fff", animation: "spin 1s linear infinite" }} /> Uploading...</>
                ) : (
                  <><Icon name="cloud_upload" size={18} style={{ color: "#fff" }} /> Upload {files.length > 0 ? `(${files.length})` : ""}</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// PAGE 5 — PROFILE
// ═══════════════════════════════════════════════════════════════════
const ProfilePage = ({ user, files, onLogout }) => {
  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
  const initials = user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div style={{ paddingTop: 80, paddingBottom: 90, minHeight: "100vh", background: colors.surface }}>
      <div style={{ maxWidth: 500, margin: "0 auto", padding: "0 20px" }}>

        <div className="fade-up" style={{ textAlign: "center", marginBottom: 28, paddingTop: 16 }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: colors.primary,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28,
            color: "#fff", marginBottom: 14,
          }}>
            {initials}
          </div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, color: colors.onSurface }}>{user.name}</h2>
          {user.email && <p style={{ color: colors.onSurfaceVariant, fontSize: 14, marginTop: 4 }}>{user.email}</p>}
        </div>

        <div className="fade-up-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total Files", value: files.length, icon: "description" },
            { label: "Storage Used", value: formatSize(totalBytes), icon: "data_usage" },
          ].map(s => (
            <div key={s.label} style={{
              background: colors.surfaceContainerLowest, borderRadius: 16,
              border: `1.5px solid ${colors.outlineVariant}`, padding: "18px 20px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}>
              <Icon name={s.icon} size={22} style={{ color: colors.primary, marginBottom: 8 }} />
              <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, color: colors.onSurface }}>{s.value}</p>
              <p style={{ fontSize: 12, color: colors.onSurfaceVariant, marginTop: 2 }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="fade-up-2" style={{
          background: colors.surfaceContainerLowest, borderRadius: 16,
          border: `1.5px solid ${colors.outlineVariant}`, overflow: "hidden", marginBottom: 20,
        }}>
          {[
            { icon: "person", label: "Name", value: user.name },
            { icon: "mail", label: "Email", value: user.email || "Not provided" },
            { icon: "storage", label: "Plan", value: "Free — 50 GB" },
          ].map((row, i, arr) => (
            <div key={row.label} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
              borderBottom: i < arr.length - 1 ? `1px solid ${colors.outlineVariant}` : "none",
            }}>
              <Icon name={row.icon} size={20} style={{ color: colors.primary }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: colors.outline, textTransform: "uppercase", letterSpacing: "0.06em" }}>{row.label}</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: colors.onSurface, marginTop: 2 }}>{row.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="fade-up-3">
          <button onClick={onLogout} style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            background: "#fff0f0", color: colors.error,
            border: `1.5px solid #fca5a5`, borderRadius: 14, padding: "14px 24px",
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 700, cursor: "pointer",
            transition: "all 0.18s ease",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "#fee2e2"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#fff0f0"; }}
          >
            <Icon name="logout" size={20} style={{ color: colors.error }} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("home");
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [booting, setBooting] = useState(true);
  const [authMessage, setAuthMessage] = useState("");
  const [authMode, setAuthMode] = useState("signup");
  const [authTarget, setAuthTarget] = useState("dashboard");

  useEffect(() => {
    (async () => {
      if (!api.getToken()) {
        setBooting(false);
        return;
      }
      try {
        const { user: me } = await api.fetchMe();
        const { files: savedFiles, folders: savedFolders } = await api.fetchUserData();
        setUser(me);
        setFiles(savedFiles);
        setFolders(savedFolders);
      } catch {
        api.logout();
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  const handleAuth = (userData, loadedFiles, loadedFolders, redirectTo = authTarget) => {
    setUser(userData);
    setFiles(loadedFiles);
    setFolders(loadedFolders);
    setPage(redirectTo);
    setAuthMessage("");
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setPage("home");
    setFiles([]);
    setFolders([]);
  };

  const handleUpload = async (fileEntry) => {
    const uploaded = await api.uploadFile(fileEntry.rawFile, fileEntry.folderId);
    setFiles(prev => [...prev, uploaded]);
  };

  const handleDeleteFile = async (id) => {
    try {
      await api.deleteFile(id);
      setFiles(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      alert(err.message || "Failed to delete file");
    }
  };

  const handleDeleteFolder = async (id) => {
    try {
      await api.deleteFolder(id);
      setFolders(prev => prev.filter(f => f.id !== id));
      setFiles(prev => prev.map(f => f.folderId === id ? { ...f, folderId: null } : f));
    } catch (err) {
      alert(err.message || "Failed to delete folder");
    }
  };

  const handleAddFolder = async (name) => {
    try {
      const folder = await api.createFolder(name);
      setFolders(prev => [...prev, folder]);
    } catch (err) {
      alert(err.message || "Failed to create folder");
    }
  };

  const handleMoveFile = async (fileId, folderId) => {
    try {
      const updated = await api.moveFile(fileId, folderId);
      setFiles(prev => prev.map(f => f.id === fileId ? updated : f));
    } catch (err) {
      alert(err.message || "Failed to move file");
    }
  };

  const goToAuth = (message = "", mode = "login") => {
    setAuthMessage(message);
    setAuthMode(mode);
    setAuthTarget("dashboard");
    setPage("auth");
  };

  const openAuthForUpload = () => {
    setAuthMessage("Please log in to upload files.");
    setAuthMode("login");
    setAuthTarget("upload");
    setPage("auth");
  };

  const openAuthForDashboard = () => {
    setAuthMessage("Please log in to continue.");
    setAuthMode("login");
    setAuthTarget("dashboard");
    setPage("auth");
  };

  const handleNav = (nextPage) => {
    if (nextPage === "upload" && !user) {
      openAuthForUpload();
      return;
    }

    if ((nextPage === "dashboard" || nextPage === "files" || nextPage === "profile") && !user) {
      openAuthForDashboard();
      return;
    }

    setPage(nextPage);
  };

  const renderPage = () => {
    if (page === "home") return <HomePage user={user} onLogin={() => goToAuth("Please log in to upload files.", "login")} onSignup={() => goToAuth("Create your account to get started.", "signup")} onOpenDashboard={() => handleNav("dashboard")} onUpload={() => handleNav("upload")} />;
    if (page === "auth") return <AuthPage initialMode={authMode} onAuth={handleAuth} message={authMessage} />;
    if (!user) return <HomePage user={user} onLogin={() => goToAuth("Please log in to upload files.", "login")} onSignup={() => goToAuth("Create your account to get started.", "signup")} onOpenDashboard={() => handleNav("dashboard")} onUpload={() => handleNav("upload")} />;
    if (page === "dashboard") return <DashboardPage user={user} files={files} folders={folders} onNav={handleNav} />;
    if (page === "files") return <FilesPage files={files} folders={folders} onNav={handleNav} onDeleteFile={handleDeleteFile} onDeleteFolder={handleDeleteFolder} onAddFolder={handleAddFolder} onMoveFile={handleMoveFile} />;
    if (page === "upload") return <UploadPage folders={folders} onNav={handleNav} onUpload={handleUpload} />;
    if (page === "profile") return <ProfilePage user={user} files={files} onLogout={handleLogout} />;
    return <HomePage user={user} onLogin={() => goToAuth("Please log in to upload files.", "login")} onSignup={() => goToAuth("Create your account to get started.", "signup")} onOpenDashboard={() => handleNav("dashboard")} onUpload={() => handleNav("upload")} />;
    return null;
  };

  if (booting) {
    return (
      <>
        <style>{globalStyles}</style>
        <div style={{
          minHeight: "100vh", display: "flex", alignItems: "center",
          justifyContent: "center", color: colors.onSurfaceVariant,
        }}>
          <Icon name="sync" size={28} style={{ animation: "spin 1s linear infinite" }} />
        </div>
      </>
    );
  }

  return (
    <>
      <style>{globalStyles}</style>
      {user && page !== "home" && <TopBar user={user} onNav={handleNav} />}
      {renderPage()}
      {user && page !== "home" && <BottomNav active={page} onNav={handleNav} />}
    </>
  );
}