/* ── TRACKING — Flow: Project Detail / Task ── */
import { track } from '../analytics.js';
import { buildTaskProps } from './utils.js';

export function trackAddTask(source) {
  track('add_task', { source });
}

export function trackCancelAddTask(cancelMethod) {
  track('cancel_add_task', { cancelMethod });
}

export function trackAddTaskCompleted(task, S) {
  track('add_task_completed', buildTaskProps(task, S));
}

export function trackScheduleTask(task, S, isFirstSchedule = false, timeToFirstScheduleMs = null) {
  const props = {
    ...buildTaskProps(task, S),
    isFirstSchedule,
  };
  if (isFirstSchedule && timeToFirstScheduleMs != null) {
    props.timeToFirstScheduleMs = timeToFirstScheduleMs;
  }
  track('schedule_task', props);
}

export function trackUnscheduleTask(task, S) {
  track('unschedule_task', buildTaskProps(task, S));
}

export function trackRescheduleTask(task, S) {
  track('reschedule_task', buildTaskProps(task, S));
}

export function trackResizeTaskDuration(task, S, resizeDeltaWeeks) {
  track('resize_task_duration', { ...buildTaskProps(task, S), resizeDeltaWeeks });
}

export function trackCompleteTask(task, S) {
  track('complete_task', buildTaskProps(task, S));
}

export function trackOpenTaskDetail(task, S, source) {
  track('open_task_detail', { ...buildTaskProps(task, S), source });
}

export function trackTaskEdited(task, S, { changedName, changedTeam, changedPhase, changedDescription, changedTags }) {
  track('task_edited', {
    ...buildTaskProps(task, S),
    changedName, changedTeam, changedPhase, changedDescription, changedTags,
  });
}

export function trackTaskDeleted(task, S) {
  track('task_deleted', buildTaskProps(task, S));
}

export function trackDoneTask(task, S) {
  track('done_task', buildTaskProps(task, S));
}

export function trackUndoneTask(task, S) {
  track('undone_task', buildTaskProps(task, S));
}

export function trackUndoAction() {
  track('undo_action');
}
