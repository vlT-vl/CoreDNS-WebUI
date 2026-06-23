import { useState } from "react";
import { CONFIG } from "../config.js";
import { CoreDNSLogo } from "../components/Icon.jsx";

export default function LoginScreen({ onLogin }) {
  const [user, setUser]       = useState("");
  const [pass, setPass]       = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ user, pass }),
      });
      const data = await res.json();
      if (data.ok) {
        onLogin();
      } else {
        setError(data.error || "Credenziali non valide");
      }
    } catch {
      setError("Errore di connessione al server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-card">
        <div className="login-logo">
          <CoreDNSLogo size={48} />
        </div>
        <div className="login-title">{CONFIG.appTitle}</div>
        <div className="login-subtitle">Accedi con le tue credenziali</div>
        <form className="login-form" onSubmit={handleLogin}>
          <input
            className={`login-input ${error ? "login-input-error" : ""}`}
            type="text"
            placeholder="Username"
            value={user}
            onChange={e => { setUser(e.target.value); setError(""); }}
            autoComplete="username"
          />
          <input
            className={`login-input ${error ? "login-input-error" : ""}`}
            type="password"
            placeholder="Password"
            value={pass}
            onChange={e => { setPass(e.target.value); setError(""); }}
            autoComplete="current-password"
          />
          {error && <div className="login-error">{error}</div>}
          <button className="login-btn" type="submit" disabled={loading || !user || !pass}>
            {loading ? "Accesso in corso…" : "Login"}
          </button>
        </form>
        <div className="login-footer">
          CoreDNS Manager · {CONFIG.nodeName}
        </div>
      </div>
    </div>
  );
}
