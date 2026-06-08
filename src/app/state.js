/* ── STATE — singleton S, undo/redo history ── */
import { HISTORY_MAX } from './constants.js';

export let S = {
  cfg: {
    title:    'Project Roadmap',
    subtitle: '',
    start:    '2025-06-02',
    end:      '2025-11-30',
  },
  phases: [],
  teams:  [],
  tasks:  [],
  tags:   ['tracking','UX','tech','growth','research'],
  ui: {
    filter:      { phase: '', team: '', tag: '', status: 'backlog', search: '' },
    modal:       null,
    ctx:         null,
    dragData:    null,
    resizeData:  null,
    phaseResize: null,
    phaseDragId: null,
    teamDragId:  null,
    readonly:    false,
  },
  _nextId: 1,
};

export function nextId() { return S._nextId++; }

export function teamById(id)  { return S.teams.find(t => t.id === id); }
export function taskById(id)  { return S.tasks.find(t => t.id === id); }
export function phaseById(id) { return S.phases.find(p => p.id === id); }
export function phaseAt(w)    { return S.phases.find(p => w >= p.startWeek && w <= p.endWeek) || null; }

/* ── HISTORY (undo / redo) ── */
let _history = [], _histIdx = -1;

function snapshotState() {
  return JSON.stringify({ phases: S.phases, teams: S.teams, tasks: S.tasks, tags: S.tags, _nextId: S._nextId });
}

function applySnapshot(snap) {
  const d = JSON.parse(snap);
  S.phases = d.phases; S.teams = d.teams; S.tasks = d.tasks;
  S.tags = d.tags; S._nextId = d._nextId;
}

export function pushHistory() {
  _history = _history.slice(0, _histIdx + 1);
  _history.push(snapshotState());
  if (_history.length > HISTORY_MAX) _history.shift();
  _histIdx = _history.length - 1;
}

export function undo(rerenderFn) {
  if (_histIdx <= 0) return;
  _histIdx--;
  applySnapshot(_history[_histIdx]);
  rerenderFn?.();
}

export function redo(rerenderFn) {
  if (_histIdx >= _history.length - 1) return;
  _histIdx++;
  applySnapshot(_history[_histIdx]);
  rerenderFn?.();
}

export function resetHistory() {
  _history = [];
  _histIdx = -1;
}
