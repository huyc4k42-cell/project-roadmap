/* ── RENDER / SIDEBAR — task backlog panel ── */
import { S, teamById, phaseById } from '../state.js';
import { esc, tagPalette }         from '../utils.js';
import { loadSidebarState }         from '../storage.js';
import { svgIcon }                  from '../icons.js';

export function buildSidebar() {
  const f = S.ui.filter;

  /* Filtered task list */
  let tasks = [...S.tasks];
  if (!f.status || f.status === 'backlog') {
    tasks = tasks.filter(t => t.startWeek === null);
  } else if (f.status === 'scheduled') {
    tasks = tasks.filter(t => t.startWeek !== null);
  }
  if (f.phase)  tasks = tasks.filter(t => t.phaseId === +f.phase);
  if (f.team)   tasks = tasks.filter(t => t.teamId  === +f.team);
  if (f.tag)    tasks = tasks.filter(t => t.tags.includes(f.tag));
  if (f.search) tasks = tasks.filter(t => t.name.toLowerCase().includes(f.search.toLowerCase()));

  const backlogCount = S.tasks.filter(t => t.startWeek === null).length;

  /* Tag pills */
  const tags = S.tags.map(tg => {
    const on = f.tag === tg ? ' on' : '';
    return `<button class="tf draggable-tag${on}" data-tag="${esc(tg)}" draggable="true" title="Kéo để gán tag, click để lọc">${esc(tg)}<span class="tf-del" data-del-tag="${esc(tg)}">×</span></button>`;
  }).join('');

  /* Filter dropdowns */
  const phOpts = S.phases.map(p =>
    `<option value="${p.id}"${f.phase === String(p.id) ? ' selected' : ''}>${esc(p.name)}</option>`).join('');
  const tmOpts = S.teams.map(tm =>
    `<option value="${tm.id}"${f.team === String(tm.id) ? ' selected' : ''}>${esc(tm.name)}</option>`).join('');

  const taskCards = tasks.length
    ? tasks.map(buildTaskCard).join('')
    : `<div class="no-tasks">Không có task nào phù hợp</div>`;

  const sidebarState = loadSidebarState();
  const isRail = sidebarState === 'collapsed';

  return `
<aside class="sb${isRail ? ' rail' : ''}" id="sidebar">
  <button class="sb-rail-btn" id="sb-rail-btn" aria-label="Mở rộng sidebar (${backlogCount} task backlog)" title="Mở rộng sidebar">
    <div class="sb-rail-icon">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>
    </div>
    <span class="sb-rail-badge">${backlogCount}</span>
  </button>
  <div class="sb-hd">
    <h2>Task Backlog</h2>
    <div style="display:flex;align-items:center;gap:6px">
      <span class="sb-badge">${backlogCount}</span>
      <button class="sb-toggle" id="sb-toggle" aria-label="Thu gọn sidebar" title="Thu gọn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3H5a2 2 0 00-2 2v14a2 2 0 002 2h10"/><polyline points="11 7 7 11 11 15"/></svg>
      </button>
    </div>
  </div>
  <div class="sb-search">
    <svg class="sb-search-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    <input class="sb-search-inp" id="sb-search" placeholder="Tìm task... (Ctrl+K)" value="${esc(f.search || '')}" aria-label="Tìm kiếm task" autocomplete="off"/>
  </div>
  <div class="tg-bar">
    <button class="tf${!f.tag ? ' on' : ''}" data-tag="">Tất cả</button>
    ${tags}
    <div class="tf-add-row">
      <input class="tf-add-inp" id="tf-add-inp" placeholder="+ tag mới..." aria-label="Nhập tên tag mới" />
      <button class="tf-add-btn" id="tf-add-btn" aria-label="Thêm tag">+</button>
    </div>
  </div>
  <div class="filter-bar">
    <select class="fi-sel" id="f-phase" aria-label="Filter by phase">
      <option value="">All phases</option>${phOpts}
    </select>
    <select class="fi-sel" id="f-team" aria-label="Filter by team">
      <option value="">All teams</option>${tmOpts}
    </select>
  </div>
  <div class="task-list" id="task-list">${taskCards}</div>
  <div class="sb-foot">
    <button class="add-tc" id="add-tc-btn">＋ Thêm task mới</button>
  </div>
</aside>`;
}

export function buildTaskCard(t) {
  const team  = teamById(t.teamId);
  const phase = t.phaseId ? phaseById(t.phaseId) : null;
  const isScheduled = t.startWeek !== null;

  const tagHtml = t.tags.map(tg => {
    const [bg, fg] = tagPalette(tg);
    return `<span class="tag" style="background:${bg};color:${fg}">${esc(tg)}</span>`;
  }).join('');

  const phHtml = phase
    ? `<span class="tc-ph" style="background:${phase.color}22;color:${phase.color}">${esc(phase.name)}</span>`
    : '';

  return `
<div class="tc" draggable="true" data-task-id="${t.id}" id="tc-${t.id}">
  <div class="tc-top">
    <span class="tc-nm">${esc(t.name)}</span>
    <div class="tc-status" aria-label="${isScheduled ? 'Đã xếp lịch' : 'Chưa xếp lịch'}">
      ${isScheduled
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--grn)" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--txt3)" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/></svg>`}
    </div>
  </div>
  <div class="tc-tags">${tagHtml}${phHtml}</div>
  <div class="tc-footer">
    ${team ? `<span class="tc-team">${svgIcon(team.icon, 11)} ${esc(team.name)}</span>` : ''}
    <span class="dur-b">${t.dur}w</span>
  </div>
</div>`;
}
