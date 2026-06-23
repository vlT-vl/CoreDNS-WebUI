import { useState } from "react";
import { api } from "../api.js";
import { RECORD_TYPES } from "../config.js";
import { Icon } from "../components/Icon.jsx";
import { Field, Terminal } from "../components/ui.jsx";

export default function QueryView() {
  const [input, setInput]     = useState({ record: "", type: "", server: "" });
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setInput(q => ({ ...q, [k]: v }));

  const doQuery = async () => {
    setLoading(true);
    setResult(null);
    try {
      const r = await api.query(input);
      setResult(r.data);
    } catch (e) {
      setResult({ error: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tab-panel">
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div className="tab-panel-title" style={{ marginBottom: 4 }}>Query DNS</div>
        <div className="tab-panel-subtitle" style={{ marginBottom: 20 }}>
          Esegue <code style={{ color: "#1d6ae5", background: "#e8f0fd", padding: "1px 6px", borderRadius: 4, fontSize: 11 }}>corednsctl query record</code> sul nodo
        </div>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="field-grid-3" style={{ marginBottom: 16 }}>
            <Field label="Record / IP">
              <input className="field-input" value={input.record}
                onChange={e => set("record", e.target.value)}
                placeholder="host.zona.it" />
            </Field>
            <Field label="Tipo">
              <select className="field-select" value={input.type}
                onChange={e => set("type", e.target.value)}>
                <option value="">Auto</option>
                {RECORD_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Server DNS">
              <input className="field-input" value={input.server}
                onChange={e => set("server", e.target.value)}
                placeholder="10.0.4.2 (opz.)" />
            </Field>
          </div>
          <button className="btn btn-primary"
            onClick={doQuery} disabled={!input.record || loading}>
            <Icon name="search" size={14} color="#fff" />
            {loading ? "In corso…" : "Esegui query"}
          </button>
        </div>
        {result && <Terminal label="output" error={result.error} output={result.output} />}
      </div>
    </div>
  );
}
