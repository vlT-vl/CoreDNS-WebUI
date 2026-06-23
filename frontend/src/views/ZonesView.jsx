import { useState } from "react";
import { api } from "../api.js";
import { RECORD_TYPES } from "../config.js";
import { Icon } from "../components/Icon.jsx";
import { Spinner, TypeBadge, Modal, Field, CmdPreview } from "../components/ui.jsx";

function AddRecordModal({ zone, onSave, onClose }) {
  const [form, setForm] = useState({ name: "", type: "A", value: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const cmd = `corednsctl add record ${zone?.name} ${form.name || "<nome>"}${form.type !== "A" ? " " + form.type : ""} ${form.value || "<valore>"}`;
  return (
    <Modal title={`Aggiungi record — ${zone?.name}`} onClose={onClose}>
      <Field label="Nome">
        <input className="field-input" value={form.name}
          onChange={e => set("name", e.target.value)} placeholder="host oppure @" />
      </Field>
      <div className="field-grid-2">
        <Field label="Tipo">
          <select className="field-select" value={form.type}
            onChange={e => set("type", e.target.value)}>
            {RECORD_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Valore">
          <input className="field-input" value={form.value}
            onChange={e => set("value", e.target.value)} placeholder="10.0.4.99" />
        </Field>
      </div>
      <CmdPreview cmd={cmd} />
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Annulla</button>
        <button className="btn btn-primary" onClick={() => onSave(form)}
          disabled={!form.name || !form.value}>
          <Icon name="plus" size={14} color="#fff" /> Aggiungi
        </button>
      </div>
    </Modal>
  );
}

function CreateZoneModal({ onSave, onClose }) {
  const [form, setForm] = useState({ zone: "", ns_name: "coredns", ns_ip: "", subnet: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const cmd = `corednsctl create zone ${form.zone || "<zona>"}${form.subnet ? " " + form.subnet : ""} ${form.ns_name} ${form.ns_ip || "<ip>"}`;
  return (
    <Modal title="Crea nuova zona DNS" onClose={onClose}>
      <Field label="Nome zona">
        <input className="field-input" value={form.zone}
          onChange={e => set("zone", e.target.value)} placeholder="cdns.s2etech.it" />
      </Field>
      <div className="field-grid-2">
        <Field label="NS Name">
          <input className="field-input" value={form.ns_name}
            onChange={e => set("ns_name", e.target.value)} />
        </Field>
        <Field label="NS IP">
          <input className="field-input" value={form.ns_ip}
            onChange={e => set("ns_ip", e.target.value)} placeholder="10.0.4.2" />
        </Field>
      </div>
      <Field label="Subnet /24 (opz. — crea anche reverse)">
        <input className="field-input" value={form.subnet}
          onChange={e => set("subnet", e.target.value)} placeholder="10.0.4.0/24" />
      </Field>
      <CmdPreview cmd={cmd} />
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Annulla</button>
        <button className="btn btn-primary" onClick={() => onSave(form)}
          disabled={!form.zone || !form.ns_ip}>
          <Icon name="plus" size={14} color="#fff" /> Crea zona
        </button>
      </div>
    </Modal>
  );
}

const recKey = (r) => `${r.name}||${r.type}||${r.value}`;

export default function ZonesView({ zones, loading, showToast, showConfirm, onRefresh }) {
  const [selectedName, setSelectedName] = useState(null);
  const [search, setSearch]             = useState("");
  const [modal, setModal]               = useState(null);
  const [checkedKeys, setCheckedKeys]   = useState(new Set());
  const [checkingZone, setCheckingZone] = useState(false);

  const fwdZones = zones.filter(z => !z.is_reverse);

  // Auto-select first zone; keep current or fall back when list changes
  const currentZone = (() => {
    if (!selectedName) return fwdZones[0] || null;
    return fwdZones.find(z => z.name === selectedName) || fwdZones[0] || null;
  })();

  const filteredRecords = (currentZone?.records || []).filter(r =>
    !search ||
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.type?.toLowerCase().includes(search.toLowerCase()) ||
    r.value?.toLowerCase().includes(search.toLowerCase())
  );

  const allKeys      = filteredRecords.map(recKey);
  const allChecked   = allKeys.length > 0 && allKeys.every(k => checkedKeys.has(k));
  const someChecked  = !allChecked && allKeys.some(k => checkedKeys.has(k));

  const toggleAll = () => {
    if (allChecked) { setCheckedKeys(new Set()); return; }
    setCheckedKeys(new Set(allKeys));
  };
  const toggleOne = (key) => {
    setCheckedKeys(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const doRemoveSelected = () => {
    const targets = filteredRecords.filter(r => checkedKeys.has(recKey(r)));
    showConfirm(
      `Eliminare ${targets.length} record da "${currentZone.name}"?`,
      async () => {
        try {
          await Promise.all(targets.map(r =>
            api.removeRecord({ zone: currentZone.name, name: r.name, type: r.type })
          ));
          showToast(`${targets.length} record eliminati`);
          setCheckedKeys(new Set());
          await onRefresh();
        } catch (e) { showToast(e.message, "error"); }
      }
    );
  };

  const doCreateZone = async (form) => {
    try {
      await api.createZone(form);
      showToast("Zona creata: " + form.zone);
      setModal(null);
      await onRefresh();
    } catch (e) { showToast(e.message, "error"); }
  };

  const doRemoveZone = async (zone) => {
    setCheckingZone(true);
    let fresh;
    try {
      fresh = await api.getZones();
    } catch {
      setCheckingZone(false);
      showToast("Impossibile verificare lo stato delle zone", "error");
      return;
    }
    setCheckingZone(false);

    const stillExists = (fresh.data || []).some(z => z.name === zone.name);
    if (!stillExists) {
      showToast(`La zona "${zone.name}" non è più presente — ricarica la lista`, "error");
      await onRefresh();
      return;
    }

    showConfirm(`Eliminare la zona "${zone.name}"?`, async () => {
      try {
        await api.removeZone({ zone: zone.name });
        showToast("Zona eliminata");
        setSelectedName(null);
        await onRefresh();
      } catch (e) { showToast(e.message, "error"); }
    });
  };

  const doAddRecord = async (form) => {
    try {
      await api.addRecord({ zone: currentZone.name, ...form });
      showToast("Record aggiunto");
      setModal(null);
      await onRefresh();
    } catch (e) { showToast(e.message, "error"); }
  };


  return (
    <>
      {/* Zone list sidebar */}
      <div className="zone-list">
        <div className="zone-list-header">
          <span className="zone-list-title">Zone ({fwdZones.length})</span>
          <button className="btn btn-primary btn-sm"
            onClick={() => setModal({ type: "createZone" })}>
            <Icon name="plus" size={13} color="#fff" /> Nuova
          </button>
        </div>
        <div className="zone-list-body">
          {loading ? <Spinner /> : fwdZones.length === 0 ? (
            <div className="spinner-wrap">Nessuna zona</div>
          ) : fwdZones.map(zone => (
            <div key={zone.file || zone.name}
              className={`zone-item ${currentZone?.name === zone.name ? "active" : ""}`}
              onClick={() => { setSelectedName(zone.name); setCheckedKeys(new Set()); }}>
              <div className="zone-item-name">{zone.name}</div>
              <div className="zone-item-meta">{(zone.records || []).length} record</div>
            </div>
          ))}
        </div>
      </div>

      {/* Records panel */}
      <div className="records-panel">
        {currentZone ? (
          <>
            <div className="records-toolbar">
              <span className="zone-heading">{currentZone.name}</span>
              <div className="search-wrap" style={{ marginLeft: 8 }}>
                <Icon name="search" size={13} color="#8a9ab8" />
                <input className="search-inp" placeholder="Cerca…"
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div style={{ flex: 1 }} />
              <button className={`btn btn-danger btn-sm${checkingZone ? " btn--loading" : ""}`}
                disabled={checkingZone}
                onClick={() => doRemoveZone(currentZone)}>
                <Icon name="trash" size={13} /> Zona
              </button>
              {checkedKeys.size > 0 && (
                <button className="btn btn-danger btn-sm" onClick={doRemoveSelected}>
                  <Icon name="trash" size={13} /> Elimina ({checkedKeys.size})
                </button>
              )}
              <button className="btn btn-primary btn-sm"
                onClick={() => setModal({ type: "addRecord" })}>
                <Icon name="plus" size={14} color="#fff" /> Record
              </button>
            </div>
            <div className="records-body">
              <table className="records-table">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>
                      <input type="checkbox" className="rec-checkbox"
                        checked={allChecked} ref={el => { if (el) el.indeterminate = someChecked; }}
                        onChange={toggleAll} />
                    </th>
                    {["Nome","Tipo","TTL","Valore"].map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: "center", padding: "40px 0", color: "#8a9ab8", fontSize: 13 }}>
                      {search ? "Nessun risultato" : "Zona vuota"}
                    </td></tr>
                  ) : filteredRecords.map((rec, i) => {
                    const key     = recKey(rec);
                    const checked = checkedKeys.has(key);
                    return (
                      <tr key={i} className={`tr-record${checked ? " tr-selected" : ""}`}
                        onClick={() => toggleOne(key)} style={{ cursor: "pointer" }}>
                        <td style={{ textAlign: "center" }} onClick={e => e.stopPropagation()}>
                          <input type="checkbox" className="rec-checkbox"
                            checked={checked} onChange={() => toggleOne(key)} />
                        </td>
                        <td className="td-name">{rec.name}</td>
                        <td className="td-mid"><TypeBadge type={rec.type} /></td>
                        <td className="td-ttl">{rec.ttl || "–"}</td>
                        <td className="td-val">{rec.value}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <Icon name="globe" size={40} color="#dde4f0" />
            <p>Seleziona una zona</p>
          </div>
        )}
      </div>

      {modal?.type === "addRecord"  && <AddRecordModal  zone={currentZone} onSave={doAddRecord}  onClose={() => setModal(null)} />}
      {modal?.type === "createZone" && <CreateZoneModal                    onSave={doCreateZone} onClose={() => setModal(null)} />}
    </>
  );
}
