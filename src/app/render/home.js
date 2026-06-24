/* ── RENDER / HOME — home screen, project cards, home modals ── */
import { S }                       from '../state.js';
import { esc }                     from '../utils.js';
import { currentUser }             from '../firebase.js';
import { PROJ_ACCENTS }            from '../constants.js';
import { logoUrl }                 from '../icons.js';
import { buildImportModal }        from './modals.js';
import { buildWkPicker }          from '../weekpicker.js';
import { t }                      from '../i18n.js';
import { parseDate, totalWeeks, fmtInput, todayWeekFrac } from '../date.js';

/* State for home-only UI */
export let homeCtxId        = null;
export let homeUserMenuOpen = false;
export function setHomeCtxId(v)        { homeCtxId = v; }
export function setHomeUserMenuOpen(v) { homeUserMenuOpen = v; }

/* Injected: loadIndex (from persistence/B8) and bindHome (from events/B7) */
let _loadIndex = null;
let _bindHome  = null;
export function setLoadIndex(fn) { _loadIndex = fn; }
export function setBindHome(fn)  { _bindHome  = fn; }

/* ── renderHome ── */
export function renderHome() {
  document.title = 'Arthur — Projects';
  document.getElementById('app').innerHTML = buildHome();
  _bindHome?.();
}

/* ── buildHome ── */
export function buildHome() {
  if (!currentUser) {
    return `<div class="auth-screen" role="main" aria-label="${t('home.signIn')}">
      <canvas id="auth-dot-canvas" class="auth-canvas" aria-hidden="true"></canvas>
      <div class="auth-radial" aria-hidden="true"></div>
      <div class="auth-vignette" aria-hidden="true"></div>

      <div class="auth-logo-wrap" aria-hidden="true">
        <div class="auth-logo-bg"></div>
        <img src="${logoUrl}" alt="Aroadmap" class="auth-logo">
      </div>

      <div class="auth-content">
        <h1 class="auth-title">Turn your roadmap<br>into reality.</h1>
        <p class="auth-desc">Plan visually, align your team in real time,<br>and ship every milestone on schedule.</p>
        <button class="auth-google-btn" id="home-signin-btn">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          ${t('home.signIn')}
        </button>
        <p class="auth-legal">By logging in, you agree to the <a href="#">Policies</a>, <a href="#">Privacy Notice</a>, and <a href="#">Cookie Notice</a>.</p>
      </div>
    </div>`;
  }

  const idx           = _loadIndex?.() || [];
  const accentSwatches = PROJ_ACCENTS.map((c, i) =>
    `<span class="proj-accent-swatch${i === 0 ? ' sel' : ''}" data-acc="${c}" style="background:${c}"></span>`
  ).join('');

  const modal = S.ui.modal
    ? (S.ui.modal.type === 'import' ? buildImportModal() : buildHomeModal(accentSwatches))
    : '';

  if (idx.length === 0 && !S.ui.modal) {
    return `<div class="home">
      ${buildHomeHdr(0)}
      <div class="home-empty">
        <canvas id="home-empty-canvas" class="home-empty-canvas" aria-hidden="true"></canvas>
        <div class="home-empty-center">
          <div class="home-empty-title">${t('home.newProject')} starts here.</div>
          <div class="home-empty-sub">Plan visually, align your team, and ship every milestone on schedule.</div>
          <div class="empty-actions">
            <button class="empty-btn empty-btn-primary" id="home-new-btn" style="display:flex;align-items:center;gap:6px">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              ${t('home.newProject')}
            </button>
            <button class="empty-btn empty-btn-sec" id="home-view-sample-btn">${t('home.viewSample')}</button>
          </div>
        </div>
      </div>
      ${modal}
    </div>`;
  }

  const cards = idx.map(p => buildProjCard(p)).join('');

  return `<div class="home">
    ${buildHomeHdr(idx.length)}
    <div class="home-body">
      <div class="home-section-lbl">${idx.length} project${idx.length !== 1 ? 's' : ''}</div>
      <div class="proj-grid">
        ${cards}
        <button class="proj-new-card" id="home-new-btn" aria-label="${t('home.newProject')}">
          <div class="proj-new-ico" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
          <span class="proj-new-lbl">${t('home.newProject')}</span>
        </button>
      </div>
    </div>
    ${modal}
  </div>`;
}

/* ── buildHomeHdr ── */
export function buildHomeHdr(count) {
  const authHtml = currentUser
    ? `<div class="auth-user-wrap${homeUserMenuOpen ? ' open' : ''}" id="auth-user-wrap">
        <button class="auth-avatar-btn" id="home-avatar-btn" aria-haspopup="true" aria-expanded="${homeUserMenuOpen}" aria-label="Account menu">
          ${currentUser.photoURL
            ? `<img class="auth-avatar" src="${esc(currentUser.photoURL)}" alt="${esc(currentUser.displayName || '')}"/>`
            : `<div class="auth-avatar auth-avatar-fallback">${(currentUser.displayName || currentUser.email || '?')[0].toUpperCase()}</div>`}
        </button>
        ${homeUserMenuOpen ? `<div class="auth-dropdown" id="auth-dropdown" role="menu">
          <div class="auth-dd-info">
            <span class="auth-dd-label">${t('home.signedInAs')}</span>
            <span class="auth-dd-email">${esc(currentUser.email || currentUser.displayName || '')}</span>
          </div>
          <div class="auth-dd-sep"></div>
          <button class="auth-dd-item" id="home-signout-btn" role="menuitem">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            ${t('home.signOut')}
          </button>
        </div>` : ''}
      </div>`
    : `<button class="btn btn-ghost" id="home-signin-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>
        ${t('home.signInBtn')}
      </button>`;

  return `<header class="home-hdr" role="banner">
    <div class="home-hdr-spacer"></div>
    <div class="home-hdr-logo"><img src="${logoUrl}" alt="Aroadmap" style="height:56px;width:auto"></div>
    <div class="home-hdr-actions">
      ${currentUser ? `<button class="btn btn-ghost" id="home-import-btn" title="${t('home.importCsv')}">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
        ${t('home.importCsv')}
      </button>` : ''}
      <button class="btn btn-ghost" id="home-theme-btn" title="${t('home.toggleTheme')}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="5"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.78" y2="4.22"/></svg>
      </button>
      ${currentUser ? `<button class="btn btn-gold" id="home-new-hdr-btn">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        ${t('home.newProject')}
      </button>` : ''}
      ${authHtml}
    </div>
  </header>`;
}

/* ── cardStats helper ── */
function cardStats(p) {
  const s = p.stats || {};
  const phases    = s.phases || 0;
  const phaseEnds = s.phaseEnds || [];
  let totalW = 0, startStr = '—', endStr = '—', phasesDone = 0;
  if (s.start && s.end) {
    const cfg = { start: s.start, end: s.end };
    totalW    = totalWeeks(cfg);
    startStr  = fmtInput(parseDate(s.start));
    endStr    = fmtInput(parseDate(s.end));
    const curW = todayWeekFrac(cfg);
    phasesDone = phaseEnds.filter(ew => ew && ew < curW).length;
  }
  return { phases, phasesDone, totalW, startStr, endStr };
}

/* ── buildProjCard ── */
export function buildProjCard(p) {
  const schedPct = p.stats?.tasks > 0 ? Math.round(p.stats.sched / p.stats.tasks * 100) : 0;
  const accent   = p.accent || '#D0A052';
  const ctxOpen  = homeCtxId === p.id;
  const st       = cardStats(p);

  return `
<div class="proj-card" data-proj-id="${p.id}" role="article" aria-label="${esc(p.name)}">
  <div class="proj-card-stripe" style="background:${accent}"></div>
  <div class="proj-card-top">
    <div class="proj-menu">
      <button class="proj-menu-btn" data-proj-menu="${p.id}" aria-label="Project options" aria-haspopup="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
      </button>
      ${ctxOpen ? `<div class="proj-ctx" role="menu">
        <button class="proj-ctx-item" role="menuitem" data-proj-open="${p.id}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          ${t('home.open')}
        </button>
        <button class="proj-ctx-item" role="menuitem" data-proj-rename="${p.id}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          ${t('home.rename')}
        </button>
        <button class="proj-ctx-item" role="menuitem" data-proj-dup="${p.id}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          ${t('home.duplicate')}
        </button>
        <div class="proj-ctx-sep"></div>
        <button class="proj-ctx-item dng" role="menuitem" data-proj-del="${p.id}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/></svg>
          ${t('common.delete')}
        </button>
      </div>` : ''}
    </div>
  </div>

  <div class="proj-card-head">
    <div class="proj-card-name">${esc(p.name)}</div>
    ${p.subtitle ? `<div class="proj-card-sub">${esc(p.subtitle)}</div>` : ''}
  </div>

  <div class="proj-card-stats">
    <div class="proj-stat-row">
      <span class="proj-stat-lbl">${t('home.cardTimeline')}</span>
      <span class="proj-stat-val">${st.totalW} ${t('home.cardWeeks').replace('{n}', '').trim()}</span>
      <span class="proj-stat-detail">${st.startStr} → ${st.endStr}</span>
    </div>
    <div class="proj-stat-row">
      <span class="proj-stat-lbl">${t('home.cardPhases')}</span>
      <span class="proj-stat-val">${st.phases}</span>
      <span class="proj-stat-detail">${t('home.cardCompleted').replace('{n}', st.phasesDone)}</span>
    </div>
  </div>

  <div class="proj-card-progress">
    <div class="proj-progress-bar">
      <div class="proj-progress-fill" style="width:${schedPct}%;background:${accent}"></div>
    </div>
    <div class="proj-progress-meta">
      <span>${schedPct}% ${t('home.cardScheduled').replace('{n}','').trim()}</span>
    </div>
  </div>

  <div class="proj-card-footer">
    <span class="proj-date">${timeAgo(p.updatedAt)}</span>
    <span class="proj-card-open-badge">${t('home.openBadge') || 'Open →'}</span>
  </div>
</div>`;
}

/* ── buildHomeModal (new-project / rename-project) ── */
export function buildHomeModal(accentSwatches) {
  const hm = S.ui.modal;
  if (!hm) return '';
  const isRename = hm.type === 'rename-project';
  const d        = hm.data || {};

  return `<div class="mbg" id="modal-bg" role="presentation">
    <div class="mdl" role="dialog" aria-modal="true" aria-label="${isRename ? t('modal.project.titleRename') : t('modal.project.titleNew')}">
      <h3>${isRename
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="vertical-align:-2px;margin-right:6px"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>${t('modal.project.titleRename')}`
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="vertical-align:-2px;margin-right:6px"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>${t('modal.project.titleNew')}`}</h3>
      <div class="fg"><label for="hm-name">${t('modal.project.nameLabel')}</label>
        <input class="fi" id="hm-name" value="${esc(d.name || '')}" placeholder="${t('modal.project.namePlaceholder')}" autocomplete="off"/></div>
      <div class="fg"><label for="hm-sub">${t('modal.project.subtitleLabel')}</label>
        <input class="fi" id="hm-sub" value="${esc(d.subtitle || '')}" placeholder="${t('modal.project.subtitlePlaceholder')}" autocomplete="off"/></div>
      <div class="fg"><label>${t('modal.project.accentLabel')}</label>
        <div class="proj-accent-grid" id="hm-accent-grid">${
          isRename
            ? PROJ_ACCENTS.map((c) => `<span class="proj-accent-swatch${c === (d.accent || '#D0A052') ? ' sel' : ''}" data-acc="${c}" style="background:${c}"></span>`).join('')
            : (accentSwatches || '')
        }</div>
      </div>
      ${!isRename ? `<div class="fg"><label>${t('modal.project.timelineLabel')}</label>${buildWkPicker()}</div>` : ''}
      <div class="mdl-btns">
        <button class="bsm b-sec" id="m-cancel">${t('common.cancel')}</button>
        <button class="bsm b-primary" id="m-save">${isRename ? t('common.save') : t('modal.project.createBtn')}</button>
      </div>
    </div>
  </div>`;
}

/* ── timeAgo helper ── */
function timeAgo(ts) {
  const d = Math.floor((Date.now() - ts) / 86400000);
  if (d === 0) return t('home.timeAgo.today');
  if (d === 1) return t('home.timeAgo.yesterday');
  if (d < 30)  return t('home.timeAgo.daysAgo', { n: d });
  const m = Math.floor(d / 30);
  return m < 12 ? t('home.timeAgo.monthsAgo', { n: m }) : t('home.timeAgo.yearsAgo', { n: Math.floor(m / 12) });
}
