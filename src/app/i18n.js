/* ── I18N — language detection + t() translation function ── */
import en from '../locales/en.json';
import vi from '../locales/vi.json';

const LOCALES = { en, vi };
let _lang = 'en';

export function initLang() {
  const stored  = localStorage.getItem('aroadmap_lang');
  const browser = (navigator.language || 'en').split('-')[0];
  _lang = stored ?? (LOCALES[browser] ? browser : 'en');
}

export function getLang() { return _lang; }

/* t('modal.share.title') → "Share Roadmap"
   t('toast.syncedToCloud', { count: 3 }) → "Synced 3 project(s) to cloud!"
   t('timeline.months') → ["Jan","Feb",...] (arrays returned as-is) */
export function t(key, vars = {}) {
  const val = key.split('.').reduce((o, k) => o?.[k], LOCALES[_lang]) ?? key;
  if (typeof val !== 'string') return val;
  return val.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));
}
