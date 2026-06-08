/* ── RENDER / TIMELINE — phase/week header + team rows + scope/output ── */
import { S, phaseById, phaseAt } from '../state.js';
import { esc }                   from '../utils.js';
import { totalWeeks, todayWeekFrac, weekDate, weekLabel, taskBarH } from '../date.js';
import { loadRowState }          from '../storage.js';
import { assignLanes }           from '../algorithms.js';
import { LANE_PAD, LANE_GAP }    from '../constants.js';
import { svgIcon }               from '../icons.js';

/* WW is set by render/index.js before calling buildTimeline */
export let WW = 64;
export function setWW(val) { WW = val; }

export function buildTimeline() {
  const tw      = totalWeeks(S.cfg);
  const twFrac  = todayWeekFrac(S.cfg);
  const rowState = loadRowState();

  /* ── Phase row ── */
  const sortedPhases = [...S.phases].sort((a, b) => a.startWeek - b.startWeek);
  let phCells = '';
  let w = 1;
  while (w <= tw) {
    const ph = phaseAt(w);
    if (ph) {
      const span   = Math.min(ph.endWeek, tw) - ph.startWeek + 1;
      const phIdx  = sortedPhases.findIndex(p => p.id === ph.id);
      const phTasks = S.tasks.filter(t => t.phaseId === ph.id);
      const phDone  = phTasks.filter(t => t.startWeek !== null).length;
      const phPct   = phTasks.length ? Math.round(phDone / phTasks.length * 100) : 0;
      phCells += `<div class="ph-cell" style="width:${span * WW}px;background:${ph.color}" data-phase-id="${ph.id}">
        <div class="ph-lh" data-ph-resize-left="${ph.id}" aria-label="Kéo để thay đổi ngày bắt đầu phase" role="slider" aria-orientation="horizontal"></div>
        <div class="ph-body" draggable="true" data-ph-drag="${ph.id}">
          <div class="ph-hd-row">
            <div class="ph-num">Phase ${phIdx + 1}</div>
            <div class="ph-wk-badge">${ph.endWeek - ph.startWeek + 1} tuần</div>
          </div>
          <div class="ph-name">${esc(ph.name)}</div>
          <div class="ph-dates">W${ph.startWeek}–${ph.endWeek} · ${weekLabel(ph.startWeek, S.cfg)} → ${weekLabel(ph.endWeek, S.cfg)}</div>
        </div>
        <div class="ph-rh" data-ph-resize-right="${ph.id}" aria-label="Kéo để thay đổi ngày kết thúc phase" role="slider" aria-orientation="horizontal"></div>
        ${phTasks.length ? `<div class="ph-prog" aria-label="${phPct}% tasks đã xếp lịch"><div class="ph-prog-fill" style="width:${phPct}%"></div></div>` : ''}
      </div>`;
      w = ph.endWeek + 1;
    } else {
      phCells += `<div class="ph-cell ph-gap" style="width:${WW}px"></div>`;
      w++;
    }
  }

  /* ── Month row ── */
  const MO_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let moCells = '';
  let prevMo = -1;
  for (let i = 1; i <= tw; i++) {
    const d  = weekDate(i, S.cfg);
    const mo = d.getMonth();
    if (mo !== prevMo) {
      let span = 0;
      for (let j = i; j <= tw; j++) {
        if (weekDate(j, S.cfg).getMonth() === mo) span++; else break;
      }
      moCells += `<div class="mo-cell" style="width:${span * WW}px">${MO_SHORT[mo]} ${d.getFullYear()}</div>`;
      prevMo = mo;
    }
  }

  /* ── Week row ── */
  let wkCells = '';
  for (let i = 1; i <= tw; i++) {
    const isCur = Math.floor(twFrac) === i;
    wkCells += `<div class="wk-c${isCur ? ' cur' : ''}">
      <span class="wn">W${i}</span>
      <span class="wd">${weekLabel(i, S.cfg)}</span>
    </div>`;
  }

  /* ── Team rows ── */
  const teamRows = S.teams.map(tm => buildTeamRow(tm, tw, twFrac)).join('');

  /* ── Scope row ── */
  const scopeH = S.cfg.scopeRowHeight || 100;
  let scopeTrack = '';
  let sv = 1;
  while (sv <= tw) {
    const ph = phaseAt(sv);
    if (ph) {
      const span = Math.min(ph.endWeek, tw) - ph.startWeek + 1;
      scopeTrack += `<div class="scope-block" style="width:${span * WW}px;height:${scopeH}px;border-left-color:${ph.color}">
        <textarea placeholder="Mô tả phạm vi phase..." data-scope-id="${ph.id}" style="height:${scopeH - 18}px">${esc(ph.scope || '')}</textarea>
      </div>`;
      sv = ph.endWeek + 1;
    } else {
      scopeTrack += `<div class="scope-gap" style="width:${WW}px;height:${scopeH}px"></div>`;
      sv++;
    }
  }

  /* ── Output row ── */
  let outTrack = '';
  let ov = 1;
  while (ov <= tw) {
    const ph = phaseAt(ov);
    if (ph) {
      const span  = Math.min(ph.endWeek, tw) - ph.startWeek + 1;
      const items = (ph.outputs || []).map(o => `
        <div class="chk-item" data-chk-id="${o.id}" data-chk-ph="${ph.id}">
          <input type="checkbox" ${o.done ? 'checked' : ''} data-chk-toggle="${o.id}:${ph.id}"/>
          <span class="chk-txt${o.done ? ' done' : ''}" contenteditable="true" data-chk-edit="${o.id}:${ph.id}">${esc(o.text)}</span>
          <button class="del-chk" data-del-chk="${o.id}:${ph.id}">×</button>
        </div>`).join('');
      outTrack += `<div class="output-block" style="width:${span * WW}px;border-left-color:${ph.color}">
        <div class="chk-list">${items}</div>
        <button class="add-chk" data-add-chk="${ph.id}">＋ Thêm output</button>
        <textarea class="output-paste-inp" data-paste-ph="${ph.id}" placeholder="Paste nhiều dòng → tự thêm vào danh sách..." rows="1"></textarea>
      </div>`;
      ov = ph.endWeek + 1;
    } else {
      outTrack += `<div class="output-gap" style="width:${WW}px;min-height:90px"></div>`;
      ov++;
    }
  }

  const isEmpty = S.phases.length === 0 && S.teams.length === 0;

  return `
<div class="tl-area" id="tl-area">
  <div class="tl-inner" id="tl-inner">
    <div class="tl-hdrs">
      <div class="ph-row">
        <div class="ph-stub">
          <button class="ph-add-btn" id="btn-add-phase2" aria-label="Thêm phase mới">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Thêm Phase
          </button>
        </div>
        <div class="ph-cells">${phCells}</div>
      </div>
      <div class="mo-row">
        <div class="mo-stub"></div>
        ${moCells}
      </div>
      <div class="wk-row">
        <div class="wk-stub">Tuần / Ngày</div>
        ${wkCells}
      </div>
    </div>
    <div class="tm-rows" id="tm-rows">
      ${teamRows}
      <div class="add-tm-row">
        <button class="add-tm-btn" id="add-tm-btn2">＋ Thêm nhóm</button>
        <div style="flex:1;background:var(--bg)"></div>
      </div>
    </div>
    <div class="scope-row${rowState.scope === 'collapsed' ? ' collapsed' : ''}" id="scope-row">
      <div class="scope-row-inner">
        <div class="row-lbl">
          <div class="row-lbl-top">
            <h3>Phase Scope</h3>
            <button class="row-toggle${rowState.scope === 'collapsed' ? ' collapsed' : ''}" id="scope-toggle" aria-label="Thu gọn/mở rộng Phase Scope" title="Thu gọn/mở rộng">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          </div>
          <p>Phạm vi &amp; mục tiêu</p>
        </div>
        <div class="row-track">${scopeTrack}</div>
      </div>
      <div class="scope-resize-handle" id="scope-resize-handle" title="Kéo để thay đổi chiều cao"></div>
    </div>
    <div class="output-row${rowState.output === 'collapsed' ? ' collapsed' : ''}" id="output-row">
      <div class="row-lbl">
        <div class="row-lbl-top">
          <h3>Output</h3>
          <button class="row-toggle${rowState.output === 'collapsed' ? ' collapsed' : ''}" id="output-toggle" aria-label="Thu gọn/mở rộng Output" title="Thu gọn/mở rộng">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>
        <p>Checklist đầu ra</p>
      </div>
      <div class="row-track">${outTrack}</div>
    </div>
    ${isEmpty ? `<div class="empty-state" role="status">
      <div class="empty-ico" aria-hidden="true">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="8" y2="14"/><line x1="12" y1="14" x2="16" y2="14"/></svg>
      </div>
      <div class="empty-title">Bắt đầu roadmap của bạn</div>
      <div class="empty-sub">Thêm Phase để xác định giai đoạn, sau đó tạo Nhóm và kéo Tasks vào timeline.</div>
      <div class="empty-actions">
        <button class="empty-btn empty-btn-primary" id="empty-add-phase">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Tạo Phase đầu tiên
        </button>
        <button class="empty-btn empty-btn-sec" id="empty-load-sample">Xem ví dụ mẫu</button>
      </div>
    </div>` : ''}
  </div>
</div>`;
}

export function buildTeamRow(tm, tw, twFrac) {
  const tasks       = S.tasks.filter(t => t.teamId === tm.id && t.startWeek !== null);
  const todayLeft   = (twFrac - 1) * WW;
  const todayInRange = twFrac >= 1 && twFrac <= tw + 1;

  const { assignments, numLanes, laneH } = assignLanes(tasks);
  const totalLaneH = laneH.reduce((s, h) => s + h, 0);
  const rowH = LANE_PAD * 2 + totalLaneH + Math.max(0, numLanes - 1) * LANE_GAP;

  const laneTop = [];
  let acc = LANE_PAD;
  for (let i = 0; i < laneH.length; i++) {
    laneTop[i] = acc;
    acc += laneH[i] + LANE_GAP;
  }

  let cells = '';
  for (let i = 1; i <= tw; i++) {
    const ph = phaseAt(i);
    cells += `<div class="trc${ph ? ' ph-bg' : ''}" style="height:${rowH}px" data-week="${i}" data-team="${tm.id}"></div>`;
  }

  const bars = tasks.map(t => {
    const lane  = assignments[t.id] ?? 0;
    const barH  = taskBarH(t);
    const top   = laneTop[lane] ?? LANE_PAD;
    const left  = (t.startWeek - 1) * WW;
    const width = Math.max(t.dur * WW - 3, WW - 3);
    const color = tm.color || '#D0A052';
    const ph    = t.phaseId ? phaseById(t.phaseId) : null;
    const longTitle = (t.name || '').length > 22;
    const tagsHtml  = t.tags?.length
      ? `<div class="tb-tags">${t.tags.slice(0, 4).map(tg => `<span class="tb-tag">${esc(tg)}</span>`).join('')}</div>`
      : '';
    return `<div class="tb${t.done ? ' tb-done' : ''}" draggable="true" data-task-id="${t.id}"
      style="left:${left}px;top:${top}px;width:${width}px;height:${barH}px;background:${color}cc;border-left:3px solid ${color}"
      title="${esc(t.name)}${ph ? ' · ' + esc(ph.name) : ''}${t.done ? ' (done)' : ''}">
      <div class="tb-lh" data-resize-left="${t.id}" aria-label="Kéo để thay đổi ngày bắt đầu" role="slider" aria-orientation="horizontal"></div>
      <div class="tb-top">
        <span class="tb-nm${longTitle ? ' wrap' : ''}">${esc(t.name)}</span>
        ${t.dur >= 2 ? `<span class="tb-dur">${t.dur}w</span>` : ''}
      </div>
      ${tagsHtml}
      <div class="tb-rh" data-resize="${t.id}" aria-label="Kéo để thay đổi thời lượng" role="slider" aria-orientation="horizontal"></div>
    </div>`;
  }).join('');

  const todayLine = todayInRange
    ? `<div class="today-line" style="left:${todayLeft}px;height:${rowH}px"></div>` : '';

  return `
<div class="tm-row" data-team-id="${tm.id}" style="min-height:${rowH}px">
  <div class="trl" data-team-id="${tm.id}" data-team-ctx="${tm.id}" style="min-height:${rowH}px">
    <div class="tm-ico" style="color:${tm.color || 'var(--gold)'}">${svgIcon(tm.icon || 'layers', 15)}</div>
    <span class="tm-nm">${esc(tm.name)}</span>
    <div class="team-drag-handle" data-team-drag="${tm.id}" draggable="true" title="Kéo để thay đổi thứ tự nhóm">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="9" cy="5" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="19" r="1"/></svg>
    </div>
  </div>
  <div class="trr" data-team="${tm.id}" style="height:${rowH}px">
    ${cells}${todayLine}${bars}
    ${tasks.length === 0 ? `<div class="tm-drop-hint">Drop tasks here</div>` : ''}
  </div>
</div>`;
}
