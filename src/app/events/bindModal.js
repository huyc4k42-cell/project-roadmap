/* ── EVENTS / BIND MODAL — modal UI bindings + CRUD actions ── */
import { S, nextId, phaseById, taskById, pushHistory } from '../state.js';
import { q, qAll }                                      from '../utils.js';
import { PHASE_COLORS, LS_KEY }                         from '../constants.js';
import { wkp, bindWkPickerEvents, setRenderModal }      from '../weekpicker.js';
import { parseDate, dateStrYMD, wkpMonday, weekDate, fmtInput } from '../date.js';
import { setTheme }                                     from '../theme.js';
import { renderModal }                                  from '../render/modals.js';
import { t }                                           from '../i18n.js';


/* Injected render callbacks */
let _render     = null;
let _closeModal = null;
export function setBindModalDeps({ render, closeModal }) {
  _render     = render;
  _closeModal = closeModal;
}

/* ── bindModal ── */
export function bindModal() {
  const bg   = q('#modal-bg');
  if (!bg) return;
  const type = S.ui.modal?.type;

  /* Auto-focus first input */
  setTimeout(() => {
    const first = bg.querySelector('input[type=text],input:not([type]),input[type=date],input[type=number]');
    if (first) first.focus();
  }, 50);

  /* Focus trap */
  const FOCUSABLE = 'input,select,textarea,button:not([disabled]),[tabindex]:not([tabindex="-1"])';
  bg.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const focusable = [...bg.querySelectorAll(FOCUSABLE)];
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
    else            { if (document.activeElement === last)  { e.preventDefault(); first.focus(); } }
  });

  bg.addEventListener('click', e => { if (e.target === bg) _closeModal?.(_render); });
  q('#m-cancel')?.addEventListener('click', () => _closeModal?.(_render));

  q('#m-save')?.addEventListener('click', () => {
    if (type === 'cfg')                              saveCfg();
    if (type === 'add-task'  || type === 'edit-task')  saveTask();
    if (type === 'add-team'  || type === 'edit-team')  saveTeam();
    if (type === 'add-phase' || type === 'edit-phase') savePhase();
  });

  q('#m-del')?.addEventListener('click', () => {
    if (type === 'edit-task')  delTask(S.ui.modal.data.id);
    if (type === 'edit-team')  delTeam(S.ui.modal.data.id);
    if (type === 'edit-phase') delPhase(S.ui.modal.data.id);
    _closeModal?.(_render);
  });

  /* Reset all data */
  q('#m-reset')?.addEventListener('click', () => {
    if (!confirm(t('modal.cfg.resetConfirm'))) return;
    pushHistory();
    S.phases = []; S.teams = []; S.tasks = []; S.tags = []; S._nextId = 1;
    try { localStorage.removeItem(LS_KEY); } catch(e) {}
    _closeModal?.(_render);
  });

  /* Week picker */
  setRenderModal(() => renderModal());
  bindWkPickerEvents();

  /* Share — copy link */
  const copyBtn = q('#share-copy-btn');
  const urlInp  = q('#share-url-inp');
  if (copyBtn && urlInp) {
    urlInp.addEventListener('click', () => urlInp.select());
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(urlInp.value).then(() => {
        copyBtn.textContent = t('modal.share.copied');
        copyBtn.classList.add('copied');
        setTimeout(() => { copyBtn.textContent = t('modal.share.copy'); copyBtn.classList.remove('copied'); }, 2200);
      }).catch(() => { urlInp.select(); document.execCommand('copy'); });
    });
  }

  /* Theme buttons */
  qAll('[data-theme-set]').forEach(btn => btn.addEventListener('click', () => setTheme(btn.dataset.themeSet, _render)));

  /* Tag toggles */
  qAll('.to[data-tag]').forEach(el => el.addEventListener('click', () => el.classList.toggle('sel')));

  /* Icon grid — select icon + apply current color */
  qAll('.ig[data-icon]').forEach(el => {
    el.addEventListener('click', () => {
      const color = q('.co.sel')?.dataset.color || '#D0A052';
      qAll('.ig').forEach(i => { i.classList.remove('sel'); i.style.color = ''; });
      el.classList.add('sel');
      el.style.color = color;
    });
  });

  /* Color picker — select color + apply to selected icon */
  qAll('.co[data-color]').forEach(el => {
    el.addEventListener('click', () => {
      qAll('.co').forEach(c => c.classList.remove('sel'));
      el.classList.add('sel');
      const selIcon = q('.ig.sel');
      if (selIcon) selIcon.style.color = el.dataset.color;
    });
  });

  /* Duration stepper */
  const durVal = q('.dur-val');
  const durInp = q('#m-dur');
  if (durVal && durInp) {
    const updateDur = n => {
      const v = Math.max(1, Math.min(52, n));
      durVal.textContent = v;
      durInp.value = v;
    };
    q('.dur-dec')?.addEventListener('click', () => updateDur(+(durInp.value) - 1));
    q('.dur-inc')?.addEventListener('click', () => updateDur(+(durInp.value) + 1));
  }

  /* Phase week inputs */
  const phSwInp  = q('#m-ph-sw');
  const phDurInp = q('#m-ph-dur');
  const phDurVal = q('#m-ph-dur-val');
  const phPreview = q('#m-ph-preview');
  const phWarn    = q('#m-ph-warn');

  if (phSwInp && phDurInp) {
    const updatePhPreview = () => {
      const sw  = Math.max(1, +phSwInp.value || 1);
      const dur = Math.max(1, +phDurInp.value || 1);
      const ew  = sw + dur - 1;

      // Update dur display
      if (phDurVal) phDurVal.textContent = dur;

      // Build preview text
      if (phPreview) {
        // Use weekDate from date.js to get real dates
        const startDate = weekDate(sw, S.cfg);
        const endDate   = weekDate(ew, S.cfg);
        const fmt = d => d ? fmtInput(d) : '?';
        phPreview.textContent = `→ kết thúc W${ew} · ${dur} tuần · ${fmt(startDate)} – ${fmt(endDate)}`;
      }

      // Overlap check
      if (phWarn) {
        const modalType = S.ui.modal?.type;
        const editId    = S.ui.modal?.data?.id ?? null;
        const conflict  = S.phases.find(p =>
          p.id !== editId &&
          p.startWeek <= ew && p.endWeek >= sw
        );
        if (conflict) {
          phWarn.textContent = `⚠ Trùng với ${conflict.name} (W${conflict.startWeek}–${conflict.endWeek})`;
          phWarn.style.display = 'block';
        } else {
          phWarn.style.display = 'none';
        }
      }
    };

    // Dur stepper for phase
    q('#m-ph-sw')?.addEventListener('input', updatePhPreview);
    q('.phase-week-row .dur-dec')?.addEventListener('click', () => {
      const v = Math.max(1, (+phDurInp.value || 2) - 1);
      phDurInp.value = v;
      updatePhPreview();
    });
    q('.phase-week-row .dur-inc')?.addEventListener('click', () => {
      const v = (+phDurInp.value || 2) + 1;
      phDurInp.value = v;
      updatePhPreview();
    });

    // Run once on open
    updatePhPreview();
  }
}

/* ══════════════════════════════════════════════
   CRUD ACTIONS
══════════════════════════════════════════════ */

function shakeErr(el, msg) {
  msg = msg ?? t('errors.requiredFields');
  if (!el) return;
  el.classList.remove('err');
  void el.offsetWidth;
  el.classList.add('err');
  el.focus();
  const live = document.getElementById('err-live');
  if (live) { live.textContent = ''; setTimeout(() => live.textContent = msg, 10); }
}

function saveCfg() {
  S.cfg.title    = q('#m-cfg-title')?.value.trim() || S.cfg.title;
  S.cfg.subtitle = q('#m-cfg-sub')?.value.trim() || '';
  if (wkp.startMon && wkp.endMon) {
    S.cfg.start = dateStrYMD(wkp.startMon);
    const endSun = new Date(wkp.endMon); endSun.setDate(endSun.getDate() + 6);
    S.cfg.end = dateStrYMD(endSun);
  }
  _closeModal?.(_render);
}

function saveTask() {
  const name   = q('#m-name')?.value.trim();
  const teamId = +q('#m-team')?.value || null;
  const dur    = Math.max(1, +q('#m-dur')?.value || 2);
  const tags   = [...qAll('.to.sel')].map(el => el.dataset.tag);
  const desc   = q('#m-desc')?.value.trim() || '';
  if (!name) { shakeErr(q('#m-name')); return; }
  pushHistory();

  if (S.ui.modal.type === 'edit-task') {
    const tk = taskById(S.ui.modal.data.id);
    Object.assign(tk, { name, teamId, dur, tags, desc });
  } else {
    const prefill = S.ui._prefillTask || {};
    S.ui._prefillTask = null;
    S.tasks.push({ id: nextId(), name, teamId, dur, phaseId: null, tags, desc, startWeek: prefill.startWeek ?? null });
  }
  _closeModal?.(_render);
}

function saveTeam() {
  const name  = q('#m-tm-name')?.value.trim();
  const icon  = q('.ig.sel')?.dataset.icon  || 'layers';
  const color = q('.co.sel')?.dataset.color || '#D0A052';
  if (!name) { shakeErr(q('#m-tm-name')); return; }
  pushHistory();

  if (S.ui.modal.type === 'edit-team') {
    const tm = S.teams.find(t => t.id === S.ui.modal.data.id);
    Object.assign(tm, { name, icon, color });
  } else {
    S.teams.push({ id: nextId(), name, icon, color });
  }
  _closeModal?.(_render);
}

function savePhase() {
  const name  = q('#m-ph-name')?.value.trim();
  const color = q('.co.sel')?.dataset.color || PHASE_COLORS[0];
  if (!name) { shakeErr(q('#m-ph-name')); return; }
  pushHistory();

  const sw = Math.max(1, +q('#m-ph-sw')?.value || 1);
  const dur = Math.max(1, +q('#m-ph-dur')?.value || 1);
  const ew  = Math.max(sw, sw + dur - 1);

  if (S.ui.modal.type === 'edit-phase') {
    const ph = phaseById(S.ui.modal.data.id);
    Object.assign(ph, { name, startWeek: sw, endWeek: ew, color });
  } else {
    S.phases.push({ id: nextId(), name, startWeek: sw, endWeek: ew, color, scope: '', outputs: [] });
  }
  _closeModal?.(_render);
}

export function delTask(id)  { pushHistory(); S.tasks  = S.tasks.filter(t => t.id !== id); }
export function delTeam(id)  { pushHistory(); S.teams  = S.teams.filter(t => t.id !== id); }
export function delPhase(id) {
  pushHistory();
  S.phases = S.phases.filter(p => p.id !== id);
  S.tasks.forEach(t => { if (t.phaseId === id) t.phaseId = null; });
}

export function addTag(name) {
  const clean = name.trim().toLowerCase().replace(/\s+/g, '-');
  if (clean && !S.tags.includes(clean)) {
    S.tags.push(clean);
    _render?.();
    setTimeout(() => { const inp = q('#tf-add-inp'); if (inp) inp.value = ''; }, 0);
  }
}

export function delTag(name) {
  S.tags = S.tags.filter(t => t !== name);
  S.tasks.forEach(t => { t.tags = t.tags.filter(g => g !== name); });
  if (S.ui.filter.tag === name) S.ui.filter.tag = '';
  _render?.();
}

/* ── openCfgModal helper — sets up wkp state before opening ── */
export function openCfgModal(openModalFn) {
  const sm     = wkpMonday(parseDate(S.cfg.start));
  wkp.startMon = sm;
  wkp.endMon   = wkpMonday(parseDate(S.cfg.end));
  wkp.yr       = sm.getFullYear();
  wkp.mo       = sm.getMonth();
  wkp.step     = 'start';
  wkp.showMonthSel = false;
  openModalFn('cfg');
}
