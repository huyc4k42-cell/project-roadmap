/* ── UTILS — DOM helpers, string helpers, tag palette ── */
import { TAG_PALETTES } from './constants.js';

export const q    = sel => document.querySelector(sel);
export const qAll = sel => document.querySelectorAll(sel);

export function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

export function tagPalette(tag) {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) & 0xffff;
  return TAG_PALETTES[h % TAG_PALETTES.length];
}

export function showToast(msg, dur = 3000) {
  const existing = document.querySelector('.imp-toast');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = 'imp-toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), dur);
}
