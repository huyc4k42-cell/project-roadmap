/* ── EVENTS / BIND / HEADER — back-home, header buttons, stat filter, timeline nav, search, team labels, tag pills, add-tag ── */
import { S } from '../../state.js';
import { q, qAll } from '../../utils.js';
import { todayWeekFrac } from '../../date.js';
import { currentProjId } from '../../persistence.js';
import {
  trackClickBackRoadmap, trackClickSettingsRoadmap,
  trackClickAddButton, trackClickExportPdf, trackShareRoadmap,
} from '../../tracking/project.js';
import {
  trackSearchTask, trackFilterByTag, trackFilterByPhase, trackFilterByTeam,
} from '../../tracking/sidebar.js';

export function bindHeader(deps) {
  const _WW = deps.WW ?? 64;

  /* Back to Home */
  q('#btn-back-home')?.addEventListener('click', () => { trackClickBackRoadmap(); location.hash = '#home'; });

  /* Header */
  q('#hdr-title-click')?.addEventListener('click', () => { trackClickSettingsRoadmap('title'); deps.openModal?.('cfg'); });
  q('#btn-cfg')?.addEventListener('click', () => { trackClickSettingsRoadmap('button'); deps.openModal?.('cfg'); });
  q('#btn-share')?.addEventListener('click', () => { trackShareRoadmap(currentProjId); deps.openModal?.('share'); });
  q('#btn-add-phase2')?.addEventListener('click', () => { trackClickAddButton('phase'); deps.openModal?.('add-phase'); });
  q('#add-tc-btn')?.addEventListener('click', () => { trackClickAddButton('task'); deps.openModal?.('add-task'); });
  q('#add-tm-btn2')?.addEventListener('click', () => { trackClickAddButton('team'); deps.openModal?.('add-team'); });
  q('#btn-export')?.addEventListener('click', () => { trackClickExportPdf(); deps.exportPDF?.(); });

  /* Stat buttons → filter */
  q('#stat-all')?.addEventListener('click',   () => { S.ui.filter.status = ''; deps.render?.(); });
  q('#stat-sched')?.addEventListener('click', () => { S.ui.filter.status = 'scheduled'; deps.render?.(); });
  q('#stat-back')?.addEventListener('click',  () => { S.ui.filter.status = 'backlog'; deps.render?.(); });

  /* Timeline navigation */
  const getTlArea = () => q('#tl-area') || q('.tl-area');
  const scrollWeeks = (n) => {
    const el = getTlArea();
    if (el) el.scrollBy({ left: n * _WW, behavior: 'smooth' });
  };
  q('#btn-tl-prev')?.addEventListener('click', () => scrollWeeks(-4));
  q('#btn-tl-next')?.addEventListener('click', () => scrollWeeks(+4));
  q('#btn-tl-today')?.addEventListener('click', () => {
    const el = getTlArea();
    if (!el) return;
    const wf = todayWeekFrac(S.cfg);
    const target = Math.max(0, (wf - 1) * _WW - el.clientWidth / 2);
    el.scrollTo({ left: target, behavior: 'smooth' });
  });

  /* Search */
  q('#sb-search')?.addEventListener('input', e => {
    const el  = e.target;
    const sel = el.selectionStart;
    const searchQuery = el.value;
    S.ui.filter.search = searchQuery;
    deps.render?.(true);
    const newEl = q('#sb-search');
    if (newEl) { newEl.focus(); newEl.setSelectionRange(sel, sel); }
    const resultCount = searchQuery
      ? S.tasks.filter(tk => tk.name.toLowerCase().includes(searchQuery.toLowerCase())).length
      : S.tasks.length;
    trackSearchTask(searchQuery, resultCount, resultCount > 0);
  });
  q('#sb-search')?.addEventListener('keydown', e => { if (e.key === 'Escape') { S.ui.filter.search = ''; deps.render?.(); } });

  /* Empty state buttons */
  q('#empty-add-phase')?.addEventListener('click',   () => deps.openModal?.('add-phase'));
  q('#empty-load-sample')?.addEventListener('click', () => deps.loadSampleData?.());

  /* Add-new dropdown */
  q('#btn-add-new')?.addEventListener('click', e => {
    e.stopPropagation();
    const menu = q('#add-new-menu');
    const btn  = q('#btn-add-new');
    if (!menu) return;
    const opening = !menu.classList.contains('open');
    menu.classList.toggle('open', opening);
    btn?.setAttribute('aria-expanded', opening ? 'true' : 'false');
  });
  qAll('.add-dd-item').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      q('#add-new-menu')?.classList.remove('open');
      if (btn.dataset.add === 'import-csv') {
        trackClickAddButton('import');
        deps.openImportModal?.(); return;
      }
      const addMap = { phase: 'phase', 'add-task': 'task', 'add-team': 'team' };
      trackClickAddButton(addMap[btn.dataset.add] || btn.dataset.add);
      const type = btn.dataset.add === 'phase' ? 'add-phase' : btn.dataset.add;
      deps.openModal?.(type);
    });
  });
  document.addEventListener('click', () => q('#add-new-menu')?.classList.remove('open'));

  /* Team label click → edit */
  qAll('.trl[data-team-id]').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.closest('[data-action]')) return;
      const tm = S.teams.find(m => m.id === +el.dataset.teamId);
      if (tm) deps.openModal?.('edit-team', tm);
    });
  });

  /* Tag filter pills */
  qAll('.tf[data-tag]').forEach(el => {
    el.addEventListener('click', e => {
      const delBtn = e.target.closest('[data-del-tag]');
      if (delBtn) { e.stopPropagation(); deps.delTag?.(delBtn.dataset.delTag); return; }
      S.ui.filter.tag = el.dataset.tag || '';
      if (S.ui.filter.tag) trackFilterByTag(S.ui.filter.tag);
      deps.render?.();
    });
    el.addEventListener('dragstart', e => {
      const tag = el.dataset.tag;
      if (!tag) { e.preventDefault(); return; }
      S.ui.dragData = { type: 'tag', tag };
      e.dataTransfer.effectAllowed = 'copy';
    });
    el.addEventListener('dragend', () => {
      if (S.ui.dragData?.type === 'tag') S.ui.dragData = null;
    });
  });

  /* Filter selects */
  q('#f-phase')?.addEventListener('change', e => {
    S.ui.filter.phase = e.target.value;
    if (e.target.value) trackFilterByPhase(e.target.value);
    deps.render?.();
  });
  q('#f-team')?.addEventListener('change', e => {
    S.ui.filter.team = e.target.value;
    if (e.target.value) trackFilterByTeam(e.target.value);
    deps.render?.();
  });

  /* Add tag */
  q('#tf-add-btn')?.addEventListener('click', () => {
    const inp = q('#tf-add-inp');
    if (inp && inp.value.trim()) { deps.addTag?.(inp.value.trim()); }
  });
  q('#tf-add-inp')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') { const v = e.target.value.trim(); if (v) deps.addTag?.(v); }
  });
}
