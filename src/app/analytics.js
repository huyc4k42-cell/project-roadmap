/* ── ANALYTICS — Mixpanel + GA4 wrapper ── */
import { getCurrentThemePref } from './theme.js';

const MIXPANEL_TOKEN = 'a4de62e984cb1461cd78752f6805100f';
const GA4_ID         = 'G-MLS4VV8NLH';
const APP_VERSION    = '2.0.0';

const INTERNAL_EMAILS = ['huy.c4k42@gmail.com'];
const INTERNAL_DOMAINS = ['aroadmap.cloud'];

let _isInternal = false;
let _initialized = false;

/* ─────────────────────────────────────────────
   INTERNAL CHECK
───────────────────────────────────────────── */
function _checkInternal(email) {
  if (!email) return false;
  if (INTERNAL_EMAILS.includes(email.toLowerCase())) return true;
  const domain = email.split('@')[1] || '';
  return INTERNAL_DOMAINS.includes(domain.toLowerCase());
}

/* ─────────────────────────────────────────────
   ACQUISITION SOURCE — capture utm_source before auth redirect
───────────────────────────────────────────── */
function _captureAcquisitionSource() {
  try {
    const params = new URLSearchParams(window.location.search);
    const utm = params.get('utm_source');
    if (utm) sessionStorage.setItem('aroadmap_utm_source', utm);
  } catch(e) {}
}

export function getAcquisitionSource() {
  try {
    return sessionStorage.getItem('aroadmap_utm_source') || 'direct';
  } catch(e) { return 'direct'; }
}

/* ─────────────────────────────────────────────
   LAST VISIT — days since last session
───────────────────────────────────────────── */
const LAST_VISIT_KEY = 'aroadmap_last_visit';

function _getDaysSinceLastVisit() {
  try {
    const last = localStorage.getItem(LAST_VISIT_KEY);
    if (!last) return null;
    const diff = Date.now() - parseInt(last, 10);
    return Math.floor(diff / 86400000);
  } catch(e) { return null; }
}

function _setLastVisit() {
  try { localStorage.setItem(LAST_VISIT_KEY, Date.now().toString()); } catch(e) {}
}

/* ─────────────────────────────────────────────
   INIT
───────────────────────────────────────────── */
export function init() {
  if (_initialized) return;
  _initialized = true;

  _captureAcquisitionSource();

  // Mixpanel init
  if (window.mixpanel) {
    window.mixpanel.init(MIXPANEL_TOKEN, {
      persistence: 'localStorage',
      autocapture: false,
    });
  }

  // GA4 config (already loaded in app.html)
  _ga4('config', GA4_ID, { send_page_view: false });
}

/* ─────────────────────────────────────────────
   GA4 helper
───────────────────────────────────────────── */
function _ga4(command, ...args) {
  if (typeof window.gtag === 'function') {
    window.gtag(command, ...args);
  }
}

/* ─────────────────────────────────────────────
   IDENTIFY — call on sign-in
───────────────────────────────────────────── */
export function identify(firebaseUser, extraTraits = {}) {
  if (!firebaseUser) return;

  const uid   = firebaseUser.uid;
  const email = firebaseUser.email || '';

  _isInternal = _checkInternal(email);

  const createdAt   = firebaseUser.metadata?.creationTime
    ? new Date(firebaseUser.metadata.creationTime).getTime()
    : null;
  const lastSignIn  = firebaseUser.metadata?.lastSignInTime
    ? new Date(firebaseUser.metadata.lastSignInTime).getTime()
    : null;
  const isFirstSession = createdAt && lastSignIn
    ? Math.abs(createdAt - lastSignIn) < 5000
    : false;
  const accountAgeDays = createdAt
    ? Math.floor((Date.now() - createdAt) / 86400000)
    : null;
  const daysSinceLastVisit = _getDaysSinceLastVisit();

  _setLastVisit();

  // Mixpanel identify + people.set
  if (window.mixpanel) {
    window.mixpanel.identify(uid);

    // PII — people only, never in event props
    window.mixpanel.people.set({
      $email:    email,
      $name:     firebaseUser.displayName || '',
      is_internal: _isInternal,
      signup_at:   createdAt,
    });
    window.mixpanel.people.set_once({ signup_at: createdAt });

    // Super properties — auto-attached to every event
    window.mixpanel.register({
      app_version:        APP_VERSION,
      theme:              getCurrentThemePref(),
      isLoggedIn:         true,
      isFirstSession,
      accountAgeDays,
      daysSinceLastVisit,
      acquisitionSource:  getAcquisitionSource(),
      ...extraTraits,
    });
  }

  // GA4 set user id
  _ga4('config', GA4_ID, { user_id: uid });
  _ga4('set', 'user_properties', {
    is_internal:      _isInternal,
    account_age_days: accountAgeDays,
    theme:            getCurrentThemePref(),
    is_first_session: isFirstSession,
  });
}

/* ─────────────────────────────────────────────
   SET PEOPLE TRAITS (call separately when needed)
───────────────────────────────────────────── */
export function setPeopleTraits(traits = {}) {
  if (window.mixpanel) window.mixpanel.people.set(traits);
}

export function incrementPeopleTrait(trait, value = 1) {
  if (window.mixpanel) window.mixpanel.people.increment(trait, value);
}

/* ─────────────────────────────────────────────
   UPDATE PROJECT CONTEXT super property
   Call this when opening/closing a project
───────────────────────────────────────────── */
export function setProjectContext(ctx) {
  if (window.mixpanel) {
    if (ctx) {
      window.mixpanel.register({ projectContext: ctx });
    } else {
      window.mixpanel.unregister('projectContext');
    }
  }
}

/* ─────────────────────────────────────────────
   TRACK
───────────────────────────────────────────── */
export function track(eventName, props = {}) {
  if (_isInternal) return;

  const payload = { ...props };

  // Mixpanel
  if (window.mixpanel) {
    window.mixpanel.track(eventName, payload);
  }

  // GA4
  _ga4('event', eventName, payload);
}

/* ─────────────────────────────────────────────
   RESET — call on sign-out
───────────────────────────────────────────── */
export function reset() {
  _isInternal = false;
  if (window.mixpanel) {
    window.mixpanel.reset();
  }
  _ga4('config', GA4_ID, { user_id: undefined });
}
