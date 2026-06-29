/* ── EVENTS / BIND / LAYOUT — scope resize handle, sidebar collapse, row toggles ── */
import { S } from '../../state.js';
import { q, qAll } from '../../utils.js';
import { loadRowState, saveRowState, saveSidebarState } from '../../storage.js';
import { trackCollapseSidebar, trackExpandSidebar } from '../../tracking/sidebar.js';

export function bindLayout(deps) {
  /* Scope row resize handle */
  const scopeHandle = q('#scope-resize-handle');
  if (scopeHandle) {
    let startY = 0, startH = 0;
    const onMove = e => {
      const dy = (e.clientY || e.touches?.[0]?.clientY || startY) - startY;
      S.cfg.scopeRowHeight = Math.max(60, startH + dy);
      qAll('.scope-block, .scope-gap').forEach(el => { el.style.height = S.cfg.scopeRowHeight + 'px'; });
      qAll('[data-scope-id]').forEach(el => { el.style.height = (S.cfg.scopeRowHeight - 18) + 'px'; });
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      scopeHandle.classList.remove('dragging');
      deps.render?.();
    };
    scopeHandle.addEventListener('mousedown', e => {
      e.preventDefault();
      startY = e.clientY;
      startH = S.cfg.scopeRowHeight || 100;
      scopeHandle.classList.add('dragging');
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  /* Sidebar collapse */
  q('#sb-toggle')?.addEventListener('click', () => { trackCollapseSidebar(); saveSidebarState('collapsed'); deps.render?.(); });
  q('#sb-rail-btn')?.addEventListener('click', () => { trackExpandSidebar(); saveSidebarState('expanded'); deps.render?.(); });

  /* Row collapse toggles */
  q('#scope-toggle')?.addEventListener('click', () => {
    const rs = loadRowState();
    rs.scope = rs.scope === 'collapsed' ? 'expanded' : 'collapsed';
    saveRowState(rs);
    deps.render?.(true);
  });
  q('#output-toggle')?.addEventListener('click', () => {
    const rs = loadRowState();
    rs.output = rs.output === 'collapsed' ? 'expanded' : 'collapsed';
    saveRowState(rs);
    deps.render?.(true);
  });
}
