/* ── RENDER / MODALS — project modal, context menu, renderModal ── */
import { S, phaseById }                  from '../state.js';
import { esc, tagPalette }               from '../utils.js';
import { totalWeeks, weekLabel }         from '../date.js';
import { ICONS, PHASE_COLORS, PROJ_ACCENTS, SHEETS_TEMPLATE_URL } from '../constants.js';
import { svgIcon }                       from '../icons.js';
import { buildWkPicker }                 from '../weekpicker.js';
import { t }                             from '../i18n.js';

/* Forward-declare bind callbacks — injected by bind layer (B7) */
let _bindModal       = null;
let _bindImportModal = null;
export function setBindModal(fn)       { _bindModal = fn; }
export function setBindImportModal(fn) { _bindImportModal = fn; }

/* ── renderModal ── */
export function renderModal() {
  const root = document.getElementById('modal-root');
  if (!root) return;
  if (!S.ui.modal) { root.innerHTML = ''; return; }
  root.innerHTML = S.ui.modal.type === 'import' ? buildImportModal() : buildModal();
  if (S.ui.modal.type === 'import') _bindImportModal?.();
  else _bindModal?.();
}

/* ── openModal / closeModal ── */
export function openModal(type, data = null, parseDate, wkpMonday, wkp) {
  S.ui.modal = { type, data };
  if (parseDate && wkpMonday && wkp) {
    if (type === 'cfg') {
      const sm     = wkpMonday(parseDate(S.cfg.start));
      wkp.startMon = sm;
      wkp.endMon   = wkpMonday(parseDate(S.cfg.end));
      wkp.yr       = sm.getFullYear();
      wkp.mo       = sm.getMonth();
      wkp.step     = 'start';
      wkp.showMonthSel = false;
      wkp.phaseMode = false;
      wkp.cfgStart  = null;
    } else if (type === 'add-phase' || type === 'edit-phase') {
      const ph       = data || {};
      const cfgStart = wkpMonday(parseDate(S.cfg.start));
      const sw       = ph.startWeek || 1;
      const ew       = ph.endWeek   || Math.min(sw + 3, totalWeeks(S.cfg));
      wkp.cfgStart   = cfgStart;
      wkp.phaseMode  = true;
      wkp.startMon   = new Date(cfgStart.getTime() + (sw - 1) * 7 * 86400000);
      wkp.endMon     = new Date(cfgStart.getTime() + (ew - 1) * 7 * 86400000);
      wkp.yr         = wkp.startMon.getFullYear();
      wkp.mo         = wkp.startMon.getMonth();
      wkp.step       = 'start';
      wkp.showMonthSel = false;
    }
  }
  renderModal();
}

export function closeModal(renderFn) {
  S.ui.modal = null;
  const root = document.getElementById('modal-root');
  if (root) root.innerHTML = '';
  renderFn?.();
}

/* ── openCtx / closeCtx ── */
export function openCtx(x, y, items, renderFn) {
  S.ui.ctx = { x, y, items };
  renderFn?.();
}

export function closeCtx(renderFn) {
  if (!S.ui.ctx) return;
  S.ui.ctx = null;
  renderFn?.();
}

/* ══════════════════════════════════════════════════════════════════
   BUILD FUNCTIONS
══════════════════════════════════════════════════════════════════ */

export function buildModal() {
  const { type, data } = S.ui.modal;

  /* ── Share ── */
  if (type === 'share') {
    /* buildShareURL injected at runtime — use placeholder if unavailable */
    const url = typeof _buildShareURL === 'function' ? _buildShareURL() : location.href;
    return `<div class="mbg" id="modal-bg" role="presentation"><div class="mdl" role="dialog" aria-modal="true" aria-label="${t('modal.share.title')}">
      <h3><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="vertical-align:-2px;margin-right:6px"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>${t('modal.share.title')}</h3>
      <p class="hlp" style="margin-bottom:10px">${t('modal.share.hint')}</p>
      <div class="fg"><label>${t('modal.share.linkLabel')}</label>
        <div class="share-url-wrap">
          <input class="share-url" id="share-url-inp" readonly value="${esc(url)}"/>
          <button class="share-copy" id="share-copy-btn">${t('modal.share.copy')}</button>
        </div>
      </div>
      <p class="hlp" style="margin-top:8px;font-size:11px">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="vertical-align:-1px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        ${t('modal.share.footer')}
      </p>
      <div class="mdl-btns"><button class="bsm b-sec" id="m-cancel">${t('common.close')}</button></div>
    </div></div>`;
  }

  /* ── Settings / cfg ── */
  if (type === 'cfg') {
    return `<div class="mbg" id="modal-bg" role="presentation"><div class="mdl mdl-cfg" role="dialog" aria-modal="true" aria-label="${t('nav.settings')}">
      <h3>${svgIcon('settings', 14)} ${t('nav.settings')}</h3>
      <div class="cfg-grid">
        <div class="cfg-left">
          <div class="fg"><label>${t('modal.cfg.nameLabel')}</label>
            <input class="fi" id="m-cfg-title" value="${esc(S.cfg.title)}" placeholder="${t('modal.cfg.namePlaceholder')}"/></div>
          <div class="fg"><label>${t('modal.cfg.subtitleLabel')}</label>
            <input class="fi" id="m-cfg-sub" value="${esc(S.cfg.subtitle)}" placeholder="${t('modal.cfg.subtitlePlaceholder')}"/></div>
          <div class="fg"><label>${t('modal.cfg.timelineLabel')}</label>${buildWkPicker()}</div>
        </div>
        <div class="cfg-right">
          <div class="fg"><label>${t('modal.cfg.dataLabel')}</label>
            <button class="bsm b-dng" id="m-reset" style="width:100%;justify-content:center;margin-top:2px">${t('modal.cfg.resetBtn')}</button>
          </div>
          <div class="cfg-right-actions">
            <button class="bsm b-sec" id="m-cancel">${t('common.cancel')}</button>
            <button class="bsm b-primary" id="m-save">${t('common.save')}</button>
          </div>
        </div>
      </div>
    </div></div>`;
  }

  /* ── Add / Edit task ── */
  if (type === 'add-task' || type === 'edit-task') {
    const td     = data || {};
    const isEdit = type === 'edit-task';
    const selTags = td.tags || [];
    const tagOpts = S.tags.map(tg => {
      const [bg, fg] = tagPalette(tg);
      return `<button class="to${selTags.includes(tg) ? ' sel' : ''}" data-tag="${esc(tg)}"
        style="${selTags.includes(tg) ? `border-color:${fg};color:${fg};background:${bg}` : ''}">${esc(tg)}</button>`;
    }).join('');
    const titleKey = isEdit ? t('modal.task.titleEdit') : t('modal.task.titleAdd');

    return `<div class="mbg" id="modal-bg" role="presentation"><div class="mdl" role="dialog" aria-modal="true" aria-label="${titleKey}">
      <h3>${svgIcon('edit', 14)} ${titleKey}</h3>
      <div class="fg"><label>${t('modal.task.nameLabel')}</label>
        <input class="fi" id="m-name" value="${esc(td.name || '')}" placeholder="${t('modal.task.namePlaceholder')}"/></div>
      <div class="fg-row">
        <div class="fg"><label>${t('modal.task.teamLabel')}</label>
          <select class="fi" id="m-team">
            <option value=""${!td.teamId ? ' selected' : ''}>${t('modal.task.teamNone')}</option>
            ${S.teams.map(tm => `<option value="${tm.id}"${tm.id === td.teamId ? ' selected' : ''}>${esc(tm.name)}</option>`).join('')}
          </select></div>
        <div class="fg"><label>${t('modal.task.durationLabel')}</label>
          <div class="dur-stepper">
            <button type="button" class="dur-btn dur-dec" tabindex="-1">−</button>
            <span class="dur-val">${td.dur || 2}</span>
            <input type="hidden" id="m-dur" value="${td.dur || 2}"/>
            <button type="button" class="dur-btn dur-inc" tabindex="-1">+</button>
          </div>
        </div>
      </div>
      <div class="fg"><label>${t('modal.task.notesLabel')}</label>
        <textarea class="fi" id="m-desc" rows="3" placeholder="${t('modal.task.notesPlaceholder')}">${esc(td.desc || '')}</textarea></div>
      <div class="fg"><label>${t('modal.task.tagsLabel')}</label>
        <div class="tag-opts" id="tag-opts">${tagOpts}</div></div>
      <div class="mdl-btns">
        ${isEdit ? `<button class="bsm b-dng" id="m-del">${t('common.delete')}</button>` : ''}
        <button class="bsm b-sec" id="m-cancel">${t('common.cancel')}</button>
        <button class="bsm b-primary" id="m-save">${isEdit ? t('common.save') : t('common.add')}</button>
      </div>
    </div></div>`;
  }

  /* ── Add / Edit team ── */
  if (type === 'add-team' || type === 'edit-team') {
    const tm     = data || {};
    const isEdit = type === 'edit-team';
    const selIcon  = tm.icon  || 'layers';
    const selColor = tm.color || '#D0A052';
    const iconGrid = Object.entries(ICONS).map(([key, ic]) =>
      `<button class="ig${key === selIcon ? ' sel' : ''}" data-icon="${key}" style="${key === selIcon ? `color:${selColor}` : ''}">
        ${svgIcon(key, 15)}
        <span class="ig-lbl">${ic.l}</span>
      </button>`).join('');
    const colors = ['#D0A052','#7c3aed','#1d4ed8','#047857','#be185d','#0e7490','#b45309','#10b981','#ef4444','#8b5cf6'];
    const colorDots = colors.map(c =>
      `<div class="co${c === selColor ? ' sel' : ''}" data-color="${c}" style="background:${c}"></div>`).join('');
    const titleKey = isEdit ? t('modal.team.titleEdit') : t('modal.team.titleAdd');

    return `<div class="mbg" id="modal-bg" role="presentation"><div class="mdl" role="dialog" aria-modal="true" aria-label="${titleKey}">
      <h3>${svgIcon('users', 14)} ${titleKey}</h3>
      <div class="fg"><label>${t('modal.team.nameLabel')}</label>
        <input class="fi" id="m-tm-name" value="${esc(tm.name || '')}" placeholder="${t('modal.team.namePlaceholder')}"/></div>
      <div class="fg"><label>${t('modal.team.iconLabel')}</label>
        <div class="icon-grid">${iconGrid}</div></div>
      <div class="fg"><label>${t('modal.team.colorLabel')}</label>
        <div class="col-opts">${colorDots}</div></div>
      <div class="mdl-btns">
        ${isEdit ? `<button class="bsm b-dng" id="m-del">${t('modal.team.deleteBtn')}</button>` : ''}
        <button class="bsm b-sec" id="m-cancel">${t('common.cancel')}</button>
        <button class="bsm b-primary" id="m-save">${isEdit ? t('common.save') : t('common.add')}</button>
      </div>
    </div></div>`;
  }

  /* ── Add / Edit phase ── */
  if (type === 'add-phase' || type === 'edit-phase') {
    const ph     = data || {};
    const isEdit = type === 'edit-phase';
    const colorBtns = PHASE_COLORS.map(c =>
      `<div class="co${c === (ph.color || PHASE_COLORS[0]) ? ' sel' : ''}" data-color="${c}" style="background:${c}"></div>`).join('');
    const titleKey = isEdit ? t('modal.phase.titleEdit') : t('modal.phase.titleAdd');

    return `<div class="mbg" id="modal-bg" role="presentation"><div class="mdl" role="dialog" aria-modal="true" aria-label="${titleKey}">
      <h3>${svgIcon('map', 14)} ${titleKey}</h3>
      <div class="fg"><label>${t('modal.phase.nameLabel')}</label>
        <input class="fi" id="m-ph-name" value="${esc(ph.name || '')}" placeholder="${t('modal.phase.namePlaceholder')}"/></div>
      ${buildWkPicker()}
      <div class="fg"><label>${t('modal.phase.colorLabel')}</label>
        <div class="col-opts">${colorBtns}</div></div>
      <div class="mdl-btns">
        ${isEdit ? `<button class="bsm b-dng" id="m-del">${t('common.delete')}</button>` : ''}
        <button class="bsm b-sec" id="m-cancel">${t('common.cancel')}</button>
        <button class="bsm b-primary" id="m-save">${isEdit ? t('common.save') : t('common.add')}</button>
      </div>
    </div></div>`;
  }

  return '';
}

/* ── Context menu ── */
export function buildCtx() {
  const { x, y, items } = S.ui.ctx;
  const safeX = Math.min(x, window.innerWidth  - 160);
  const safeY = Math.min(y, window.innerHeight - items.length * 32 - 10);
  return `<div class="ctx" id="ctx-menu" role="menu" aria-label="Context menu" style="left:${safeX}px;top:${safeY}px">
    ${items.map(it => it === '---'
      ? '<div class="ci-sep" role="separator"></div>'
      : `<div class="ci${it.d ? ' dng' : ''}" data-action="${it.a}" role="menuitem" tabindex="0">${it.icon ? svgIcon(it.icon, 12) : ''} ${it.l}</div>`
    ).join('')}
  </div>`;
}

/* ── Import modal ── */
export function buildImportModal() {
  const t = S.ui.modal;
  if (!t || t.type !== 'import') return '';
  const step = t.step || 1;
  const idx  = _loadIndex?.() || [];

  const stepsHtml = `<div class="imp-steps">
    <div class="imp-step-dot ${step > 1 ? 'done' : 'active'}">
      <div class="imp-step-num">${step > 1 ? '✓' : '1'}</div><span>${t('modal.import.step1')}</span>
    </div>
    <div class="imp-step-line"></div>
    <div class="imp-step-dot ${step === 2 ? 'active' : ''}">
      <div class="imp-step-num">2</div><span>${t('modal.import.step2')}</span>
    </div>
  </div>`;

  if (step === 1) {
    const isNew = !t.targetId || t.targetId === 'new';
    const projOptions = idx.map(p =>
      `<option value="${p.id}"${t.targetId === p.id ? ' selected' : ''}>${esc(p.name)}</option>`
    ).join('');

    const mi = t; // modal import state alias
    return `<div class="mbg" id="modal-bg" role="presentation">
      <div class="mdl mdl-wide" role="dialog" aria-modal="true" aria-label="${t('modal.import.title')}">
        <h3><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="vertical-align:-2px;margin-right:6px"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>${t('modal.import.title')}</h3>
        ${stepsHtml}

        <div class="fg">
          <label for="imp-target">${t('modal.import.projectLabel')}</label>
          <select class="fi" id="imp-target" style="cursor:pointer">
            <option value="new"${isNew ? ' selected' : ''}>${t('modal.import.newProjectOption')}</option>
            ${idx.length ? `<optgroup label="${t('modal.import.existingGroup')}">${projOptions}</optgroup>` : ''}
          </select>
        </div>

        ${isNew ? `<div class="fg" id="imp-newname-row">
          <label for="imp-newname">${t('modal.import.newNameLabel')}</label>
          <input class="fi" id="imp-newname" value="${esc(mi.newProjName || '')}" placeholder="${t('modal.import.newNamePlaceholder')}" autocomplete="off"/>
        </div>` : `<div class="fg">
          <label>${t('modal.import.mergeLabel')}</label>
          <div class="imp-mode-row">
            <button class="imp-mode-btn${mi.mode !== 'replace' ? ' sel' : ''}" id="imp-mode-merge">
              <strong>${t('modal.import.mergeTitle')}</strong><br>
              <span style="font-size:11px;font-weight:400;opacity:.7">${t('modal.import.mergeDesc')}</span>
            </button>
            <button class="imp-mode-btn imp-mode-replace${mi.mode === 'replace' ? ' sel' : ''}" id="imp-mode-replace">
              <strong>${t('modal.import.replaceTitle')}</strong><br>
              <span style="font-size:11px;font-weight:400;opacity:.7">${t('modal.import.replaceDesc')}</span>
            </button>
          </div>
          <div class="imp-mode-warn${mi.mode === 'replace' ? ' show' : ''}">${t('modal.import.replaceWarning')}</div>
        </div>`}

        <div class="fg">
          <label>${t('modal.import.fileLabel')}</label>
          ${mi.filename ? `<div class="imp-file-chosen">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--grn)" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>
            <span class="imp-file-name">${esc(mi.filename)}</span>
            <button class="imp-file-clear" id="imp-file-clear" title="${t('modal.import.removeFile')}">✕</button>
          </div>` : `<div class="imp-dropzone" id="imp-dropzone">
            <div class="imp-dropzone-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg></div>
            <div class="imp-dropzone-lbl">${t('modal.import.dropLabel')}</div>
            <div class="imp-dropzone-sub">${t('modal.import.dropSub')}</div>
            <input type="file" id="imp-file-input" accept=".csv,text/csv" style="display:none">
          </div>`}
          ${mi.structError ? `<div class="imp-struct-err">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;margin-top:1px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div>${esc(mi.structError)}</div>
          </div>` : ''}
        </div>

        <div class="fg">
          <label>${t('modal.import.templateLabel')}</label>
          <div class="imp-tpl-row">
            <button class="imp-tpl-btn imp-tpl-csv" id="imp-dl-tpl">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              ${t('modal.import.downloadTemplate')}
            </button>
            <a class="imp-tpl-btn imp-tpl-sheets" href="${SHEETS_TEMPLATE_URL}" target="_blank" rel="noopener noreferrer">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              ${t('modal.import.googleSheets')}
            </a>
          </div>
        </div>

        <div class="mdl-btns">
          <button class="bsm b-sec" id="m-cancel">${t('common.cancel')}</button>
          <button class="bsm b-primary" id="imp-next"${!mi.filename ? ' disabled style="opacity:.45;cursor:not-allowed"' : ''}>${t('modal.import.nextBtn')}</button>
        </div>
      </div>
    </div>`;
  }

  /* Step 2: Preview */
  const { validatedRows = [], checkedRows = new Set() } = t;
  const errCount = validatedRows.filter(r => r._errors.length).length;
  const okChecked = [...checkedRows].filter(i => !validatedRows[i]?._errors.length).length;

  const tableRows = validatedRows.map((row, i) => {
    const hasErr   = row._errors.length > 0;
    const isChecked = checkedRows.has(i);
    const rowCls   = hasErr ? 'row-err' : (!isChecked ? 'row-skip' : '');
    const errTag   = hasErr ? `<span class="imp-err-tag">${esc(row._errors[0])}</span>` : '';
    const startCell = row._weekStart ? esc(row.start_date) : `<span class="imp-badge-bl">${t('modal.import.backlogBadge')}</span>`;
    return `<tr class="${rowCls}" data-row-i="${i}">
      <td><input type="checkbox" class="imp-cb" data-i="${i}"${isChecked ? ' checked' : ''}${hasErr ? ' disabled' : ''}></td>
      <td>${esc(row.task_name || '—')}${errTag}</td>
      <td>${esc(row.phase_name || '—')}</td>
      <td>${esc(row.team_name || '—')}</td>
      <td>${startCell}</td>
      <td>${esc(row.end_date || '')}</td>
      <td>${esc((row.tags || '').replace(/[;|]/g, ', ').substring(0, 25))}</td>
    </tr>`;
  }).join('');

  const errHtml = errCount ? t('modal.import.summaryErrors', {err: errCount}) : '';
  return `<div class="mbg" id="modal-bg" role="presentation">
    <div class="mdl mdl-wide" role="dialog" aria-modal="true" aria-label="${t('modal.import.previewTitle')}">
      <h3><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="vertical-align:-2px;margin-right:6px"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>${t('modal.import.title')}</h3>
      ${stepsHtml}

      <div class="imp-preview-hd">
        <div class="imp-preview-summary" id="imp-summary">
          ${t('modal.import.summary', {ok: okChecked})}${errHtml}
        </div>
        <button class="imp-back-btn" id="imp-back">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          ${t('common.back')}
        </button>
      </div>

      <div class="imp-table-wrap">
        <table class="imp-tbl">
          <thead><tr>
            <th><input type="checkbox" id="imp-cb-all" title="${t('modal.import.selectAll')}" checked></th>
            <th>Task</th><th>Phase</th><th>Team</th><th>Start</th><th>End</th><th>Tags</th>
          </tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>

      <div class="mdl-btns" style="margin-top:14px">
        <button class="bsm b-sec" id="m-cancel">${t('common.cancel')}</button>
        <button class="bsm b-primary" id="imp-confirm"${okChecked === 0 ? ' disabled style="opacity:.45;cursor:not-allowed"' : ''}>${t('modal.import.importBtn', {n: okChecked})}</button>
      </div>
    </div>
  </div>`;
}

/* ── Injected helpers (set by router/B8) ── */
let _buildShareURL = null;
let _loadIndex     = null;
export function setShareURLFn(fn) { _buildShareURL = fn; }
export function setLoadIndexFn(fn) { _loadIndex = fn; }
