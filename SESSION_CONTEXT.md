# Arthur Project Roadmap — Session Context

> File này dùng để handoff sang session mới. Chứa toàn bộ quyết định thiết kế, kiến trúc kỹ thuật, trạng thái hiện tại và các task còn dở.

---

## 1. Tổng quan dự án

Single-file HTML Gantt/roadmap app (`timeline.html`). Không có build tool, không có backend, không có framework — chỉ vanilla JS + CDN scripts.

- **Repo:** https://github.com/huyc4k42-cell/project-roadmap
- **Live:** https://project-roadmap-eight.vercel.app
- **File duy nhất:** `/Users/arthur/Desktop/[Claude] Project Roadmap/timeline.html` (~2079 dòng)
- **Assets:** `Logo.png` (Arthur wordmark, RGBA PNG, 544×272px), `vercel.json`

---

## 2. Hạ tầng

| Thứ | Công cụ | Ghi chú |
|-----|---------|---------|
| Version control | Git + GitHub (`huyc4k42-cell/project-roadmap`) | Branch `main`, push thẳng |
| Deploy | Vercel CLI (`vercel --prod`) | `vercel.json` rewrite `/` → `/timeline.html` |
| CDN scripts | html2canvas 1.4.1, jsPDF 2.5.1, LZ-string 1.4.4 | Tất cả từ cdnjs |
| Auth | `gh auth` (GitHub CLI), `vercel whoami` | Đã login cả 2 |

**Deploy command:**
```bash
cd "/Users/arthur/Desktop/[Claude] Project Roadmap"
git add . && git commit -m "..." && git push
vercel --prod
```

---

## 3. Design System

### 3.1 Color Tokens (`:root`)

```css
/* Dark theme (default) */
--bg:#080808;  --s1:#111111;  --s2:#1b1b1b;  --s3:#262626;  --s4:#303030;  --s5:#3e3e3e;
--bd:#2e2e2e;  --bd2:#3e3e3e;  --bd3:#545454;
--txt:#ede9e4;  --txt2:#b2aaa0;  --txt3:#857d75;
--gold:#D0A052;  --goldL:#e8c07a;  --goldD:rgba(208,160,82,.18);  --goldB:rgba(208,160,82,.07);
--grn:#4caf7d;  --red:#e05757;
```

```css
/* Light theme ([data-theme="light"]) */
--bg:#f4f1ed;  --s1:#ece7e0;  --s2:#f8f6f3;  --s3:#e8e2db;  --s4:#ddd7cf;  --s5:#cec7be;
--bd:#d8d2ca;  --bd2:#c5bdb4;  --bd3:#aaa098;
--txt:#1c1814;  --txt2:#5a5048;  --txt3:#6e6058;
--gold:#7f6018;  --goldL:#9a7820;
--grn:#2d7a50;  --red:#c0392b;
```

**WCAG AA status (dark):** `--txt` 16.5:1 ✅ · `--txt2` 7.6:1 ✅ · `--txt3` 5.2:1 ✅ · `--gold` 8.4:1 ✅

### 3.2 Typography
- **Heading/Phase name:** Crimson Pro 600 (serif)
- **Body/UI:** Inter 300–700
- **Base size:** 14px, line-height 1.5

### 3.3 Layout Constants
```
--sb: 288px   (sidebar width)
--tlw: 204px  (timeline label width)
--ww: dynamic (week column width, set by JS)
--hdr: 58px   (header height)
```

### 3.4 Phase Colors (PHASE_COLORS array)
```js
['#7c3aed','#1d4ed8','#047857','#b45309','#be185d','#0e7490','#7f1d1d','#1e3a5f','#4a1942','#14532d']
```

---

## 4. Kiến trúc App

### 4.1 State (`S`)

```js
S = {
  cfg: { title, subtitle, start:'YYYY-MM-DD', end:'YYYY-MM-DD' },
  phases: [{ id, name, startWeek, endWeek, color }],
  teams:  [{ id, name, icon, color }],
  tasks:  [{ id, name, teamId, phaseId, startWeek|null, dur, tags:[] }],
  tags:   ['tracking','UX','tech',...],
  ui: {
    filter: { phase:'', team:'', tag:'', status:'backlog' },
    modal: null | { type, data },
    ctx: null,
    dragData: null,
    resizeData: null,   // { taskId, side:'left'|'right', startX, origDur, origStartWeek }
    phaseResize: null,  // { phaseId, side, startX, origStart, origEnd, origAll }
    phaseDragId: null,
    readonly: false,    // true khi xem shared link
  },
  _nextId: 1,
}
```

**Persistence:** `localStorage` key `'roadmap-state-v1'`

### 4.2 Render cycle
```
render(noSave=false)
  → calcWW()  (set WW + CSS --ww)
  → buildApp() → buildSidebar() + buildTimeline() + buildModal()? + buildCtx()?
  → bind()    (attach all event listeners)
  → if !noSave: saveState()
```

**RAF throttle cho drag/resize:**
```js
renderRAF() → cancelAnimationFrame → requestAnimationFrame → render(true)
```

### 4.3 Week Column Width (WW) — Dynamic
```js
let WW = 64;
const WW_FILL_COLS = 12;

function calcWW() {
  const available = window.innerWidth - sidebarWidth - TLW - 4;
  const cols = Math.min(totalWeeks(), WW_FILL_COLS);
  return Math.floor(available / cols);
}
// ≤12 tuần: tất cả fill màn hình
// >12 tuần: 12 tuần đầu fill màn hình, còn lại scroll ngang
```

Window resize → debounce 150ms → `render(true)`.

---

## 5. Tính năng đã implement

### 5.1 Timeline Core
- Phase row: drag (swap/push), resize trái/phải với cascade push (`pushPhasesAfter`)
- Team rows: multi-lane task bars (`assignLanes`)
- Task bars: drag sang team/week khác, resize trái (move start) / phải (extend dur)
- Scope + Output rows: checklist per phase
- Today line (đỏ, opacity .5)
- Filter sidebar: phase / team / tag / status (backlog/scheduled)

### 5.2 Drag & Drop
- Task card drag từ sidebar → drop vào timeline cell
- Task bar drag trong timeline → reposition
- Tag drag từ sidebar pill → drop vào task card (assign tag)
- Phase drag → `swapPhases(idA, idB)` (không push, chỉ swap positions)

### 5.3 Theme System
```js
const THEME_KEY = 'roadmap-theme'; // 'dark' | 'light' | 'system'
loadTheme()  // chạy trước loadState()
applyTheme() // set document.documentElement.dataset.theme
setTheme()   // save + applyTheme + render
```
Toggle UI: 3 buttons (Tối / Sáng / Hệ thống) trong modal Cài đặt.

### 5.4 URL Share
```js
const SHARE_PREFIX = '#v1=';
buildShareURL()    // LZString.compressToEncodedURIComponent(JSON.stringify(state))
loadFromHash()     // ngược lại, set S.ui.readonly = true
```
- Init: `if (!loadFromHash()) loadState();`
- Readonly mode: banner "Bản xem", ẩn tất cả edit buttons, disable drag/resize (CSS `.readonly`)
- Share button trong header (viền gold), opens modal type `'share'` với copy-to-clipboard

### 5.5 Week Picker (Settings modal)
```js
let wkp = { yr, mo, startMon:Date|null, endMon:Date|null, step:'start'|'end', showMonthSel:false }
```
- **View thường:** 1-month calendar, cột W (ISO week number), T2–CN header
- **Click month label:** toggle `showMonthSel` → 4×3 month grid + year nav
- **Interaction:** click-click (start → hover preview → end)
- **Manual input:** DD/MM/YYYY, auto-format, Enter → navigate + select
- **Footer:** `W23 → W35 · 13 tuần` + `02 Jun – 25 Aug 2025`
- **No jitter:** `wkpRefresh()` chỉ replace `.wkp` element, không gọi `render()`

```js
function wkpRefresh() {
  const el = q('.wkp');
  if (!el) { render(); return; }
  el.replaceWith(/* buildWkPicker() */);
  bindWkPickerEvents();
}
```

`saveCfg()` đọc `wkp.startMon` / `wkp.endMon`, convert sang YYYY-MM-DD (start = Monday, end = Sunday của end week).

---

## 6. Các hàm quan trọng

| Hàm | Mô tả |
|-----|-------|
| `pushPhasesAfter(phaseId, minStart)` | Cascade push phases về phải khi resize |
| `swapPhases(idA, idB)` | Swap startWeek/endWeek khi drag phase |
| `assignLanes(tasks)` | Multi-lane algorithm cho overlapping tasks |
| `calcWW()` | Dynamic week column width |
| `buildShareURL()` | LZ-compress state → URL hash |
| `loadFromHash()` | Decompress URL hash → state (readonly) |
| `wkpMonday(date)` | Monday của tuần chứa date |
| `isoWeek(date)` | ISO week number (W1–W53) |
| `dateStrYMD(date)` | Date → 'YYYY-MM-DD' |
| `renderRAF()` | Throttle render với requestAnimationFrame |
| `tagPalette(tag)` | Hash tag name → [bg, fg] color pair |

---

## 7. Modal Types

| type | Dùng cho |
|------|---------|
| `'cfg'` | Cài đặt: title, subtitle, week picker, theme, reset |
| `'share'` | Share link + copy to clipboard |
| `'add-task'` / `'edit-task'` | Tạo/sửa task |
| `'add-team'` / `'edit-team'` | Tạo/sửa team |
| `'add-phase'` / `'edit-phase'` | Tạo/sửa phase |

---

## 8. localStorage Keys

| Key | Nội dung |
|-----|---------|
| `'roadmap-state-v1'` | Toàn bộ state (cfg, phases, teams, tasks, tags, _nextId) |
| `'roadmap-theme'` | Theme preference: `'dark'` \| `'light'` \| `'system'` |

---

## 9. Grill-me decisions đã chốt (session này)

### Week Picker
| Quyết định | Chốt |
|-----------|------|
| Layout | 1 tháng duy nhất |
| Interaction | Click-click (start → hover preview → end) |
| Week display | Số tuần W23 bên trái, 7 ô ngày T2–CN |
| Footer format | 2 dòng: `W23 → W35 · 13 tuần` + `02 Jun – 25 Aug 2025` |
| First day | Thứ Hai |

### Phase Resize/Drag (session trước)
| Quyết định | Chốt |
|-----------|------|
| Resize phải (dài hơn) | Push phases sau sang phải (cascade) |
| Resize trái | Chỉ thay đổi startWeek của phase đó, không ảnh hưởng phase khác |
| Drag phase | Swap 2 phases (không shift toàn bộ) |
| Task resize trái | Giữ endWeek, thay đổi startWeek + duration |

---

## 10. Known Issues / Pending

- [ ] Không có feature branch — tất cả commit thẳng vào `main`. Nên dùng `git checkout -b feature/xxx` cho các task lớn tiếp theo.
- [ ] GitHub chưa kết nối Vercel qua GitHub App → mỗi deploy phải chạy `vercel --prod` thủ công.
- [ ] Share URL có thể rất dài khi roadmap lớn (nhiều tasks/phases). Chưa có cảnh báo giới hạn URL.
- [ ] Light mode: logo PNG (gold trên transparent) dùng `filter:brightness(.52)` — có thể không đẹp ở mọi màn hình.

---

## 11. Commit history (session này)

```
5b07af0 Update .gitignore to exclude .vercel directory
6d189ca Week picker: click month label + manual date input
4d44cc6 Fix week picker jitter on month navigation
c8710bc Replace date inputs with week picker calendar
96f91ec Add vercel.json to serve timeline.html at root
06f1132 Fix week scaling: always fill 12 cols, extras scroll
d2479fc Auto-scale week columns to fill screen when ≤ 12 weeks
8812f8b Add URL-encoded share + light/dark theme toggle
212b8ce Initial release — Arthur Project Roadmap
```

---

## 12. Cách tiếp tục trong session mới

1. Đọc file này để nắm context
2. File chính: `/Users/arthur/Desktop/[Claude] Project Roadmap/timeline.html`
3. Trước khi làm task lớn: `git checkout -b feature/ten-feature`
4. Deploy: `cd "/Users/arthur/Desktop/[Claude] Project Roadmap" && vercel --prod`
5. Skills có sẵn: `/ui-ux-pro-max`, `/accessibility-review`, `/grill-me`, `/design-critique`
