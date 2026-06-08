/* ── IMPORT / CSV — parse, validate, execute, bind import modal ── */
import { S, nextId }                    from '../state.js';
import { q, qAll, showToast }           from '../utils.js';
import { parseDate, startMonday, dateStrYMD } from '../date.js';
import { PHASE_COLORS, PROJ_ACCENTS }   from '../constants.js';

/* Injected from router/persistence (B8) */
let _loadIndex  = null;
let _saveIndex  = null;
let _projKey    = id => 'roadmap-proj-' + id;
let _rerenderFn = null;
export function setImportDeps({ loadIndex, saveIndex, projKey, rerenderFn }) {
  _loadIndex  = loadIndex;
  _saveIndex  = saveIndex;
  if (projKey)    _projKey    = projKey;
  if (rerenderFn) _rerenderFn = rerenderFn;
}

/* ── refreshImportPreview ── */
export function refreshImportPreview() {
  const t = S.ui.modal;
  if (!t || !t.validatedRows) return;
  const okChecked = [...t.checkedRows].filter(i => !t.validatedRows[i]?._errors.length).length;
  const errCount  = t.validatedRows.filter(r => r._errors.length).length;
  const btn = q('#imp-confirm');
  if (btn) {
    btn.textContent = `✓ Import ${okChecked} task${okChecked !== 1 ? 's' : ''}`;
    btn.disabled = okChecked === 0;
    btn.style.opacity = okChecked === 0 ? '.45' : '1';
  }
  const sum = q('#imp-summary');
  if (sum) sum.innerHTML = `<b>${okChecked}</b> tasks sẽ import${errCount ? ` · <span class="err-c">${errCount} row lỗi bị bỏ qua</span>` : ''}`;
  qAll('.imp-tbl tr[data-row-i]').forEach(tr => {
    const i = parseInt(tr.dataset.rowI);
    const hasErr = t.validatedRows[i]?._errors.length > 0;
    if (!hasErr) tr.className = t.checkedRows.has(i) ? '' : 'row-skip';
  });
}

/* ── handleCSVFile ── */
export function handleCSVFile(file) {
  const t = S.ui.modal;
  if (!t) return;
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext !== 'csv' && file.type !== 'text/csv') {
    t.structError = `File không hợp lệ (nhận được .${ext}). Vui lòng chọn file .csv`;
    t.filename = ''; t.parsedData = null;
    _rerenderFn?.(); return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    let text = e.target.result;
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1); // strip BOM
    const result = parseCSVText(text);
    if (result.error) {
      t.structError = result.error; t.filename = ''; t.parsedData = null;
    } else {
      t.structError = null; t.filename = file.name; t.parsedData = result;
      if (!t.newProjName) t.newProjName = file.name.replace(/\.csv$/i, '').replace(/[-_]/g, ' ');
    }
    _rerenderFn?.();
  };
  reader.readAsText(file, 'UTF-8');
}

/* ── CSV Parsing ── */
function parseCSVText(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) return { error: 'File CSV rỗng.' };
  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  if (!headers.includes('task_name')) return { error: `Thiếu cột bắt buộc "task_name". Cột hiện có: ${headers.join(', ')}` };
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const vals = parseCSVLine(lines[i]);
    const row  = {};
    headers.forEach((h, j) => { row[h] = (vals[j] || '').trim(); });
    rows.push(row);
  }
  if (!rows.length) return { error: 'File CSV không có dòng dữ liệu (chỉ có header).' };
  return { headers, rows };
}

function parseCSVLine(line) {
  const res = []; let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { if (inQ && line[i + 1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
    else if (c === ',' && !inQ) { res.push(cur); cur = ''; }
    else cur += c;
  }
  res.push(cur); return res;
}

/* ── Validation ── */
export function validateCSVRows(rows, cfgStart, cfgEnd) {
  const startMon = cfgStart ? startMonday(cfgStart) : null;
  const endDate  = cfgEnd   ? parseDate(cfgEnd)     : null;
  return rows.map(row => {
    const r = { ...row, _errors: [], _weekStart: null, _weekDur: 1 };
    if (!r.task_name) { r._errors.push('Thiếu task_name'); return r; }
    const hasDates = r.start_date || r.end_date;
    if (!hasDates) return r; // backlog — OK
    let sd = null, ed = null;
    if (r.start_date) { try { sd = parseDate(r.start_date); if (isNaN(sd.getTime())) sd = null; } catch(e) {} if (!sd) r._errors.push('start_date không hợp lệ'); }
    if (r.end_date)   { try { ed = parseDate(r.end_date);   if (isNaN(ed.getTime())) ed = null; } catch(e) {} if (!ed) r._errors.push('end_date không hợp lệ'); }
    if (sd && ed && sd > ed) r._errors.push('start_date sau end_date');
    if (sd && startMon && sd < startMon) r._errors.push('start_date trước ngày bắt đầu project');
    if (ed && endDate && ed > new Date(endDate.getTime() + 7 * 86400000)) r._errors.push('end_date vượt ngoài timeline');
    if (!r._errors.length && sd && startMon) {
      const diffDays = (sd - startMon) / 86400000;
      r._weekStart = Math.max(1, Math.floor(diffDays / 7) + 1);
      if (ed) {
        const diffEnd = (ed - startMon) / 86400000;
        r._weekDur = Math.max(1, Math.floor(diffEnd / 7) + 1 - r._weekStart + 1);
      }
    }
    return r;
  });
}

/* ── Execute Import ── */
export function executeCSVImport() {
  const t = S.ui.modal;
  if (!t) return;
  const { targetId, mode, newProjName, validatedRows, checkedRows, cfgStart, cfgEnd } = t;
  const rowsToImport = validatedRows.filter((_, i) => checkedRows.has(i) && !validatedRows[i]._errors.length);
  if (!rowsToImport.length) return;

  let projId, projData;
  if (targetId === 'new') {
    projId   = 'proj_' + Date.now();
    projData = { cfg: { title: newProjName || 'Imported Project', subtitle: '', start: cfgStart, end: cfgEnd }, phases: [], teams: [], tasks: [], tags: ['tracking','UX','tech','growth','research'], _nextId: 1 };
  } else {
    projId = targetId;
    try { const raw = localStorage.getItem(_projKey(projId)); projData = raw ? JSON.parse(raw) : null; } catch(e) {}
    if (!projData) { showToast('Không tìm thấy project!'); return; }
    if (mode === 'replace') { projData.phases = []; projData.teams = []; projData.tasks = []; projData._nextId = 1; }
  }

  let nid = projData._nextId || 1;
  const nxtId = () => nid++;
  const phaseMap = {}, teamMap = {};
  (projData.phases || []).forEach(p  => { phaseMap[p.name.toLowerCase()] = p.id; });
  (projData.teams  || []).forEach(tm => { teamMap[tm.name.toLowerCase()] = tm.id; });

  const teamIcons = ['package','code','heart','bar','users','star','globe','target'];
  rowsToImport.forEach(row => {
    const pn = (row.phase_name?.trim() || 'Uncategorized').toLowerCase();
    if (!phaseMap[pn]) {
      const pid = nxtId();
      const ci  = Object.keys(phaseMap).length % PHASE_COLORS.length;
      projData.phases.push({ id: pid, name: row.phase_name?.trim() || 'Uncategorized', startWeek: 1, endWeek: 4, color: PHASE_COLORS[ci], scope: '', outputs: [] });
      phaseMap[pn] = pid;
    }
    if (row.team_name?.trim()) {
      const tn = row.team_name.trim().toLowerCase();
      if (!teamMap[tn]) {
        const tid = nxtId();
        const ci  = Object.keys(teamMap).length;
        projData.teams.push({ id: tid, name: row.team_name.trim(), icon: teamIcons[ci % teamIcons.length], color: PROJ_ACCENTS[ci % PROJ_ACCENTS.length] });
        teamMap[tn] = tid;
      }
    }
  });

  rowsToImport.forEach(row => {
    const phaseId = phaseMap[(row.phase_name?.trim() || 'Uncategorized').toLowerCase()] || null;
    const teamId  = row.team_name?.trim() ? (teamMap[row.team_name.trim().toLowerCase()] || null) : null;
    const tags    = row.tags ? row.tags.split(/[;,|]/).map(s => s.trim()).filter(Boolean) : [];
    projData.tasks.push({ id: nxtId(), name: row.task_name, phaseId, teamId, startWeek: row._weekStart || null, dur: row._weekDur || 1, tags, desc: row.description || '' });
  });

  /* Auto-fit phase ranges to cover their tasks */
  projData.phases.forEach(phase => {
    const pt = projData.tasks.filter(t2 => t2.phaseId === phase.id && t2.startWeek !== null);
    if (pt.length) {
      phase.startWeek = Math.min(...pt.map(t2 => t2.startWeek));
      phase.endWeek   = Math.max(...pt.map(t2 => t2.startWeek + t2.dur - 1));
    }
  });
  projData._nextId = nid;

  try { localStorage.setItem(_projKey(projId), JSON.stringify(projData)); }
  catch(e) { showToast('Lỗi lưu dữ liệu — dung lượng đầy?'); return; }

  const idx = _loadIndex?.() || [];
  const ex  = idx.find(p => p.id === projId);
  const statsObj = { phases: projData.phases.length, tasks: projData.tasks.length, sched: projData.tasks.filter(t2 => t2.startWeek !== null).length, start: projData.cfg.start, end: projData.cfg.end };
  if (ex) { ex.updatedAt = Date.now(); ex.stats = statsObj; }
  else idx.push({ id: projId, name: projData.cfg.title, subtitle: '', accent: t.newProjAccent || '#D0A052', updatedAt: Date.now(), stats: statsObj });
  _saveIndex?.(idx);

  S.ui.modal = null;
  const cnt = rowsToImport.length;
  showToast(`✓ Đã import ${cnt} task${cnt !== 1 ? 's' : ''} · ${projData.phases.length} phases`);
  location.hash = '#project-' + projId;
}

/* ── Download Template ── */
export function downloadCSVTemplate() {
  const now  = new Date();
  const fmt  = d => dateStrYMD(d);
  const addW = w => { const d = new Date(now); d.setDate(d.getDate() + w * 7); return fmt(d); };
  const headers = ['task_name','phase_name','team_name','start_date','end_date','tags','description'];
  const rows = [
    ['User Research',        'Discovery','Product', addW(0),  addW(2),  'ux;research','Phỏng vấn người dùng'],
    ['Competitive Analysis', 'Discovery','Product', addW(2),  addW(4),  'research',   'Phân tích đối thủ'],
    ['Wireframes',           'Design',   'Design',  addW(4),  addW(7),  'ux',         'Thiết kế wireframe chính'],
    ['Prototype v1',         'Design',   'Design',  addW(7),  addW(10), 'ux',         'Prototype tương tác'],
    ['Backend API',          'Build',    'Eng',     addW(10), addW(14), 'tech',       'Xây dựng REST API'],
    ['Frontend',             'Build',    'Eng',     addW(12), addW(16), 'tech',       ''],
    ['Write spec',           '',         '',        '',       '',       '',           'Chưa có lịch - sẽ vào Backlog'],
    ['Launch plan',          '',         'Product', '',       '',       'growth',     'Kế hoạch ra mắt'],
  ];
  const csvEsc = v => (v.includes(',') || v.includes('"') || v.includes('\n')) ? `"${v.replace(/"/g, '""')}"` : v;
  const csv  = [headers.join(','), ...rows.map(r => r.map(csvEsc).join(','))].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href = url; a.download = 'roadmap-template.csv'; a.click();
  URL.revokeObjectURL(url);
}

/* ── bindImportModal ── */
export function bindImportModal() {
  const t = S.ui.modal;
  if (!t || t.type !== 'import') return;

  const close = () => { S.ui.modal = null; _rerenderFn?.(); };
  q('#m-cancel')?.addEventListener('click', close);
  q('#modal-bg')?.addEventListener('click', e => { if (e.target.id === 'modal-bg') close(); });

  if (t.step === 1) {
    q('#imp-target')?.addEventListener('change', e => {
      t.targetId = e.target.value;
      if (!t.mode) t.mode = 'merge';
      _rerenderFn?.();
    });
    q('#imp-newname')?.addEventListener('input', e => { t.newProjName = e.target.value; });
    q('#imp-mode-merge')?.addEventListener('click', () => { t.mode = 'merge'; _rerenderFn?.(); });
    q('#imp-mode-replace')?.addEventListener('click', () => { t.mode = 'replace'; _rerenderFn?.(); });
    q('#imp-dl-tpl')?.addEventListener('click', downloadCSVTemplate);
    q('#imp-file-clear')?.addEventListener('click', () => {
      t.filename = ''; t.structError = null; t.parsedData = null; _rerenderFn?.();
    });
    const dz = q('#imp-dropzone');
    if (dz) {
      dz.addEventListener('click', () => q('#imp-file-input')?.click());
      dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag-over'); });
      dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));
      dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('drag-over'); const f = e.dataTransfer.files[0]; if (f) handleCSVFile(f); });
    }
    q('#imp-file-input')?.addEventListener('change', e => { const f = e.target.files[0]; if (f) handleCSVFile(f); });

    q('#imp-next')?.addEventListener('click', () => {
      if (!t.parsedData) return;
      t.targetId = q('#imp-target')?.value || 'new';
      const nameEl = q('#imp-newname');
      if (nameEl) t.newProjName = nameEl.value.trim() || t.newProjName;

      let cfgStart, cfgEnd;
      if (t.targetId !== 'new') {
        try { const raw = localStorage.getItem(_projKey(t.targetId)); if (raw) { const d = JSON.parse(raw); cfgStart = d.cfg?.start; cfgEnd = d.cfg?.end; } } catch(e) {}
      } else {
        const dates = t.parsedData.rows.flatMap(r => [r.start_date, r.end_date].filter(Boolean))
          .map(s => { try { const d = parseDate(s); return isNaN(d) ? null : d; } catch(e) { return null; } }).filter(Boolean);
        if (dates.length) {
          const mn  = new Date(Math.min(...dates.map(d => d.getTime())));
          const mx  = new Date(Math.max(...dates.map(d => d.getTime())));
          const dow = mn.getDay(); mn.setDate(mn.getDate() + (dow === 0 ? -6 : 1 - dow));
          cfgStart = dateStrYMD(mn); cfgEnd = dateStrYMD(mx);
        } else {
          const n = new Date(); const e2 = new Date(n); e2.setMonth(e2.getMonth() + 6);
          cfgStart = dateStrYMD(n); cfgEnd = dateStrYMD(e2);
        }
      }
      t.cfgStart       = cfgStart; t.cfgEnd = cfgEnd;
      t.validatedRows  = validateCSVRows(t.parsedData.rows, cfgStart, cfgEnd);
      t.checkedRows    = new Set(t.validatedRows.map((_, i) => i).filter(i => !t.validatedRows[i]._errors.length));
      t.step = 2;
      _rerenderFn?.();
    });

  } else {
    /* Step 2 */
    q('#imp-back')?.addEventListener('click', () => { t.step = 1; _rerenderFn?.(); });

    qAll('.imp-cb').forEach(cb => {
      cb.addEventListener('change', () => {
        const i = parseInt(cb.dataset.i);
        cb.checked ? t.checkedRows.add(i) : t.checkedRows.delete(i);
        refreshImportPreview();
      });
    });
    q('#imp-cb-all')?.addEventListener('change', e => {
      qAll('.imp-cb:not(:disabled)').forEach(cb => {
        cb.checked = e.target.checked;
        const i = parseInt(cb.dataset.i);
        e.target.checked ? t.checkedRows.add(i) : t.checkedRows.delete(i);
      });
      refreshImportPreview();
    });
    q('#imp-confirm')?.addEventListener('click', executeCSVImport);
  }
}

/* ── openImportModal ── */
export function openImportModal(fromProjId) {
  S.ui.modal = {
    type: 'import', step: 1,
    fromProject: fromProjId,
    targetId: fromProjId || 'new',
    mode: 'merge',
    newProjName: '', newProjAccent: '#D0A052',
    filename: '', parsedData: null,
    validatedRows: null, checkedRows: null,
    cfgStart: null, cfgEnd: null, structError: null,
  };
  _rerenderFn?.();
}
