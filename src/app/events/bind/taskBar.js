/* ── EVENTS / BIND / TASK BAR — .tb click/dblclick/drag, resize handles, reorder, sidebar unschedule, fallback drop ── */
import { S, nextId, pushHistory, taskById } from '../../state.js';
import { q, qAll } from '../../utils.js';
import { t } from '../../i18n.js';
import { trackDoneTask, trackUndoneTask, trackOpenTaskDetail, trackUnscheduleTask } from '../../tracking/task.js';

export function bindTaskBars(deps) {
  /* Task bars */
  qAll('.tb').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.closest('.tb-lh,.tb-rh')) return;
      if (S.ui.dragData) return;
      const tk = taskById(+el.dataset.taskId);
      if (!tk || S.ui.readonly) return;
      if (!tk.done) trackDoneTask(tk, S); else trackUndoneTask(tk, S);
      pushHistory();
      tk.done = !tk.done;
      deps.render?.(false);
    });
    el.addEventListener('dblclick', e => {
      if (e.target.closest('.tb-lh,.tb-rh')) return;
      const tk = taskById(+el.dataset.taskId);
      if (tk) { trackOpenTaskDetail(tk, S, 'bar_dblclick'); deps.openModal?.('edit-task', tk); }
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
      const tk = taskById(+el.dataset.taskId);
      deps.openCtx?.(e.clientX, e.clientY, [
        { l: t('context.editTask'),                                        icon: 'edit',   a: `edit-task:${tk.id}` },
        { l: tk.done ? t('context.markActive') : t('context.markDone'),   icon: 'zap',    a: `toggle-done:${tk.id}` },
        { l: t('context.sendToBacklog'),                                   icon: 'layers', a: `unschedule:${tk.id}` },
        '---',
        { l: t('context.deleteTask'), icon: 'zap', a: `del-task:${tk.id}`, d: true },
      ]);
    });
  });

  /* Task right resize handle */
  qAll('.tb-rh').forEach(el => {
    el.addEventListener('mousedown', e => {
      e.stopPropagation(); e.preventDefault();
      const id = +el.dataset.resize;
      const tk = taskById(id);
      if (tk) { pushHistory(); S.ui.resizeData = { taskId: id, side: 'right', startX: e.clientX, origDur: tk.dur, origStartWeek: tk.startWeek }; }
    });
  });

  /* Task left resize handle */
  qAll('.tb-lh').forEach(el => {
    el.addEventListener('mousedown', e => {
      e.stopPropagation(); e.preventDefault();
      const id = +el.dataset.resizeLeft;
      const tk = taskById(id);
      if (tk) { pushHistory(); S.ui.resizeData = { taskId: id, side: 'left', startX: e.clientX, origDur: tk.dur, origStartWeek: tk.startWeek }; }
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
        deps.render?.();
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
        const tk = taskById(S.ui.dragData.taskId);
        if (tk) { trackUnscheduleTask(tk, S); pushHistory(); tk.startWeek = null; }
        S.ui.dragData = null;
        deps.render?.();
      }
    });
  }

  /* Fallback drop zone when no teams exist */
  const tlArea = q('.tl-area');
  if (tlArea && S.teams.length === 0) {
    tlArea.addEventListener('dragover', e => {
      if (S.ui.dragData?.type === 'backlog' || S.ui.dragData?.type === 'bar') e.preventDefault();
    }, { once: false });
    tlArea.addEventListener('drop', e => {
      if (!S.ui.dragData) return;
      if (S.ui.dragData.type !== 'backlog' && S.ui.dragData.type !== 'bar') return;
      e.preventDefault();
      pushHistory();
      const tm = { id: nextId(), name: 'Untitled', icon: 'users', color: '#7c3aed' };
      S.teams.push(tm);
      const tk = taskById(S.ui.dragData.taskId);
      if (tk) { tk.teamId = tm.id; tk.startWeek = 1; }
      S.ui.dragData = null;
      deps.render?.();
    }, { once: true });
  }
}
