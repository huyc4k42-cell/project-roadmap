/* ── ROUTER — hash-based routing for home / project / share views ── */
import { S }                                               from './state.js';
import { SHARE_PREFIX }                                    from './constants.js';
import { currentUser }                                     from './firebase.js';
import { loadProject, unsubscribeProject, setCurrentProjId } from './persistence.js';
import { loadFromHash }                                    from './share.js';
import { setHomeCtxId, setHomeUserMenuOpen }               from './render/home.js';

/* Injected render callbacks */
let _render     = null;
let _renderHome = null;
export function setRouterDeps({ render, renderHome }) {
  _render     = render;
  _renderHome = renderHome;
}

/* ── router() ── */
export async function router() {
  const hash = location.hash;

  /* Reset home UI state on every navigation */
  setHomeCtxId(null);
  setHomeUserMenuOpen(false);

  /* Share / read-only view */
  if (hash.startsWith(SHARE_PREFIX)) {
    unsubscribeProject();
    setCurrentProjId(null);
    S.ui.readonly = false; // will be set true by loadFromHash if valid
    if (loadFromHash()) { _render?.(); }
    return;
  }

  /* Project view */
  if (hash.startsWith('#project-')) {
    if (!currentUser) { location.hash = '#home'; return; }
    const id = hash.slice('#project-'.length);
    unsubscribeProject();
    S.ui.readonly = false;
    await loadProject(id, _render);
    _render?.();
    return;
  }

  /* Home (default) */
  unsubscribeProject();
  setCurrentProjId(null);
  S.ui.readonly = false;
  S.ui.modal = null;
  _renderHome?.();
}

/* Register hashchange listener */
window.addEventListener('hashchange', router);
