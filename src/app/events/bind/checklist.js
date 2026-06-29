/* ── EVENTS / BIND / CHECKLIST — context-menu items, scope textarea, output checklist ── */
import { S, nextId, pushHistory, phaseById } from '../../state.js';
import { q, qAll } from '../../utils.js';
import { trackEditPhaseScope, trackAddPhaseOutput, trackTogglePhaseOutputItem, trackDeletePhaseOutput } from '../../tracking/phase.js';

export function bindChecklist(deps) {
  /* Context menu action items */
  qAll('.ci[data-action]').forEach(el => {
    el.addEventListener('click', () => deps.handleAction?.(el.dataset.action));
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); deps.handleAction?.(el.dataset.action); }
    });
  });

  /* Scope textarea — live update, persist on blur */
  qAll('[data-scope-id]').forEach(el => {
    let dirty = false;
    el.addEventListener('focus', () => { dirty = false; });
    el.addEventListener('input', () => {
      if (!dirty) { pushHistory(); dirty = true; }
      const ph = phaseById(+el.dataset.scopeId);
      if (ph) ph.scope = el.value;
    });
    el.addEventListener('blur', () => {
      if (dirty) {
        const ph = phaseById(+el.dataset.scopeId);
        if (ph) trackEditPhaseScope(ph, S);
        setTimeout(() => deps.render?.(), 0);
      }
    });
  });

  /* Output checklist — add item */
  qAll('[data-add-chk]').forEach(el => {
    el.addEventListener('click', () => {
      const ph = phaseById(+el.dataset.addChk);
      if (!ph) return;
      pushHistory();
      if (!ph.outputs) ph.outputs = [];
      const newId = nextId();
      ph.outputs.push({ id: newId, text: '', done: false });
      S.ui._focusOutputId = newId;
      trackAddPhaseOutput('button', ph, S);
      deps.render?.();
    });
  });

  /* Output checklist — toggle done */
  qAll('[data-chk-toggle]').forEach(el => {
    el.addEventListener('change', () => {
      const [oid, pid] = el.dataset.chkToggle.split(':').map(Number);
      const ph = phaseById(pid);
      if (!ph) return;
      const o = ph.outputs?.find(x => x.id === oid);
      if (o) { pushHistory(); o.done = el.checked; trackTogglePhaseOutputItem(ph, S); deps.render?.(); }
    });
  });

  /* Output checklist — edit text */
  qAll('[data-chk-edit]').forEach(el => {
    el.addEventListener('input', () => {
      const [oid, pid] = el.dataset.chkEdit.split(':').map(Number);
      const ph = phaseById(pid);
      if (!ph) return;
      const o = ph.outputs?.find(x => x.id === oid);
      if (o) o.text = el.textContent;
    });
    el.addEventListener('blur', () => {
      const [oid, pid] = el.dataset.chkEdit.split(':').map(Number);
      const ph = phaseById(pid);
      if (!ph) return;
      const o = ph.outputs?.find(x => x.id === oid);
      if (o) { pushHistory(); o.text = el.textContent; }
    });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const [oid, pid] = el.dataset.chkEdit.split(':').map(Number);
        const ph = phaseById(pid);
        if (!ph) return;
        pushHistory();
        const cur = ph.outputs?.find(x => x.id === oid);
        if (cur) cur.text = el.textContent;
        const newId = nextId();
        const idx = ph.outputs.findIndex(x => x.id === oid);
        ph.outputs.splice(idx + 1, 0, { id: newId, text: '', done: false });
        S.ui._focusOutputId = newId;
        deps.render?.();
      }
    });
  });

  /* Output checklist — delete item */
  qAll('[data-del-chk]').forEach(el => {
    el.addEventListener('click', () => {
      const [oid, pid] = el.dataset.delChk.split(':').map(Number);
      const ph = phaseById(pid);
      if (!ph) return;
      pushHistory();
      ph.outputs = ph.outputs?.filter(x => x.id !== oid);
      trackDeletePhaseOutput(ph, S);
      deps.render?.();
    });
  });

  /* Output paste → auto todo-list */
  qAll('[data-paste-ph]').forEach(ta => {
    ta.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const val = ta.value.trim();
        if (!val) return;
        const ph = phaseById(+ta.dataset.pastePh);
        if (!ph) return;
        pushHistory();
        if (!ph.outputs) ph.outputs = [];
        ph.outputs.push({ id: nextId(), text: val, done: false });
        ta.value = '';
        deps.render?.();
      }
    });
    ta.addEventListener('paste', e => {
      e.preventDefault();
      const text  = (e.clipboardData || window.clipboardData).getData('text');
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (!lines.length) return;
      const ph = phaseById(+ta.dataset.pastePh);
      if (!ph) return;
      pushHistory();
      if (!ph.outputs) ph.outputs = [];
      lines.forEach(line => ph.outputs.push({ id: nextId(), text: line, done: false }));
      deps.render?.();
    });
  });

  /* Auto-focus newly created output item */
  if (S.ui._focusOutputId != null) {
    const focusId = S.ui._focusOutputId;
    S.ui._focusOutputId = null;
    const target = [...qAll('[data-chk-edit]')].find(n => +n.dataset.chkEdit.split(':')[0] === focusId);
    if (target) {
      target.focus();
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(target);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }
}
