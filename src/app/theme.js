/* ── THEME — dark / light / system preference ── */
import { THEME_KEY } from './constants.js';

export function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getCurrentThemePref() {
  return localStorage.getItem(THEME_KEY) || 'dark';
}

export function applyTheme(pref) {
  const actual = pref === 'system' ? getSystemTheme() : pref;
  document.documentElement.dataset.theme = actual;
}

export function setTheme(pref, rerenderFn) {
  localStorage.setItem(THEME_KEY, pref);
  applyTheme(pref);
  rerenderFn?.();
}

export function loadTheme() {
  applyTheme(getCurrentThemePref());
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getCurrentThemePref() === 'system') applyTheme('system');
  });
}
