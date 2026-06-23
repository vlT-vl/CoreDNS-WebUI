import { Icon } from "./Icon.jsx";

export const TypeBadge = ({ type }) => (
  <span className={`badge badge-${type}`}>{type}</span>
);

export const Spinner = () => (
  <div className="spinner-wrap">
    <div className="spinner" /> Caricamento…
  </div>
);

export const Toast = ({ toast }) => {
  if (!toast) return null;
  return (
    <div className={`toast ${toast.type === "error" ? "toast-error" : "toast-success"}`}>
      <Icon name={toast.type === "error" ? "alert" : "check"} size={14} />
      {toast.msg}
    </div>
  );
};

export const Modal = ({ title, onClose, children }) => (
  <div className="modal-overlay">
    <div className="modal-box">
      <div className="modal-header">
        <span className="modal-title">{title}</span>
        <button className="modal-close" onClick={onClose}>
          <Icon name="x" size={18} />
        </button>
      </div>
      <div className="modal-body">{children}</div>
    </div>
  </div>
);

export const Field = ({ label, children }) => (
  <div className="field">
    <label className="field-label">{label}</label>
    {children}
  </div>
);

export const CmdPreview = ({ cmd }) => (
  <div className="cmd-preview">{cmd}</div>
);

export const Terminal = ({ label, error, output }) => (
  <div className="terminal">
    <div className="terminal-bar">
      {["#c83a3a","#c8a030","#3aaa6a"].map(c => (
        <span key={c} className="terminal-dot" style={{ background: c }} />
      ))}
      <span className="terminal-label">{label}</span>
    </div>
    {error && <div style={{ color: "#e07070", fontSize: 12, padding: "10px 20px 0", fontFamily: "monospace" }}>{error}</div>}
    <pre className="terminal-pre">{output || "(nessun output)"}</pre>
  </div>
);

export function fallbackCopy(text, showToast) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
  document.body.appendChild(ta);
  ta.focus(); ta.select();
  try { document.execCommand("copy"); showToast("Copiato"); }
  catch { showToast("Copia non riuscita", "error"); }
  document.body.removeChild(ta);
}
