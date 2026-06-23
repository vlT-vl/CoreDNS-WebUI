import { useState } from "react";
import { api } from "../api.js";
import { Icon } from "../components/Icon.jsx";
import { Spinner, Modal, Field, CmdPreview } from "../components/ui.jsx";

/* ── helpers ─────────────────────────────────────────────────────────────── */

function subnetFromZone(name) {
  const core   = name.replace(".in-addr.arpa", "");
  const octets = core.split(".").reverse();
  return octets.join(".") + ".0/24";
}

function subnetBase(name) {
  const core = name.replace(".in-addr.arpa", "");
  return core.split(".").reverse().join(".");
}

function fullIp(base, recordName) {
  return `${base}.${recordName}`;
}

/* ── AddReverseModal ─────────────────────────────────────────────────────── */

function AddReverseModal({ zones, onSave, onClose }) {
  const [form, setForm] = useState({ zone: zones[0]?.name || "", subnet: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const cmd = `corednsctl add reverse ${form.zone || "<zona>"} ${form.subnet || "<subnet>"}`;
  return (
    <Modal title="Aggiungi reverse zone" onClose={onClose}>
      <Field label="Zona forward">
        <select className="field-select" value={form.zone}
          onChange={e => set("zone", e.target.value)}>
          {zones.map(z => <option key={z.name} value={z.name}>{z.name}</option>)}
        </select>
      </Field>
      <Field label="Subnet /24">
        <input className="field-input" value={form.subnet}
          onChange={e => set("subnet", e.target.value)} placeholder="10.0.4.0/24" />
      </Field>
      <CmdPreview cmd={cmd} />
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Annulla</button>
        <button className="btn btn-primary" onClick={() => onSave(form)}
          disabled={!form.zone || !form.subnet}>
          <Icon name="plus" size={14} color="#fff" /> Aggiungi
        </button>
      </div>
    </Modal>
  );
}

/* ── ReverseCard ─────────────────────────────────────────────────────────── */

function ReverseCard({ zone, onRemove }) {
  const [expanded, setExpanded] = useState(false);
  const records  = zone.records || [];
  const base     = subnetBase(zone.name);
  const subnet   = subnetFromZone(zone.name);
  const PREVIEW  = 5;
  const shown    = expanded ? records : records.slice(0, PREVIEW);

  return (
    <div className="reverse-card">

      {/* ── colonna sinistra: identità + stats ─────────────────────────── */}
      <div className="rev-left">
        <div className="rev-card-head">
          <div className="rev-subnet-pill">
            <Icon name="reverse" size={13} color="#1d6ae5" />
            {subnet}
          </div>
          <button className="btn btn-danger btn-sm btn-icon" onClick={onRemove}
            title="Elimina zona">
            <Icon name="trash" size={13} />
          </button>
        </div>

        <div className="rev-arpa">{zone.name}</div>

        <div className="rev-stats-row">
          <div className="rev-stat">
            <span className="rev-stat-label">PTR</span>
            <span className="rev-stat-val accent">{records.length}</span>
          </div>
          <div className="rev-stat">
            <span className="rev-stat-label">Range</span>
            <span className="rev-stat-val" style={{ fontSize: 12 }}>{base}.1–254</span>
          </div>
        </div>

        <div style={{ marginTop: 8 }}>
          <span className="rev-stat-label">File</span>
          <code className="rev-stat-code" style={{ display: "block", marginTop: 3 }}>{zone.file || "–"}</code>
        </div>
      </div>

      {/* ── colonna destra: record PTR ─────────────────────────────────── */}
      <div className="rev-records">
        {records.length === 0 ? (
          <div className="rev-empty">Zona senza record PTR</div>
        ) : (
          <>
            <div className="rev-records-head">
              <span>Indirizzo IP</span>
              <span>Hostname</span>
            </div>
            <div className="rev-records-scroll">
              {shown.map((r, i) => (
                <div key={i} className="rev-record-row">
                  <code className="rev-record-ip">{fullIp(base, r.name)}</code>
                  <span className="rev-record-arrow">→</span>
                  <span className="rev-record-host">{r.value}</span>
                </div>
              ))}
            </div>
            {records.length > PREVIEW && (
              <button className="rev-expand-btn" onClick={() => setExpanded(e => !e)}>
                {expanded ? "Mostra meno ↑" : `+${records.length - PREVIEW} altri record…`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ── ReverseView ─────────────────────────────────────────────────────────── */

export default function ReverseView({ zones, loading, showToast, showConfirm, onRefresh }) {
  const [modal,    setModal]    = useState(null);
  const [checking, setChecking] = useState(null);

  const fwdZones = zones.filter(z => !z.is_reverse);
  const revZones = zones.filter(z =>  z.is_reverse);

  const doAddReverse = async (form) => {
    try {
      await api.addReverse(form);
      showToast("Reverse zone aggiunta");
      setModal(null);
      await onRefresh();
    } catch (e) { showToast(e.message, "error"); }
  };

  const doRemoveReverse = async (zone) => {
    // Verifica che la zona esista ancora prima di procedere
    setChecking(zone.name);
    let fresh;
    try {
      fresh = await api.getZones();
    } catch {
      setChecking(null);
      showToast("Impossibile verificare lo stato delle zone", "error");
      return;
    }
    setChecking(null);

    const stillExists = (fresh.data || []).some(z => z.name === zone.name);
    if (!stillExists) {
      showToast(`La zona "${zone.name}" non è più presente — ricarica la lista`, "error");
      await onRefresh();
      return;
    }

    showConfirm(`Eliminare la reverse zone "${zone.name}"?`, async () => {
      try {
        const parts  = zone.name.replace(".in-addr.arpa", "").split(".");
        const subnet = [...parts].reverse().join(".") + ".0/24";
        await api.removeReverse({ subnet });
        showToast("Zona eliminata");
        await onRefresh();
      } catch (e) { showToast(e.message, "error"); }
    });
  };

  return (
    <div className="tab-panel">
      <div className="tab-panel-inner">

        <div className="tab-panel-header">
          <div>
            <div className="tab-panel-title">Reverse Zone</div>
            <div className="tab-panel-subtitle">{revZones.length} zone in-addr.arpa</div>
          </div>
          <button className="btn btn-primary"
            onClick={() => setModal({ type: "addReverse" })}>
            <Icon name="plus" size={14} color="#fff" /> Aggiungi reverse
          </button>
        </div>

        {loading ? <Spinner /> : revZones.length === 0 ? (
          <div className="empty-state" style={{ padding: "64px 0" }}>
            <Icon name="reverse" size={36} color="#dde4f0" />
            <p>Nessuna reverse zone</p>
          </div>
        ) : (
          <div className="reverse-grid">
            {revZones.map(zone => (
              <ReverseCard
                key={zone.file || zone.name}
                zone={zone}
                onRemove={() => doRemoveReverse(zone)}
                checking={checking === zone.name}
              />
            ))}
          </div>
        )}
      </div>

      {modal?.type === "addReverse" && (
        <AddReverseModal zones={fwdZones} onSave={doAddReverse} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
