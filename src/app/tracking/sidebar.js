/* ── TRACKING — Flow: Project Detail / Sidebar ── */
import { track } from '../analytics.js';

export function trackCollapseSidebar() {
  track('collapse_sidebar');
}

export function trackExpandSidebar() {
  track('expand_sidebar');
}

export function trackSearchTask(searchQuery, searchResultCount, hasResult) {
  track('search_task', { searchQuery, searchResultCount, hasResult });
}

export function trackFilterByTag(filterValue) {
  track('filter_by_tag', { filterType: 'tag', filterValue });
}

export function trackFilterByPhase(filterValue) {
  track('filter_by_phase', { filterType: 'phase', filterValue });
}

export function trackFilterByTeam(filterValue) {
  track('filter_by_team', { filterType: 'team', filterValue });
}

export function trackAddTag(tagName) {
  track('add_tag', { tagName });
}

export function trackTagDelete(tagName, tagTaskCount) {
  track('tag_delete', { tagName, tagTaskCount });
}

export function trackDragTagToTask(tagName, taskName) {
  track('drag_tag_to_task', { tagName, taskName });
}
