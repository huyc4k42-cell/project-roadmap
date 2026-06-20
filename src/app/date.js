/* ── DATE — week/date helpers used across timeline rendering ── */
import { TLW, WW_FILL_COLS } from './constants.js';
import { loadSidebarState } from './storage.js';
import { getLang } from './i18n.js';

export function parseDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function startMonday(dateStr) {
  const d = parseDate(dateStr);
  const dow = d.getDay();
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow));
  return d;
}

export function isoWeek(date) {
  const d = new Date(date); d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const jan4 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - jan4) / 86400000 - 3 + (jan4.getDay() + 6) % 7) / 7);
}

export function dateStrYMD(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

export function fmtWkpDate(date) {
  const mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${String(date.getDate()).padStart(2,'0')} ${mo[date.getMonth()]} ${date.getFullYear()}`;
}

export function fmtInput(date) {
  if (!date) return '';
  return `${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')}/${date.getFullYear()}`;
}

export function wkpMonday(date) {
  const d = new Date(date); d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow));
  return d;
}

/* These depend on S.cfg — callers pass the config in */
export function totalWeeks(cfg) {
  const s = startMonday(cfg.start);
  const e = parseDate(cfg.end);
  return Math.max(1, Math.ceil((e - s) / (7 * 86400000)) + 1);
}

export function weekDate(w, cfg) {
  const s = startMonday(cfg.start);
  s.setDate(s.getDate() + (w - 1) * 7);
  return s;
}

export function weekLabel(w, cfg) {
  const d = weekDate(w, cfg);
  const locale = getLang() === 'vi' ? 'vi-VN' : 'en-US';
  return d.toLocaleDateString(locale, { month: 'numeric', day: 'numeric' });
}

export function todayWeekFrac(cfg) {
  const s = startMonday(cfg.start);
  return (new Date() - s) / (7 * 86400000) + 1;
}

export function calcWW(cfg) {
  const sbW = loadSidebarState() === 'collapsed' ? 48
    : (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sb')) || 288);
  const available = window.innerWidth - sbW - TLW - 4;
  const cols = Math.min(totalWeeks(cfg), WW_FILL_COLS);
  return Math.max(60, Math.floor(available / cols));
}

export function taskBarH(_task) {
  return 44;
}
