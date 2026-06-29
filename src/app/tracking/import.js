/* ── TRACKING — Flow: Import CSV ── */
import { track } from '../analytics.js';

export function trackViewImportProjectPopup(source) {
  track('view_import_project_popup', { source });
}

export function trackInputNameProjectImport() {
  track('input_name_project');
}

export function trackSelectImportTarget(importTarget) {
  track('select_import_target', { importTarget });
}

export function trackSelectImportMode(importMode, importTarget) {
  track('select_import_mode', { importMode, importTarget });
}

export function trackUploadCsvFile(importRowCount, importTarget) {
  track('upload_csv_file', { importRowCount, importTarget });
}

export function trackDownloadCsvTemplate() {
  track('download_csv_template');
}

export function trackOpenSheetsTemplate() {
  track('open_sheets_template');
}

export function trackPreviewCsvImport({ importRowCount, importTarget, importMode }) {
  track('preview_csv_import', { importRowCount, importTarget, importMode });
}

export function trackClickBackCsvImport(cancelStep) {
  track('click_back_csv_import', { cancelStep });
}

export function trackClickImport({ importTarget, importMode, importRowCount }) {
  track('click_import', { importTarget, importMode, importRowCount });
}

export function trackCsvImportCompleted({ importTarget, importMode, importRowCount, importDurationMs }) {
  track('csv_import_completed', { importTarget, importMode, importRowCount, importDurationMs });
}

export function trackCsvImportFailed({ importTarget, importMode, importRowCount, errorType }) {
  track('csv_import_failed', { importTarget, importMode, importRowCount, errorType });
}

export function trackCancelCsvImport(cancelMethod, cancelStep) {
  track('cancel_csv_import', { cancelMethod, cancelStep });
}
