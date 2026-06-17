/* ── PERSISTENCE — Firestore CRUD, localStorage cache, project index ── */
import { doc, getDoc, setDoc, deleteDoc, collection,
         query, where, getDocs, onSnapshot }   from 'firebase/firestore';
import { db, currentUser }                     from './firebase.js';
import { S }                                   from './state.js';
import { INDEX_KEY, PROJ_PFX, LS_KEY }         from './constants.js';
import { showToast }                           from './utils.js';

export let _projIndex          = [];
export let currentProjId       = null;
export let _projCollaborators  = [];
export let _projInviteToken    = '';

export function setCurrentProjId(id) { currentProjId = id; }
export function loadIndex()    { return _projIndex; }
export function saveIndex(idx) { _projIndex = idx; }

let _unsubProj = null;
let _fbSaving  = false;

/* ── Cache helpers ── */
function projKey(id)         { return PROJ_PFX + id; }
function cacheProject(id, d) { try { localStorage.setItem(projKey(id), JSON.stringify(d)); } catch(e) {} }
function readCachedProject(id) {
  try { const r = localStorage.getItem(projKey(id)); return r ? JSON.parse(r) : null; } catch(e) { return null; }
}

/* ── Firestore helpers ── */
function _fsDoc(id)       { return doc(db, 'projects', id); }

function _payload(id, data, accent) {
  return {
    ownerId:      currentUser.uid,
    ownerName:    currentUser.displayName || '',
    ownerPhoto:   currentUser.photoURL    || '',
    name:         data.cfg.title,
    subtitle:     data.cfg.subtitle || '',
    accent:       accent || _projIndex.find(p => p.id === id)?.accent || '#D0A052',
    updatedAt:    Date.now(),
    lastEditedBy: { uid: currentUser.uid, name: currentUser.displayName || currentUser.email || '' },
    collaborators: _projCollaborators,
    inviteToken:   _projInviteToken,
    stats: {
      phases: data.phases.length,
      tasks:  data.tasks.length,
      sched:  data.tasks.filter(t => t.startWeek !== null).length,
      start:  data.cfg.start,
      end:    data.cfg.end,
    },
    cfg: data.cfg, phases: data.phases, teams: data.teams,
    tasks: data.tasks, tags: data.tags, _nextId: data._nextId,
  };
}

/* ── Index ── */
export async function refreshIndex() {
  if (!currentUser || !db) { _projIndex = []; return; }
  try {
    const snap = await getDocs(query(collection(db, 'projects'), where('ownerId', '==', currentUser.uid)));
    _projIndex = snap.docs.map(d => {
      const dd = d.data();
      return { id: d.id, name: dd.name, subtitle: dd.subtitle || '', accent: dd.accent || '#D0A052', updatedAt: dd.updatedAt || 0, stats: dd.stats || {} };
    }).sort((a, b) => b.updatedAt - a.updatedAt);
  } catch(e) { console.error('refreshIndex:', e); }
}

export function updateIndexEntry() {
  if (!currentProjId) return;
  const p = _projIndex.find(p => p.id === currentProjId);
  if (!p) return;
  p.name = S.cfg.title; p.subtitle = S.cfg.subtitle || ''; p.updatedAt = Date.now();
  p.stats = {
    phases: S.phases.length, tasks: S.tasks.length,
    sched: S.tasks.filter(t => t.startWeek !== null).length,
    start: S.cfg.start, end: S.cfg.end,
  };
}

/* ── Save ── */
export async function saveToFirestore(id, data, accent) {
  if (!db || !currentUser) return;
  _fbSaving = true;
  try {
    const pl = _payload(id, data, accent);
    await setDoc(_fsDoc(id), pl);
    const p = _projIndex.find(p => p.id === id);
    if (p) { p.name = pl.name; p.subtitle = pl.subtitle; p.updatedAt = pl.updatedAt; p.stats = pl.stats; }
  } catch(e) { console.error('saveToFirestore:', e); }
  setTimeout(() => { _fbSaving = false; }, 800);
}

/* ── Realtime subscription ── */
export function subscribeToProject(id, rerenderFn) {
  _unsubProj?.(); _unsubProj = null;
  if (!db || !currentUser) return;
  _unsubProj = onSnapshot(_fsDoc(id), snap => {
    if (_fbSaving || currentProjId !== id || !snap.exists()) return;
    const d = snap.data();
    if (d.cfg)     S.cfg     = { ...S.cfg,  ...d.cfg };
    if (d.phases)  S.phases  = d.phases;
    if (d.teams)   S.teams   = d.teams;
    if (d.tasks)   S.tasks   = d.tasks;
    if (d.tags)    S.tags    = d.tags;
    if (d._nextId) S._nextId = d._nextId;
    cacheProject(id, { cfg: S.cfg, phases: S.phases, teams: S.teams, tasks: S.tasks, tags: S.tags, _nextId: S._nextId });
    rerenderFn(true);
    showToast('🔄 Cập nhật từ thiết bị khác', 2500);
  });
}

/* ── Load project ── */
export async function loadProject(id, rerenderFn) {
  S.cfg = { title: 'Project Roadmap', subtitle: '', start: '2025-06-02', end: '2025-11-30', scopeRowHeight: 100 };
  S.phases = []; S.teams = []; S.tasks = [];
  S.tags = []; S._nextId = 1;
  S.ui.filter = { phase: '', team: '', tag: '', status: 'backlog', search: '' };
  S.ui.modal = null; S.ui.ctx = null; S.ui.dragData = null;
  S.ui.resizeData = null; S.ui.phaseResize = null; S.ui.phaseDragId = null;
  currentProjId = id;

  if (db && currentUser) {
    try {
      const snap = await getDoc(_fsDoc(id));
      if (snap.exists()) {
        const d = snap.data();
        if (d.cfg)     S.cfg     = { ...S.cfg, ...d.cfg };
        if (d.phases)  S.phases  = d.phases;
        if (d.teams)   S.teams   = d.teams;
        if (d.tasks)   S.tasks   = d.tasks;
        if (d.tags)    S.tags    = d.tags;
        if (d._nextId) S._nextId = d._nextId;
        _projCollaborators = d.collaborators || [];
        _projInviteToken   = d.inviteToken   || '';
        cacheProject(id, { cfg: S.cfg, phases: S.phases, teams: S.teams, tasks: S.tasks, tags: S.tags, _nextId: S._nextId });
        subscribeToProject(id, rerenderFn);
        return;
      }
    } catch(e) { console.error('loadProject:', e); }
  }

  const cached = readCachedProject(id);
  if (cached) {
    if (cached.cfg)     S.cfg     = { ...S.cfg, ...cached.cfg };
    if (cached.phases)  S.phases  = cached.phases;
    if (cached.teams)   S.teams   = cached.teams;
    if (cached.tasks)   S.tasks   = cached.tasks;
    if (cached.tags)    S.tags    = cached.tags;
    if (cached._nextId) S._nextId = cached._nextId;
  }
}

/* ── Project CRUD ── */
export async function createProject(name, subtitle, accent, navigateFn) {
  const id  = 'proj_' + Date.now();
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const start = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  const endD  = new Date(now.getFullYear(), now.getMonth() + 6, now.getDate());
  const end   = `${endD.getFullYear()}-${pad(endD.getMonth()+1)}-${pad(endD.getDate())}`;
  const data  = { cfg: { title: name, subtitle: subtitle || '', start, end, scopeRowHeight: 100 },
                  phases: [], teams: [], tasks: [], tags: [], _nextId: 1 };
  cacheProject(id, data);
  if (db && currentUser) { try { await setDoc(_fsDoc(id), _payload(id, data, accent || '#D0A052')); } catch(e) {} }
  _projIndex.unshift({ id, name, subtitle: subtitle || '', accent: accent || '#D0A052', updatedAt: Date.now(), stats: { phases: 0, tasks: 0, sched: 0, start, end } });
  navigateFn('#project-' + id);
}

export async function deleteProject(id, renderHomeFn) {
  try { localStorage.removeItem(projKey(id)); } catch(e) {}
  if (db && currentUser) { try { await deleteDoc(_fsDoc(id)); } catch(e) {} }
  _projIndex = _projIndex.filter(p => p.id !== id);
  renderHomeFn();
}

export async function duplicateProject(id, renderHomeFn) {
  let data = null;
  if (db && currentUser) { try { const s = await getDoc(_fsDoc(id)); if (s.exists()) data = s.data(); } catch(e) {} }
  if (!data) data = readCachedProject(id);
  if (!data) return;
  data.cfg = { ...data.cfg, title: (data.cfg?.title || 'Project') + ' (copy)' };
  const newId = 'proj_' + Date.now();
  const orig  = _projIndex.find(p => p.id === id);
  cacheProject(newId, { cfg: data.cfg, phases: data.phases, teams: data.teams, tasks: data.tasks, tags: data.tags, _nextId: data._nextId });
  if (db && currentUser) { try { await setDoc(_fsDoc(newId), _payload(newId, data, orig?.accent)); } catch(e) {} }
  _projIndex.unshift({ id: newId, name: data.cfg.title, subtitle: data.cfg.subtitle || '',
    accent: orig?.accent || '#D0A052', updatedAt: Date.now(), stats: orig ? { ...orig.stats } : {} });
  renderHomeFn();
}

export async function renameProject(id, name, subtitle, accent, renderHomeFn) {
  const p = _projIndex.find(p => p.id === id);
  if (!p) return;
  p.name = name; p.subtitle = subtitle; p.updatedAt = Date.now();
  if (accent) p.accent = accent;
  const cached = readCachedProject(id);
  if (cached) { cached.cfg.title = name; cached.cfg.subtitle = subtitle; cacheProject(id, cached); }
  if (db && currentUser) {
    try {
      const s = await getDoc(_fsDoc(id));
      if (s.exists()) {
        const d = s.data();
        await setDoc(_fsDoc(id), { ...d, name, subtitle, accent: accent || d.accent, cfg: { ...d.cfg, title: name, subtitle } });
      }
    } catch(e) {}
  }
  renderHomeFn();
}

/* ── Migration: localStorage → Firestore on first login ── */
export async function migrateLocalToFirestore() {
  if (!currentUser || !db) return;
  const chk = await getDocs(query(collection(db, 'projects'), where('ownerId', '==', currentUser.uid)));
  if (chk.size > 0) return;
  let localIdx = [];
  try { const r = localStorage.getItem(INDEX_KEY); localIdx = r ? JSON.parse(r) : []; } catch(e) {}
  if (localIdx.length === 0) {
    const old = localStorage.getItem(LS_KEY);
    if (!old) return;
    try {
      const d  = JSON.parse(old);
      const id = 'proj_' + Date.now();
      cacheProject(id, d);
      localIdx = [{ id, name: d.cfg?.title || 'My Roadmap', subtitle: '', accent: '#D0A052', updatedAt: Date.now(), stats: {} }];
    } catch(e) { return; }
  }
  let count = 0;
  for (const entry of localIdx) {
    const data = readCachedProject(entry.id);
    if (!data) continue;
    try { await setDoc(_fsDoc(entry.id), _payload(entry.id, data, entry.accent)); count++; } catch(e) {}
  }
  if (count > 0) showToast(`☁️ Đã đồng bộ ${count} project lên cloud!`, 4000);
}

/* ── Legacy localStorage migration (single→multi, pre-Firebase era) ── */
export function migrateOldData() {
  const old = localStorage.getItem(LS_KEY);
  if (!old) return;
  const localIdx = (() => { try { const r = localStorage.getItem(INDEX_KEY); return r ? JSON.parse(r) : []; } catch(e) { return []; } })();
  if (localIdx.length > 0) { localStorage.removeItem(LS_KEY); return; }
  const id = 'proj_' + Date.now();
  try {
    const d = JSON.parse(old);
    cacheProject(id, d);
    _projIndex = [{ id, name: d.cfg?.title || 'My Roadmap', subtitle: '', accent: '#D0A052', updatedAt: Date.now(),
      stats: { phases: d.phases?.length || 0, tasks: d.tasks?.length || 0, sched: d.tasks?.filter(t => t.startWeek !== null).length || 0 } }];
    localStorage.removeItem(LS_KEY);
  } catch(e) {}
}

/* ── Save current project (called from render) ── */
export function saveCurrentProject() {
  if (!currentProjId) return;
  const p = _projIndex.find(p => p.id === currentProjId);
  const toSave = { cfg: S.cfg, phases: S.phases, teams: S.teams, tasks: S.tasks, tags: S.tags, _nextId: S._nextId };
  cacheProject(currentProjId, toSave);
  if (db && currentUser) saveToFirestore(currentProjId, toSave, p?.accent).catch(console.error);
}

export function unsubscribeProject() {
  _unsubProj?.(); _unsubProj = null;
}
