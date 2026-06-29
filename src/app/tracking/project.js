/* ── TRACKING — Flow: Project Detail (Header + Settings) ── */
import { track, setProjectContext } from '../analytics.js';
import { buildProjectContext, checkAndMarkFirstShare } from './utils.js';

export function trackViewRoadmap(S, projId) {
  const ctx = buildProjectContext(S, projId);
  setProjectContext(ctx);
  track('view_roadmap', ctx);
}

export function trackClickBackRoadmap() {
  setProjectContext(null);
  track('click_back_roadmap');
}

export function trackClickSettingsRoadmap(source) {
  track('click_settings_roadmap', { sourceSettingsRoadmap: source });
}

export function trackClickAddButton(addTarget) {
  track('click_add_button', { addTarget });
}

export function trackClickExportPdf() {
  track('click_export_pdf');
}

export function trackExportPdfCompleted(exportDurationMs) {
  track('export_pdf_completed', { exportDurationMs });
}

export function trackExportPdfFailed(errorType, errorMessage) {
  track('export_pdf_failed', { errorType, errorMessage });
}

export function trackShareRoadmap(projId) {
  const isFirstShare = checkAndMarkFirstShare(projId);
  track('share_roadmap', { shareType: 'link', isFirstShare });
}

export function trackViewSettingsPopup() {
  track('view_settings_popup');
}

export function trackSaveSettings({ changedName, changedStartDate, changedEndDate, changedDescription }) {
  track('save_settings', { changedName, changedStartDate, changedEndDate, changedDescription });
}

export function trackCancelSettings(cancelMethod, hasUnsavedChanges) {
  track('cancel_settings', { cancelMethod, hasUnsavedChanges });
}
