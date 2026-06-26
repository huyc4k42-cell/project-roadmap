/* ── WEEK PICKER — calendar UI state + HTML builder + event binder ── */
import { parseDate, isoWeek, dateStrYMD, fmtInput, wkpMonday } from './date.js';
import { t } from './i18n.js';
import { q, qAll } from './utils.js';

export let wkp = {
  yr: new Date().getFullYear(),
  mo: new Date().getMonth(),
  startMon: null, endMon: null,
  step: 'start',
  showMonthSel: false,
  phaseMode: false,
  cfgStart: null,
  popOpen: false,
  popAnchor: null,
  inputErr: { start: null, end: null },
  npPreset: null,  // null | '4w' | '1m' | '3m' | '6m' | 'custom'
};

export function wkpNav(dir) {
  wkp.mo += dir;
  if (wkp.mo > 11) { wkp.mo = 0; wkp.yr++; }
  if (wkp.mo < 0)  { wkp.mo = 11; wkp.yr--; }
  wkpRefresh();
}

export function wkpClick(monStr) {
  const mon = parseDate(monStr);
  if (wkp.step === 'start' || !wkp.startMon) {
    wkp.startMon = mon;
    if (!wkp.endMon || mon.getTime() >= wkp.endMon.getTime()) wkp.endMon = null;
    wkp.step = 'end';
    wkp.popAnchor = 'end';
    wkp.popOpen = true;
  } else {
    if (mon.getTime() < wkp.startMon.getTime()) {
      wkp.endMon = new Date(wkp.startMon); wkp.startMon = mon;
    } else {
      wkp.endMon = mon;
    }
    wkp.popOpen = false;
    wkp.step = 'start';
  }
  wkpRefresh();
}

/* wkpRefresh and bindWkPickerEvents are mutually dependent — both defined below.
   renderModal must be injected to avoid a circular dep with modals.js */
let _renderModal = null;
export function setRenderModal(fn) { _renderModal = fn; }

export function wkpRefresh() {
  const el = q('.wkp');
  if (!el) { _renderModal?.(); return; }
  const tmp = document.createElement('div');
  tmp.innerHTML = buildWkPicker();
  el.replaceWith(tmp.firstElementChild);
  bindWkPickerEvents();
}

/* ── Internal: build popover calendar ── */
function _buildWkpPopover() {
  const { yr, mo, startMon, endMon } = wkp;
  const today   = new Date(); today.setHours(0, 0, 0, 0);
  const startTs = startMon ? startMon.getTime() : null;
  const endTs   = endMon   ? endMon.getTime()   : null;

  let cursor  = wkpMonday(new Date(yr, mo, 1));
  const lastDay = new Date(yr, mo + 1, 0);
  const weeks = [];
  while (cursor <= lastDay) {
    const mon  = new Date(cursor);
    const days = Array.from({ length: 7 }, () => {
      const d = new Date(cursor); cursor.setDate(cursor.getDate() + 1); return d;
    });
    weeks.push({ mon, days });
  }

  const rows = weeks.map(({ mon, days }) => {
    const monTs = mon.getTime();
    let cls = 'wkp-row';
    if (startTs && monTs === startTs) cls += ' w-start';
    if (endTs   && monTs === endTs)   cls += ' w-end';
    if (startTs && endTs && monTs > startTs && monTs < endTs) cls += ' in-range';
    const isSelected = (startTs && monTs === startTs) || (endTs && monTs === endTs);
    const dayCells = days.map(d => {
      let dc = 'wkp-day';
      if (d.getMonth() !== mo)            dc += ' out';
      if (d.getTime() === today.getTime()) dc += ' today';
      return `<span class="${dc}">${d.getDate()}</span>`;
    }).join('');
    return `<div class="${cls}" data-wmon="${dateStrYMD(mon)}" role="gridcell" aria-selected="${isSelected}">${dayCells}</div>`;
  }).join('');

  const calBody = wkp.showMonthSel
    ? `<div class="wkp-yr-nav">
        <button class="wkp-nav-btn" id="wkp-yr-prev">‹</button>
        <span class="wkp-yr-lbl">${yr}</span>
        <button class="wkp-nav-btn" id="wkp-yr-next">›</button>
      </div>
      <div class="wkp-mo-grid">
        ${t('weekpicker.monthsShort').map((m, i) => `<div class="wkp-mo-cell${i === mo ? ' cur' : ''}" data-wmo="${i}">${m}</div>`).join('')}
      </div>`
    : `<div class="wkp-head">
        ${t('weekpicker.days').map(d => `<span>${d}</span>`).join('')}
      </div>
      <div id="wkp-rows" role="grid">${rows}</div>`;

  return `<div class="wkp-popover">
    <div class="wkp-step-instr">${wkp.step === 'start' ? t('weekpicker.stepStart') : t('weekpicker.stepEnd')}</div>
    <div class="wkp-nav">
      <button class="wkp-nav-btn" id="wkp-prev">‹</button>
      <span class="wkp-nav-lbl" id="wkp-mo-lbl">${t('weekpicker.monthsFull')[mo]} ${yr}</span>
      <button class="wkp-nav-btn" id="wkp-next">›</button>
    </div>
    ${calBody}
  </div>`;
}

/* ── Internal: build compact date-row + summary + optional popover ── */
function _buildWkpCompact() {
  const { startMon, endMon, step } = wkp;
  const startVal = startMon ? fmtInput(startMon) : '';
  const endTs    = endMon   ? endMon.getTime()   : null;
  const endVal   = endMon   ? fmtInput(new Date(endTs + 6 * 86400000)) : '';

  const startActive = wkp.popOpen && step === 'start' ? ' wkp-field-active' : '';
  const endActive   = wkp.popOpen && step === 'end'   ? ' wkp-field-active' : '';

  const startErrHtml = wkp.inputErr.start
    ? `<div class="wkp-date-err">${wkp.inputErr.start}</div>` : '';
  const endErrHtml   = wkp.inputErr.end
    ? `<div class="wkp-date-err">${wkp.inputErr.end}</div>` : '';

  let summaryHtml = '';
  if (startMon && endMon) {
    const startTs   = startMon.getTime();
    const totalWks  = Math.round((endTs - startTs) / (7 * 86400000)) + 1;
    summaryHtml = `<div class="wkp-summary">W${isoWeek(startMon)} → W${isoWeek(endMon)} · ${totalWks} tuần / ${fmtInput(startMon)} – ${fmtInput(endMon)}</div>`;
  }

  const popoverHtml = wkp.popOpen ? _buildWkpPopover() : '';

  return `<div class="wkp-date-row">
      <div class="wkp-date-field${startActive}" id="wkp-field-start">
        <span class="wkp-date-lbl">${t('weekpicker.start')}</span>
        <input class="wkp-date-inp" id="wkp-inp-start" placeholder="DD/MM/YYYY" value="${startVal}" autocomplete="off">
      </div>
      ${startErrHtml}
      <div class="wkp-date-arrow">→</div>
      <div class="wkp-date-field${endActive}" id="wkp-field-end">
        <span class="wkp-date-lbl">${t('weekpicker.end')}</span>
        <input class="wkp-date-inp" id="wkp-inp-end" placeholder="DD/MM/YYYY" value="${endVal}" autocomplete="off">
      </div>
      ${endErrHtml}
    </div>
    ${summaryHtml}
    ${popoverHtml}`;
}

export function buildWkPicker() {
  return `<div class="wkp">${_buildWkpCompact()}</div>`;
}

/* ── Internal: bind events for compact date fields ── */
function _bindWkpCompactEvents() {
  q('#wkp-field-start')?.addEventListener('click', () => {
    wkp.popOpen = true;
    wkp.step = 'start';
    wkp.popAnchor = 'start';
    wkpRefresh();
    q('#wkp-inp-start')?.focus();
  });
  q('#wkp-field-end')?.addEventListener('click', () => {
    wkp.popOpen = true;
    wkp.step = 'end';
    wkp.popAnchor = 'end';
    wkpRefresh();
    q('#wkp-inp-end')?.focus();
  });

  ['start', 'end'].forEach(side => {
    const inp = q(`#wkp-inp-${side}`);
    if (!inp) return;

    // Auto-slash formatting
    inp.addEventListener('input', () => {
      let v = inp.value.replace(/\D/g, '');
      if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
      if (v.length > 5) v = v.slice(0, 5) + '/' + v.slice(5, 9);
      inp.value = v;
    });

    // Enter key: parse and commit with error feedback
    inp.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      const parts = inp.value.trim().split('/');
      if (parts.length !== 3) {
        wkp.inputErr[side] = t('weekpicker.invalidDate');
        wkpRefresh();
        return;
      }
      const [d, m, y] = parts.map(Number);
      if (!d || !m || !y || y < 2000 || y > 2099) {
        wkp.inputErr[side] = t('weekpicker.invalidDate');
        wkpRefresh();
        return;
      }
      const date = new Date(y, m - 1, d);
      if (isNaN(date.getTime())) {
        wkp.inputErr[side] = t('weekpicker.invalidDate');
        wkpRefresh();
        return;
      }
      wkp.inputErr[side] = null;
      const mon = wkpMonday(date);
      wkp.yr = mon.getFullYear();
      wkp.mo = mon.getMonth();
      if (side === 'start') {
        wkp.startMon = mon;
        wkp.step = 'end';
        wkp.popOpen = true;
      } else {
        wkp.endMon = mon;
        wkp.popOpen = false;
        wkp.step = 'start';
      }
      e.preventDefault();
      wkpRefresh();
    });

    // Blur: silent commit — ignore invalid, commit valid
    inp.addEventListener('blur', () => {
      const parts = inp.value.trim().split('/');
      if (parts.length !== 3) return;
      const [d, m, y] = parts.map(Number);
      if (!d || !m || !y || y < 2000 || y > 2099) return;
      const date = new Date(y, m - 1, d);
      if (isNaN(date.getTime())) return;
      const mon = wkpMonday(date);
      wkp.yr = mon.getFullYear();
      wkp.mo = mon.getMonth();
      if (side === 'start') {
        wkp.startMon = mon;
        wkp.step = 'end';
        wkp.popOpen = true;
      } else {
        wkp.endMon = mon;
        wkp.popOpen = false;
        wkp.step = 'start';
      }
      wkpRefresh();
    });
  });
}

/* ── Internal: bind events for popover (only called when popOpen) ── */
function _bindWkpPopoverEvents() {
  // Month nav
  q('#wkp-prev')?.addEventListener('click', () => {
    wkp.mo--;
    if (wkp.mo < 0) { wkp.mo = 11; wkp.yr--; }
    wkpRefresh();
  });
  q('#wkp-next')?.addEventListener('click', () => {
    wkp.mo++;
    if (wkp.mo > 11) { wkp.mo = 0; wkp.yr++; }
    wkpRefresh();
  });

  // Month label toggle
  q('#wkp-mo-lbl')?.addEventListener('click', () => {
    wkp.showMonthSel = !wkp.showMonthSel;
    wkpRefresh();
  });

  // Month selector cells
  qAll('.wkp-mo-cell').forEach(cell => {
    cell.addEventListener('click', () => {
      wkp.mo = +cell.dataset.wmo;
      wkp.showMonthSel = false;
      wkpRefresh();
    });
  });

  // Year nav (in month selector)
  q('#wkp-yr-prev')?.addEventListener('click', () => { wkp.yr--; wkpRefresh(); });
  q('#wkp-yr-next')?.addEventListener('click', () => { wkp.yr++; wkpRefresh(); });

  // Row click
  qAll('.wkp-row').forEach(row => {
    row.addEventListener('click', () => wkpClick(row.dataset.wmon));

    // Row hover: direct DOM class toggle, NO wkpRefresh
    row.addEventListener('mouseenter', () => {
      row.classList.add('hov-row');
      if (wkp.step !== 'end' || !wkp.startMon) return;
      const hovTs   = parseDate(row.dataset.wmon).getTime();
      const startTs = wkp.startMon.getTime();
      qAll('.wkp-row').forEach(r => {
        const rTs = parseDate(r.dataset.wmon).getTime();
        r.classList.toggle('hov-range', rTs > startTs && rTs < hovTs);
        r.classList.toggle('hov-end',   rTs === hovTs);
      });
    });
    row.addEventListener('mouseleave', () => {
      row.classList.remove('hov-row');
    });
  });

  // Remove hover classes when leaving the grid
  q('#wkp-rows')?.addEventListener('mouseleave', () => {
    qAll('.wkp-row').forEach(r => r.classList.remove('hov-range', 'hov-end', 'hov-row'));
  });

  // Outside-click closer (setTimeout to avoid self-close)
  setTimeout(() => {
    document.addEventListener('click', function _closer(e) {
      if (!e.target.closest('.wkp')) {
        wkp.popOpen = false;
        wkpRefresh();
      } else {
        document.addEventListener('click', _closer, { once: true });
      }
    }, { once: true });
  }, 0);

  // ESC key closer
  document.addEventListener('keydown', function _esc(e) {
    if (e.key === 'Escape') {
      wkp.popOpen = false;
      wkpRefresh();
      document.removeEventListener('keydown', _esc);
    }
  });

  // Arrow key navigation in popover
  q('#wkp-rows')?.addEventListener('keydown', e => {
    const rows = Array.from(qAll('.wkp-row'));
    const focused = document.activeElement?.closest('.wkp-row');
    const idx = focused ? rows.indexOf(focused) : -1;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = rows[idx + 1];
      if (next) next.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = rows[idx - 1];
      if (prev) prev.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      wkp.mo--;
      if (wkp.mo < 0) { wkp.mo = 11; wkp.yr--; }
      wkpRefresh();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      wkp.mo++;
      if (wkp.mo > 11) { wkp.mo = 0; wkp.yr++; }
      wkpRefresh();
    } else if (e.key === 'Enter' && focused) {
      e.preventDefault();
      wkpClick(focused.dataset.wmon);
    }
  });
}

export function bindWkPickerEvents() {
  _bindWkpCompactEvents();
  if (wkp.popOpen) _bindWkpPopoverEvents();
}

/* ══════════════════════════════════════════════════════════════════
   NEW-PROJECT DUAL CALENDAR (inline, not popover)
══════════════════════════════════════════════════════════════════ */

const NP_DOW = ['T2','T3','T4','T5','T6','T7','CN'];

function _buildNpMonth(year, month, startTs, endTs) {
  const header = `<div class="np-dow-row" aria-hidden="true">
    <span></span>
    ${NP_DOW.map((d, i) => `<span class="np-dow${i === 0 ? ' np-dow-mon' : ''}">${d}</span>`).join('')}
  </div>`;

  let cursor = wkpMonday(new Date(year, month, 1));
  const lastDay = new Date(year, month + 1, 0);
  const todayTs = (() => { const d = new Date(); d.setHours(0,0,0,0); return d.getTime(); })();
  const rows = [];

  while (cursor <= lastDay) {
    const weekMon = new Date(cursor);
    const monTs   = weekMon.getTime();
    let rowCls = 'np-cal-row';
    if (startTs && monTs === startTs) rowCls += ' np-row-start';
    if (endTs   && monTs === endTs)   rowCls += ' np-row-end';
    if (startTs && endTs && monTs > startTs && monTs < endTs) rowCls += ' np-row-range';

    const wn = isoWeek(weekMon);
    const cells = [];
    for (let i = 0; i < 7; i++) {
      const d    = new Date(cursor);
      const outM = d.getMonth() !== month;
      const isT  = d.getTime() === todayTs;
      cells.push(`<span class="np-day${outM ? ' np-out' : ''}${isT ? ' np-today' : ''}">${d.getDate()}</span>`);
      cursor.setDate(cursor.getDate() + 1);
    }

    rows.push(`<div class="${rowCls}" data-np-wmon="${dateStrYMD(weekMon)}" role="row" tabindex="-1">
      <span class="np-wn" aria-hidden="true">W${wn}</span>
      ${cells.join('')}
    </div>`);
  }

  return header + `<div class="np-cal-rows" role="rowgroup">${rows.join('')}</div>`;
}

export function buildNpDualCalendar() {
  const { yr, mo, startMon, endMon, step, npPreset } = wkp;
  const startTs = startMon ? startMon.getTime() : null;
  const endTs   = endMon   ? endMon.getTime()   : null;

  let yr2 = yr, mo2 = mo + 1;
  if (mo2 > 11) { mo2 = 0; yr2++; }

  const months = t('weekpicker.monthsFull');
  const head1  = months[mo]  + ' ' + yr;
  const head2  = months[mo2] + ' ' + yr2;

  const startVal = startMon ? fmtInput(startMon) : '';
  const endVal   = endMon   ? fmtInput(new Date(endTs + 6 * 86400000)) : '';
  const weeksVal = (startMon && endMon) ? Math.round((endTs - startTs) / (7 * 86400000)) : '';

  const startActive = step === 'start' ? ' np-f-active' : '';
  const endActive   = step === 'end'   ? ' np-f-active' : '';

  let hintHtml;
  if (!startMon) {
    hintHtml = t('weekpicker.stepStart');
  } else if (!endMon) {
    hintHtml = t('weekpicker.stepEnd');
  } else {
    const wks = Math.round((endTs - startTs) / (7 * 86400000));
    hintHtml = `<span class="np-range-summary">W${isoWeek(startMon)} → W${isoWeek(endMon)} · <b>${wks} tuần</b> / ${fmtInput(startMon)} – ${fmtInput(endMon)}</span>`;
  }

  return `<div class="np-wkp-wrap">
    <div class="np-date-row">
      <div class="np-date-f${startActive}" id="np-f-start">
        <span class="np-date-lbl">${t('weekpicker.start')}</span>
        <input class="np-date-inp" id="np-inp-start" placeholder="DD/MM/YYYY" value="${startVal}" autocomplete="off">
      </div>
      <div class="np-arrow">→</div>
      <div class="np-date-f${endActive}" id="np-f-end">
        <span class="np-date-lbl">${t('weekpicker.end')}</span>
        <input class="np-date-inp" id="np-inp-end" placeholder="DD/MM/YYYY" value="${endVal}" autocomplete="off">
      </div>
      <div class="np-weeks-wrap">
        <input class="np-weeks-inp" id="np-weeks-inp" type="number" min="1" max="260"
          aria-label="Số tuần" value="${weeksVal}" placeholder="—">
        <span class="np-weeks-lbl">TUẦN</span>
      </div>
    </div>
    <div class="np-cal-nav">
      <button class="np-nav-btn" id="np-prev" aria-label="Tháng trước">‹</button>
      <div class="np-cal-heads">
        <span class="np-cal-head">${head1}</span>
        <span class="np-cal-head">${head2}</span>
      </div>
      <button class="np-nav-btn" id="np-next" aria-label="Tháng sau">›</button>
    </div>
    <div class="np-dual-cal">
      <div role="grid" aria-label="Calendar tháng bắt đầu">${_buildNpMonth(yr, mo, startTs, endTs)}</div>
      <div role="grid" aria-label="Calendar tháng kết thúc">${_buildNpMonth(yr2, mo2, startTs, endTs)}</div>
    </div>
    <div class="np-cal-hint">${hintHtml}</div>
  </div>`;
}

export function wkpNpDayClick(wmonStr) {
  const mon = parseDate(wmonStr);
  if (wkp.step === 'start' || !wkp.startMon) {
    wkp.startMon = mon;
    if (!wkp.endMon || mon.getTime() >= wkp.endMon.getTime()) wkp.endMon = null;
    wkp.step = 'end';
  } else {
    if (mon.getTime() < wkp.startMon.getTime()) {
      wkp.endMon = new Date(wkp.startMon); wkp.startMon = mon;
    } else {
      wkp.endMon = mon;
    }
    wkp.step = 'start';
  }
  wkp.npPreset = 'custom';
  _renderModal?.();
}

export function applyNpPreset(key) {
  if (!wkp.startMon) {
    const today = new Date(); today.setHours(0,0,0,0);
    wkp.startMon = wkpMonday(today);
  }
  const s = wkp.startMon;
  if (key === '4w') {
    wkp.endMon = new Date(s.getTime() + 4 * 7 * 86400000);
  } else if (key === '1m') {
    const e = new Date(s); e.setMonth(e.getMonth() + 1);
    wkp.endMon = wkpMonday(e);
  } else if (key === '3m') {
    const e = new Date(s); e.setMonth(e.getMonth() + 3);
    wkp.endMon = wkpMonday(e);
  } else if (key === '6m') {
    const e = new Date(s); e.setMonth(e.getMonth() + 6);
    wkp.endMon = wkpMonday(e);
  }
  wkp.npPreset = key;
  _renderModal?.();
}

export function bindNpCalendarEvents() {
  q('#np-prev')?.addEventListener('click', () => {
    wkp.mo--; if (wkp.mo < 0) { wkp.mo = 11; wkp.yr--; }
    _renderModal?.();
  });
  q('#np-next')?.addEventListener('click', () => {
    wkp.mo++; if (wkp.mo > 11) { wkp.mo = 0; wkp.yr++; }
    _renderModal?.();
  });

  qAll('.np-cal-row').forEach(row => {
    row.addEventListener('click', () => wkpNpDayClick(row.dataset.npWmon));
    row.addEventListener('mouseenter', () => {
      if (wkp.step !== 'end' || !wkp.startMon) return;
      const hovTs   = parseDate(row.dataset.npWmon).getTime();
      const startTs = wkp.startMon.getTime();
      qAll('.np-cal-row').forEach(r => {
        const rTs = parseDate(r.dataset.npWmon).getTime();
        r.classList.toggle('np-row-hov-range', rTs > startTs && rTs < hovTs);
        r.classList.toggle('np-row-hov-end',   rTs === hovTs);
      });
    });
    row.addEventListener('mouseleave', () => {
      qAll('.np-cal-row').forEach(r => r.classList.remove('np-row-hov-range', 'np-row-hov-end'));
    });
  });

  ['start', 'end'].forEach(side => {
    const inp = q(`#np-inp-${side}`);
    if (!inp) return;
    inp.addEventListener('input', () => {
      let v = inp.value.replace(/\D/g, '');
      if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
      if (v.length > 5) v = v.slice(0, 5) + '/' + v.slice(5, 9);
      inp.value = v;
    });
    const _commit = (fromEnter, e) => {
      const parts = inp.value.trim().split('/');
      if (parts.length !== 3) return;
      const [d, m, y] = parts.map(Number);
      if (!d || !m || !y || y < 2000 || y > 2099) return;
      const date = new Date(y, m - 1, d);
      if (isNaN(date.getTime())) return;
      const mon = wkpMonday(date);
      wkp.yr = mon.getFullYear(); wkp.mo = mon.getMonth();
      if (side === 'start') { wkp.startMon = mon; wkp.step = 'end'; }
      else                  { wkp.endMon   = mon; wkp.step = 'start'; }
      wkp.npPreset = 'custom';
      if (fromEnter) e.preventDefault();
      _renderModal?.();
    };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') _commit(true, e); });
    inp.addEventListener('blur',    ()  => _commit(false));
  });

  q('#np-weeks-inp')?.addEventListener('change', e => {
    const n = parseInt(e.target.value);
    if (isNaN(n) || n < 1) return;
    if (!wkp.startMon) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      wkp.startMon = wkpMonday(today);
    }
    wkp.endMon   = new Date(wkp.startMon.getTime() + n * 7 * 86400000);
    wkp.npPreset = 'custom';
    _renderModal?.();
  });
}
