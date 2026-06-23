import { useState } from "react";
import PKG from "../../package.json";
import LICENSE_TEXT from "../../../LICENSE?raw";
import { CoreDNSLogo, Icon } from "../components/Icon.jsx";

const VLT_LOGO = "/vlt-logo-dark.png";

const LEGAL = [
  "CoreDNS Manager è un software sviluppato da Veronesi Lorenzo (vlT). È possibile utilizzarlo liberamente per scopi personali o professionali. La distribuzione del software è riservata esclusivamente all'autore.",
  "Il codice sorgente è reso disponibile dietro richiesta, unicamente a scopo di trasparenza e studio. Il download, la modifica, l'adattamento, il fork o l'utilizzo come base per altri progetti — anche parzialmente — non è consentito senza previa autorizzazione scritta dell'autore.",
  "Tutto il codice, il design e il contenuto di questo software sono di esclusiva proprietà intellettuale di Veronesi Lorenzo (vlT). Nessuna forma di appropriazione, commercializzazione o ridistribuzione modificata è consentita. Per i dettagli completi consulta la licenza allegata.",
  "La decompilazione o il reverse engineering del binario sono vietati, salvo quanto imposto dalla legge obbligatoria applicabile.",
  "Questo software non è affiliato né sponsorizzato dal progetto CoreDNS o dalla CNCF. «CoreDNS» è un marchio registrato dei rispettivi titolari.",
  "Il software è fornito così com'è, senza garanzie di alcun tipo. L'autore non è responsabile per eventuali danni derivanti dal suo utilizzo. Mantieni sempre backup adeguati prima di operare sulla tua infrastruttura.",
];

const INFO_PILLS = [
  { label: "Versione",       value: PKG.version,                    clickable: false },
  { label: "Build",          value: PKG.build,                      clickable: false },
  { label: "Aggiornato",     value: PKG.updated,                    clickable: false },
  { label: "Build iniziale", value: PKG.ibuild,                     clickable: false },
  { label: "Licenza",        value: "Proprietary Source-Available", clickable: true  },
  { label: "Runtime",        value: "Go + React",                   clickable: false },
];

// Split the LICENSE file on separator lines and detect section headings (ALL CAPS lines)
function parseLicense(text) {
  return text
    .split(/\n─{10,}\n/)
    .map(block => {
      const trimmed = block.trim();
      const lines   = trimmed.split("\n");
      const first   = lines[0]?.trim() || "";
      const isHead  = first.length > 3 && first === first.toUpperCase() && !/^\d\./.test(first);
      return {
        heading: isHead ? first : null,
        body:    isHead ? lines.slice(1).join("\n").trim() : trimmed,
      };
    })
    .filter(s => s.heading || s.body);
}

function LicenseModal({ onClose }) {
  const sections = parseLicense(LICENSE_TEXT);

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{ backdropFilter: "blur(2px)" }}
    >
      <div
        className="modal-box"
        style={{
          width: 660,
          maxHeight: "84vh",
          display: "flex",
          flexDirection: "column",
          background: "var(--surface)",
          boxShadow: "0 24px 64px rgba(0,0,0,.18)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 24px",
          background: "var(--surface-alt)",
          borderBottom: "1px solid var(--border)",
          borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10, flexShrink: 0,
              background: "rgba(29,106,229,.10)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name="file" size={20} color="var(--accent)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-pri)", lineHeight: 1.2 }}>
                License
              </div>
              <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 2 }}>
                Proprietary Source-Available License — vlT
              </div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* ── Body (scrollable) ── */}
        <div style={{ overflowY: "auto", flex: 1, padding: "24px 28px" }}>
          {sections.map((section, i) => (
            <div key={i}>
              {section.heading && (
                <div style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
                  textTransform: "uppercase", color: "var(--text-muted)",
                  marginBottom: 10, paddingBottom: 8,
                  borderBottom: "1px solid var(--border)",
                }}>
                  {section.heading}
                </div>
              )}
              <pre style={{
                fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
                fontSize: 12.5, lineHeight: 1.8,
                whiteSpace: "pre-wrap", wordBreak: "break-word",
                color: "var(--text-pri)",
                margin: 0,
              }}>
                {section.body}
              </pre>
              {i < sections.length - 1 && (
                <div style={{ borderBottom: "1px solid var(--border)", margin: "20px 0" }} />
              )}
            </div>
          ))}
        </div>

        {/* ── Footer ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 24px",
          background: "var(--surface-alt)",
          borderTop: "1px solid var(--border)",
          borderRadius: "0 0 var(--radius-lg) var(--radius-lg)",
          flexShrink: 0,
        }}>
          <a href="mailto:veronesilorenzo@outlook.com"
            style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none" }}>
            veronesilorenzo@outlook.com
          </a>
          <button className="btn btn-secondary" onClick={onClose}>Chiudi</button>
        </div>
      </div>
    </div>
  );
}

export default function InfoView() {
  const [showLicense, setShowLicense] = useState(false);

  return (
    <div className="tab-panel">
      <div style={{ maxWidth: 960, margin: "0 auto" }}>

        {/* ── Info card ── */}
        <div className="card info-header" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <CoreDNSLogo size={52} />
          </div>
          <div className="info-name">{PKG.name}</div>
          <div className="info-desc">
            {PKG.description} — basata su  <code>corednsctl cli api</code>
          </div>
          <div className="info-pills">
            {INFO_PILLS.map(item => (
              <div key={item.label}>
                <div className="info-pill-label">{item.label}</div>
                {item.clickable ? (
                  <button
                    onClick={() => setShowLicense(true)}
                    style={{
                      all: "unset",
                      cursor: "pointer",
                      fontSize: 13, fontWeight: 600, color: "var(--text-pri)",
                      display: "inline-flex", alignItems: "center", gap: 5,
                    }}
                  >
                    {item.value}
                    <Icon name="file" size={12} color="var(--text-muted)" />
                  </button>
                ) : (
                  <div className="info-pill-value">{item.value}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Legal notes ── */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title">Note legali e disclaimer</div>
          {LEGAL.map((text, i) => (
            <div key={i} className="disclaimer-item">
              <div className="disclaimer-dot" />
              <p className="disclaimer-text">{text}</p>
            </div>
          ))}
        </div>

        {/* ── Footer ── */}
        <div className="card info-footer">
          <img src={VLT_LOGO} alt="vlT"
            style={{ height: 36, objectFit: "contain", opacity: .85 }} />
          <div className="info-footer-copy">
            {PKG.author} — Tutti i diritti riservati
          </div>
          <div className="info-footer-note">
            Distribuito con licenza{" "}
            <button
              onClick={() => setShowLicense(true)}
              style={{
                all: "unset", cursor: "pointer",
                fontSize: 11, color: "var(--text-muted)",
                textDecoration: "underline", textUnderlineOffset: 3,
              }}
            >
              Proprietary Source-Available
            </button>
            . Tutti i diritti riservati.
          </div>
        </div>

      </div>

      {showLicense && <LicenseModal onClose={() => setShowLicense(false)} />}
    </div>
  );
}
