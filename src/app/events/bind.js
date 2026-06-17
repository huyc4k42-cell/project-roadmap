/* ── EVENTS / BIND — all project-view event handlers ── */
import { S, nextId, taskById, phaseById, pushHistory, swapPhases, reorderTeam } from '../state.js';
import { q, qAll }               from '../utils.js';
import { loadRowState, saveRowState, saveSidebarState } from '../storage.js';
import { setResizeWW }            from './resize.js';
import { delTask, delTeam, delPhase } from './bindModal.js';

/* ── Injected callbacks ── */
let _render      = null;
let _renderRAF   = null;
let _openModal   = null;
let _openCtx     = null;
let _closeCtx    = null;
let _closeModal  = null;
let _undo        = null;
let _redo        = null;
let _exportPDF   = null;
let _openImport  = null;
let _addTag      = null;
let _delTag      = null;
let _loadSample  = null;  // loadSampleData — fill current project with demo data
let _WW          = 64;

export function setBindDeps({
  render, renderRAF, openModal, openCtx, closeCtx, closeModal,
  undo, redo, exportPDF, openImportModal, addTag, delTag, loadSampleData, WW,
}) {
  _render     = render;
  _renderRAF  = renderRAF;
  _openModal  = openModal;
  _openCtx    = openCtx;
  _closeCtx   = closeCtx;
  _closeModal = closeModal;
  _undo       = undo;
  _redo       = redo;
  _exportPDF  = exportPDF;
  _openImport = openImportModal;
  _addTag     = addTag;
  _delTag     = delTag;
  _loadSample = loadSampleData;
  _WW         = WW;
  setResizeWW(WW);
}

/* ── RAF-throttled render for drag/resize ── */
let _rafId = null;
export function renderRAF() {
  if (_rafId) cancelAnimationFrame(_rafId);
  _rafId = requestAnimationFrame(() => { _rafId = null; _render?.(true); });
}

/* ── handleAction — shared between ctx-menu items and bind.js ── */
export function handleAction(action) {
  _closeCtx?.();
  const [cmd, id] = action.split(':');
  const nid = +id;
  if (cmd === 'edit-task')    _openModal?.('edit-task',  taskById(nid));
  if (cmd === 'del-task')   { delTask(nid);  _render?.(); }
  if (cmd === 'toggle-done') { const t = taskById(nid); if (t) { pushHistory(); t.done = !t.done; _render?.(); } }
  if (cmd === 'unschedule')  { const t = taskById(nid); if (t) { t.startWeek = null; _render?.(); } }
  if (cmd === 'edit-team')   _openModal?.('edit-team',  S.teams.find(t => t.id === nid));
  if (cmd === 'del-team')  { delTeam(nid);  _render?.(); }
  if (cmd === 'edit-phase')  _openModal?.('edit-phase', phaseById(nid));
  if (cmd === 'del-phase') { delPhase(nid); _render?.(); }
}

/* ── onKey / onDocClick — document-level handlers ── */
export function onDocClick() { _closeCtx?.(); }

export function onKey(e) {
  const ctrl = e.ctrlKey || e.metaKey;

  /* Escape resets all drag states regardless of modal */
  if (e.key === 'Escape') {
    S.ui.dragData   = null;
    S.ui.teamDragId = null;
    S.ui.phaseDragId = null;
  }

  /* Modal open — Escape closes, Enter saves */
  if (S.ui.modal) {
    if (e.key === 'Escape') { _closeModal?.(_render); return; }
    if (e.key === 'Enter' && !e.shiftKey && e.target.tagName !== 'TEXTAREA') {
      q('#m-save')?.click(); return;
    }
    return;
  }
  if (S.ui.ctx) { if (e.key === 'Escape') { _closeCtx?.(); return; } }

  const inInput = ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)
               || document.activeElement?.isContentEditable;

  if (!inInput) {
    if (ctrl && e.key === 'z' && !e.shiftKey) { e.preventDefault(); _undo?.(); return; }
    if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); _redo?.(); return; }
  }

  if (ctrl && e.key === 'k') {
    e.preventDefault();
    const inp = q('#sb-search');
    if (inp) { inp.focus(); inp.select(); }
    return;
  }

  if (inInput) return;
  if (e.key === 'n' && !ctrl) { e.preventDefault(); _openModal?.('add-task'); }
  if (e.key === 'p' && !ctrl) { e.preventDefault(); _openModal?.('add-phase'); }
  if (e.key === 't' && !ctrl) { e.preventDefault(); _openModal?.('add-team'); }
}

/* ══════════════════════════════════════════════
   MAIN BIND FUNCTION
══════════════════════════════════════════════ */
export function bind() {
  /* Back to Home */
  q('#btn-back-home')?.addEventListener('click', () => { location.hash = '#home'; });

  /* Header */
  q('#hdr-title-click')?.addEventListener('click', () => _openModal?.('cfg'));
  q('#btn-cfg')?.addEventListener('click', () => _openModal?.('cfg'));
  q('#btn-share')?.addEventListener('click', () => _openModal?.('share'));
  q('#btn-add-phase2')?.addEventListener('click', () => _openModal?.('add-phase'));
  q('#add-tc-btn')?.addEventListener('click', () => _openModal?.('add-task'));
  q('#add-tm-btn2')?.addEventListener('click', () => _openModal?.('add-team'));
  q('#btn-export')?.addEventListener('click', () => _exportPDF?.());

  /* Stat buttons → filter */
  q('#stat-all')?.addEventListener('click',   () => { S.ui.filter.status = ''; _render?.(); });
  q('#stat-sched')?.addEventListener('click', () => { S.ui.filter.status = 'scheduled'; _render?.(); });
  q('#stat-back')?.addEventListener('click',  () => { S.ui.filter.status = 'backlog'; _render?.(); });

  /* Search */
  q('#sb-search')?.addEventListener('input',   e => { S.ui.filter.search = e.target.value; _render?.(true); });
  q('#sb-search')?.addEventListener('keydown', e => { if (e.key === 'Escape') { S.ui.filter.search = ''; _render?.(); } });

  /* Empty state buttons */
  q('#empty-add-phase')?.addEventListener('click',   () => _openModal?.('add-phase'));
  q('#empty-load-sample')?.addEventListener('click', () => _loadSample?.());

  /* Add-new dropdown */
  q('#btn-add-new')?.addEventListener('click', e => {
    e.stopPropagation();
    const menu = q('#add-new-menu');
    const btn  = q('#btn-add-new');
    if (!menu) return;
    const opening = !menu.classList.contains('open');
    menu.classList.toggle('open', opening);
    btn?.setAttribute('aria-expanded', opening ? 'true' : 'false');
  });
  qAll('.add-dd-item').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      q('#add-new-menu')?.classList.remove('open');
      if (btn.dataset.add === 'import-csv') { _openImport?.(); return; }
      const type = btn.dataset.add === 'phase' ? 'add-phase' : btn.dataset.add;
      _openModal?.(type);
    });
  });
  document.addEventListener('click', () => q('#add-new-menu')?.classList.remove('open'));

  /* Team label click → edit */
  qAll('.trl[data-team-id]').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.closest('[data-action]')) return;
      const tm = S.teams.find(t => t.id === +el.dataset.teamId);
      if (tm) _openModal?.('edit-team', tm);
    });
  });

  /* Tag filter pills */
  qAll('.tf[data-tag]').forEach(el => {
    el.addEventListener('click', e => {
      const delBtn = e.target.closest('[data-del-tag]');
      if (delBtn) { e.stopPropagation(); _delTag?.(delBtn.dataset.delTag); return; }
      S.ui.filter.tag = el.dataset.tag || '';
      _render?.();
    });
    el.addEventListener('dragstart', e => {
      const tag = el.dataset.tag;
      if (!tag) { e.preventDefault(); return; }
      S.ui.dragData = { type: 'tag', tag };
      e.dataTransfer.effectAllowed = 'copy';
    });
    el.addEventListener('dragend', () => {
      if (S.ui.dragData?.type === 'tag') S.ui.dragData = null;
    });
  });

  /* Filter selects */
  q('#f-phase')?.addEventListener('change', e => { S.ui.filter.phase = e.target.value; _render?.(); });
  q('#f-team')?.addEventListener('change',  e => { S.ui.filter.team  = e.target.value; _render?.(); });

  /* Add tag */
  q('#tf-add-btn')?.addEventListener('click', () => {
    const inp = q('#tf-add-inp');
    if (inp && inp.value.trim()) { _addTag?.(inp.value.trim()); }
  });
  q('#tf-add-inp')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') { const v = e.target.value.trim(); if (v) _addTag?.(v); }
  });

  /* Task cards */
  qAll('.tc[data-task-id]').forEach(el => {
    const taskId = +el.dataset.taskId;

    el.addEventListener('click', e => {
      if (e.target.closest('[data-del-tag-from-card]')) return;
      const t = taskById(taskId);
      if (t) _openModal?.('edit-task', t);
    });

    el.addEventListener('dragstart', e => {
      if (S.ui.dragData?.type === 'tag') return;
      S.ui.dragData = { type: 'backlog', taskId };
      setTimeout(() => el.classList.add('drg'), 0);
      e.dataTransfer.effectAllowed = 'move';
    });
    el.addEventListener('dragend', () => el.classList.remove('drg'));

    el.addEventListener('dragover', e => {
      if (S.ui.dragData?.type === 'tag') { e.preventDefault(); e.stopPropagation(); el.classList.add('tag-drop-target'); }
    });
    el.addEventListener('dragleave', e => {
      if (!el.contains(e.relatedTarget)) el.classList.remove('tag-drop-target');
    });
    el.addEventListener('drop', e => {
      el.classList.remove('tag-drop-target');
      if (S.ui.dragData?.type === 'tag') {
        e.preventDefault(); e.stopPropagation();
        const t = taskById(taskId);
        const tag = S.ui.dragData.tag;
        if (t && tag && !t.tags.includes(tag)) { t.tags.push(tag); S.ui.dragData = null; _render?.(); }
      }
    });

    el.addEventListener('contextmenu', e => {
      e.preventDefault();
      const t = taskById(taskId);
      _openCtx?.(e.clientX, e.clientY, [
        { l: 'Edit task',                             icon: 'edit', a: `edit-task:${t.id}` },
        { l: t.done ? 'Mark as active' : 'Mark as done', icon: 'zap', a: `toggle-done:${t.id}` },
        '---',
        { l: 'Delete task', icon: 'zap', a: `del-task:${t.id}`, d: true },
      ]);
    });
  });

  /* Timeline cells drop */
  qAll('.trc').forEach(el => {
    el.addEventListener('dragover', e => {
      if (!S.ui.dragData) return;
      e.preventDefault();
      el.classList.add('dh');
    });
    el.addEventListener('dragleave', () => el.classList.remove('dh'));
    el.addEventListener('drop', e => {
      e.preventDefault();
      el.classList.remove('dh');
      if (!S.ui.dragData) return;
      const week   = +el.dataset.week;
      const teamId = +el.dataset.team;
      const t = taskById(S.ui.dragData.taskId);
      if (t) { pushHistory(); t.startWeek = week; t.teamId = teamId; }
      S.ui.dragData = null;
      _render?.();
    });
  });

  /* Task bars */
  qAll('.tb').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.closest('.tb-lh,.tb-rh')) return;
      if (S.ui.dragData) return;
      const t = taskById(+el.dataset.taskId);
      if (!t || S.ui.readonly) return;
      pushHistory();
      t.done = !t.done;
      _render?.(false);
    });
    el.addEventListener('dblclick', e => {
      if (e.target.closest('.tb-lh,.tb-rh')) return;
      const t = taskById(+el.dataset.taskId);
      if (t) _openModal?.('edit-task', t);
    });
    el.addEventListener('dragstart', e => {
      if (e.target.classList.contains('tb-rh')) { e.preventDefault(); return; }
      S.ui.dragData = { type: 'bar', taskId: +el.dataset.taskId };
      setTimeout(() => el.classList.add('drg'), 0);
      e.dataTransfer.effectAllowed = 'move';
    });
    el.addEventListener('dragend', () => { el.classList.remove('drg'); S.ui.dragData = null; });
    el.addEventListener('contextmenu', e => {
      e.preventDefault();
      const t = taskById(+el.dataset.taskId);
      _openCtx?.(e.clientX, e.clientY, [
        { l: 'Edit task',                             icon: 'edit',   a: `edit-task:${t.id}` },
        { l: t.done ? 'Mark as active' : 'Mark as done', icon: 'zap', a: `toggle-done:${t.id}` },
        { l: 'Send to backlog',                       icon: 'layers', a: `unschedule:${t.id}` },
        '---',
        { l: 'Delete task', icon: 'zap', a: `del-task:${t.id}`, d: true },
      ]);
    });
  });

  /* Task right resize handle */
  qAll('.tb-rh').forEach(el => {
    el.addEventListener('mousedown', e => {
      e.stopPropagation(); e.preventDefault();
      const id = +el.dataset.resize;
      const t = taskById(id);
      if (t) S.ui.resizeData = { taskId: id, side: 'right', startX: e.clientX, origDur: t.dur, origStartWeek: t.startWeek };
    });
  });

  /* Task left resize handle */
  qAll('.tb-lh').forEach(el => {
    el.addEventListener('mousedown', e => {
      e.stopPropagation(); e.preventDefault();
      const id = +el.dataset.resizeLeft;
      const t = taskById(id);
      if (t) S.ui.resizeData = { taskId: id, side: 'left', startX: e.clientX, origDur: t.dur, origStartWeek: t.startWeek };
    });
  });

  /* Phase resize handles */
  qAll('[data-ph-resize-left]').forEach(el => {
    el.addEventListener('mousedown', e => {
      e.stopPropagation(); e.preventDefault();
      const id = +el.dataset.phResizeLeft;
      const ph = phaseById(id);
      if (!ph) return;
      S.ui.phaseResize = {
        phaseId: id, side: 'left', startX: e.clientX,
        origStart: ph.startWeek, origEnd: ph.endWeek,
        origAll: S.phases.map(p => ({ id: p.id, startWeek: p.startWeek, endWeek: p.endWeek })),
      };
    });
  });
  qAll('[data-ph-resize-right]').forEach(el => {
    el.addEventListener('mousedown', e => {
      e.stopPropagation(); e.preventDefault();
      const id = +el.dataset.phResizeRight;
      const ph = phaseById(id);
      if (!ph) return;
      S.ui.phaseResize = {
        phaseId: id, side: 'right', startX: e.clientX,
        origStart: ph.startWeek, origEnd: ph.endWeek,
        origAll: S.phases.map(p => ({ id: p.id, startWeek: p.startWeek, endWeek: p.endWeek })),
      };
    });
  });

  /* Phase drag/swap */
  qAll('[data-ph-drag]').forEach(el => {
    el.addEventListener('dragstart', e => {
      S.ui.phaseDragId = +el.dataset.phDrag;
      e.dataTransfer.effectAllowed = 'move';
    });
    el.addEventListener('dragend', () => { S.ui.phaseDragId = null; });
  });
  qAll('.ph-cell:not(.ph-gap)').forEach(el => {
    el.addEventListener('dragover', e => {
      if (!S.ui.phaseDragId) return;
      const targetId = +el.dataset.phaseId;
      if (targetId !== S.ui.phaseDragId) { e.preventDefault(); el.classList.add('ph-drag-over'); }
    });
    el.addEventListener('dragleave', () => el.classList.remove('ph-drag-over'));
    el.addEventListener('drop', e => {
      e.preventDefault();
      el.classList.remove('ph-drag-over');
      const targetId = +el.dataset.phaseId;
      if (S.ui.phaseDragId && targetId !== S.ui.phaseDragId) {
        swapPhases(S.ui.phaseDragId, targetId);
        S.ui.phaseDragId = null;
        _render?.();
      }
    });
  });

  /* Team row reorder */
  qAll('.team-drag-handle[data-team-drag]').forEach(el => {
    el.addEventListener('dragstart', e => {
      e.stopPropagation();
      S.ui.teamDragId = +el.dataset.teamDrag;
      e.dataTransfer.effectAllowed = 'move';
    });
    el.addEventListener('dragend', () => { S.ui.teamDragId = null; });
  });
  qAll('.tm-row[data-team-id]').forEach(el => {
    el.addEventListener('dragover', e => {
      if (!S.ui.teamDragId) return;
      const targetId = +el.dataset.teamId;
      if (targetId !== S.ui.teamDragId) { e.preventDefault(); el.classList.add('team-drag-over'); }
    });
    el.addEventListener('dragleave', () => el.classList.remove('team-drag-over'));
    el.addEventListener('drop', e => {
      e.preventDefault();
      el.classList.remove('team-drag-over');
      const targetId = +el.dataset.teamId;
      if (S.ui.teamDragId && targetId !== S.ui.teamDragId) {
        reorderTeam(S.ui.teamDragId, targetId);
        S.ui.teamDragId = null;
        _render?.();
      }
    });
  });

  /* Task bar reorder within same phase (insert before) */
  qAll('.tb[data-task-id]').forEach(el => {
    el.addEventListener('dragover', e => {
      if (!S.ui.dragData || S.ui.dragData.type !== 'bar') return;
      const dragTask  = taskById(S.ui.dragData.taskId);
      const hoverTask = taskById(+el.dataset.taskId);
      if (!dragTask || !hoverTask) return;
      if (dragTask.id !== hoverTask.id &&
          dragTask.phaseId !== null &&
          dragTask.phaseId === hoverTask.phaseId &&
          dragTask.teamId  === hoverTask.teamId) {
        e.preventDefault(); e.stopPropagation();
        el.classList.add('tb-insert-before');
      }
    });
    el.addEventListener('dragleave', () => el.classList.remove('tb-insert-before'));
    el.addEventListener('drop', e => {
      el.classList.remove('tb-insert-before');
      if (!S.ui.dragData || S.ui.dragData.type !== 'bar') return;
      const dragTask  = taskById(S.ui.dragData.taskId);
      const hoverTask = taskById(+el.dataset.taskId);
      if (!dragTask || !hoverTask || dragTask.id === hoverTask.id) return;
      if (dragTask.phaseId !== null &&
          dragTask.phaseId === hoverTask.phaseId &&
          dragTask.teamId  === hoverTask.teamId) {
        e.preventDefault(); e.stopPropagation();
        pushHistory();
        const fromIdx = S.tasks.indexOf(dragTask);
        let   toIdx   = S.tasks.indexOf(hoverTask);
        if (fromIdx !== -1 && toIdx !== -1) {
          S.tasks.splice(fromIdx, 1);
          toIdx = S.tasks.indexOf(hoverTask);
          S.tasks.splice(toIdx, 0, dragTask);
        }
        S.ui.dragData = null;
        _render?.();
      }
    });
  });

  /* Sidebar drop zone (unschedule) */
  const sb = q('#sidebar');
  if (sb) {
    sb.addEventListener('dragover', e => {
      if (S.ui.dragData?.type === 'bar') { e.preventDefault(); sb.classList.add('dh-zone'); }
    });
    sb.addEventListener('dragleave', () => sb.classList.remove('dh-zone'));
    sb.addEventListener('drop', e => {
      e.preventDefault(); sb.classList.remove('dh-zone');
      if (S.ui.dragData?.type === 'bar') {
        const t = taskById(S.ui.dragData.taskId);
        if (t) t.startWeek = null;
        S.ui.dragData = null;
        _render?.();
      }
    });
  }

  /* Phase body — double-click to edit, right-click for context menu */
  qAll('.ph-body[data-ph-drag]').forEach(el => {
    el.addEventListener('dblclick', e => {
      e.preventDefault();
      const id = +el.dataset.phDrag;
      _openModal?.('edit-phase', phaseById(id));
    });
    el.addEventListener('contextmenu', e => {
      e.preventDefault();
      const id = +el.dataset.phDrag;
      _openCtx?.(e.clientX, e.clientY, [
        { l: 'Sửa phase', icon: 'edit', a: `edit-phase:${id}` },
        '---',
        { l: 'Xóa phase', icon: 'zap', a: `del-phase:${id}`, d: true },
      ]);
    });
  });

  /* Team label right-click */
  qAll('[data-team-ctx]').forEach(el => {
    el.addEventListener('contextmenu', e => {
      e.preventDefault();
      const id = +el.dataset.teamCtx;
      _openCtx?.(e.clientX, e.clientY, [
        { l: 'Sửa nhóm', icon: 'edit', a: `edit-team:${id}` },
        '---',
        { l: 'Xóa nhóm', icon: 'zap', a: `del-team:${id}`, d: true },
      ]);
    });
  });

  /* Team hover edit button */
  qAll('[data-edit-team]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const tm = S.teams.find(t => t.id === +el.dataset.editTeam);
      if (tm) _openModal?.('edit-team', tm);
    });
  });

  /* Context menu action items */
  qAll('.ci[data-action]').forEach(el => {
    el.addEventListener('click', () => handleAction(el.dataset.action));
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleAction(el.dataset.action); }
    });
  });

  /* Scope textarea — live update, persist on blur */
  qAll('[data-scope-id]').forEach(el => {
    el.addEventListener('input', () => {
      const ph = phaseById(+el.dataset.scopeId);
      if (ph) ph.scope = el.value;
    });
    el.addEventListener('blur', () => _render?.());
  });

  /* Output checklist — add item */
  qAll('[data-add-chk]').forEach(el => {
    el.addEventListener('click', () => {
      const ph = phaseById(+el.dataset.addChk);
      if (!ph) return;
      if (!ph.outputs) ph.outputs = [];
      ph.outputs.push({ id: nextId(), text: '', done: false });
      _render?.();
    });
  });

  /* Output checklist — toggle done */
  qAll('[data-chk-toggle]').forEach(el => {
    el.addEventListener('change', () => {
      const [oid, pid] = el.dataset.chkToggle.split(':').map(Number);
      const ph = phaseById(pid);
      if (!ph) return;
      const o = ph.outputs?.find(x => x.id === oid);
      if (o) { o.done = el.checked; _render?.(); }
    });
  });

  /* Output checklist — edit text */
  qAll('[data-chk-edit]').forEach(el => {
    el.addEventListener('input', () => {
      const [oid, pid] = el.dataset.chkEdit.split(':').map(Number);
      const ph = phaseById(pid);
      if (!ph) return;
      const o = ph.outputs?.find(x => x.id === oid);
      if (o) o.text = el.textContent;
    });
  });

  /* Output checklist — delete item */
  qAll('[data-del-chk]').forEach(el => {
    el.addEventListener('click', () => {
      const [oid, pid] = el.dataset.delChk.split(':').map(Number);
      const ph = phaseById(pid);
      if (!ph) return;
      ph.outputs = ph.outputs?.filter(x => x.id !== oid);
      _render?.();
    });
  });

  /* Output paste → auto todo-list */
  qAll('[data-paste-ph]').forEach(ta => {
    ta.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const val = ta.value.trim();
        if (!val) return;
        const ph = phaseById(+ta.dataset.pastePh);
        if (!ph) return;
        if (!ph.outputs) ph.outputs = [];
        ph.outputs.push({ id: nextId(), text: val, done: false });
        ta.value = '';
        _render?.();
      }
    });
    ta.addEventListener('paste', e => {
      e.preventDefault();
      const text  = (e.clipboardData || window.clipboardData).getData('text');
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (!lines.length) return;
      const ph = phaseById(+ta.dataset.pastePh);
      if (!ph) return;
      if (!ph.outputs) ph.outputs = [];
      lines.forEach(line => ph.outputs.push({ id: nextId(), text: line, done: false }));
      _render?.();
    });
  });

  /* Scope row resize handle */
  const scopeHandle = q('#scope-resize-handle');
  if (scopeHandle) {
    let startY = 0, startH = 0;
    const onMove = e => {
      const dy = (e.clientY || e.touches?.[0]?.clientY || startY) - startY;
      S.cfg.scopeRowHeight = Math.max(60, startH + dy);
      qAll('.scope-block, .scope-gap').forEach(el => { el.style.height = S.cfg.scopeRowHeight + 'px'; });
      qAll('[data-scope-id]').forEach(el => { el.style.height = (S.cfg.scopeRowHeight - 18) + 'px'; });
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      scopeHandle.classList.remove('dragging');
      _render?.();
    };
    scopeHandle.addEventListener('mousedown', e => {
      e.preventDefault();
      startY = e.clientY;
      startH = S.cfg.scopeRowHeight || 100;
      scopeHandle.classList.add('dragging');
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  /* Sidebar collapse */
  q('#sb-toggle')?.addEventListener('click', () => { saveSidebarState('collapsed'); _render?.(); });
  q('#sb-rail-btn')?.addEventListener('click', () => { saveSidebarState('expanded'); _render?.(); });

  /* Row collapse toggles */
  q('#scope-toggle')?.addEventListener('click', () => {
    const rs = loadRowState();
    rs.scope = rs.scope === 'collapsed' ? 'expanded' : 'collapsed';
    saveRowState(rs);
    _render?.(true);
  });
  q('#output-toggle')?.addEventListener('click', () => {
    const rs = loadRowState();
    rs.output = rs.output === 'collapsed' ? 'expanded' : 'collapsed';
    saveRowState(rs);
    _render?.(true);
  });

  /* Global doc handlers — re-register each bind() call */
  document.removeEventListener('click', onDocClick);
  document.addEventListener('click', onDocClick, { once: true });
  document.removeEventListener('keydown', onKey);
  document.addEventListener('keydown', onKey);
}
