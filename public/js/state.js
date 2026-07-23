// Application state and persistence
import { STORAGE_KEY } from './constants.js';

export const state = {
  canvasType: 'whiteboard',
  lanes: [],
  prompts: [],
  cards: [],
  connections: [],
  selection: { cardId: null, connId: null },
  view: { x: 0, y: 0, scale: 1 },
  session: null, // { title, customer, description, stages:[...], activeIndex }
};

// Hook called after save — set by collab module to sync changes to peers
let onSaveHook = null;
export function setOnSaveHook(fn) { onSaveHook = fn; }

export function save() {
  try {
    if (typeof window.__persistCurrentStage === 'function') window.__persistCurrentStage();
    const { selection, view, ...persist } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persist));
  } catch (e) { /* silent */ }
  // Notify collab layer of local change
  if (onSaveHook) onSaveHook();
}

export function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    Object.assign(state, data);
    state.connections = state.connections || [];
    return true;
  } catch (e) { return false; }
}
