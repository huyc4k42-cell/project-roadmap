/* ── RENDER / SIDEBAR — task backlog panel ── */
import { S, teamById, phaseById } from '../state.js';
import { esc, tagPalette }         from '../utils.js';
import { loadSidebarState }         from '../storage.js';
import { svgIcon }                  from '../icons.js';
import { t }                        from '../i18n.js';

export function buildSidebar() {
  const f = S.ui.filter;

  /* Filtered task list */
  let tasks = [...S.tasks];
  if (!f.status || f.status === 'backlog') {
    tasks = tasks.filter(tk => tk.startWeek === null);
  } else if (f.status === 'scheduled') {
    tasks = tasks.filter(tk => tk.startWeek !== null);
  }
  if (f.phase)  tasks = tasks.filter(tk => tk.phaseId === +f.phase);
  if (f.team)   tasks = tasks.filter(tk => tk.teamId  === +f.team);
  if (f.tag)    tasks = tasks.filter(tk => tk.tags.includes(f.tag));
  if (f.search) tasks = tasks.filter(tk => tk.name.toLowerCase().includes(f.search.toLowerCase()));

  const backlogCount = S.tasks.filter(tk => tk.startWeek === null).length;

  /* Tag pills */
  const tags = S.tags.map(tg => {
    const on = f.tag === tg ? ' on' : '';
    return `<button class="tf draggable-tag${on}" data-tag="${esc(tg)}" draggable="true" title="${t('sidebar.tagDragHint')}">${esc(tg)}<span class="tf-del" data-del-tag="${esc(tg)}">×</span></button>`;
  }).join('');

  /* Filter dropdowns */
  const phOpts = S.phases.map(p =>
    `<option value="${p.id}"${f.phase === String(p.id) ? ' selected' : ''}>${esc(p.name)}</option>`).join('');
  const tmOpts = S.teams.map(tm =>
    `<option value="${tm.id}"${f.team === String(tm.id) ? ' selected' : ''}>${esc(tm.name)}</option>`).join('');

  const taskCards = tasks.length
    ? tasks.map(buildTaskCard).join('')
    : `<div class="no-tasks">${t('sidebar.noMatch')}</div>`;

  const sidebarState = loadSidebarState();
  const isRail = sidebarState === 'collapsed';

  return `
<aside class="sb${isRail ? ' rail' : ''}" id="sidebar">
  <button class="sb-rail-btn" id="sb-rail-btn" aria-label="${t('sidebar.expand', { n: backlogCount })}" title="${t('sidebar.expandShort')}">
    <div class="sb-rail-icon">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>
    </div>
    <span class="sb-rail-badge">${backlogCount}</span>
  </button>
  <div class="sb-hd">
    <h2>${t('sidebar.title')}</h2>
    <div style="display:flex;align-items:center;gap:6px">
      <span class="sb-badge">${backlogCount}</span>
      <button class="sb-toggle" id="sb-toggle" aria-label="${t('sidebar.collapse')}" title="${t('sidebar.collapseShort')}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3H5a2 2 0 00-2 2v14a2 2 0 002 2h10"/><polyline points="11 7 7 11 11 15"/></svg>
      </button>
    </div>
  </div>
  <div class="sb-search">
    <svg class="sb-search-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    <input class="sb-search-inp" id="sb-search" placeholder="${t('sidebar.searchPlaceholder')}" value="${esc(f.search || '')}" aria-label="${t('sidebar.searchLabel')}" autocomplete="off"/>
  </div>
  <div class="tg-bar">
    <button class="tf${!f.tag ? ' on' : ''}" data-tag="">${t('sidebar.allTags')}</button>
    ${tags}
    <div class="tf-add-row">
      <input class="tf-add-inp" id="tf-add-inp" placeholder="${t('sidebar.newTagPlaceholder')}" aria-label="${t('sidebar.newTagLabel')}" />
      <button class="tf-add-btn" id="tf-add-btn" aria-label="${t('common.add')}">+</button>
    </div>
  </div>
  <div class="filter-bar">
    <select class="fi-sel" id="f-phase" aria-label="${t('sidebar.filterPhase')}">
      <option value="">${t('sidebar.allPhases')}</option>${phOpts}
    </select>
    <select class="fi-sel" id="f-team" aria-label="${t('sidebar.filterTeam')}">
      <option value="">${t('sidebar.allTeams')}</option>${tmOpts}
    </select>
  </div>
  <div class="task-list" id="task-list">${taskCards}</div>
  <div class="sb-foot">
    <button class="add-tc" id="add-tc-btn">${t('sidebar.addTaskBtn')}</button>
  </div>
</aside>`;
}

export function buildTaskCard(tk) {
  const team  = teamById(tk.teamId);
  const phase = tk.phaseId ? phaseById(tk.phaseId) : null;
  const isScheduled = tk.startWeek !== null;

  const tagHtml = tk.tags.map(tg => {
    const [bg, fg] = tagPalette(tg);
    return `<span class="tag" style="background:${bg};color:${fg}">${esc(tg)}</span>`;
  }).join('');

  const phHtml = phase
    ? `<span class="tc-ph" style="background:${phase.color}22;color:${phase.color}">${esc(phase.name)}</span>`
    : '';

  return `
<div class="tc" draggable="true" data-task-id="${tk.id}" id="tc-${tk.id}">
  <div class="tc-top">
    <span class="tc-nm">${esc(tk.name)}</span>
    <div class="tc-status" aria-label="${isScheduled ? t('sidebar.taskScheduled') : t('sidebar.taskBacklog')}">
      ${isScheduled
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--grn)" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--txt3)" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/></svg>`}
    </div>
  </div>
  <div class="tc-tags">${tagHtml}${phHtml}</div>
  <div class="tc-footer">
    ${team ? `<span class="tc-team">${svgIcon(team.icon, 11)} ${esc(team.name)}</span>` : ''}
    <span class="dur-b">${tk.dur}w</span>
  </div>
</div>`;
}
