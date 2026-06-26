/* ── EVENTS / BIND HOME — home-screen event handlers ── */
import { S, nextId, pushHistory } from '../state.js';
import { q, qAll }           from '../utils.js';
import { setTheme, getCurrentThemePref } from '../theme.js';
import { SHARE_PREFIX }      from '../constants.js';
import {
  homeCtxId, homeUserMenuOpen,
  setHomeCtxId, setHomeUserMenuOpen,
} from '../render/home.js';
import { bindImportModal }   from '../import/csv.js';
import { wkp, bindWkPickerEvents, setRenderModal, applyNpPreset, bindNpCalendarEvents } from '../weekpicker.js';
import { wkpMonday, dateStrYMD }                   from '../date.js';
import { t }                                        from '../i18n.js';

/* Injected callbacks */
let _renderHome     = null;
let _fbSignIn       = null;
let _fbSignOut      = null;
let _openImport     = null;
let _createProject  = null;
let _deleteProject  = null;
let _duplicateProject = null;
let _renameProject  = null;
let _loadIndex      = null;
let _initSignInCanvas    = null;
let _initHomeEmptyCanvas = null;

export function setBindHomeDeps({
  renderHome, fbSignIn, fbSignOut, openImportModal,
  createProject, deleteProject, duplicateProject, renameProject,
  loadIndex, initSignInCanvas, initHomeEmptyCanvas,
}) {
  _renderHome          = renderHome;
  _fbSignIn            = fbSignIn;
  _fbSignOut           = fbSignOut;
  _openImport          = openImportModal;
  _createProject       = createProject;
  _deleteProject       = deleteProject;
  _duplicateProject    = duplicateProject;
  _renameProject       = renameProject;
  _loadIndex           = loadIndex;
  _initSignInCanvas    = initSignInCanvas;
  _initHomeEmptyCanvas = initHomeEmptyCanvas;
}

/* ── shakeErr (local copy for home modals — no access to project modal state) ── */
function shakeErr(el) {
  if (!el) return;
  el.classList.remove('err');
  void el.offsetWidth;
  el.classList.add('err');
  el.focus();
}

/* ── loadSampleProject — navigates to #v1=<compressed> read-only view ── */
export function loadSampleProject() {
  const lz = window.LZString;
  if (!lz) return;
  const now    = new Date();
  const sy = now.getFullYear(), sm = now.getMonth();
  const startD = new Date(sy, sm, 1);
  const endD   = new Date(sy, sm + 6, 0);
  const pad = n => String(n).padStart(2, '0');
  const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const data = {
    cfg: {
      title:          'Product Launch Q3',
      subtitle:       'Sample · explore Aroadmap',
      start:          fmt(startD),
      end:            fmt(endD),
      scopeRowHeight: 100,
    },
    phases: [
      { id: 1, name: 'Discovery',   startWeek: 1,  endWeek: 4,  color: '#7c3aed' },
      { id: 2, name: 'Design',      startWeek: 5,  endWeek: 9,  color: '#1d4ed8' },
      { id: 3, name: 'Engineering', startWeek: 9,  endWeek: 16, color: '#047857' },
      { id: 4, name: 'Launch',      startWeek: 17, endWeek: 20, color: '#D0A052' },
    ],
    teams: [
      { id: 1, name: 'Product',     icon: '📋', color: '#7c3aed' },
      { id: 2, name: 'Design',      icon: '🎨', color: '#1d4ed8' },
      { id: 3, name: 'Engineering', icon: '⚙️', color: '#047857' },
    ],
    tasks: [
      { id: 1,  name: 'User Interviews',     teamId: 1, phaseId: 1, startWeek: 1,  dur: 2, tags: ['research'] },
      { id: 2,  name: 'Competitive Analysis',teamId: 1, phaseId: 1, startWeek: 3,  dur: 2, tags: ['research'] },
      { id: 3,  name: 'Wireframes',          teamId: 2, phaseId: 2, startWeek: 5,  dur: 2, tags: ['UX'] },
      { id: 4,  name: 'Design System',       teamId: 2, phaseId: 2, startWeek: 5,  dur: 4, tags: ['UX'] },
      { id: 5,  name: 'User Testing',        teamId: 2, phaseId: 2, startWeek: 7,  dur: 2, tags: ['research'] },
      { id: 6,  name: 'API Development',     teamId: 3, phaseId: 3, startWeek: 9,  dur: 6, tags: ['tech'] },
      { id: 7,  name: 'Frontend',            teamId: 3, phaseId: 3, startWeek: 11, dur: 6, tags: ['tech'] },
      { id: 8,  name: 'QA & Testing',        teamId: 3, phaseId: 3, startWeek: 15, dur: 2, tags: ['tech'] },
      { id: 9,  name: 'Launch Plan',         teamId: 1, phaseId: 4, startWeek: 17, dur: 2, tags: ['growth'] },
      { id: 10, name: 'Marketing Rollout',   teamId: 1, phaseId: 4, startWeek: 19, dur: 2, tags: ['growth'] },
    ],
    tags: ['research', 'UX', 'tech', 'growth', 'tracking'],
    _nextId: 11,
  };
  const compressed = lz.compressToEncodedURIComponent(JSON.stringify(data));
  location.hash = SHARE_PREFIX + compressed;
}

/* ── loadSampleData — fills current project with demo data (empty-state helper) ── */
export function loadSampleData(render) {
  pushHistory();
  const base = new Date(); base.setDate(1);
  S.cfg.start = `${base.getFullYear()}-${String(base.getMonth()+1).padStart(2,'0')}-01`;
  const end = new Date(base); end.setMonth(end.getMonth() + 4);
  S.cfg.end = `${end.getFullYear()}-${String(end.getMonth()+1).padStart(2,'0')}-28`;
  S.phases = [
    { id: nextId(), name: 'Discovery', startWeek: 1,  endWeek: 4,  color: '#1d4ed8', scope: 'Research & define problem space', outputs: [] },
    { id: nextId(), name: 'Design',    startWeek: 5,  endWeek: 10, color: '#7c3aed', scope: 'Wireframes, prototypes, testing',   outputs: [] },
    { id: nextId(), name: 'Build',     startWeek: 11, endWeek: 16, color: '#047857', scope: 'Engineering & QA',                  outputs: [] },
  ];
  const [p1, p2, p3] = S.phases;
  S.teams = [
    { id: nextId(), name: 'Product', icon: 'package', color: '#7c3aed' },
    { id: nextId(), name: 'Design',  icon: 'heart',   color: '#be185d' },
    { id: nextId(), name: 'Eng',     icon: 'code',    color: '#047857' },
  ];
  const [t1, t2, t3] = S.teams;
  S.tasks = [
    { id: nextId(), name: 'User research',        teamId: t1.id, phaseId: p1.id, startWeek: 1,    dur: 2, tags: ['research'] },
    { id: nextId(), name: 'Competitive analysis', teamId: t1.id, phaseId: p1.id, startWeek: 3,    dur: 2, tags: ['research'] },
    { id: nextId(), name: 'Wireframes',           teamId: t2.id, phaseId: p2.id, startWeek: 5,    dur: 3, tags: ['UX'] },
    { id: nextId(), name: 'Prototype v1',         teamId: t2.id, phaseId: p2.id, startWeek: 8,    dur: 3, tags: ['UX'] },
    { id: nextId(), name: 'Backend API',          teamId: t3.id, phaseId: p3.id, startWeek: 11,   dur: 4, tags: ['tech'] },
    { id: nextId(), name: 'Frontend',             teamId: t3.id, phaseId: p3.id, startWeek: 13,   dur: 4, tags: ['tech'] },
    { id: nextId(), name: 'Write spec',           teamId: t1.id, phaseId: null,  startWeek: null, dur: 1, tags: [] },
    { id: nextId(), name: 'Launch plan',          teamId: t1.id, phaseId: null,  startWeek: null, dur: 2, tags: ['growth'] },
  ];
  S.tags = ['research', 'UX', 'tech', 'growth', 'tracking'];
  render?.();
}

/* ── Avatar outside-click handler (module-level, self-removes) ── */
function _onAvatarOutsideClick(e) {
  if (!e.target.closest('#auth-user-wrap')) {
    document.removeEventListener('click', _onAvatarOutsideClick);
    setHomeUserMenuOpen(false);
    _renderHome?.();
  }
}

/* ── Project ctx outside-click handler (module-level, self-removes) ── */
function _onProjCtxOutsideClick() {
  document.removeEventListener('click', _onProjCtxOutsideClick);
  setHomeCtxId(null);
  _renderHome?.(); // renderHome removes ctx from body
}

/* ── Home keydown handler (module-level so it can be removed/re-added) ── */
function _onHomeKey(e) {
  if (e.key === 'Escape') {
    S.ui.modal = null;
    setHomeCtxId(null);
    setHomeUserMenuOpen(false);
    _renderHome?.(); // renderHome removes ctx from body
  }
  if (e.key === 'Enter' && S.ui.modal && e.target.tagName !== 'TEXTAREA') {
    q('#m-save')?.click();
  }
}

/* ── bindHome ── */
export function bindHome() {
  /* renderHome() handles ctx portal lifecycle — no manual cleanup needed here */

  /* Canvas animations */
  _initSignInCanvas?.();
  _initHomeEmptyCanvas?.();

  /* Auth */
  q('#home-signin-btn')?.addEventListener('click', () => _fbSignIn?.());
  q('#home-signout-btn')?.addEventListener('click', () => _fbSignOut?.());

  /* Avatar dropdown */
  q('#home-avatar-btn')?.addEventListener('click', e => {
    e.stopPropagation();
    setHomeUserMenuOpen(!homeUserMenuOpen);
    _renderHome?.();
  });
  if (homeUserMenuOpen) {
    document.removeEventListener('click', _onAvatarOutsideClick);
    document.addEventListener('click', _onAvatarOutsideClick);
  }

  /* New project */
  const openNew = () => {
    const today    = new Date(); today.setHours(0, 0, 0, 0);
    const startMon = wkpMonday(today);
    const endMon   = new Date(startMon.getTime() + 12 * 7 * 86400000);
    wkp.startMon     = startMon;
    wkp.endMon       = endMon;
    wkp.yr           = startMon.getFullYear();
    wkp.mo           = startMon.getMonth();
    wkp.step         = 'start';
    wkp.showMonthSel = false;
    wkp.phaseMode    = false;
    wkp.cfgStart     = null;
    wkp.npPreset     = null;
    S.ui.modal = { type: 'new-project', data: {} };
    _renderHome?.();
  };
  q('#home-new-btn')?.addEventListener('click', openNew);
  q('#home-new-hdr-btn')?.addEventListener('click', openNew);

  /* View sample */
  q('#home-view-sample-btn')?.addEventListener('click', loadSampleProject);

  /* Import CSV */
  q('#home-import-btn')?.addEventListener('click', () => _openImport?.(null));

  /* Project card click → open */
  qAll('.proj-card[data-proj-id]').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('[data-proj-menu],[data-proj-open],[data-proj-rename],[data-proj-dup],[data-proj-del],.proj-ctx')) return;
      location.hash = '#project-' + card.dataset.projId;
    });
  });

  /* Card context menu toggle */
  qAll('[data-proj-menu]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const rect   = btn.getBoundingClientRect();
      const projId = btn.dataset.projMenu;
      const opening = homeCtxId !== projId;
      setHomeCtxId(opening ? projId : null);
      _renderHome?.(); // renderHome appends/removes ctx portal in body
      if (opening) {
        const ctx = document.body.querySelector('.proj-ctx');
        if (ctx) {
          const w = ctx.offsetWidth || 150;
          ctx.style.top  = (rect.bottom + 4) + 'px';
          ctx.style.left = (rect.right - w) + 'px';
        }
      }
    });
  });

  /* Context menu actions */
  qAll('[data-proj-open]').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation(); location.hash = '#project-' + b.dataset.projOpen;
  }));
  qAll('[data-proj-rename]').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    const idx = _loadIndex?.() || [];
    const p   = idx.find(x => x.id === b.dataset.projRename);
    setHomeCtxId(null);
    S.ui.modal = { type: 'rename-project', data: { id: p.id, name: p.name, subtitle: p.subtitle || '', accent: p.accent || '#D0A052' } };
    _renderHome?.();
  }));
  qAll('[data-proj-dup]').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    setHomeCtxId(null);
    _duplicateProject?.(b.dataset.projDup, _renderHome);
  }));
  qAll('[data-proj-del]').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    setHomeCtxId(null);
    if (confirm(t('home.deleteConfirm'))) {
      _deleteProject?.(b.dataset.projDel, _renderHome);
    } else {
      _renderHome?.();
    }
  }));

  /* Close ctx when clicking outside */
  if (homeCtxId) {
    document.removeEventListener('click', _onProjCtxOutsideClick);
    document.addEventListener('click', _onProjCtxOutsideClick);
  }

  /* Theme toggle */
  q('#home-theme-btn')?.addEventListener('click', () => {
    const cur = getCurrentThemePref();
    setTheme(cur === 'dark' ? 'light' : cur === 'light' ? 'system' : 'dark');
    _renderHome?.();
  });

  /* Modal */
  const bg = q('#modal-bg');
  if (!bg) return;
  bg.addEventListener('click', e => {
    if (e.target === bg) { S.ui.modal = null; _renderHome?.(); }
  });
  q('#m-cancel')?.addEventListener('click', () => { S.ui.modal = null; _renderHome?.(); });

  /* New-project modal: dual calendar + presets */
  if (S.ui.modal?.type === 'new-project') {
    setRenderModal(() => _renderHome?.());
    bindNpCalendarEvents();

    qAll('.np-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.npPreset;
        if (key === 'custom') {
          /* Custom = just mark active, don't change dates */
          wkp.npPreset = 'custom';
          _renderHome?.();
        } else {
          applyNpPreset(key);
        }
      });
    });
  }

  /* Accent swatches */
  qAll('.proj-accent-swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      qAll('.proj-accent-swatch').forEach(s => s.classList.remove('sel'));
      sw.classList.add('sel');
    });
  });

  /* Auto-focus name input */
  setTimeout(() => q('#hm-name')?.focus(), 50);

  /* Save */
  q('#m-save')?.addEventListener('click', () => {
    const name = q('#hm-name')?.value.trim();
    if (!name) { shakeErr(q('#hm-name')); return; }
    const sub   = q('#hm-sub')?.value.trim() || '';
    const type  = S.ui.modal?.type;
    if (type === 'new-project') {
      const accent   = q('.proj-accent-swatch.sel')?.dataset.acc || '#D0A052';
      const startDate = wkp.startMon ? dateStrYMD(wkp.startMon) : null;
      const endSun    = wkp.endMon ? new Date(wkp.endMon.getTime() + 6 * 86400000) : null;
      const endDate   = endSun ? dateStrYMD(endSun) : null;
      S.ui.modal = null;
      _createProject?.(name, sub, accent, hash => { location.hash = hash; }, startDate, endDate);
    } else if (type === 'rename-project') {
      const id     = S.ui.modal.data.id;
      const accent = q('.proj-accent-swatch.sel')?.dataset.acc || S.ui.modal.data.accent || '#D0A052';
      S.ui.modal = null;
      _renameProject?.(id, name, sub, accent, _renderHome);
    }
  });

  /* Keyboard shortcuts */
  document.removeEventListener('keydown', _onHomeKey);
  document.addEventListener('keydown', _onHomeKey);

  /* Import modal bind (runs on top of normal modal bind) */
  if (S.ui.modal?.type === 'import') bindImportModal();
}
