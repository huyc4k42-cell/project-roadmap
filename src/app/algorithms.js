/* ── ALGORITHMS — lane layout, phase ordering, team reorder ── */
import { S, phaseById, pushHistory } from './state.js';
import { LANE_PAD, LANE_GAP }        from './constants.js';
import { taskBarH }                   from './date.js';

/* ── Multi-lane greedy packing ──
   Tasks from different phases share lane indices — they occupy
   non-overlapping x-columns so never visually conflict.            */
export function assignLanes(tasks) {
  const result = {};
  const byPhase = {}, noPhase = [];

  for (const t of tasks) {
    if (t.phaseId !== null && t.phaseId !== undefined) {
      (byPhase[t.phaseId] ??= []).push(t);
    } else {
      noPhase.push(t);
    }
  }

  const phaseGroupMaxLanes = [];
  for (const phaseTasks of Object.values(byPhase)) {
    const sorted   = [...phaseTasks].sort((a, b) => (a.startWeek ?? 0) - (b.startWeek ?? 0));
    const laneEnds = [];
    for (const t of sorted) {
      const sw = t.startWeek ?? 0;
      let placed = false;
      for (let i = 0; i < laneEnds.length; i++) {
        if (sw > laneEnds[i]) {
          laneEnds[i] = sw + t.dur - 1;
          result[t.id] = i;
          placed = true;
          break;
        }
      }
      if (!placed) {
        result[t.id] = laneEnds.length;
        laneEnds.push(sw + t.dur - 1);
      }
    }
    phaseGroupMaxLanes.push(laneEnds.length);
  }

  const noLaneEnds = [];
  for (const t of [...noPhase].sort((a, b) => (a.startWeek ?? 0) - (b.startWeek ?? 0))) {
    const sw = t.startWeek ?? 0;
    let placed = false;
    for (let i = 0; i < noLaneEnds.length; i++) {
      if (sw > noLaneEnds[i]) {
        noLaneEnds[i] = sw + t.dur - 1;
        result[t.id] = i;
        placed = true;
        break;
      }
    }
    if (!placed) {
      result[t.id] = noLaneEnds.length;
      noLaneEnds.push(sw + t.dur - 1);
    }
  }

  const numLanes = Math.max(...phaseGroupMaxLanes, noLaneEnds.length, 1);
  const laneH    = Array.from({ length: numLanes }, () => 34);
  for (const t of tasks) {
    const lane = result[t.id] ?? 0;
    if (lane < numLanes) laneH[lane] = Math.max(laneH[lane], taskBarH(t));
  }

  return { assignments: result, numLanes, laneH };
}

export function rowMetrics(tasks) {
  const { numLanes, laneH } = assignLanes(tasks);
  const totalLaneH = laneH.reduce((s, h) => s + h, 0);
  const rowH       = LANE_PAD * 2 + totalLaneH + Math.max(0, numLanes - 1) * LANE_GAP;
  const laneTop    = [];
  let acc = LANE_PAD;
  for (const h of laneH) { laneTop.push(acc); acc += h + LANE_GAP; }
  return { rowH, laneTop };
}

/* ── Phase ordering helpers ── */
export function pushPhasesAfter(phaseId, minStart) {
  const sorted = [...S.phases].sort((a, b) => a.startWeek - b.startWeek);
  const idx    = sorted.findIndex(p => p.id === phaseId);
  let cursor   = minStart;
  for (let i = idx + 1; i < sorted.length; i++) {
    const ph = S.phases.find(p => p.id === sorted[i].id);
    if (ph && ph.startWeek < cursor) {
      const span   = ph.endWeek - ph.startWeek;
      ph.startWeek = cursor;
      ph.endWeek   = cursor + span;
      cursor       = ph.endWeek + 1;
    }
  }
}

export function swapPhases(idA, idB) {
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

/* ── RAF-throttled render wrapper ── */
let _rafId = null;
export function renderRAF(renderFn) {
  if (_rafId) cancelAnimationFrame(_rafId);
  _rafId = requestAnimationFrame(() => { _rafId = null; renderFn(true); });
}
