/* ── TRACKING — Flow: Auth ── */
import { track } from '../analytics.js';

export function trackSignIn() {
  track('sign_in');
}

export function trackSignInSuccessful() {
  track('sign_in_successful');
}

export function trackSignInFailed() {
  track('sign_in_failed');
}
