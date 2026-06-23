import { CONFIG } from "./config.js";

let _tracker = null;
export function setRequestTracker(fn) { _tracker = fn; }

export async function apiFetch(path, opts = {}) {
  if (_tracker) _tracker(path);
  const res = await fetch(`${CONFIG.apiUrl}${path}`, {
    signal: AbortSignal.timeout(8000),
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Errore sconosciuto");
  return json;
}

export const api = {
  getZones:      ()  => apiFetch("/zones"),
  getCorefile:   ()  => apiFetch("/corefile"),
  createZone:    (b) => apiFetch("/zones/create",   { method: "POST", body: JSON.stringify(b) }),
  removeZone:    (b) => apiFetch("/zones/remove",   { method: "POST", body: JSON.stringify(b) }),
  addReverse:    (b) => apiFetch("/reverse/add",    { method: "POST", body: JSON.stringify(b) }),
  removeReverse: (b) => apiFetch("/reverse/remove", { method: "POST", body: JSON.stringify(b) }),
  addRecord:     (b) => apiFetch("/records/add",    { method: "POST", body: JSON.stringify(b) }),
  removeRecord:  (b) => apiFetch("/records/remove", { method: "POST", body: JSON.stringify(b) }),
  query:         (b) => apiFetch("/query",          { method: "POST", body: JSON.stringify(b) }),
};
