/* ── FIREBASE — app init, auth, exported singletons ── */
import { initializeApp }                                       from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup,
         signInWithRedirect, getRedirectResult, signOut,
         onAuthStateChanged, browserLocalPersistence,
         setPersistence }                                      from 'firebase/auth';
import { getFirestore }                                        from 'firebase/firestore';
import { showToast } from './utils.js';
import { t }         from './i18n.js';

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

let _gProvider = null;

export async function fbSignIn() {
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
      catch(e2) { showToast(t('toast.signInFailed', { msg: e2.message }), 4000); }
    } else if (e.code !== 'auth/popup-closed-by-user') {
      showToast(t('toast.signInFailed', { msg: e.message }), 4000);
    }
  }
}

export async function fbSignOut(onSignedOut) {
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

    try { await getRedirectResult(auth); }
    catch(e) {
      if (e?.code && e.code !== 'auth/cancelled-popup-request')
        showToast(t('toast.signInFailed', { msg: e.message }), 4000);
    }

    onAuthStateChanged(auth, async user => {
      currentUser = user;
      await onAuthChange(user);
    });
  } catch(e) {
    console.error('Firebase init failed — running offline:', e);
    await onAuthChange(null, true /* offline */);
  }
}
