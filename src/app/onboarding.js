/* ── ONBOARDING — first-run tooltip walkthrough for new empty projects ── */
import { S } from './state.js';
import { q } from './utils.js';
import { t } from './i18n.js';
import { trackViewOnboarding, trackSkipOnboarding, trackCompleteOnboarding } from './tracking/onboarding.js';

const ONB_KEY = 'aroadmap_onboarded';

function getSteps() {
  return [
    { sel: null,          pos: 'center', title: t('onboarding.step1Title'), body: t('onboarding.step1Body') },
    { sel: '#btn-add-new',pos: 'bottom', title: t('onboarding.step2Title'), body: t('onboarding.step2Body') },
    { sel: '.tl-area',    pos: 'left',   title: t('onboarding.step3Title'), body: t('onboarding.step3Body') },
    { sel: null,          pos: 'center', title: t('onboarding.step4Title'), body: t('onboarding.step4Body'), last: true },
  ];
}

let onbStep   = 0;
let onbActive = false;

export function startOnboarding() {
  if (onbActive) return;
  try { if (localStorage.getItem(ONB_KEY)) return; } catch(e) { return; }
  if (S.phases.length || S.teams.length || S.tasks.length) return;
  onbStep   = 0;
  onbActive = true;
  trackViewOnboarding(getSteps().length);
  showStep();
}

export function stopOnboarding() {
  try { localStorage.setItem(ONB_KEY, '1'); } catch(e) {}
  onbActive = false;
  const root = document.getElementById('onb-root');
  if (root) root.innerHTML = '';
}

function showStep() {
  const root = document.getElementById('onb-root');
  if (!root) return;
  const steps = getSteps();
  const step  = steps[onbStep];
  if (!step) { stopOnboarding(); return; }

  const total  = steps.length;
  let spotHTML = '';
  let tipStyle = '';

  if (step.sel) {
    const el  = q(step.sel);
    const PAD = 8;
    if (el) {
      const r    = el.getBoundingClientRect();
      const rTop = r.top  - PAD;
      const rL   = r.left - PAD;
      const rW   = r.width  + PAD * 2;
      const rH   = r.height + PAD * 2;
      spotHTML = `<div class="onb-spot" style="top:${rTop}px;left:${rL}px;width:${rW}px;height:${rH}px"></div>`;
      if (step.pos === 'bottom') {
        const tl = Math.min(Math.max(12, r.left), window.innerWidth - 320);
        tipStyle = `top:${r.bottom + 14}px;left:${tl}px`;
      } else if (step.pos === 'left') {
        tipStyle = `top:${Math.max(12, r.top)}px;right:${window.innerWidth - r.left + 16}px`;
      } else {
        tipStyle = `top:${Math.max(12, r.top)}px;left:${r.right + 16}px`;
      }
    }
  } else {
    spotHTML = `<div class="onb-dim"></div>`;
    tipStyle = `top:50%;left:50%;transform:translate(-50%,-50%)`;
  }

  const dots = steps.map((_, i) =>
    `<div class="onb-dot${i === onbStep ? ' cur' : ''}"></div>`
  ).join('');

  root.innerHTML = `<div class="onb-overlay" id="onb-overlay">
    ${spotHTML}
    <div class="onb-tip" style="${tipStyle}" role="dialog" aria-label="${t('onboarding.stepLabel', { n: onbStep + 1 })}">
      <div class="onb-hd">
        <span class="onb-badge">${t('onboarding.stepBadge', { n: onbStep + 1, total })}</span>
      </div>
      <div class="onb-ttl">${step.title}</div>
      <p class="onb-bdy">${step.body}</p>
      <div class="onb-ft">
        <div class="onb-dots">${dots}</div>
        <div class="onb-acts">
          ${!step.last ? `<button class="onb-skip" id="onb-skip">${t('onboarding.skip')}</button>` : ''}
          <button class="onb-btn" id="onb-next">${step.last ? t('onboarding.start') : t('onboarding.next')}</button>
        </div>
      </div>
    </div>
  </div>`;

  q('#onb-next')?.addEventListener('click', () => {
    onbStep++;
    if (onbStep >= steps.length) { trackCompleteOnboarding(steps.length); stopOnboarding(); } else showStep();
  });
  q('#onb-skip')?.addEventListener('click', () => {
    trackSkipOnboarding(onbStep, steps.length, 'skip_button');
    stopOnboarding();
  });
  q('#onb-overlay')?.addEventListener('click', e => {
    if (!e.target.closest('.onb-tip')) {
      trackSkipOnboarding(onbStep, steps.length, 'backdrop');
      stopOnboarding();
    }
  });
}
