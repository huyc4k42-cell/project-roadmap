# PROJECT CONTEXT — Arthur Roadmap Timeline
> **Dùng file này để nạp context đầy đủ vào đầu mỗi session Claude mới.**  
> Cập nhật lần cuối: 2026-06-02 · Commit: `8c67803`

---

## 1. Tổng quan sản phẩm

**Tên:** Arthur — Project Roadmap Timeline  
**URL Production:** https://project-roadmap-eight.vercel.app  
**Repo GitHub:** https://github.com/huyc4k42-cell/project-roadmap  
**File duy nhất:** `/Users/arthur/Desktop/[Claude] Project Roadmap/timeline.html` (~3546 dòng)

### Kiến trúc cốt lõi
- **Single HTML file** — toàn bộ CSS + JS nằm trong 1 file `timeline.html`
- **Vanilla JS** — không có framework, không có npm, không có build step
- **localStorage** — toàn bộ dữ liệu lưu local, không có backend
- **Hash routing** — `#home` → trang chủ, `#project-{id}` → project detail, `#share-{data}` → read-only share

### Deploy
- **Vercel** với `vercel.json` redirect root → `timeline.html`
- **GitHub** repo `huyc4k42-cell/project-roadmap`, branch `main`
- Deploy: `vercel deploy --prod` từ thư mục project (git push cũng trigger nhưng chậm hơn)

---

## 2. Data Model (localStorage)

### Keys
```
roadmap-index          → JSON array of project index entries
roadmap-proj-{id}      → JSON object of full project data
roadmap-state-v1       → LEGACY (old single-project format, tự migrate)
roadmap-theme          → 'dark' | 'light' | 'system'
```

### Index Entry (per project)
```js
{
  id: 'proj_1234567890',
  name: 'Product Roadmap Q3',
  subtitle: 'Mô tả ngắn',
  accent: '#D0A052',          // màu card stripe
  updatedAt: 1234567890000,
  stats: {
    phases: 3,
    tasks: 8,
    sched: 6,                 // số task đã có startWeek
    start: '2025-06-02',      // từ cfg.start
    end: '2025-11-30'         // từ cfg.end
  }
}
```

### Project Data (full)
```js
{
  cfg: {
    title: 'Project Roadmap',
    subtitle: '',
    start: '2025-06-02',      // YYYY-MM-DD, Monday preferred
    end: '2025-11-30',
    scopeRowHeight: 100        // chiều cao Phase Scope row (px), default 100
  },
  phases: [{
    id: 1,                    // số nguyên từ _nextId
    name: 'Discovery',
    startWeek: 1, endWeek: 4, // 1-indexed từ cfg.start
    color: '#1d4ed8',
    scope: 'Mô tả phạm vi...',
    outputs: [{ id: 5, text: 'Research report', done: false }]
  }],
  teams: [{
    id: 2,
    name: 'Product',
    icon: 'package',           // key trong ICONS object
    color: '#7c3aed'
  }],
  tasks: [{
    id: 3,
    name: 'User Research',
    phaseId: 1,               // null = unassigned phase
    teamId: 2,                // null = unassigned team
    startWeek: 1,             // null = Backlog (chưa xếp lịch)
    dur: 2,                   // duration in weeks
    tags: ['ux', 'research'],
    desc: 'Mô tả task...'
  }],
  tags: ['tracking', 'UX', 'tech', 'growth', 'research'],
  _nextId: 10                 // auto-increment ID counter
}
```

---

## 3. State Object (runtime)

```js
const S = {
  cfg: { title, subtitle, start, end, scopeRowHeight },
  phases: [],
  teams: [],
  tasks: [],
  tags: [],
  _nextId: 1,
  ui: {
    filter: { phase: '', team: '', tag: '', status: 'backlog', search: '' },
    modal: null,    // { type, ...data } — xem phần Modal Types
    ctx: null,      // context menu state
    dragData: null,
    resizeData: null,
    phaseResize: null,
    phaseDragId: null,
    importModal: null  // deprecated, dùng modal.type='import'
  }
}
```

### Modal Types (`S.ui.modal.type`)
| Type | Mô tả |
|------|-------|
| `'cfg'` | Cài đặt project (title, dates, week picker) |
| `'add-phase'` | Thêm phase mới |
| `'edit-phase'` | Sửa phase |
| `'add-task'` | Thêm task mới |
| `'edit-task'` | Sửa task |
| `'add-team'` | Thêm nhóm |
| `'edit-team'` | Sửa nhóm |
| `'share'` | Share roadmap (URL encode) |
| `'new-project'` | Tạo project mới (Home screen) |
| `'rename-project'` | Đổi tên + accent + subtitle project |
| `'import'` | CSV import flow (2 bước) |

---

## 4. Layout & Render Pipeline

```
render()
  └── buildHdr()          → header: logo/breadcrumb, stats, buttons
  └── buildSidebar()      → task backlog list (left panel)
  └── buildTimeline()
        ├── phCells        → Phase row (drag/resize handles, week count badge)
        ├── moCells        → Month labels
        ├── wkCells        → Week columns (W1, W2...)
        ├── teamRows       → buildTeamRow() per team
        │     └── assignLanes() → no-overlap lane algorithm
        │     └── task bars với dynamic height + tags
        ├── scopeTrack     → Phase Scope row (resizable)
        └── outTrack       → Output/Checklist row (paste to list)
```

```
renderHome()
  └── buildHome()
        ├── buildHomeHdr() → logo center, Import CSV, New Project, Theme toggle
        ├── buildProjCard() per project → stats, week elapsed bar
        └── buildHomeModal() / buildImportModal()
```

---

## 5. CSS Design System

### CSS Variables (Dark Theme default)
```css
--bg: #080808          /* page background */
--s1: #111111          /* header, sidebar, cards */
--s2: #1b1b1b          /* inputs, timeline bg */
--s3: #262626          /* hover states */
--s4: #303030          /* disabled elements */
--bd: #2e2e2e          /* borders */
--bd2: #3e3e3e         /* stronger borders */
--txt: #ede9e4         /* primary text */
--txt2: #b2aaa0        /* secondary text */
--txt3: #857d75        /* placeholder/muted */
--gold: #D0A052        /* accent/primary action */
--goldD: rgba(208,160,82,.18)  /* gold bg tint */
--grn: #4caf7d         /* success */
--red: #e05757         /* error/danger */
--sb: 288px            /* sidebar width */
--tlw: 204px           /* timeline label width */
--ww: 64px             /* week column width (recalculated) */
--hdr: 58px            /* header height */
```

### Light Theme: `[data-theme="light"]` override tất cả vars trên.

### Fonts
- **Crimson Pro** (Google Fonts) — serif, dùng cho titles, phase names, project names
- **Inter** — sans-serif, dùng cho UI text

---

## 6. Key Constants

```js
const TLW = 204              // timeline label col width (px)
const WW_FILL_COLS = 9       // số cột tối đa khi fill (đổi từ 12 xuống 9)
const LANE_PAD = 10          // padding trên/dưới mỗi team row (px)
const LANE_GAP = 5           // khoảng cách giữa các lane (px)
const PHASE_COLORS = [       // màu auto-assign cho phases
  '#7c3aed','#1d4ed8','#047857','#b45309',
  '#be185d','#0e7490','#7f1d1d','#1e3a5f','#4a1942','#14532d'
]
const PROJ_ACCENTS = [       // màu accent cho project cards
  '#D0A052','#7c3aed','#1d4ed8','#047857',
  '#be185d','#0e7490','#b45309','#e05757'
]
const SHEETS_TEMPLATE_URL = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/copy'
// ⚠️ URL placeholder — cần replace bằng Google Sheet thật nếu muốn dùng
```

---

## 7. Task Bar Height Algorithm

```js
function taskBarH(task) {
  const longTitle = task.name.length > 22;
  const hasTags   = task.tags?.length > 0;
  return 12 + (longTitle ? 36 : 20) + (hasTags ? 22 : 0);
  // Short/no tags: 32px | Long/no tags: 48px | Short+tags: 54px | Long+tags: 70px
}
```

### Lane Assignment (no-overlap stacking)
```js
assignLanes(tasks)
// → { assignments: {taskId: laneIndex}, numLanes, laneH: [maxHPerLane] }
// Top offset = LANE_PAD + Σ(laneH[0..lane-1]) + lane * LANE_GAP
```

---

## 8. Features Implemented (Chronological)

### Core Timeline (v1)
- [x] Phase bar với drag-to-move và resize handles (left/right)
- [x] Team rows với task bars drag-drop
- [x] Task resize (left/right handles)
- [x] Backlog sidebar (task list chưa xếp lịch)
- [x] Phase Scope textarea (lưu per phase)
- [x] Output/Checklist per phase
- [x] Today line indicator
- [x] Dark/Light/System theme toggle
- [x] Share roadmap (URL encode)
- [x] Export PDF (html2canvas + jsPDF)
- [x] Week picker calendar (click month → chọn range)
- [x] Keyboard shortcuts (Ctrl+Z undo, Ctrl+K search, Escape đóng modal)
- [x] Tag system (filter, color, drag-drop tag onto task)
- [x] Search tasks
- [x] Sample data loader

### Multi-Project Home Screen
- [x] Home page với project cards grid
- [x] Hash routing `#home` / `#project-{id}`
- [x] Project CRUD (Create, Rename, Duplicate, Delete)
- [x] Accent color picker (khi tạo mới và khi đổi tên)
- [x] Card stats: phases, tasks, % xếp lịch, tuần elapsed/total
- [x] Empty state với "Tạo Project mới" button
- [x] Logo centered, bỏ "Dự án của tôi"

### CSV Import Feature
- [x] Entry point: Home header "Import CSV" + Project "Thêm mới" → "Import CSV"
- [x] Step 1: Chọn project đích / tạo mới, chọn Replace/Merge, upload file
- [x] Step 2: Preview table với checkboxes, row lỗi highlight đỏ
- [x] Validation: fail-fast (structure errors), per-row (date errors, out-of-range)
- [x] CSV schema: `task_name, phase_name, team_name, start_date, end_date, tags, description`
- [x] Auto-create phases + teams từ CSV
- [x] Download CSV template (8 row mẫu với ngày thực)
- [x] Link Google Sheets template (cần setup URL thật)

### Timeline UX Overhaul (Latest)
- [x] **Week columns**: WW_FILL_COLS 12 → **9** (rộng hơn)
- [x] **Phase header**: badge "N tuần" per phase
- [x] **Task bars**: dynamic height theo title length + tags, hiện tag chips
- [x] **Task stacking**: sum-based lane offsets, không bao giờ overlap
- [x] **Scope row resize**: kéo handle đáy để thay đổi chiều cao, lưu state
- [x] **Output paste**: paste nhiều dòng → auto split thành todo items; Enter = thêm 1 item

---

## 9. Known Patterns & Conventions

### Render Pattern
```js
// Mỗi thay đổi data → gọi render() (project) hoặc renderHome() (home)
// render(noSave=false) → render HTML + bind events + saveState (nếu noSave=false)
// Không dùng virtual DOM — innerHTML replace toàn bộ mỗi lần render
```

### Helper Functions hay dùng
```js
q('#id')             // document.querySelector shorthand
qAll('.class')       // document.querySelectorAll shorthand
esc(str)             // HTML escape
nextId()             // trả về S._nextId++ (auto-increment)
saveState()          // save toàn bộ S vào localStorage
render(true)         // re-render không save (dùng cho live-update như search)
rerender()           // render() hoặc renderHome() tùy currentProjId
showToast(msg, dur)  // hiện toast notification (3s default)
```

### Date Functions
```js
parseDate('2025-06-02')          // → Date object
dateStrYMD(dateObj)              // → 'YYYY-MM-DD'
startMonday('2025-06-02')        // → Date của thứ 2 đầu tuần
weekDate(weekNum)                // → Date của ngày đầu tuần N
weekLabel(weekNum)               // → 'DD/MM' string
totalWeeks()                     // → số tuần trong project
todayWeekFrac()                  // → vị trí today (fractional week number)
```

### ID System
- Tất cả entities (phase, team, task, output) dùng integer ID từ `_nextId`
- `nextId()` tự increment `S._nextId`
- Không dùng UUID

---

## 10. Files trong Project Directory

```
[Claude] Project Roadmap/
├── timeline.html          ← FILE DUY NHẤT của app
├── PROJECT_CONTEXT.md     ← file này
├── vercel.json            ← Vercel config (redirect / → /timeline.html)
├── Logo.png               ← Logo source (embedded as base64 trong HTML)
├── .vercel/
│   └── project.json       ← projectId + orgId (đừng xóa)
└── .claude/
    └── launch.json        ← Preview server config (port 3333)
```

---

## 11. Pending / Backlog Items

> Các item đã thảo luận nhưng chưa implement hoặc cần follow-up:

- [ ] **Google Sheets template URL** — cần tạo real Google Sheet và update `SHEETS_TEMPLATE_URL`
- [ ] **Weeks/elapsed% trên card** — chỉ hiện sau khi mở project 1 lần (start/end cần được save vào index)
- [ ] **Scope row auto-scale khi import** — hiện import không update `scopeRowHeight`, scope text có thể overflow
- [ ] **Phase scope per-block resize** — hiện resize là toàn row; per-phase resize phức tạp hơn (chưa implement)
- [ ] **Mobile responsive** — layout hiện chỉ dùng được trên desktop

---

## 12. Quick Debug Checklist

Khi gặp lỗi, kiểm tra theo thứ tự:

1. **Console errors?** → F12 → Console
2. **WW âm?** → `window.innerWidth` quá nhỏ, `calcWW()` có guard `Math.max(60, ...)`
3. **Modal không đóng?** → Kiểm tra `S.ui.modal = null` rồi gọi `render()`/`renderHome()`
4. **Task không lưu?** → `saveState()` có được gọi không?
5. **Import không navigate?** → `location.hash = '#project-' + projId` sau `saveIndex()`
6. **Dropdown menu bị clipped?** → `.proj-card` không được có `overflow:hidden`
7. **Context menu lệch?** → `.proj-ctx` dùng `top: calc(100% + 4px)` (không phải `bottom`)

---

## 13. Deployment Checklist

```bash
# Commit + push + deploy
cd "/Users/arthur/Desktop/[Claude] Project Roadmap"
git add timeline.html
git commit -m "feat: mô tả thay đổi"
git push origin main
vercel deploy --prod
```

**Vercel project ID:** `prj_o0iwuBDrXnp8BRdKLNKR1vMRphyx`  
**Team ID:** `team_P9FfhTlhYVKuixkXkc9Ge26j`

---

*File này được tạo bởi Claude Sonnet 4.6 vào 2026-06-02. Cập nhật file này sau mỗi session có thay đổi lớn.*
