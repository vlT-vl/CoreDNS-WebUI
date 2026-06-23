import { useState } from "react";
import { Icon } from "../components/Icon.jsx";
import { Terminal, fallbackCopy } from "../components/ui.jsx";

export default function CorefileView({ corefile, onRefresh, showToast }) {
  const [spinning, setSpinning] = useState(false);

  const handleRefresh = async () => {
    setSpinning(true);
    await Promise.all([onRefresh(), new Promise(r => setTimeout(r, 700))]);
    setSpinning(false);
    showToast("Corefile aggiornato");
  };

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(corefile)
        .then(() => showToast("Corefile copiato"))
        .catch(() => fallbackCopy(corefile, showToast));
    } else {
      fallbackCopy(corefile, showToast);
    }
  };

  return (
    <div className="tab-panel">
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div className="tab-panel-header">
          <div>
            <div className="tab-panel-title">Corefile</div>
            <div className="tab-panel-subtitle">
              <code>/etc/coredns/Corefile</code> — sola lettura
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className={`btn btn-secondary${spinning ? " btn--loading" : ""}`}
              onClick={handleRefresh} disabled={spinning}>
              <Icon name="refresh" size={13} /> Ricarica
            </button>
            <button className="btn btn-secondary" onClick={handleCopy}>
              <Icon name="copy" size={13} /> Copia
            </button>
          </div>
        </div>
        <Terminal label="Corefile" output={corefile || "# Corefile non disponibile"} />
      </div>
    </div>
  );
}
