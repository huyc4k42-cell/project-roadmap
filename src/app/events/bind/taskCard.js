/* ── EVENTS / BIND / TASK CARD — .tc[data-task-id] click, drag, tag-drop, contextmenu ── */
import { S, pushHistory, taskById } from '../../state.js';
import { qAll } from '../../utils.js';
import { t } from '../../i18n.js';
import { trackDragTagToTask } from '../../tracking/sidebar.js';
import { trackOpenTaskDetail } from '../../tracking/task.js';

export function bindTaskCards(deps) {
  qAll('.tc[data-task-id]').forEach(el => {
    const taskId = +el.dataset.taskId;

    el.addEventListener('click', e => {
      if (e.target.closest('[data-del-tag-from-card]')) return;
      const tk = taskById(taskId);
      if (tk) { trackOpenTaskDetail(tk, S, 'sidebar_card'); deps.openModal?.('edit-task', tk); }
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
        const tk = taskById(taskId);
        const tag = S.ui.dragData.tag;
        if (tk && tag && !tk.tags.includes(tag)) { pushHistory(); tk.tags.push(tag); trackDragTagToTask(tag, tk.name); S.ui.dragData = null; deps.render?.(); }
      }
    });

    el.addEventListener('contextmenu', e => {
      e.preventDefault();
      const tk = taskById(taskId);
      deps.openCtx?.(e.clientX, e.clientY, [
        { l: t('context.editTask'),                                          icon: 'edit', a: `edit-task:${tk.id}` },
        { l: tk.done ? t('context.markActive') : t('context.markDone'),     icon: 'zap',  a: `toggle-done:${tk.id}` },
        '---',
        { l: t('context.deleteTask'), icon: 'zap', a: `del-task:${tk.id}`, d: true },
      ]);
    });
  });
}
