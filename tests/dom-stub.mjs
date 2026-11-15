// Minimal localStorage + window stub so the real storage module can run in node.
let data = new Map();
const localStorage = {
  getItem: (k) => (data.has(k) ? data.get(k) : null),
  setItem: (k, v) => void data.set(k, String(v)),
  removeItem: (k) => void data.delete(k),
};
const listeners = new Map();
globalThis.window = {
  localStorage,
  dispatchEvent: (event) => {
    for (const fn of listeners.get(event.type) ?? []) fn(event);
    return true;
  },
  addEventListener: (type, fn) => {
    if (!listeners.has(type)) listeners.set(type, []);
    listeners.get(type).push(fn);
  },
  removeEventListener: () => {},
};
globalThis.localStorage = localStorage;
globalThis.Event = class { constructor(type) { this.type = type; } };
// Simulates a page reload: module state is gone but storage survives.
globalThis.__reload = () => { listeners.clear(); };
globalThis.__rawStorage = () => [...data.values()].join('');
globalThis.__corrupt = () => data.set('recyclevision.records.v1', '{not json');
