/* ── WEEK PICKER — calendar UI state + HTML builder + event binder ── */
import { parseDate, isoWeek, dateStrYMD, fmtWkpDate, fmtInput, wkpMonday } from './date.js';
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
  } else {
    if (mon.getTime() < wkp.startMon.getTime()) {
      wkp.endMon = new Date(wkp.startMon); wkp.startMon = mon;
    } else {
      wkp.endMon = mon;
    }
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

export function buildWkPicker() {
  const { yr, mo, startMon, endMon, step } = wkp;
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
    const dayCells = days.map(d => {
      let dc = 'wkp-day';
      if (d.getMonth() !== mo)            dc += ' out';
      if (d.getTime() === today.getTime()) dc += ' today';
      return `<span class="${dc}">${d.getDate()}</span>`;
    }).join('');
    return `<div class="${cls}" data-wmon="${dateStrYMD(mon)}"><span class="wkp-wn">W${isoWeek(mon)}</span>${dayCells}</div>`;
  }).join('');

  let footer = '';
  if (startTs && endTs) {
    const endSun = new Date(endTs + 6 * 86400000);
    let f1;
    if (wkp.phaseMode && wkp.cfgStart) {
      const cfgTs  = wkp.cfgStart.getTime();
      const sw     = Math.round((startTs - cfgTs) / (7 * 86400000)) + 1;
      const ew     = Math.round((endTs   - cfgTs) / (7 * 86400000)) + 1;
      f1 = t('weekpicker.range', { sw, ew, n: ew - sw + 1 });
    } else {
      const totalWks = Math.round((endTs - startTs) / (7 * 86400000)) + 1;
      f1 = t('weekpicker.rangeIso', { sw: isoWeek(startMon), ew: isoWeek(endMon), n: totalWks });
    }
    footer = `<div class="wkp-footer">
      <div class="wkp-f1">${f1}</div>
      <div class="wkp-f2">${fmtWkpDate(startMon)} – ${fmtWkpDate(endSun)}</div>
    </div>`;
  }

  const startVal = startMon ? fmtInput(startMon) : '';
  const endVal   = endMon   ? fmtInput(new Date(endTs + 6 * 86400000)) : '';
  const MO_ABBR  = t('weekpicker.monthsShort');

  const calBody = wkp.showMonthSel
    ? `<div class="wkp-yr-nav">
        <button class="wkp-nav-btn" id="wkp-yr-prev">‹</button>
        <span class="wkp-yr-lbl">${yr}</span>
        <button class="wkp-nav-btn" id="wkp-yr-next">›</button>
      </div>
      <div class="wkp-mo-grid">
        ${MO_ABBR.map((m, i) => `<div class="wkp-mo-cell${i === mo ? ' cur' : ''}" data-wmo="${i}">${m}</div>`).join('')}
      </div>`
    : `<div class="wkp-head">
        <span></span>${t('weekpicker.days').map(d => `<span>${d}</span>`).join('')}
      </div>
      <div id="wkp-rows">${rows}</div>
      ${footer}`;

  return `<div class="wkp">
    <div class="wkp-date-row">
      <div class="wkp-date-field${step === 'start' ? ' active' : ''}" id="wkp-field-start">
        <span class="wkp-date-lbl">${t('weekpicker.start')}</span>
        <input class="wkp-date-inp" id="wkp-inp-start" placeholder="DD/MM/YYYY" value="${startVal}" autocomplete="off">
      </div>
      <div class="wkp-date-arrow">→</div>
      <div class="wkp-date-field${step === 'end' ? ' active' : ''}" id="wkp-field-end">
        <span class="wkp-date-lbl">${t('weekpicker.end')}</span>
        <input class="wkp-date-inp" id="wkp-inp-end" placeholder="DD/MM/YYYY" value="${endVal}" autocomplete="off">
      </div>
    </div>
    <div class="wkp-nav">
      <button class="wkp-nav-btn" id="wkp-prev">‹</button>
      <span class="wkp-nav-lbl" id="wkp-mo-lbl">${t('weekpicker.monthsFull')[mo]} ${yr}</span>
      <button class="wkp-nav-btn" id="wkp-next">›</button>
    </div>
    ${calBody}
  </div>`;
}

export function bindWkPickerEvents() {
  q('#wkp-mo-lbl')?.addEventListener('click', () => { wkp.showMonthSel = !wkp.showMonthSel; wkpRefresh(); });
  qAll('.wkp-mo-cell').forEach(cell => {
    cell.addEventListener('click', () => { wkp.mo = +cell.dataset.wmo; wkp.showMonthSel = false; wkpRefresh(); });
  });
  q('#wkp-yr-prev')?.addEventListener('click', () => { wkp.yr--; wkpRefresh(); });
  q('#wkp-yr-next')?.addEventListener('click', () => { wkp.yr++; wkpRefresh(); });
  q('#wkp-prev')?.addEventListener('click', () => wkpNav(-1));
  q('#wkp-next')?.addEventListener('click', () => wkpNav(1));

  q('#wkp-field-start')?.addEventListener('click', () => { wkp.step = 'start'; wkpRefresh(); q('#wkp-inp-start')?.focus(); });
  q('#wkp-field-end')?.addEventListener('click',   () => { wkp.step = 'end';   wkpRefresh(); q('#wkp-inp-end')?.focus(); });

  ['start', 'end'].forEach(side => {
    const inp = q(`#wkp-inp-${side}`);
    if (!inp) return;
    inp.addEventListener('focus', () => { wkp.step = side; wkpRefresh(); q(`#wkp-inp-${side}`)?.focus(); });
    inp.addEventListener('input', () => {
      let v = inp.value.replace(/\D/g, '');
      if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
      if (v.length > 5) v = v.slice(0, 5) + '/' + v.slice(5, 9);
      inp.value = v;
    });
    inp.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== 'Tab') return;
      const parts = inp.value.trim().split('/');
      if (parts.length !== 3) return;
      const [d, m, y] = parts.map(Number);
      if (!d || !m || !y || y < 2000 || y > 2099) return;
      const date = new Date(y, m - 1, d);
      if (isNaN(date.getTime())) return;
      const mon = wkpMonday(date);
      wkp.yr = mon.getFullYear();
      wkp.mo = mon.getMonth();
      if (side === 'start') { wkp.startMon = mon; wkp.step = 'end'; }
      else                  { wkp.endMon   = mon; wkp.step = 'start'; }
      e.preventDefault();
      wkpRefresh();
    });
  });

  qAll('.wkp-row').forEach(row => {
    row.addEventListener('click', () => wkpClick(row.dataset.wmon));
    row.addEventListener('mouseenter', () => {
      if (wkp.step !== 'end' || !wkp.startMon) return;
      const hovTs   = parseDate(row.dataset.wmon).getTime();
      const startTs = wkp.startMon.getTime();
      qAll('.wkp-row').forEach(r => {
        const rTs = parseDate(r.dataset.wmon).getTime();
        r.classList.toggle('hov-range', rTs > startTs && rTs < hovTs);
        r.classList.toggle('hov-end',   rTs === hovTs);
      });
    });
  });
  q('#wkp-rows')?.addEventListener('mouseleave', () => {
    qAll('.wkp-row').forEach(r => r.classList.remove('hov-range', 'hov-end'));
  });
}
