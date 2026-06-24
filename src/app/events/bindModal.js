/* ── EVENTS / BIND MODAL — modal UI bindings + CRUD actions ── */
import { S, nextId, phaseById, taskById, pushHistory } from '../state.js';
import { q, qAll }                                      from '../utils.js';
import { PHASE_COLORS, LS_KEY }                         from '../constants.js';
import { wkp, bindWkPickerEvents, setRenderModal }      from '../weekpicker.js';
import { parseDate, dateStrYMD, wkpMonday, weekDate, fmtInput, totalWeeks } from '../date.js';
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

  const getRange = () => {
    if (g.start == null) return null;
    // Phase C: end committed (differs from start) — use end directly
    // Phase B: end === start (single click) — prefer hoverEnd for preview
    const committed = g.end != null && g.end !== g.start;
    const b = committed ? g.end : (g.hoverEnd ?? g.end ?? g.start);
    return { lo: Math.min(g.start, b), hi: Math.max(g.start, b) };
  };

  const firstBlockedIn = (lo, hi) => {
    for (let w = lo; w <= hi; w++) if (blocked.has(w)) return w;
    return null;
  };

  // Effective selected range respecting blocked hard-stop
  const effectiveRange = () => {
    const r = getRange();
    if (!r) return null;
    const bw = firstBlockedIn(r.lo, r.hi);
    if (bw == null) return r;
    // Clamp to the side of start
    if (g.start <= bw) return { lo: r.lo, hi: bw - 1 };
    return { lo: bw + 1, hi: r.hi };
  };

  function paint() {
    const r = effectiveRange();
    const cells = [];
    for (let w = 1; w <= totalW; w++) {
      const b = blocked.get(w);
      let cls = 'pwg-cell';
      let style = '';
      let title = '';
      if (b) {
        cls += ' pwg-blocked';
        style = `background:${b.color}`;
        title = b.name;
      } else if (r && w >= r.lo && w <= r.hi) {
        cls += ' pwg-selected';
      }
      cells.push(`<div class="${cls}" data-w="${w}"${title ? ` title="${title}"` : ''}${style ? ` style="${style}"` : ''}>W${w}</div>`);
    }
    gridEl.innerHTML = cells.join('');
    updateHelp();
  }

  function updateHelp() {
    const r = effectiveRange();
    const nameOk = !!nameInp?.value.trim();
    let msg = '';
    let warn = false;

    if (g.blockedHit != null && g.start != null) {
      const b = blocked.get(g.blockedHit);
      const maxW = g.start <= g.blockedHit ? g.blockedHit - 1 : g.blockedHit + 1;
      msg = `W${g.blockedHit} đã thuộc về ${b?.name ?? 'phase khác'} — chỉ chọn được đến W${maxW}`;
      warn = true;
    } else if (r) {
      const dur = r.hi - r.lo + 1;
      msg = `${dur} tuần được chọn (W${r.lo} → W${r.hi})`;
    } else {
      msg = 'Click vào tuần để bắt đầu phase';
    }

    helpEl.textContent = msg;
    helpEl.classList.toggle('pwg-help-warn', warn);

    const hasRange = r != null;
    const canSave = nameOk && hasRange;
    saveBtn.disabled = !canSave;
    saveBtn.style.opacity = canSave ? '' : '.45';
    saveBtn.style.cursor  = canSave ? '' : 'not-allowed';
  }

  // MOUSEOVER — hover preview (Phase B only)
  gridEl.addEventListener('mouseover', e => {
    const cell = e.target.closest('.pwg-cell');
    if (!cell || cell.classList.contains('pwg-blocked')) return;
    const w = +cell.dataset.w;
    if (g.start == null) return;
    // Phase B: start set, end not yet committed (or same as start)
    if (g.end != null && g.end !== g.start) return;
    const lo = Math.min(g.start, w), hi = Math.max(g.start, w);
    const bw = firstBlockedIn(lo, hi);
    g.hoverEnd = w;
    g.blockedHit = bw ?? null;
    paint();
  });

  // MOUSELEAVE — clear hover preview
  gridEl.addEventListener('mouseleave', () => {
    if (g.start != null && (g.end == null || g.end === g.start)) {
      g.hoverEnd = null;
      g.blockedHit = null;
      paint();
    }
  });

  // CLICK — state machine
  gridEl.addEventListener('click', e => {
    const cell = e.target.closest('.pwg-cell');
    if (!cell || cell.classList.contains('pwg-blocked')) return;
    const w = +cell.dataset.w;

    // Phase C: committed range (start & end differ) → reset
    if (g.start != null && g.end != null && g.end !== g.start) {
      g.start = w; g.end = w; g.hoverEnd = null; g.blockedHit = null;
      paint(); return;
    }

    // Phase A: no start
    if (g.start == null) {
      g.start = w; g.end = w; g.hoverEnd = null; g.blockedHit = null;
      paint(); return;
    }

    // Phase B: click same cell as start → deselect
    if (w === g.start) {
      g.start = null; g.end = null; g.hoverEnd = null; g.blockedHit = null;
      paint(); return;
    }

    // Phase B: click different cell → commit (with blocked-range detection)
    const lo = Math.min(g.start, w), hi = Math.max(g.start, w);
    const bw = firstBlockedIn(lo, hi);
    if (bw != null) {
      // Clamp to blocked side
      g.end = (w > g.start) ? bw - 1 : bw + 1;
      g.hoverEnd = null;
      g.blockedHit = bw;
    } else {
      g.end = w; g.hoverEnd = null; g.blockedHit = null;
    }
    paint();
  });

  nameInp?.addEventListener('input', updateHelp);
  paint(); // initial render
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
  const colorEl = q('#m-ph-colors .co.sel') || q('.co.sel');
  const color = colorEl?.dataset.color || PHASE_COLORS[0];
  const g = S.ui._phaseGrid;
  if (!name || !g || g.start == null) return;
  pushHistory();

  const sw = Math.min(g.start, g.end ?? g.start);
  const ew = Math.max(g.start, g.end ?? g.start);

  if (S.ui.modal.type === 'edit-phase') {
    const ph = phaseById(S.ui.modal.data.id);
    if (ph) Object.assign(ph, { name, startWeek: sw, endWeek: ew, color });
  } else {
    S.phases.push({ id: nextId(), name, startWeek: sw, endWeek: ew, color, scope: '', outputs: [] });
  }
  S.ui._phaseGrid = null;
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
