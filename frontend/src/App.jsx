import { useState, useEffect, useCallback, useRef } from "react";
import { CONFIG, TABS } from "./config.js";
import { api, setRequestTracker } from "./api.js";
import { Icon, CoreDNSLogo } from "./components/Icon.jsx";
import { Toast, Terminal } from "./components/ui.jsx";
import LoginScreen  from "./views/LoginScreen.jsx";
import ZonesView    from "./views/ZonesView.jsx";
import ReverseView  from "./views/ReverseView.jsx";
import QueryView    from "./views/QueryView.jsx";
import CorefileView from "./views/CorefileView.jsx";
import InfoView     from "./views/InfoView.jsx";
import "./App.css";

function BridgePopup({ show, anchorRef, connected, lastReq }) {
  if (!show || !anchorRef.current) return null;
  const rect   = anchorRef.current.getBoundingClientRect();
  const dotCol = connected === null ? "#3a5070" : connected ? "#2a9a5a" : "#c03a3a";
  const label  = connected === null ? "verifica…"  : connected ? "online"  : "offline";

  const ts = lastReq
    ? `${lastReq.time.toLocaleDateString("it-IT")} ${lastReq.time.toLocaleTimeString("it-IT")}`
    : null;

  // popup sopra il trigger, allineato a sinistra con la sidebar
  const bottomFromViewport = window.innerHeight - rect.top + 8;

  return (
    <div style={{
      position:     "fixed",
      left:         rect.left + 10,
      bottom:       bottomFromViewport,
      zIndex:       500,
      background:   "#0d1e38",
      border:       "1px solid rgba(255,255,255,.09)",
      borderRadius: 8,
      padding:      "10px 12px",
      width:        196,
      boxShadow:    "0 6px 20px rgba(0,0,0,.5)",
      pointerEvents:"none",
      fontSize:     11,
      lineHeight:   1.5,
    }}>
      {/* stato + indirizzo */}
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:7 }}>
        <span style={{ width:6, height:6, borderRadius:"50%", background:dotCol, flexShrink:0 }} />
        <span style={{ color:dotCol, fontWeight:600 }}>{label}</span>
        <span style={{ color:"#3a5070", marginLeft:"auto", fontFamily:"monospace", fontSize:11 }}>
          :{CONFIG.bridgePort}
        </span>
      </div>
      <div style={{ color:"#5a6a88", marginBottom:7, fontFamily:"monospace", fontSize:10, wordBreak:"break-all" }}>
        {CONFIG.nodeName}
      </div>

      {/* ultima richiesta */}
      <div style={{ borderTop:"1px solid rgba(255,255,255,.06)", paddingTop:7 }}>
        {lastReq ? (
          <>
            <code style={{
              display:"block", color:"#1d6ae5",
              background:"rgba(29,106,229,.12)", borderRadius:4,
              padding:"2px 5px", marginBottom:4, fontSize:10,
              wordBreak:"break-all",
            }}>
              /api{lastReq.path}
            </code>
            <span style={{ color:"#3a5070", fontFamily:"monospace", fontSize:10 }}>{ts}</span>
          </>
        ) : (
          <span style={{ color:"#3a5070" }}>nessuna richiesta</span>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [authed,        setAuthed]        = useState(!CONFIG.authEnabled);
  const [authChecked,   setAuthChecked]   = useState(!CONFIG.authEnabled);
  const [tab,           setTab]           = useState("zones");
  const [zones,         setZones]         = useState([]);
  const [corefile,      setCorefile]      = useState("");
  const [loading,       setLoading]       = useState(true);
  const [connected,     setConnected]     = useState(null);
  const [toast,         setToast]         = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [errorModal,    setErrorModal]    = useState(null);
  const [lastReq,       setLastReq]       = useState(null);
  const [statusHover,   setStatusHover]   = useState(false);
  const [sidebarSpin,   setSidebarSpin]   = useState(false);
  const intervalRef = useRef(null);
  const retryRef    = useRef(null);
  const statusRef   = useRef(null);

  const showToast = useCallback((msg, type = "success") => {
    if (type === "error" && msg && msg.length > 60) {
      setErrorModal({ title: "Errore corednsctl", output: msg });
    } else {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3000);
    }
  }, []);

  const showConfirm = useCallback((msg, onConfirm) => {
    setConfirmDialog({ msg, onConfirm });
  }, []);

  const loadAll = useCallback(async (silent = false) => {
    setLoading(true);
    try {
      const [zRes, cRes] = await Promise.all([api.getZones(), api.getCorefile()]);
      setZones(zRes.data || []);
      setCorefile(cRes.data?.content || "");
      setConnected(true);
      return true;
    } catch {
      setConnected(false);
      if (!silent) showToast("Bridge non raggiungibile", "error");
      return false;
    } finally { setLoading(false); }
  }, [showToast]);

  const refreshZones = useCallback(async () => {
    try {
      const [zRes, cRes] = await Promise.all([api.getZones(), api.getCorefile()]);
      setZones(zRes.data || []);
      setCorefile(cRes.data?.content || "");
    } catch (e) { showToast(e.message, "error"); }
  }, [showToast]);

  useEffect(() => {
    setRequestTracker((path) => setLastReq({ path, time: new Date() }));
  }, []);

  // Controlla se esiste già una sessione valida (cookie httpOnly)
  useEffect(() => {
    if (!CONFIG.authEnabled) return;
    fetch("/api/auth/status", { credentials: "same-origin" })
      .then(r => r.json())
      .then(d => { if (d.authed) setAuthed(true); })
      .catch(() => {})
      .finally(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    if (!authed) return;

    const tryLoad = async (firstAttempt = true) => {
      clearTimeout(retryRef.current);
      const ok = await loadAll(!firstAttempt);
      if (!ok) {
        retryRef.current = setTimeout(() => tryLoad(false), 3000);
      }
    };

    tryLoad(true);

    if (CONFIG.refreshInterval > 0) {
      intervalRef.current = setInterval(() => loadAll(true), CONFIG.refreshInterval);
    }
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(retryRef.current);
    };
  }, [authed, loadAll]);

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST", credentials: "same-origin" }).catch(() => {});
    setAuthed(false);
  };

  const fwdZones   = zones.filter(z => !z.is_reverse);
  const revZones   = zones.filter(z =>  z.is_reverse);
  const statusClass = connected === null ? "checking" : connected ? "online" : "offline";
  const statusLabel = connected === null ? "Connessione…" : connected ? "Bridge online" : "Bridge offline";
  const now = new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  if (!authChecked) return null;
  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;

  return (
    <div className="app-root">

      {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
      <div className="sidebar">
        <div className="sidebar-logo">
          <CoreDNSLogo size={32} />
          <div>
            <div className="sidebar-logo-title">{CONFIG.appTitle}</div>
            <div className="sidebar-logo-sub">DNS Operations</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {TABS.map(t => (
            <button key={t.id} className={`nav-item ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}>
              <Icon name={t.icon} size={15} />
              {t.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-status"
          ref={statusRef}
          onMouseEnter={() => setStatusHover(true)}
          onMouseLeave={() => setStatusHover(false)}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
            <span className={`status-dot ${statusClass}`} />
            <span className={`status-label ${statusClass}`}>{statusLabel}</span>
          </div>
          <div className="status-meta">{fwdZones.length} zone · {revZones.length} reverse</div>
          <div className="status-addr">{CONFIG.nodeName} :{CONFIG.bridgePort}</div>
          <button
            className={`btn btn-ghost btn-sm${sidebarSpin ? " btn--loading" : ""}`}
            style={{ marginTop: 10, width: "100%", justifyContent: "center",
              border: "1px solid rgba(255,255,255,.07)", color: "#3a5070" }}
            onClick={async () => {
              clearTimeout(retryRef.current);
              setSidebarSpin(true);
              await Promise.all([loadAll(), new Promise(r => setTimeout(r, 700))]);
              setSidebarSpin(false);
            }}>
            <Icon name="refresh" size={13} color="#3a5070" /> Ricarica
          </button>
        </div>
      </div>

      {/* ── MAIN ─────────────────────────────────────────────────────────── */}
      <div className="main">

        {/* Topbar */}
        <div className="topbar">
          <div className="topbar-inner">
            <div>
              <div className="topbar-eyebrow">● DNS Operations</div>
              <h1 className="topbar-title">
                {CONFIG.appTitle.split(" ")[0]}{" "}
                <span>{CONFIG.appTitle.split(" ").slice(1).join(" ") || "Manager"}</span>
              </h1>
              <p className="topbar-desc">
                Gestione zone e record — <code>/etc/coredns</code>
              </p>
            </div>
            <div className="topbar-pills">
              <div className="pill pill-blue"><span className="pill-dot" />{now}</div>
              <div className="pill pill-dark">
                <Icon name="server" size={11} color="#3a5070" />
                {CONFIG.nodeName}
              </div>
              {CONFIG.authEnabled && (
                <button className="pill pill-logout" onClick={handleLogout}>
                  <Icon name="x" size={11} color="#c87a7a" />
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab content */}
        <div className="content">
          {tab === "zones"    && <ZonesView    zones={zones}    loading={loading} showToast={showToast} showConfirm={showConfirm} onRefresh={refreshZones} />}
          {tab === "reverse"  && <ReverseView  zones={zones}    loading={loading} showToast={showToast} showConfirm={showConfirm} onRefresh={refreshZones} />}
          {tab === "query"    && <QueryView />}
          {tab === "corefile" && <CorefileView corefile={corefile} onRefresh={refreshZones} showToast={showToast} />}
          {tab === "info"     && <InfoView />}
        </div>
      </div>

      {/* ── GLOBAL OVERLAYS ──────────────────────────────────────────────── */}

      {confirmDialog && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ width: 360 }}>
            <div className="modal-body">
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 20 }}>
                <div className="confirm-icon">
                  <Icon name="trash" size={18} color="#c03a3a" />
                </div>
                <div>
                  <div className="confirm-title">Conferma eliminazione</div>
                  <div className="confirm-msg">{confirmDialog.msg}</div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setConfirmDialog(null)}>Annulla</button>
                <button className="btn btn-danger" onClick={() => { setConfirmDialog(null); confirmDialog.onConfirm(); }}>Elimina</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {errorModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ width: 520 }}>
            <div className="modal-header">
              <span className="modal-title" style={{ color: "var(--red)" }}>
                ⚠ {errorModal.title}
              </span>
              <button className="modal-close" onClick={() => setErrorModal(null)}>
                <Icon name="x" size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: "var(--text-sec)", marginBottom: 12 }}>
                Il comando{" "}
                <code style={{ color: "var(--accent)", background: "var(--accent-soft)", padding: "1px 5px", borderRadius: 4 }}>
                  corednsctl
                </code>{" "}
                ha restituito un errore:
              </p>
              <Terminal label="output" error={null} output={errorModal.output} />
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setErrorModal(null)}>Chiudi</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BridgePopup
        show={statusHover}
        anchorRef={statusRef}
        connected={connected}
        lastReq={lastReq}
      />

      <Toast toast={toast} />
    </div>
  );
}
