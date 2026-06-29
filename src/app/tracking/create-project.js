/* ── TRACKING — Flow: Create New Project ── */
import { track } from '../analytics.js';

export function trackViewCreateProjectPopup(source) {
  track('view_create_project_popup', { source });
}

export function trackInputNameProject() {
  track('input_name_project');
}

export function trackInputDescriptionProject() {
  track('input_description_project');
}

export function trackSelectColorProject(accentColor) {
  track('select_color_project', { accentColor });
}

export function trackCancelCreateProjectButton(cancelMethod, hasProjectName) {
  track('cancel_create_project_button', { cancelMethod, hasProjectName });
}

export function trackClickCreateProjectButton({ accentColor, hasDescription, projectDurationWeeks, usedDatePreset }) {
  track('click_create_project_button', {
    accentColor,
    hasDescription,
    projectDurationWeeks,
    usedDatePreset,
  });
}
