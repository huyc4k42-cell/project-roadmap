/* ── EVENTS / BIND — orchestrator ── */
import { S, pushHistory, taskById, phaseById, reorderTeam, swapPhases } from '../state.js';
import { q } from '../utils.js';
import { trackCancelSettings } from '../tracking/project.js';
import { trackCancelAddPhase, trackOpenPhaseDetail } from '../tracking/phase.js';
import { trackCancelAddTask, trackOpenTaskDetail, trackUndoAction } from '../tracking/task.js';
import { trackCancelAddTeam } from '../tracking/team.js';
import { setResizeWW } from './resize.js';
import { delTask, delTeam, delPhase } from './bindModal.js';

import { bindHeader }        from './bind/header.js';
import { bindTaskCards }     from './bind/taskCard.js';
import { bindTimelineCells } from './bind/timelineCell.js';
import { bindTaskBars }      from './bind/taskBar.js';
import { bindPhaseAndTeam }  from './bind/phaseTeam.js';
import { bindChecklist }     from './bind/checklist.js';
import { bindLayout }        from './bind/layout.js';

/* ── Injected deps object ── */
const deps = {
  render: null, renderRAF: null, openModal: null, openCtx: null,
  closeCtx: null, closeModal: null, undo: null, redo: null,
  exportPDF: null, openImportModal: null, addTag: null, delTag: null,
  loadSampleData: null, WW: 64,
  handleAction: null,
};

export function setBindDeps(d) {
  Object.assign(deps, d);
  if (d.WW != null) setResizeWW(d.WW);
}

/* ── RAF-throttled render for drag/resize ── */
let _rafId = null;
export function renderRAF() {
  if (_rafId) cancelAnimationFrame(_rafId);
  _rafId = requestAnimationFrame(() => { _rafId = null; deps.render?.(true); });
}

/* ── handleAction — shared between ctx-menu items and bind.js ── */
export function handleAction(action) {
  deps.closeCtx?.();
  const [cmd, id] = action.split(':');
  const nid = +id;
  if (cmd === 'edit-task')  { const tk = taskById(nid); if (tk) { trackOpenTaskDetail(tk, S, 'context_menu'); deps.openModal?.('edit-task', tk); } }
  if (cmd === 'del-task')   { delTask(nid);  deps.render?.(); }
  if (cmd === 'toggle-done') { const tk = taskById(nid); if (tk) { pushHistory(); tk.done = !tk.done; deps.render?.(); } }
  if (cmd === 'unschedule')  { const tk = taskById(nid); if (tk) { pushHistory(); tk.startWeek = null; deps.render?.(); } }
  if (cmd === 'edit-team')   deps.openModal?.('edit-team',  S.teams.find(tm => tm.id === nid));
  if (cmd === 'del-team')  { delTeam(nid);  deps.render?.(); }
  if (cmd === 'edit-phase') { const ph = phaseById(nid); if (ph) { trackOpenPhaseDetail('context_menu', ph, S); deps.openModal?.('edit-phase', ph); } }
  if (cmd === 'del-phase') { delPhase(nid); deps.render?.(); }
}

/* Wire handleAction into deps so sub-modules can call it */
deps.handleAction = handleAction;

/* ── onDocClick / onKey — document-level handlers ── */
export function onDocClick() { deps.closeCtx?.(); }

export function onKey(e) {
  const ctrl = e.ctrlKey || e.metaKey;

  /* Escape resets all drag states regardless of modal */
  if (e.key === 'Escape') {
    S.ui.dragData    = null;
    S.ui.teamDragId  = null;
    S.ui.phaseDragId = null;
  }

  /* Modal open — Escape closes, Enter saves */
  if (S.ui.modal) {
    if (e.key === 'Escape') {
      const mt = S.ui.modal?.type;
      if (mt === 'cfg') {
        const hasUnsavedChanges =
          (q('#m-cfg-title')?.value.trim() || '') !== S.cfg.title ||
          (q('#m-cfg-sub')?.value.trim()   || '') !== (S.cfg.subtitle || '');
        trackCancelSettings('escape', hasUnsavedChanges);
      } else if (mt === 'add-phase') { trackCancelAddPhase('escape'); }
        else if (mt === 'add-task')  { trackCancelAddTask('escape');  }
        else if (mt === 'add-team')  { trackCancelAddTeam('escape');  }
      deps.closeModal?.(deps.render); return;
    }
    if (e.key === 'Enter' && !e.shiftKey && e.target.tagName !== 'TEXTAREA') {
      q('#m-save')?.click(); return;
    }
    return;
  }
  if (S.ui.ctx) { if (e.key === 'Escape') { deps.closeCtx?.(); return; } }

  const inInput = ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)
               || document.activeElement?.isContentEditable;

  if (!inInput) {
    if (ctrl && e.key === 'z' && !e.shiftKey) { e.preventDefault(); trackUndoAction(); deps.undo?.(); return; }
    if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); deps.redo?.(); return; }
  }

  if (ctrl && e.key === 'k') {
    e.preventDefault();
    const inp = q('#sb-search');
    if (inp) { inp.focus(); inp.select(); }
    return;
  }

  if (inInput) return;
  if (e.key === 'ArrowLeft'  && !e.ctrlKey && !e.metaKey) { const el = q('#tl-area') || q('.tl-area'); if (el) { e.preventDefault(); el.scrollBy({ left: -(deps.WW ?? 64) * 2, behavior: 'smooth' }); } return; }
  if (e.key === 'ArrowRight' && !e.ctrlKey && !e.metaKey) { const el = q('#tl-area') || q('.tl-area'); if (el) { e.preventDefault(); el.scrollBy({ left: +(deps.WW ?? 64) * 2, behavior: 'smooth' }); } return; }
  if (e.key === 'n' && !ctrl) { e.preventDefault(); deps.openModal?.('add-task'); }
  if (e.key === 'p' && !ctrl) { e.preventDefault(); deps.openModal?.('add-phase'); }
  if (e.key === 't' && !ctrl) { e.preventDefault(); deps.openModal?.('add-team'); }
}

/* ══════════════════════════════════════════════
   MAIN BIND FUNCTION
══════════════════════════════════════════════ */
export function bind() {
  bindHeader(deps);
  bindTaskCards(deps);
  bindTimelineCells(deps);
  bindTaskBars(deps);
  bindPhaseAndTeam(deps);
  bindChecklist(deps);
  bindLayout(deps);

  /* Global doc handlers — re-register each bind() call */
  document.removeEventListener('click', onDocClick);
  document.addEventListener('click', onDocClick, { once: true });
  document.removeEventListener('keydown', onKey);
  document.addEventListener('keydown', onKey);
}
