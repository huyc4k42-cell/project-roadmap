/* ── EVENTS / BIND / TIMELINE CELL — .trc dragover/drop + mousedown→mouseup create task ── */
import { S, pushHistory, taskById } from '../../state.js';
import { qAll } from '../../utils.js';
import { trackScheduleTask, trackRescheduleTask } from '../../tracking/task.js';

/* Module-level state to allow safe removeEventListener */
let _trcMouseStart = null;
let _deps          = null;

function _onTrcMouseUp(e) {
  if (!_trcMouseStart) return;
  const start = _trcMouseStart;
  _trcMouseStart = null;
  const cell = e.target.closest('.trc');
  if (!cell || S.ui.dragData) return;
  const endWeek = +cell.dataset.week;
  const teamId  = +cell.dataset.team;
  if (teamId !== start.teamId) return; // different team row → ignore
  const sw  = Math.min(start.week, endWeek);
  const dur = Math.abs(endWeek - start.week) + 1;
  S.ui._prefillTask = { startWeek: sw, teamId: start.teamId, dur };
  _deps?.openModal?.('add-task');
}

export function bindTimelineCells(deps) {
  _deps = deps;

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
      const tk = taskById(S.ui.dragData.taskId);
      if (tk) {
        const wasUnscheduled = tk.startWeek === null;
        pushHistory();
        tk.startWeek = week; tk.teamId = teamId;
        if (wasUnscheduled) trackScheduleTask(tk, S, true, null);
        else trackRescheduleTask(tk, S);
      }
      S.ui.dragData = null;
      deps.render?.();
    });
    el.addEventListener('mousedown', e => {
      if (e.button !== 0 || S.ui.readonly) return;
      if (S.ui.dragData) return;
      _trcMouseStart = { week: +el.dataset.week, teamId: +el.dataset.team };
    });
  });

  /* Fix listener stacking: remove before adding */
  document.removeEventListener('mouseup', _onTrcMouseUp);
  document.addEventListener('mouseup', _onTrcMouseUp);
}
