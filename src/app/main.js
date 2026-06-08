/* ── MAIN — entry point: wires all inject hooks, boots Firebase, starts router ── */
import { initFirebase, fbSignIn, fbSignOut } from './firebase.js';
import { S, undo as _undo, redo as _redo }   from './state.js';
import { PROJ_PFX }                           from './constants.js';
import { wkp }                                from './weekpicker.js';
import { parseDate, wkpMonday }              from './date.js';
import { loadTheme }                          from './theme.js';

/* Persistence */
import {
  refreshIndex, migrateOldData, migrateLocalToFirestore,
  currentProjId, loadIndex, saveIndex, setCurrentProjId,
  createProject, deleteProject, duplicateProject, renameProject,
} from './persistence.js';

/* Render */
import { render, rerender, setBind } from './render/index.js';
import { renderHome, setLoadIndex as setHomeLoadIndex, setBindHome } from './render/home.js';
import {
  openModal as _openModalBase, closeModal as _closeModalBase,
  openCtx as _openCtxBase, closeCtx as _closeCtxBase,
  setBindModal, setBindImportModal, setShareURLFn, setLoadIndexFn,
} from './render/modals.js';

/* Share */
import { buildShareURL }         from './share.js';

/* Export */
import { exportPDF }             from './export/pdf.js';

/* Import */
import { setImportDeps, openImportModal as _openImportBase, bindImportModal } from './import/csv.js';

/* Events */
import { bind, setBindDeps, renderRAF, handleAction } from './events/bind.js';
import { bindModal, setBindModalDeps, addTag, delTag } from './events/bindModal.js';
import { bindHome, setBindHomeDeps, loadSampleData }  from './events/bindHome.js';
import { initResizeListeners, setResizeDeps }          from './events/resize.js';

/* Canvas */
import { initSignInCanvas, initHomeEmptyCanvas }       from './canvas.js';

/* Router */
import { router, setRouterDeps }                       from './router.js';

/* ══════════════════════════════════════════════
   WRAPPERS — bind render callbacks into action fns
══════════════════════════════════════════════ */

/** Open modal, always passing wkp deps so 'cfg' gets week-picker state */
function openModalFn(type, data = null) {
  _openModalBase(type, data, parseDate, wkpMonday, wkp);
}

/** closeModal, render after */
function closeModalFn() { _closeModalBase(render); }

/** openCtx, render after */
function openCtxFn(x, y, items) { _openCtxBase(x, y, items, render); }

/** closeCtx, render after */
function closeCtxFn() { _closeCtxBase(render); }

/** undo/redo with smart rerender */
const undoFn = () => _undo(rerender);
const redoFn = () => _redo(rerender);

/** openImportModal — always pass current project id */
function openImportFn(fromProjId) {
  // currentProjId is a live binding from persistence.js
  _openImportBase(fromProjId !== undefined ? fromProjId : currentProjId);
}

/** loadSampleData — fills current project, then render */
const loadSampleDataFn = () => loadSampleData(render);

/** projKey — mirrors persistence.js internal function */
const projKey = id => PROJ_PFX + id;

/* ══════════════════════════════════════════════
   INJECT ALL HOOKS
══════════════════════════════════════════════ */

/* render/index.js — inject bind */
setBind(bind);

/* render/modals.js — inject callbacks */
setBindModal(bindModal);
setBindImportModal(bindImportModal);
setShareURLFn(buildShareURL);
setLoadIndexFn(loadIndex);

/* render/home.js — inject loadIndex + bindHome */
setHomeLoadIndex(loadIndex);
setBindHome(bindHome);

/* events/bind.js — inject all action callbacks */
setBindDeps({
  render,
  renderRAF,
  openModal:      openModalFn,
  openCtx:        openCtxFn,
  closeCtx:       closeCtxFn,
  closeModal:     closeModalFn,
  undo:           undoFn,
  redo:           redoFn,
  exportPDF,
  openImportModal: openImportFn,
  addTag,
  delTag,
  loadSampleData: loadSampleDataFn,
});

/* events/bindModal.js — inject render + closeModal */
setBindModalDeps({ render, closeModal: closeModalFn });

/* events/bindHome.js — inject all home deps */
setBindHomeDeps({
  renderHome,
  fbSignIn,
  fbSignOut:        () => fbSignOut(() => {
    setCurrentProjId(null);
    location.hash = '#home';
  }),
  openImportModal:  openImportFn,
  createProject:    (name, sub, accent, nav) => createProject(name, sub, accent, nav),
  deleteProject:    (id, cb) => deleteProject(id, cb),
  duplicateProject: (id, cb) => duplicateProject(id, cb),
  renameProject:    (id, name, sub, accent, cb) => renameProject(id, name, sub, accent, cb),
  loadIndex,
  initSignInCanvas,
  initHomeEmptyCanvas,
});

/* events/resize.js — inject render + renderRAF, then start global listeners */
setResizeDeps({ render, renderRAF });
initResizeListeners();

/* import/csv.js — inject persistence helpers */
setImportDeps({
  loadIndex,
  saveIndex,
  projKey,
  rerenderFn: rerender,
});

/* router.js — inject render + renderHome */
setRouterDeps({ render, renderHome });

/* ══════════════════════════════════════════════
   FAVICON
══════════════════════════════════════════════ */
(function() {
  const path = 'M53.9742 456L52 423.025L86.2193 412.473L219.806 87.9967L274.426 57L426.439 412.473L460 423.025L458.026 456H282.981L280.348 423.025L322.465 412.473L286.929 327.397L279.69 304.974L213.884 148.671L232.968 153.947L178.348 302.995L171.768 322.78L140.839 412.473L182.955 423.025L180.981 456H53.9742ZM156.632 343.884V299.038C164.968 299.478 174.619 300.137 185.587 301.017C196.994 301.456 211.91 301.676 230.335 301.676C247.884 301.676 262.361 301.456 273.768 301.017C285.613 300.137 295.703 299.478 304.039 299.038V343.225C295.703 343.225 285.613 343.005 273.768 342.565C261.923 342.126 247.445 341.906 230.335 341.906C212.348 341.906 197.652 342.126 186.245 342.565C174.839 343.005 164.968 343.445 156.632 343.884Z';
  const svg  = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#D0A052" d="${path}"/></svg>`;
  const link = document.createElement('link');
  link.rel  = 'icon'; link.type = 'image/svg+xml';
  link.href = 'data:image/svg+xml,' + encodeURIComponent(svg);
  document.head.appendChild(link);
})();

/* ══════════════════════════════════════════════
   BOOT SEQUENCE
══════════════════════════════════════════════ */
migrateOldData();

/* Apply saved theme before first render (prevents flash) */
loadTheme();

(async () => {
  await initFirebase(async (user /*, offline = false */) => {
    if (user) {
      await refreshIndex();
      await migrateLocalToFirestore();
    }
    router();
  });
})();
