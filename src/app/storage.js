/* ── STORAGE — localStorage helpers for UI prefs ── */
import { ROW_STATE_KEY, SIDEBAR_STATE_KEY } from './constants.js';

export function loadRowState() {
  try {
    const r = localStorage.getItem(ROW_STATE_KEY);
    return r ? JSON.parse(r) : { scope: 'expanded', output: 'expanded' };
  } catch(e) { return { scope: 'expanded', output: 'expanded' }; }
}

export function saveRowState(s) {
  try { localStorage.setItem(ROW_STATE_KEY, JSON.stringify(s)); } catch(e) {}
}

export function loadSidebarState() {
  try { return localStorage.getItem(SIDEBAR_STATE_KEY) || 'expanded'; } catch(e) { return 'expanded'; }
}

export function saveSidebarState(s) {
  try { localStorage.setItem(SIDEBAR_STATE_KEY, s); } catch(e) {}
}
