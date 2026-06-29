/* ── TRACKING — Flow: Share ── */
import { track } from '../analytics.js';
import { buildProjectContext } from './utils.js';

export function trackViewSharePopup(S, projId) {
  track('view_share_popup', buildProjectContext(S, projId));
}

export function trackClickCopyLink(S, projId) {
  track('click_copy_link', buildProjectContext(S, projId));
}

export function trackCancelSharePopup(cancelMethod) {
  track('cancel_share_popup', { cancelMethod });
}

export function trackShareLinkViewed(S, projId) {
  track('share_link_viewed', buildProjectContext(S, projId));
}
