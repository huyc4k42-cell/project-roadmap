/* ── TRACKING UTILS — shared object builders ── */

const PROJ_OPEN_KEY = id => `aroadmap_proj_opens_${id}`;
const FIRST_SHARE_KEY = id => `aroadmap_proj_shared_${id}`;

/* ─── Project open count (increment + return) ─── */
export function getAndIncrementProjectOpenCount(projId) {
  try {
    const key = PROJ_OPEN_KEY(projId);
    const count = parseInt(localStorage.getItem(key) || '0', 10) + 1;
    localStorage.setItem(key, count.toString());
    return count;
  } catch(e) { return 1; }
}

/* ─── First share check ─── */
export function checkAndMarkFirstShare(projId) {
  try {
    const key = FIRST_SHARE_KEY(projId);
    const isFirst = !localStorage.getItem(key);
    if (isFirst) localStorage.setItem(key, '1');
    return isFirst;
  } catch(e) { return false; }
}

/* ─── Project duration in weeks ─── */
function _projectDurationWeeks(S) {
  try {
    const start = new Date(S.cfg.start);
    const end   = new Date(S.cfg.end);
    return Math.max(1, Math.round((end - start) / (7 * 86400000)));
  } catch(e) { return null; }
}

/* ─── Current week number (1-based from project start) ─── */
function _currentWeek(S) {
  try {
    const start = new Date(S.cfg.start);
    const diff  = Date.now() - start.getTime();
    return Math.ceil(diff / (7 * 86400000));
  } catch(e) { return null; }
}

/* ─── Phase status ─── */
function _phaseStatus(phase, S) {
  if (!phase) return 'no_phase';
  const cw = _currentWeek(S);
  if (cw == null) return 'no_phase';
  if (cw < phase.startWeek) return 'not_started';
  if (cw > phase.endWeek)   return 'completed';
  return 'in_progress';
}

/* ─── Task Object ─── */
export function buildTaskProps(task, S) {
  if (!task) return {};
  const phase = task.phaseId != null ? S.phases.find(p => p.id === task.phaseId) : null;
  return {
    taskName:           task.name || '',
    taskDuration:       task.dur  || null,
    taskIsScheduled:    task.startWeek != null,
    taskIsDone:         task.done  || false,
    taskHasPhase:       task.phaseId != null,
    taskHasTeam:        task.teamId  != null,
    taskTagCount:       (task.tags || []).length,
    taskHasDescription: !!(task.desc && task.desc.trim()),
    taskPhaseStatus:    _phaseStatus(phase, S),
    isFirstTask:        S.tasks.length === 1,
  };
}

/* ─── Phase Object ─── */
export function buildPhaseProps(phase, S) {
  if (!phase) return {};
  const phaseTasks = S.tasks.filter(t => t.phaseId === phase.id);
  return {
    phaseName:                 phase.name || '',
    phaseDuration:             (phase.endWeek - phase.startWeek + 1),
    phaseColor:                phase.color || '',
    phaseTaskCount:            phaseTasks.length,
    phaseHasScope:             !!(phase.scope && phase.scope.trim()),
    phaseOutputCount:          (phase.outputs || []).length,
    phaseCompletedOutputCount: (phase.outputs || []).filter(o => o.done).length,
    isFirstPhase:              S.phases.length === 1,
  };
}

/* ─── Team Object ─── */
export function buildTeamProps(team, S) {
  if (!team) return {};
  const teamTasks = S.tasks.filter(t => t.teamId === team.id);
  return {
    teamName:               team.name || '',
    teamTaskCount:          teamTasks.length,
    teamScheduledTaskCount: teamTasks.filter(t => t.startWeek != null).length,
    isFirstTeam:            S.teams.length === 1,
  };
}

/* ─── Project Context Object ─── */
export function buildProjectContext(S, projId, extras = {}) {
  const scheduled = S.tasks.filter(t => t.startWeek != null);
  const backlog    = S.tasks.filter(t => t.startWeek == null);
  const done       = S.tasks.filter(t => t.done);
  const openCount  = getAndIncrementProjectOpenCount(projId);

  return {
    projectId:                 projId,
    projectName:               S.cfg.title || '',
    projectOpenCount:          openCount,
    projectPhaseCount:         S.phases.length,
    projectTeamCount:          S.teams.length,
    projectTaskCount:          S.tasks.length,
    projectScheduledTaskCount: scheduled.length,
    projectBacklogCount:       backlog.length,
    projectDurationWeeks:      _projectDurationWeeks(S),
    isReadOnly:                S.ui.readonly || false,
    projectCompletionRate:     S.tasks.length > 0 ? +(done.length / S.tasks.length).toFixed(2) : null,
    projectHasPhase:           S.phases.length > 0,
    projectHasTeam:            S.teams.length  > 0,
    ...extras,
  };
}
