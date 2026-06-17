/* ── ONBOARDING — first-run tooltip walkthrough for new empty projects ── */
import { S } from './state.js';
import { q } from './utils.js';

const ONB_KEY = 'aroadmap_onboarded';

const STEPS = [
  {
    sel:   null,
    pos:   'center',
    title: 'Chào mừng đến Aroadmap!',
    body:  'Đây là project timeline của bạn. Hãy bắt đầu với 3 bước đơn giản để tạo roadmap đầu tiên.',
  },
  {
    sel:   '#btn-add-new',
    pos:   'bottom',
    title: 'Tạo phases & teams',
    body:  'Click <strong>Add</strong> để tạo phases (giai đoạn dự án) và teams (nhóm làm việc). Mỗi team sẽ có một hàng riêng trên timeline.',
  },
  {
    sel:   '.tl-area',
    pos:   'left',
    title: 'Xếp lịch tasks',
    body:  'Kéo tasks từ sidebar trái sang đây để xếp lịch theo tuần. Click task để chỉnh sửa chi tiết.',
  },
  {
    sel:   null,
    pos:   'center',
    title: 'Sẵn sàng rồi! 🎉',
    body:  'Bắt đầu bằng cách click <strong>Add → Phase</strong> để tạo giai đoạn đầu tiên của dự án.',
    last:  true,
  },
];

let onbStep   = 0;
let onbActive = false;

export function startOnboarding() {
  if (onbActive) return;
  try { if (localStorage.getItem(ONB_KEY)) return; } catch(e) { return; }
  if (S.phases.length || S.teams.length || S.tasks.length) return;
  onbStep   = 0;
  onbActive = true;
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
  const step = STEPS[onbStep];
  if (!step) { stopOnboarding(); return; }

  const total  = STEPS.length;
  let spotHTML = '';
  let tipStyle = '';

  if (step.sel) {
    const el  = q(step.sel);
    const PAD = 8;
    if (el) {
      const r = el.getBoundingClientRect();
      const t = r.top  - PAD, l = r.left - PAD;
      const w = r.width + PAD * 2, h = r.height + PAD * 2;
      spotHTML = `<div class="onb-spot" style="top:${t}px;left:${l}px;width:${w}px;height:${h}px"></div>`;
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

  const dots = STEPS.map((_, i) =>
    `<div class="onb-dot${i === onbStep ? ' cur' : ''}"></div>`
  ).join('');

  root.innerHTML = `<div class="onb-overlay" id="onb-overlay">
    ${spotHTML}
    <div class="onb-tip" style="${tipStyle}" role="dialog" aria-label="Hướng dẫn bước ${onbStep + 1}">
      <div class="onb-hd">
        <span class="onb-badge">Bước ${onbStep + 1} / ${total}</span>
      </div>
      <div class="onb-ttl">${step.title}</div>
      <p class="onb-bdy">${step.body}</p>
      <div class="onb-ft">
        <div class="onb-dots">${dots}</div>
        <div class="onb-acts">
          ${!step.last ? `<button class="onb-skip" id="onb-skip">Bỏ qua</button>` : ''}
          <button class="onb-btn" id="onb-next">${step.last ? 'Bắt đầu!' : 'Tiếp →'}</button>
        </div>
      </div>
    </div>
  </div>`;

  q('#onb-next')?.addEventListener('click', () => {
    onbStep++;
    if (onbStep >= STEPS.length) stopOnboarding(); else showStep();
  });
  q('#onb-skip')?.addEventListener('click', stopOnboarding);
  q('#onb-overlay')?.addEventListener('click', e => {
    if (!e.target.closest('.onb-tip')) stopOnboarding();
  });
}
