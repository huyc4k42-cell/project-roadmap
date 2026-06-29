/* ── EVENTS / BIND / PHASE & TEAM — phase resize, phase drag/swap, phase gap, phase body, team reorder, team ctx/edit ── */
import { S, pushHistory, phaseById, swapPhases, reorderTeam } from '../../state.js';
import { qAll } from '../../utils.js';
import { t } from '../../i18n.js';
import { trackOpenPhaseDetail, trackReorderPhase } from '../../tracking/phase.js';
import { trackReorderTeam } from '../../tracking/team.js';

/* Module-level state to allow safe removeEventListener */
let _phGapMouseStart = null;
let _deps            = null;

function _onPhGapMouseUp(e) {
  if (_phGapMouseStart == null) return;
  const start = _phGapMouseStart;
  _phGapMouseStart = null;
  const cell = e.target.closest('.ph-cell.ph-gap');
  if (!cell) return;
  const endWeek = +cell.dataset.week;
  const sw = Math.min(start, endWeek);
  const ew = Math.max(start, endWeek);
  _deps?.openModal?.('add-phase', { startWeek: sw, endWeek: Math.max(ew, sw + 1) });
}

export function bindPhaseAndTeam(deps) {
  _deps = deps;

  /* Phase resize handles — left */
  qAll('[data-ph-resize-left]').forEach(el => {
    el.addEventListener('mousedown', e => {
      e.stopPropagation(); e.preventDefault();
      const id = +el.dataset.phResizeLeft;
      const ph = phaseById(id);
      if (!ph) return;
      pushHistory();
      S.ui.phaseResize = {
        phaseId: id, side: 'left', startX: e.clientX,
        origStart: ph.startWeek, origEnd: ph.endWeek,
        origAll: S.phases.map(p => ({ id: p.id, startWeek: p.startWeek, endWeek: p.endWeek })),
      };
    });
  });

  /* Phase resize handles — right */
  qAll('[data-ph-resize-right]').forEach(el => {
    el.addEventListener('mousedown', e => {
      e.stopPropagation(); e.preventDefault();
      const id = +el.dataset.phResizeRight;
      const ph = phaseById(id);
      if (!ph) return;
      pushHistory();
      S.ui.phaseResize = {
        phaseId: id, side: 'right', startX: e.clientX,
        origStart: ph.startWeek, origEnd: ph.endWeek,
        origAll: S.phases.map(p => ({ id: p.id, startWeek: p.startWeek, endWeek: p.endWeek })),
      };
    });
  });

  /* Phase drag ghost + swap */
  qAll('[data-ph-drag]').forEach(el => {
    el.addEventListener('dragstart', e => {
      S.ui.phaseDragId = +el.dataset.phDrag;
      e.dataTransfer.effectAllowed = 'move';
      // Custom drag ghost — small badge to avoid covering adjacent phase
      const phId = +el.dataset.phDrag;
      const ph = phaseById(phId);
      const ghost = document.createElement('div');
      ghost.textContent = ph?.name || '';
      Object.assign(ghost.style, {
        position: 'fixed', top: '-200px', left: '0',
        background: ph?.color || '#333',
        color: '#fff', padding: '4px 10px',
        borderRadius: '4px', fontSize: '12px', fontWeight: '600',
        pointerEvents: 'none', whiteSpace: 'nowrap',
      });
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, 10, 16);
      requestAnimationFrame(() => ghost.remove());
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
        const dragId = S.ui.phaseDragId;
        const positionFrom = S.phases.findIndex(p => p.id === dragId);
        const positionTo   = S.phases.findIndex(p => p.id === targetId);
        const dragPhase    = phaseById(dragId);
        swapPhases(dragId, targetId);
        if (dragPhase) trackReorderPhase(positionFrom, positionTo, dragPhase, S);
        S.ui.phaseDragId = null;
        deps.render?.();
      }
    });
  });

  /* Phase gap — click/drag to create phase */
  qAll('.ph-cell.ph-gap').forEach(el => {
    el.addEventListener('mousedown', e => {
      if (e.button !== 0 || S.ui.readonly) return;
      _phGapMouseStart = +el.dataset.week;
    });
  });

  /* Fix listener stacking: remove before adding */
  document.removeEventListener('mouseup', _onPhGapMouseUp);
  document.addEventListener('mouseup', _onPhGapMouseUp);

  /* Phase body — double-click to edit, right-click for context menu */
  qAll('.ph-body[data-ph-drag]').forEach(el => {
    el.addEventListener('dblclick', e => {
      e.preventDefault();
      const id = +el.dataset.phDrag;
      const ph = phaseById(id);
      if (ph) trackOpenPhaseDetail('dblclick', ph, S);
      deps.openModal?.('edit-phase', ph);
    });
    el.addEventListener('contextmenu', e => {
      e.preventDefault();
      const id = +el.dataset.phDrag;
      deps.openCtx?.(e.clientX, e.clientY, [
        { l: t('context.editPhase'), icon: 'edit', a: `edit-phase:${id}` },
        '---',
        { l: t('context.deletePhase'), icon: 'zap', a: `del-phase:${id}`, d: true },
      ]);
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
        const draggedTeam = S.teams.find(tm => tm.id === S.ui.teamDragId);
        reorderTeam(S.ui.teamDragId, targetId);
        if (draggedTeam) trackReorderTeam(draggedTeam, S);
        S.ui.teamDragId = null;
        deps.render?.();
      }
    });
  });

  /* Team label right-click */
  qAll('[data-team-ctx]').forEach(el => {
    el.addEventListener('contextmenu', e => {
      e.preventDefault();
      const id = +el.dataset.teamCtx;
      deps.openCtx?.(e.clientX, e.clientY, [
        { l: t('context.editTeam'), icon: 'edit', a: `edit-team:${id}` },
        '---',
        { l: t('context.deleteTeam'), icon: 'zap', a: `del-team:${id}`, d: true },
      ]);
    });
  });

  /* Team hover edit button */
  qAll('[data-edit-team]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const tm = S.teams.find(m => m.id === +el.dataset.editTeam);
      if (tm) deps.openModal?.('edit-team', tm);
    });
  });
}
