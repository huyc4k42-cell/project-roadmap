/* ── TRACKING — Flow: Project Detail / Phase ── */
import { track } from '../analytics.js';
import { buildPhaseProps } from './utils.js';

export function trackAddPhase(source) {
  track('add_phase', { source });
}

export function trackCancelAddPhase(cancelMethod) {
  track('cancel_add_phase', { cancelMethod });
}

export function trackAddPhaseCompleted(phase, S) {
  track('add_phase_completed', buildPhaseProps(phase, S));
}

export function trackReorderPhase(positionFrom, positionTo, phase, S) {
  track('reorder_phase', { positionFrom, positionTo, ...buildPhaseProps(phase, S) });
}

export function trackResizePhaseDuration(durationFrom, durationTo, phase, S) {
  track('resize_phase_duration', { durationFrom, durationTo, ...buildPhaseProps(phase, S) });
}

export function trackOpenPhaseDetail(source, phase, S) {
  track('open_phase_detail', { source, ...buildPhaseProps(phase, S) });
}

export function trackEditPhaseScope(phase, S) {
  track('edit_phase_scope', buildPhaseProps(phase, S));
}

export function trackResizePhaseScope(phase, S) {
  track('resize_phase_scope', buildPhaseProps(phase, S));
}

export function trackCollapseScopeRow(phase, S) {
  track('collapse_scope_row', buildPhaseProps(phase, S));
}

export function trackExpandScopeRow(phase, S) {
  track('expand_scope_row', buildPhaseProps(phase, S));
}

export function trackAddPhaseOutput(addMethod, phase, S) {
  track('add_phase_output', { addMethod, ...buildPhaseProps(phase, S) });
}

export function trackTogglePhaseOutputItem(phase, S) {
  track('toggle_phase_output_item', buildPhaseProps(phase, S));
}

export function trackDeletePhaseOutput(phase, S) {
  track('delete_phase_output', buildPhaseProps(phase, S));
}

export function trackCollapseOutputRow(phase, S) {
  track('collapse_output_row', buildPhaseProps(phase, S));
}

export function trackExpandOutputRow(phase, S) {
  track('expand_output_row', buildPhaseProps(phase, S));
}

export function trackPhaseEdited(phase, S, { changedName, changedDuration }) {
  track('phase_edited', { ...buildPhaseProps(phase, S), changedName, changedDuration });
}

export function trackPhaseDeleted() {
  track('phase_deleted');
}
