// Aroadmap — App entry point
// Migration in progress: B8 will wire all inject hooks
// Current status: B7 smoke-test imports

/* B1 */
import './firebase.js';
/* B2 */
import './state.js';
import './constants.js';
import './utils.js';
/* B3 */
import './date.js';
import './theme.js';
import './weekpicker.js';
/* B4 */
import './storage.js';
import './persistence.js';
/* B5 */
import './canvas.js';
/* B6 */
import './icons.js';
import './render/sidebar.js';
import './render/timeline.js';
import './render/modals.js';
import './render/home.js';
import './render/index.js';
/* B7 */
import './share.js';
import './export/pdf.js';
import './import/csv.js';
import './events/resize.js';
import './events/bind.js';
import './events/bindModal.js';
import './events/bindHome.js';

document.querySelector('#app').innerHTML = `
  <div style="
    display:flex; align-items:center; justify-content:center;
    height:100vh; background:#080808; color:#ede9e4;
    font-family:Inter,sans-serif; font-size:14px; flex-direction:column; gap:12px;
  ">
    <div style="color:#D0A052; font-family:'Crimson Pro',serif; font-size:28px;">Aroadmap</div>
    <div style="color:#857d75;">Vite migration in progress — B7 checkpoint</div>
  </div>
`
