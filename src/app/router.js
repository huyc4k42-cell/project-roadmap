/* ── ROUTER — hash-based routing for home / project / share views ── */
import { S, resetHistory }                                 from './state.js';
import { SHARE_PREFIX }                                    from './constants.js';
import { currentUser }                                     from './firebase.js';
import { loadProject, unsubscribeProject, setCurrentProjId, loadIndex } from './persistence.js';
import { loadFromHash }                                    from './share.js';
import { setHomeCtxId, setHomeUserMenuOpen }               from './render/home.js';
import { trackViewHome, trackViewEmptyState }              from './tracking/home.js';
import { trackViewRoadmap }                                from './tracking/project.js';
import { trackShareLinkViewed }                            from './tracking/share.js';

/* Injected render callbacks */
let _render     = null;
let _renderHome = null;
export function setRouterDeps({ render, renderHome }) {
  _render     = render;
  _renderHome = renderHome;
}

/* ── resetUiTransient — clear ephemeral UI state on navigation ── */
function resetUiTransient() {
  S.ui.dragData    = null;
  S.ui.resizeData  = null;
  S.ui.phaseResize = null;
  S.ui.phaseDragId = null;
  S.ui.teamDragId  = null;
  S.ui.ctx         = null;
  S.ui.modal       = null;
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
    resetHistory();
    resetUiTransient();
    S.ui.readonly = false; // will be set true by loadFromHash if valid
    if (loadFromHash()) { trackShareLinkViewed(S, null); _render?.(); }
    return;
  }

  /* Project view */
  if (hash.startsWith('#project-')) {
    if (!currentUser) { location.hash = '#home'; return; }
    const id = hash.slice('#project-'.length);
    unsubscribeProject();
    resetUiTransient();
    S.ui.readonly = false;
    await loadProject(id, _render);
    _render?.();
    trackViewRoadmap(S, id);
    return;
  }

  /* Home (default) */
  unsubscribeProject();
  setCurrentProjId(null);
  resetHistory();
  resetUiTransient();
  S.ui.readonly = false;
  _renderHome?.();
  if (currentUser) {
    trackViewHome();
    if (loadIndex().length === 0) trackViewEmptyState();
  }
}

/* Register hashchange listener */
window.addEventListener('hashchange', router);
