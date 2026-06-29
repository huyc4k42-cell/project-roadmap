/* ── TRACKING — Flow: Home ── */
import { track } from '../analytics.js';

export function trackViewHome() {
  track('view_home', { screenName: 'Home' });
}

export function trackOpenProject(projId, projName) {
  track('open_project', {
    projectId:   projId,
    projectName: projName,
  });
}

export function trackDuplicateProject(projId, projName) {
  track('duplicate_project', {
    projectId:   projId,
    projectName: projName,
  });
}

export function trackDeleteProject(projId, projName) {
  track('delete_project', {
    projectId:   projId,
    projectName: projName,
  });
}

export function trackOpenSampleProject() {
  track('open_sample_project');
}

export function trackChangeMode(themeFrom, themeTo, screenName) {
  track('change_mode', { themeFrom, themeTo, screenName });
}

export function trackSignOut() {
  track('sign_out');
}

export function trackImportProject() {
  track('import_project');
}

export function trackViewEmptyState() {
  track('view_empty_state', { screenName: 'Home' });
}
