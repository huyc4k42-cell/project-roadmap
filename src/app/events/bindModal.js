/* ── EVENTS / BIND MODAL — modal UI bindings + CRUD actions ── */
import { S, nextId, phaseById, taskById, pushHistory } from '../state.js';
import { q, qAll }                                      from '../utils.js';
import { PHASE_COLORS, LS_KEY }                         from '../constants.js';
import { wkp, bindWkPickerEvents, setRenderModal }      from '../weekpicker.js';
import { parseDate, dateStrYMD, wkpMonday, weekDate, fmtInput, totalWeeks } from '../date.js';
import { setTheme }                                     from '../theme.js';
import { renderModal }                                  from '../render/modals.js';
import { t }                                           from '../i18n.js';
import {
  trackViewSettingsPopup, trackSaveSettings, trackCancelSettings,
} from '../tracking/project.js';
import { trackViewSharePopup, trackClickCopyLink, trackCancelSharePopup } from '../tracking/share.js';
import { currentProjId } from '../persistence.js';
import { trackAddTag, trackTagDelete } from '../tracking/sidebar.js';
import {
  trackAddPhaseCompleted, trackCancelAddPhase, trackPhaseEdited, trackPhaseDeleted,
  trackOpenPhaseDetail,
} from '../tracking/phase.js';
import {
  trackAddTaskCompleted, trackCancelAddTask, trackTaskEdited, trackTaskDeleted,
  trackOpenTaskDetail,
} from '../tracking/task.js';
import {
  trackAddTeamCompleted, trackCancelAddTeam, trackTeamEdited, trackTeamDeleted,
  trackViewTeamPopup,
} from '../tracking/team.js';


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

  const _cfgHasChanges = () =>
    (q('#m-cfg-title')?.value.trim() || '') !== S.cfg.title ||
    (q('#m-cfg-sub')?.value.trim()   || '') !== (S.cfg.subtitle || '');

  const _fireCancel = (cancelMethod) => {
    if (type === 'cfg')       trackCancelSettings(cancelMethod, _cfgHasChanges());
    if (type === 'add-phase') trackCancelAddPhase(cancelMethod);
    if (type === 'add-task')  trackCancelAddTask(cancelMethod);
    if (type === 'add-team')  trackCancelAddTeam(cancelMethod);
    if (type === 'share')     trackCancelSharePopup(cancelMethod);
  };

  bg.addEventListener('click', e => {
    if (e.target === bg) { _fireCancel('backdrop'); _closeModal?.(_render); }
  });
  q('#m-cancel')?.addEventListener('click', () => { _fireCancel('button'); _closeModal?.(_render); });

  if (type === 'cfg')       trackViewSettingsPopup();
  if (type === 'edit-task')  trackOpenTaskDetail(S.ui.modal.data, S, 'modal');
  if (type === 'edit-phase') trackOpenPhaseDetail('modal', S.ui.modal.data, S);
  if (type === 'edit-team')  trackViewTeamPopup(S.ui.modal.data, S);
  if (type === 'share')      trackViewSharePopup(S, currentProjId);

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
      trackClickCopyLink(S, currentProjId);
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

  /* Phase grid */
  if (type === 'add-phase' || type === 'edit-phase') {
    bindPhaseGrid();
  }
}

/* ── bindPhaseGrid ── */
function bindPhaseGrid() {
  const gridEl  = q('#m-ph-grid');
  const helpEl  = q('#m-ph-grid-help');
  const saveBtn = q('#m-save');
  const nameInp = q('#m-ph-name');
  if (!gridEl) return;

  const totalW = totalWeeks(S.cfg);
  if (totalW < 1) return;

  const editId = S.ui.modal.type === 'edit-phase' ? S.ui.modal.data?.id : null;

  // Build blocked map: weekNumber -> { id, name, color } — excludes the phase being edited
  const blocked = new Map();
  for (const p of S.phases) {
    if (p.id === editId) continue;
    for (let w = p.startWeek; w <= p.endWeek; w++) {
      blocked.set(w, { id: p.id, name: p.name, color: p.color });
    }
  }

  const g = S.ui._phaseGrid; // { start, end, hoverEnd, blockedHit }

  // ── Pure helpers ──────────────────────────────────────────────────

  const firstBlockedIn = (lo, hi) => {
    for (let w = lo; w <= hi; w++) if (blocked.has(w)) return w;
    return null;
  };

  const getRange = () => {
    if (g.start == null) return null;
    if (g.end != null) {
      return { lo: Math.min(g.start, g.end), hi: Math.max(g.start, g.end) };
    }
    // Phase B: hover preview
    const b = g.hoverEnd ?? g.start;
    return { lo: Math.min(g.start, b), hi: Math.max(g.start, b) };
  };

  const effectiveRange = () => {
    const r = getRange();
    if (!r) return null;
    const bw = firstBlockedIn(r.lo, r.hi);
    if (bw == null) return r;
    if (g.start <= bw) return { lo: r.lo, hi: bw - 1 };
    return { lo: bw + 1, hi: r.hi };
  };

  // ── Stable DOM init — build cells ONCE ───────────────────────────

  const cellEls = []; // index 0 unused; cellEls[w] = element for week w

  gridEl.innerHTML = '';
  for (let w = 1; w <= totalW; w++) {
    const el = document.createElement('div');
    el.className = 'pwg-cell';
    el.dataset.w = w;
    const sd = weekDate(w, S.cfg);
    const ed = new Date(sd); ed.setDate(ed.getDate() + 6);
    const dd = d => String(d.getDate()).padStart(2, '0');
    const mm = d => d.getMonth() + 1;
    const dtLabel = sd.getMonth() === ed.getMonth()
      ? `${dd(sd)} - ${dd(ed)}/${mm(ed)}`
      : `${dd(sd)}/${mm(sd)}-${dd(ed)}/${mm(ed)}`;
    el.innerHTML = `<span class="pwg-wn">W${w}</span><span class="pwg-dt">${dtLabel}</span>`;
    const b = blocked.get(w);
    if (b) {
      el.classList.add('pwg-blocked');
      el.style.background = b.color;
      el.title = b.name;
    }
    cellEls[w] = el;
    gridEl.appendChild(el);
  }

  // ── updateCells — classList-only, no innerHTML touch ─────────────

  function updateCells() {
    const r = effectiveRange();
    for (let w = 1; w <= totalW; w++) {
      const el = cellEls[w];
      if (el.classList.contains('pwg-blocked')) continue; // blocked: never mutate
      el.classList.toggle('pwg-selected', !!(r && w >= r.lo && w <= r.hi));
    }
    updateHelp();
  }

  // ── updateHelp — text + save button state ────────────────────────

  function updateHelp() {
    const r = effectiveRange();
    const nameOk      = !!nameInp?.value.trim();
    const isCommitted = g.end != null;
    const isHover     = g.start != null && g.end == null && g.hoverEnd != null;
    let msg = '';
    let warn = false;

    if (g.blockedHit != null && g.start != null && g.end == null) {
      const b   = blocked.get(g.blockedHit);
      const maxW = g.start <= g.blockedHit ? g.blockedHit - 1 : g.blockedHit + 1;
      msg  = `W${g.blockedHit} đã thuộc về ${b?.name ?? 'phase khác'} — chỉ chọn được đến W${maxW}`;
      warn = true;
    } else if (isHover && r) {
      const dur = r.hi - r.lo + 1;
      msg = `Click để chọn ${dur} tuần (W${r.lo} → W${r.hi})`;
    } else if (isCommitted && r) {
      const dur = r.hi - r.lo + 1;
      msg = nameOk
        ? `${dur} tuần được chọn (W${r.lo} → W${r.hi})`
        : `${dur} tuần được chọn — nhập tên phase để thêm`;
    } else if (g.start != null) {
      msg = 'Click tuần kế tiếp để xác định khoảng thời gian';
    } else {
      msg = 'Click vào tuần để bắt đầu phase';
    }

    helpEl.textContent = msg;
    helpEl.classList.toggle('pwg-help-warn', warn);

    const canSave = nameOk && isCommitted;
    saveBtn.disabled = !canSave;
    saveBtn.style.opacity = canSave ? '' : '.45';
    saveBtn.style.cursor  = canSave ? '' : 'not-allowed';
  }

  // ── Event handlers (3 total, no drag) ────────────────────────────

  // CLICK — state machine
  gridEl.addEventListener('click', e => {
    const cell = e.target.closest('.pwg-cell');
    if (!cell || cell.classList.contains('pwg-blocked')) return;
    const w = +cell.dataset.w;

    // Phase A: no start → set start, enter Phase B
    if (g.start == null) {
      g.start = w; g.end = null; g.hoverEnd = w; g.blockedHit = null;
      updateCells(); return;
    }

    // Phase C: committed → reset to Phase B with new start
    if (g.end != null) {
      g.start = w; g.end = null; g.hoverEnd = w; g.blockedHit = null;
      updateCells(); return;
    }

    // Phase B → commit (clamp if blocked week in range)
    const lo = Math.min(g.start, w), hi = Math.max(g.start, w);
    const bw = firstBlockedIn(lo, hi);
    if (bw != null) {
      g.end        = (w > g.start) ? bw - 1 : bw + 1;
      g.blockedHit = null; // clear warning after commit
    } else {
      g.end        = w;
      g.blockedHit = null;
    }
    g.hoverEnd = null;
    updateCells();
    if (!nameInp?.value.trim()) nameInp?.focus();
  });

  // MOUSEOVER — hover preview (Phase B only)
  gridEl.addEventListener('mouseover', e => {
    const cell = e.target.closest('.pwg-cell');
    if (!cell) return;
    if (g.start == null || g.end != null) return; // Phase B only

    const w = +cell.dataset.w;

    if (cell.classList.contains('pwg-blocked')) {
      g.hoverEnd   = null;
      g.blockedHit = w;
      updateCells(); return;
    }

    const lo = Math.min(g.start, w), hi = Math.max(g.start, w);
    g.hoverEnd   = w;
    g.blockedHit = firstBlockedIn(lo, hi) ?? null;
    updateCells();
  });

  // MOUSELEAVE — clear hover preview (Phase B only)
  gridEl.addEventListener('mouseleave', () => {
    if (g.start != null && g.end == null) {
      g.hoverEnd   = null;
      g.blockedHit = null;
      updateCells();
    }
  });

  nameInp?.addEventListener('input', updateHelp);
  updateCells(); // initial paint — also handles edit-phase pre-fill
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
  const origTitle    = S.cfg.title;
  const origSubtitle = S.cfg.subtitle || '';
  const origStart    = S.cfg.start;
  const origEnd      = S.cfg.end;
  S.cfg.title    = q('#m-cfg-title')?.value.trim() || S.cfg.title;
  S.cfg.subtitle = q('#m-cfg-sub')?.value.trim() || '';
  if (wkp.startMon && wkp.endMon) {
    S.cfg.start = dateStrYMD(wkp.startMon);
    const endSun = new Date(wkp.endMon); endSun.setDate(endSun.getDate() + 6);
    S.cfg.end = dateStrYMD(endSun);
  }
  trackSaveSettings({
    changedName:        S.cfg.title    !== origTitle,
    changedStartDate:   S.cfg.start    !== origStart,
    changedEndDate:     S.cfg.end      !== origEnd,
    changedDescription: S.cfg.subtitle !== origSubtitle,
  });
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
    const orig = { name: tk.name, teamId: tk.teamId, phaseId: tk.phaseId, desc: tk.desc, tags: [...tk.tags] };
    Object.assign(tk, { name, teamId, dur, tags, desc });
    trackTaskEdited(tk, S, {
      changedName: name !== orig.name, changedTeam: teamId !== orig.teamId,
      changedPhase: false, changedDescription: desc !== orig.desc,
      changedTags: JSON.stringify(tags.sort()) !== JSON.stringify(orig.tags.sort()),
    });
  } else {
    const prefill = S.ui._prefillTask || {};
    S.ui._prefillTask = null;
    const newTask = { id: nextId(), name, teamId, dur, phaseId: null, tags, desc, startWeek: prefill.startWeek ?? null };
    S.tasks.push(newTask);
    trackAddTaskCompleted(newTask, S);
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
    trackTeamEdited(tm, S);
  } else {
    const newTeam = { id: nextId(), name, icon, color };
    S.teams.push(newTeam);
    trackAddTeamCompleted(newTeam, S);
  }
  _closeModal?.(_render);
}

function savePhase() {
  const name  = q('#m-ph-name')?.value.trim();
  const colorEl = q('#m-ph-colors .co.sel') || q('.co.sel');
  const color = colorEl?.dataset.color || PHASE_COLORS[0];
  const g = S.ui._phaseGrid;
  if (!name || !g || g.start == null || g.end == null) return;
  pushHistory();

  const sw = Math.min(g.start, g.end);
  const ew = Math.max(g.start, g.end);

  if (S.ui.modal.type === 'edit-phase') {
    const ph = phaseById(S.ui.modal.data.id);
    if (ph) {
      const origName = ph.name, origDur = ph.endWeek - ph.startWeek + 1;
      Object.assign(ph, { name, startWeek: sw, endWeek: ew, color });
      trackPhaseEdited(ph, S, {
        changedName:     name !== origName,
        changedDuration: (ew - sw + 1) !== origDur,
      });
    }
  } else {
    const newPhase = { id: nextId(), name, startWeek: sw, endWeek: ew, color, scope: '', outputs: [] };
    S.phases.push(newPhase);
    trackAddPhaseCompleted(newPhase, S);
  }
  S.ui._phaseGrid = null;
  _closeModal?.(_render);
}

export function delTask(id)  {
  const tk = S.tasks.find(t => t.id === id);
  if (tk) trackTaskDeleted(tk, S);
  pushHistory(); S.tasks = S.tasks.filter(t => t.id !== id);
}
export function delTeam(id)  { trackTeamDeleted(); pushHistory(); S.teams  = S.teams.filter(t => t.id !== id); }
export function delPhase(id) {
  trackPhaseDeleted();
  pushHistory();
  S.phases = S.phases.filter(p => p.id !== id);
  S.tasks.forEach(t => { if (t.phaseId === id) t.phaseId = null; });
}

export function addTag(name) {
  const clean = name.trim().toLowerCase().replace(/\s+/g, '-');
  if (clean && !S.tags.includes(clean)) {
    S.tags.push(clean);
    trackAddTag(clean);
    _render?.();
    setTimeout(() => { const inp = q('#tf-add-inp'); if (inp) inp.value = ''; }, 0);
  }
}

export function delTag(name) {
  const tagTaskCount = S.tasks.filter(tk => tk.tags.includes(name)).length;
  S.tags = S.tags.filter(t => t !== name);
  S.tasks.forEach(t => { t.tags = t.tags.filter(g => g !== name); });
  if (S.ui.filter.tag === name) S.ui.filter.tag = '';
  trackTagDelete(name, tagTaskCount);
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
