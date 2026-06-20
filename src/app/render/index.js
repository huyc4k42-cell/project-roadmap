/* ── RENDER / INDEX — main render(), buildApp(), rerender(), WW global ── */
import { S }                           from '../state.js';
import { esc }                         from '../utils.js';
import { calcWW, totalWeeks }          from '../date.js';
import { currentUser }                 from '../firebase.js';
import { currentProjId, saveCurrentProject } from '../persistence.js';
import { LOGO_IMG, svgIcon }           from '../icons.js';
import { buildSidebar }                from './sidebar.js';
import { buildTimeline, setWW }        from './timeline.js';
import { setResizeWW }                 from '../events/resize.js';
import { buildCtx, renderModal }       from './modals.js';
import { renderHome }                  from './home.js';
import { t }                           from '../i18n.js';

/* ── WW — module-level week-width; set each render cycle ── */
export let WW = 64;

/* Injected callbacks */
let _bind     = null;
let _onbCheck = null;
export function setBind(fn)     { _bind     = fn; }
export function setOnbCheck(fn) { _onbCheck = fn; }

/* ── render() ── */
export function render(noSave = false) {
  WW = Math.max(60, calcWW(S.cfg));
  document.documentElement.style.setProperty('--ww', WW + 'px');
  setWW(WW);       // propagate to timeline module
  setResizeWW(WW); // propagate to resize module

  /* Preserve scroll positions */
  const ta = document.querySelector('.tl-area');
  const sl = ta ? ta.scrollLeft : 0;
  const st = ta ? ta.scrollTop  : 0;
  const sb = document.querySelector('.task-list');
  const ss = sb ? sb.scrollTop : 0;

  document.getElementById('app').innerHTML = buildApp();
  _bind?.();
  _onbCheck?.();

  /* Restore scroll */
  const ta2 = document.querySelector('.tl-area');
  if (ta2) { ta2.scrollLeft = sl; ta2.scrollTop = st; }
  const sb2 = document.querySelector('.task-list');
  if (sb2) sb2.scrollTop = ss;

  if (!noSave) saveCurrentProject();
}

/* ── buildApp() ── */
export function buildApp() {
  const total   = S.tasks.length;
  const sched   = S.tasks.filter(tk => tk.startWeek !== null).length;
  const unsched = total - sched;
  const tw      = totalWeeks(S.cfg);
  const ro      = S.ui.readonly;

  return `
${ro ? `<div class="ro-banner">
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  <span>${t('header.readOnlyBanner')}</span>
  <a class="ro-link" href="${location.origin + location.pathname}" target="_blank">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
    ${t('header.createYourOwn')}
  </a>
</div>` : ''}
<div class="hdr">
  <div class="hdr-row1">
    ${currentProjId && !ro
      ? `<div class="breadcrumb">
          <button class="bc-home" id="btn-back-home" aria-label="${t('header.backToProjects')}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            ${t('nav.projects')}
          </button>
          <span class="bc-sep" aria-hidden="true">›</span>
          <div class="bc-cur-wrap" id="hdr-title-click" role="button" tabindex="0" aria-label="${t('header.editName')}">
            <span class="bc-cur">${esc(S.cfg.title)}</span>
            <svg class="edit-pen" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </div>
         </div>`
      : `<div class="logo">${LOGO_IMG}</div>
         <div class="vsep"></div>
         <div class="hdr-info">
           <div class="${ro ? '' : 'hdr-title-wrap'}" ${ro ? '' : 'id="hdr-title-click"'}>
             <div class="hdr-title">${esc(S.cfg.title)}</div>
             ${ro ? '' : `<svg class="edit-pen" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`}
           </div>
           <div class="hdr-sub">${esc(S.cfg.subtitle) || '&nbsp;'}</div>
         </div>`
    }
    <div class="hdr-btns">
      ${ro ? '' : `
      <button class="btn btn-ghost" id="btn-cfg">${svgIcon('settings', 13)} ${t('nav.settings')}</button>
      <div class="btn-dd" role="none">
        <button class="btn btn-ghost" id="btn-add-new" aria-haspopup="menu" aria-expanded="false" aria-controls="add-new-menu">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          ${t('common.add')}
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="add-dd-menu" id="add-new-menu" role="menu">
          <button class="add-dd-item" role="menuitem" data-add="phase">${svgIcon('map', 13)} ${t('nav.addPhase')}</button>
          <button class="add-dd-item" role="menuitem" data-add="add-task">${svgIcon('edit', 13)} ${t('nav.addTask')}</button>
          <button class="add-dd-item" role="menuitem" data-add="add-team">${svgIcon('users', 13)} ${t('nav.addTeam')}</button>
          <div style="height:1px;background:var(--bd);margin:3px 5px"></div>
          <button class="add-dd-item" role="menuitem" data-add="import-csv"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg> ${t('nav.importCsv')}</button>
        </div>
      </div>
      <button class="btn btn-gold" id="btn-export">${svgIcon('package', 13)} ${t('nav.exportPdf')}</button>
      <button class="btn btn-ghost btn-outline-gold" id="btn-share" aria-label="${t('nav.shareLabel')}">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        ${t('nav.share')}
      </button>`}
    </div>
  </div>
  <div class="hdr-row2" role="group" aria-label="Stats">
    <button class="stat" id="stat-all" title="${t('header.total')}" aria-label="${t('header.statsTotal', { n: total })}"><span class="stat-n gd">${total}</span><span class="stat-l">${t('header.total')}</span></button>
    <button class="stat" id="stat-sched" title="${t('header.scheduled')}" aria-label="${t('header.statsSched', { n: sched })}"><span class="stat-n gn">${sched}</span><span class="stat-l">${t('header.scheduled')}</span></button>
    <button class="stat" id="stat-back" title="${t('header.backlog')}" aria-label="${t('header.statsBacklog', { n: unsched })}"><span class="stat-n mt">${unsched}</span><span class="stat-l">${t('header.backlog')}</span></button>
    <div class="stat" aria-label="${t('header.statsWeeks', { n: tw })}"><span class="stat-n" style="color:var(--txt2)">${tw}</span><span class="stat-l">${t('header.weeks')}</span></div>
  </div>
</div>
<div class="body ${ro ? 'readonly' : ''}">
  ${buildSidebar()}
  ${buildTimeline()}
</div>
${S.ui.ctx ? buildCtx() : ''}`;
}

/* ── rerender() — smart re-render: updates modal-root independently in project view ── */
export function rerender() {
  if (currentProjId) {
    if (S.ui.modal) renderModal();
    else {
      const root = document.getElementById('modal-root');
      if (root) root.innerHTML = '';
    }
    render();
  } else {
    renderHome();
  }
}
