/* ── EXPORT / PDF — html2canvas + jsPDF export ── */
import { S }        from '../state.js';
import { logoUrl }  from '../icons.js';
import { t, getLang } from '../i18n.js';

/* html2canvas and jsPDF are loaded via CDN <script> tags at runtime.
   Access via window.html2canvas and window.jspdf. */

export async function exportPDF() {
  const el = document.getElementById('tl-inner');
  if (!el) return;

  /* Loading overlay */
  const ov = document.createElement('div');
  ov.className = 'exp-ol';
  ov.innerHTML = `<div class="exp-spin"></div><span>${t('pdf.exportingLabel')}</span>`;
  document.body.appendChild(ov);

  try {
    /* Monkey-patch getComputedStyle to strip oklch() values that html2canvas
       1.4.1 cannot parse. Chrome injects these for system colors in dark mode. */
    const _origGCS = window.getComputedStyle;
    const stripOklch = v => (typeof v === 'string' && v.includes('oklch')) ? 'transparent' : v;
    window.getComputedStyle = function() {
      const cs = _origGCS.apply(this, arguments);
      return new Proxy(cs, {
        get(target, prop) {
          if (prop === 'getPropertyValue') return name => stripOklch(target.getPropertyValue(name));
          if (prop === 'getPropertyPriority') return name => { try { return target.getPropertyPriority(name); } catch { return ''; } };
          const val = Reflect.get(target, prop);
          if (typeof prop === 'string' && typeof val === 'string') return stripOklch(val);
          return typeof val === 'function' ? val.bind(target) : val;
        },
      });
    };

    const bgColor = _origGCS(document.documentElement).getPropertyValue('--bg').trim() || '#080808';

    /* Expand textareas and output blocks before capture */
    const scopeAreas = el.querySelectorAll('.scope-block textarea');
    const scopeOrigH = [];
    scopeAreas.forEach((ta, i) => {
      scopeOrigH[i] = ta.style.height;
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
      ta.style.overflow = 'hidden';
    });
    const scopeBlocks = el.querySelectorAll('.scope-block');
    const scopeBlockOrigH = [];
    scopeBlocks.forEach((b, i) => { scopeBlockOrigH[i] = b.style.height; b.style.height = 'auto'; });
    const outBlocks = el.querySelectorAll('.output-block');
    const outBlockOrigH = [];
    outBlocks.forEach((b, i) => { outBlockOrigH[i] = b.style.minHeight || ''; b.style.minHeight = 'auto'; b.style.height = 'auto'; });

    let canvas;
    try {
      canvas = await window.html2canvas(el, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: bgColor,
        width:  el.scrollWidth,
        height: el.scrollHeight,
        windowWidth:  el.scrollWidth  + 300,
        windowHeight: el.scrollHeight + 100,
        x: 0, y: 0,
        scrollX: 0, scrollY: 0,
      });
    } finally {
      window.getComputedStyle = _origGCS;
      scopeAreas.forEach((ta, i) => { ta.style.height = scopeOrigH[i]; ta.style.overflow = ''; });
      scopeBlocks.forEach((b, i) => { b.style.height = scopeBlockOrigH[i]; });
      outBlocks.forEach((b, i) => { b.style.minHeight = outBlockOrigH[i]; b.style.height = ''; });
    }

    const { jsPDF } = window.jspdf;
    const W = canvas.width, H = canvas.height;
    const scale = Math.min(800 / W, 500 / H);
    const pdf = new jsPDF({
      orientation: W > H ? 'landscape' : 'portrait',
      unit: 'pt',
      format: [W * scale + 60, H * scale + 100],
    });

    /* Background */
    pdf.setFillColor(11, 11, 11);
    pdf.rect(0, 0, W * scale + 60, H * scale + 100, 'F');

    /* Roadmap image */
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 30, 60, W * scale, H * scale);

    /* Header bar */
    pdf.setFillColor(17, 17, 17);
    pdf.rect(0, 0, W * scale + 60, 50, 'F');

    /* Title */
    pdf.setTextColor(240, 237, 232);
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.text(S.cfg.title, 30, 22);
    if (S.cfg.subtitle) {
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(138, 128, 120);
      pdf.text(S.cfg.subtitle, 30, 35);
    }

    /* Logo (top-right) */
    const logoImg = new Image();
    logoImg.src = logoUrl;
    await new Promise(res => { logoImg.onload = res; logoImg.onerror = res; });
    const lc = document.createElement('canvas');
    lc.width = 136; lc.height = 44;
    lc.getContext('2d').drawImage(logoImg, 0, 2, 136, 40);
    pdf.addImage(lc.toDataURL('image/png'), 'PNG', W * scale - 50, 8, 80, 32);

    /* Footer */
    const _localeMap = { en: 'en-US', vi: 'vi-VN' };
    const date = new Date().toLocaleDateString(_localeMap[getLang()] || 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    pdf.setFontSize(8);
    pdf.setTextColor(62, 58, 54);
    pdf.text(t('pdf.exportedAt', { date }), 30, H * scale + 85);

    pdf.save(`roadmap-${S.cfg.title.replace(/\s+/g, '-')}.pdf`);
  } catch(err) {
    console.error(err);
    alert(t('pdf.exportFailed') + err.message);
  } finally {
    document.body.removeChild(ov);
  }
}
