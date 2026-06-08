/* ── ICONS — SVG icon helper + logo asset ── */
import { ICONS } from './constants.js';
import logoUrl from '../assets/logo.png';

export function svgIcon(key, size = 14, cls = '') {
  const ic = ICONS[key];
  if (!ic) return '';
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="${size}" height="${size}" class="${cls}" aria-hidden="true" focusable="false"><path d="${ic.d}"/></svg>`;
}

/* LOGO_IMG — inline <img> referencing Vite-bundled asset */
export const LOGO_IMG = `<img src="${logoUrl}" alt="Arthur" aria-label="Arthur logo" style="height:36px;width:auto">`;

/* LOGO_URL — bare URL (used in home header where size differs) */
export { logoUrl };
