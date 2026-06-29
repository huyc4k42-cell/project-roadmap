/* ── EVENTS / RESIZE — global mousemove/mouseup for task & phase resize ── */
import { S, taskById, phaseById } from '../state.js';
import { pushPhasesAfter } from '../state.js';
import { trackResizeTaskDuration } from '../tracking/task.js';
import { trackResizePhaseDuration } from '../tracking/phase.js';

/* WW (week-width px) is injected by render/index.js after each render */
let _WW = 64;
export function setResizeWW(val) { _WW = val; }

/* render is injected to avoid circular import */
let _render    = null;
let _renderRAF = null;
export function setResizeDeps({ render, renderRAF }) {
  _render    = render;
  _renderRAF = renderRAF;
}

export function initResizeListeners() {
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup',   onMouseUp);
}

function onMouseMove(e) {
  /* Task resize (left or right handle) */
  if (S.ui.resizeData) {
    const { taskId, side, startX, origDur, origStartWeek } = S.ui.resizeData;
    const delta = Math.round((e.clientX - startX) / _WW);
    const t = taskById(taskId);
    if (t) {
      if (side === 'right') {
        t.dur = Math.max(1, origDur + delta);
      } else {
        const endWeek  = origStartWeek + origDur - 1;
        const newStart = Math.max(1, origStartWeek + delta);
        t.startWeek    = newStart;
        t.dur          = Math.max(1, endWeek - newStart + 1);
      }
    }
    _renderRAF?.();
    return;
  }

  /* Phase resize (left or right handle) */
  if (S.ui.phaseResize) {
    const { phaseId, side, startX, origStart, origEnd, origAll } = S.ui.phaseResize;
    const delta = Math.round((e.clientX - startX) / _WW);
    const ph = phaseById(phaseId);
    if (!ph) return;

    if (side === 'right') {
      const newEnd = Math.max(origStart, origEnd + delta);
      ph.endWeek = newEnd;
      /* Restore all other phases to originals, then push cascade */
      origAll.forEach(o => {
        if (o.id !== phaseId) {
          const p = phaseById(o.id);
          if (p) { p.startWeek = o.startWeek; p.endWeek = o.endWeek; }
        }
      });
      pushPhasesAfter(phaseId, newEnd + 1);
    } else {
      ph.startWeek = Math.max(1, Math.min(origEnd, origStart + delta));
    }
    _renderRAF?.();
  }
}

function onMouseUp() {
  if (S.ui.resizeData) {
    const { taskId, origDur } = S.ui.resizeData;
    const tk = taskById(taskId);
    if (tk) {
      const delta = tk.dur - origDur;
      trackResizeTaskDuration(tk, S, delta);
    }
    S.ui.resizeData = null;
    _render?.();
  }
  if (S.ui.phaseResize) {
    const { phaseId, origStart, origEnd } = S.ui.phaseResize;
    const ph = phaseById(phaseId);
    if (ph) {
      const durationFrom = origEnd - origStart;
      const durationTo   = ph.endWeek - ph.startWeek;
      trackResizePhaseDuration(durationFrom, durationTo, ph, S);
    }
    S.ui.phaseResize = null;
    _render?.();
  }
}
