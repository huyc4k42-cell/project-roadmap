/* ── TRACKING — Flow: Project Detail / Team ── */
import { track } from '../analytics.js';
import { buildTeamProps } from './utils.js';

export function trackAddTeam(source) {
  track('add_team', { source });
}

export function trackCancelAddTeam(cancelMethod) {
  track('cancel_add_team', { cancelMethod });
}

export function trackAddTeamCompleted(team, S) {
  track('add_team_completed', buildTeamProps(team, S));
}

export function trackReorderTeam(team, S) {
  track('reorder_team', buildTeamProps(team, S));
}

export function trackViewTeamPopup(team, S) {
  track('view_team_popup', buildTeamProps(team, S));
}

export function trackTeamEdited(team, S) {
  track('team_edited', buildTeamProps(team, S));
}

export function trackTeamDeleted() {
  track('team_deleted');
}
