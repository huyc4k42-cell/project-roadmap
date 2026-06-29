/* ── FIREBASE — app init, auth, exported singletons ── */
import { initializeApp }                                       from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup,
         signInWithRedirect, getRedirectResult, signOut,
         onAuthStateChanged, browserLocalPersistence,
         setPersistence }                                      from 'firebase/auth';
import { getFirestore }                                        from 'firebase/firestore';
import { showToast }            from './utils.js';
import { t }                   from './i18n.js';
import { identify, reset }     from './analytics.js';
import { trackSignInSuccessful, trackSignInFailed } from './tracking/auth.js';

const FIREBASE_CONFIG = {
  apiKey:            'AIzaSyBvJRmMGM94Gl4qxHcxAuHGIQdMjvdRm-4',
  authDomain:        'a-roadmap.firebaseapp.com',
  projectId:         'a-roadmap',
  storageBucket:     'a-roadmap.firebasestorage.app',
  messagingSenderId: '587173505646',
  appId:             '1:587173505646:web:f7eae8acdc15e96397147f',
};

export let db          = null;
export let auth        = null;
export let currentUser = null;

let _gProvider    = null;
let _justSignedIn = false; // true khi user vừa click sign-in button (popup hoặc redirect)

export async function fbSignIn() {
  _justSignedIn = true;
  await setPersistence(auth, browserLocalPersistence);
  try {
    await signInWithPopup(auth, _gProvider);
  } catch(e) {
    const fallback = [
      'auth/popup-blocked',
      'auth/operation-not-supported-in-this-environment',
      'auth/cancelled-popup-request',
    ];
    if (fallback.includes(e.code) || e.message?.includes('missing initial state') || e.message?.includes('storage-partitioned')) {
      try { await signInWithRedirect(auth, _gProvider); }
      catch(e2) {
        _justSignedIn = false;
        showToast(t('toast.signInFailed', { msg: e2.message }), 4000);
        trackSignInFailed();
      }
    } else if (e.code !== 'auth/popup-closed-by-user') {
      _justSignedIn = false;
      showToast(t('toast.signInFailed', { msg: e.message }), 4000);
      trackSignInFailed();
    } else {
      // user tự đóng popup — không fire sign_in_failed
      _justSignedIn = false;
    }
  }
}

export async function fbSignOut(onSignedOut) {
  try { localStorage.removeItem('aroadmap_authed'); } catch(e) {}
  reset();
  await signOut(auth);
  currentUser = null;
  onSignedOut?.();
}

export async function initFirebase(onAuthChange) {
  try {
    const app = initializeApp(FIREBASE_CONFIG);
    db         = getFirestore(app);
    auth       = getAuth(app);
    _gProvider = new GoogleAuthProvider();
    _gProvider.setCustomParameters({ prompt: 'select_account' });

    try { await setPersistence(auth, browserLocalPersistence); } catch(e) { /* ignore, fallback to default */ }

    try {
      const redirectResult = await getRedirectResult(auth);
      if (redirectResult?.user) _justSignedIn = true;
    }
    catch(e) {
      if (e?.code && e.code !== 'auth/cancelled-popup-request') {
        showToast(t('toast.signInFailed', { msg: e.message }), 4000);
        trackSignInFailed();
      }
    }

    // Đợi Firebase đọc xong IndexedDB session trước khi register listener
    // Tránh onAuthStateChanged fire null rồi user → router() redirect sai
    await auth.authStateReady();

    onAuthStateChanged(auth, async user => {
      currentUser = user;
      try {
        if (user) localStorage.setItem('aroadmap_authed', '1');
        else      localStorage.removeItem('aroadmap_authed');
      } catch(e) {}
      if (user) {
        identify(user);
        if (_justSignedIn) {
          _justSignedIn = false;
          trackSignInSuccessful();
        }
      }
      await onAuthChange(user);
    });
  } catch(e) {
    console.error('Firebase init failed — running offline:', e);
    await onAuthChange(null, true /* offline */);
  }
}
