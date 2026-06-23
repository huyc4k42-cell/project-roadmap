/* ── STATE — singleton S, undo/redo history ── */
import { HISTORY_MAX } from './constants.js';

export let S = {
  cfg: {
    title:          'Project Roadmap',
    subtitle:       '',
    start:          '2025-06-02',
    end:            '2025-11-30',
    scopeRowHeight: 100,
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
    phaseDragId:    null,
    teamDragId:     null,
    readonly:       false,
    _focusOutputId: null,
    _prefillTask:   null,
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

/* ── Phase helpers ── */
export function pushPhasesAfter(phaseId, minStart) {
  const sorted = [...S.phases].sort((a, b) => a.startWeek - b.startWeek);
  const idx = sorted.findIndex(p => p.id === phaseId);
  let cursor = minStart;
  for (let i = idx + 1; i < sorted.length; i++) {
    const ph = S.phases.find(p => p.id === sorted[i].id);
    if (ph && ph.startWeek < cursor) {
      const span = ph.endWeek - ph.startWeek;
      ph.startWeek = cursor;
      ph.endWeek   = cursor + span;
      cursor       = ph.endWeek + 1;
    }
  }
}

export function swapPhases(idA, idB) {
  pushHistory();
  const a = phaseById(idA), b = phaseById(idB);
  if (!a || !b) return;
  [a.startWeek, b.startWeek] = [b.startWeek, a.startWeek];
  [a.endWeek,   b.endWeek  ] = [b.endWeek,   a.endWeek  ];
}

export function reorderTeam(dragId, targetId) {
  pushHistory();
  const fromIdx = S.teams.findIndex(t => t.id === dragId);
  const toIdx   = S.teams.findIndex(t => t.id === targetId);
  if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;
  const [team] = S.teams.splice(fromIdx, 1);
  S.teams.splice(toIdx, 0, team);
}
