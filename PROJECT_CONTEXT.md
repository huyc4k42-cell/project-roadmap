# PROJECT CONTEXT — Arthur Roadmap Timeline
> **Dùng file này để nạp context kỹ thuật ổn định vào đầu mỗi session Claude mới.**
> Đọc kèm `WORKING.md` để biết sprint hiện tại + decisions đã chốt.
> Cập nhật lần cuối: 2026-06-07 · Commit app: `033e072` · Commit docs: (file này)

---

## 1. Tổng quan sản phẩm

**Tên:** Arthur — Project Roadmap Timeline
**URL Production:** https://project-roadmap-eight.vercel.app
**Repo GitHub:** https://github.com/huyc4k42-cell/project-roadmap
**File duy nhất:** `/Users/arthur/Desktop/[Claude] Project Roadmap/timeline.html` (~4100 dòng)

### Kiến trúc cốt lõi
- **Single HTML file** — toàn bộ CSS + JS nằm trong 1 file `timeline.html`
- **Vanilla JS + ES Module** — `<script type="module">`, Firebase SDK import qua CDN
- **Firebase Firestore** — source of truth cho project data, real-time sync
- **Firebase Auth** — Google Sign-In, auth required để xem/sửa projects
- **localStorage** — cache nhanh (offline fallback) + UI prefs (theme, sidebar, row state)
- **Hash routing** — `#home` → trang chủ, `#project-{id}` → project detail, `#share-{data}` → read-only share

### Deploy
- **Vercel** với `vercel.json` redirect root → `timeline.html`
- **GitHub** repo `huyc4k42-cell/project-roadmap`, branch `main`
- Deploy: `vercel deploy --prod` từ thư mục project
- **Firebase project:** `a-roadmap` (console.firebase.google.com/project/a-roadmap)
- **Firestore:** asia-southeast1, test mode (cần deploy security rules)
- **Auth:** Google Sign-In enabled, domain `project-roadmap-eight.vercel.app` authorized

---

## 2. Data Model (localStorage)

### Firestore Structure
```
/projects/{projectId}         ← mỗi project = 1 document
  ownerId: string             ← Firebase Auth uid
  ownerName: string
  ownerPhoto: string
  name: string                ← = cfg.title
  subtitle: string
  accent: string              ← màu card stripe
  updatedAt: number           ← Date.now()
  stats: { phases, tasks, sched, start, end }
  cfg: object                 ← project config
  phases: array
  teams: array
  tasks: array
  tags: array
  _nextId: number
```

### localStorage Keys (UI prefs + cache)
```
roadmap-proj-{id}      → JSON cache của project data (offline fallback)
roadmap-state-v1       → LEGACY (old single-project format, tự migrate)
roadmap-theme          → 'dark' | 'light' | 'system'
roadmap-row-state      → { scope: 'expanded'|'collapsed', output: 'expanded'|'collapsed' }
roadmap-sidebar-state  → 'expanded' | 'collapsed'
```
> `roadmap-index` không còn dùng — index lấy từ Firestore query

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

## 3. Firebase Runtime State

```js
let _db          = null;   // Firestore instance
let _auth        = null;   // Auth instance
let _gProvider   = null;   // GoogleAuthProvider
let currentUser  = null;   // Firebase user object (null = chưa đăng nhập)
let _projIndex   = [];     // in-memory index (synced từ Firestore, không persist)
let _unsubProj   = null;   // onSnapshot cleanup fn cho current project
let _fbSaving    = false;  // guard tránh onSnapshot echo khi chính mình save
```

### Key Firebase Functions
```js
fbSignIn()                  // Google popup sign-in
fbSignOut()                 // sign out + cleanup
_refreshIndex()             // query Firestore → update _projIndex
_saveToFirestore(id, data)  // setDoc với _fbSaving guard
_subscribeToProject(id)     // onSnapshot → real-time collab updates
_migrateLocalToFirestore()  // first-login: localStorage → Firestore
```

---

## 4. State Object (runtime)

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
    modal: null,        // { type, ...data } — xem Modal Types bên dưới
    ctx: null,          // context menu state
    dragData: null,     // { type: 'backlog'|'bar'|'tag', taskId, tag }
    resizeData: null,   // task resize state
    phaseResize: null,  // phase resize state
    phaseDragId: null,  // phase drag/swap state
    teamDragId: null,   // team row reorder state (mới thêm)
    readonly: false,
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
        ├── wkCells        → Week columns (W1, W2...) — cur week highlighted gold
        ├── teamRows       → buildTeamRow() per team
        │     ├── assignLanes()  → lane algorithm (xem mục 7)
        │     ├── task bars với dynamic height + tags
        │     └── team-drag-handle → kéo để reorder team rows
        ├── scopeTrack     → Phase Scope row (resizable, collapsible)
        └── outTrack       → Output/Checklist row (paste to list, collapsible)
```

```
renderHome()
  └── buildHome()
        ├── buildHomeHdr() → logo center, Import CSV, New Project, Theme toggle
        ├── buildProjCard() per project
        │     ├── accent stripe, title (24px Crimson Pro)
        │     ├── stats row: phases / tasks / sched%
        │     ├── circle SVG progress (weeks elapsed/total)
        │     └── time progress bar (% thời gian đã qua)
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
--txt3: #857d75        /* placeholder/muted — ⚠️ WCAG fail, cần fix → #9a9490 */
--gold: #D0A052        /* accent/primary action */
--goldD: rgba(208,160,82,.18)  /* gold bg tint */
--grn: #4caf7d         /* success */
--red: #e05757         /* error/danger */
--sb: 288px            /* sidebar width */
--tlw: 204px           /* timeline label col width */
--ww: 64px             /* week column width (recalculated by calcWW()) */
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
const WW_FILL_COLS = 9       // số cột tối đa khi fill
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
```

---

## 7. Algorithms

### Task Bar Height
```js
function taskBarH(task) {
  const longTitle = task.name.length > 22;
  const hasTags   = task.tags?.length > 0;
  return 12 + (longTitle ? 36 : 20) + (hasTags ? 22 : 0);
  // Short/no tags: 32px | Long/no tags: 48px | Short+tags: 54px | Long+tags: 70px
}
```

### Lane Assignment — `assignLanes(tasks)`
**Logic hiện tại (sau refactor 2026-06-02):**
- Tasks cùng phaseId → mỗi task 1 lane riêng, xếp dọc theo thứ tự trong `S.tasks`
- Phase groups sort theo `startWeek` (thứ tự visual trái→phải)
- Tasks không có phase (phaseId=null) → greedy side-by-side packing
- ⚠️ **Bug đã biết:** greedy packing cho no-phase tasks có lỗi loop không chạy → cần fix (xem WORKING.md Wave 1)

```js
assignLanes(tasks)
// → { assignments: {taskId: laneIndex}, numLanes, laneH: [maxHPerLane] }
// Top offset = LANE_PAD + Σ(laneH[0..lane-1]) + lane * LANE_GAP
```

### Team Reorder — `reorderTeam(dragId, targetId)`
```js
// Kéo team handle → insert dragId trước targetId trong S.teams array
// Triggers: pushHistory() → splice → render()
```

---

## 8. Features Implemented

### Auth & Cloud Sync
- [x] **Google Sign-In** — Firebase Auth, popup flow
- [x] **Sign-in screen** — khi chưa login, home hiện CTA thay vì project list
- [x] **User avatar + name** — hiện trong home header khi đã login
- [x] **Auto-migration** — first login tự động migrate localStorage projects lên Firestore
- [x] **Real-time sync** — `onSnapshot` cập nhật UI khi device khác save
- [x] **localStorage cache** — offline fallback, write-through khi save

### Core Timeline
- [x] Phase bar: drag-to-move, resize handles (left/right), week count badge
- [x] Team rows: task bars drag-drop từ backlog vào timeline
- [x] Task bars: dynamic height (title length + tags), tag chips không có # prefix
- [x] Task resize (left/right handles)
- [x] Task stacking: lane algorithm, không bao giờ overlap
- [x] **Team row reorder:** grip handle ở cuối label → drag để đổi thứ tự
- [x] **Task reorder trong phase:** insert-before với gold line indicator (không swap)
- [x] Backlog sidebar: task list, search, tag pills, 3 selects (Phase/Nhóm/Trạng thái) — tag select đã xoá
- [x] **Sidebar collapse rail:** thu gọn thành 48px rail với icon + badge số backlog
- [x] Phase Scope textarea (lưu per phase, resizable height, **collapsible**)
- [x] Output/Checklist per phase (paste multi-line, **collapsible**)
- [x] Row collapse state nhớ qua reload (`roadmap-row-state`)
- [x] Today line indicator (2px, gold "Hôm nay" label trên week row)
- [x] Dark/Light/System theme toggle
- [x] **Modal focus trap** — Tab/Shift+Tab cycle trong modal, auto-focus first input
- [x] Share roadmap (URL encode + LZ compress)
- [x] Export PDF (html2canvas + jsPDF, tự expand scope/output trước capture)
- [x] Week picker calendar (click month → chọn range)
- [x] Keyboard shortcuts: Ctrl+Z undo, Ctrl+K search, Escape đóng modal
- [x] Tag system: filter, color palette, drag-drop tag onto task
- [x] Context menu: right-click task bar / team label

### Multi-Project Home Screen
- [x] Project cards grid: title 24px Crimson Pro, accent stripe 4px
- [x] Card stats: phases / tasks / sched% / time bar / circle week progress
- [x] Hash routing `#home` / `#project-{id}`
- [x] Project CRUD (Create, Rename, Duplicate, Delete)
- [x] Accent color picker
- [x] Empty state

### CSV Import
- [x] 2-step flow: chọn project → preview table
- [x] Schema: `task_name, phase_name, team_name, start_date, end_date, tags, description`
- [x] Auto-create phases + teams từ CSV
- [x] Download CSV template

### Known Limitations (Won't Fix — documented)
- ❌ Mobile responsive — desktop only
- ❌ Keyboard drag-drop alternative
- ❌ CSS token rename (--s1, --s2...)
- ❌ Google Sheets template URL (placeholder hiện tại)
- ❌ Phase scope per-block resize (toàn row resize only)

---

## 9. Known Patterns & Conventions

### Render Pattern
```js
// Mỗi thay đổi data → gọi render() (project) hoặc renderHome() (home)
// render(noSave=false) → render HTML + bind events + saveState (nếu noSave=false)
// Không dùng virtual DOM — innerHTML replace toàn bộ mỗi lần render
// renderRAF() → debounce via requestAnimationFrame (dùng khi drag/resize)
```

### Helper Functions hay dùng
```js
q('#id')             // document.querySelector shorthand
qAll('.class')       // document.querySelectorAll shorthand
esc(str)             // HTML escape
nextId()             // trả về S._nextId++ (auto-increment)
saveState()          // save toàn bộ S vào localStorage
saveIndex()          // save roadmap-index (home screen stats)
render(true)         // re-render không save (live-update)
rerender()           // render() hoặc renderHome() tùy currentProjId
showToast(msg, dur)  // toast notification (3s default)
pushHistory()        // save undo snapshot trước khi mutate
```

### Date Functions
```js
parseDate('2025-06-02')   // → Date object
dateStrYMD(dateObj)       // → 'YYYY-MM-DD'
startMonday('2025-06-02') // → Date của thứ 2 đầu tuần
weekDate(weekNum)         // → Date của ngày đầu tuần N
weekLabel(weekNum)        // → 'DD/MM' string
totalWeeks()              // → số tuần trong project
todayWeekFrac()           // → vị trí today (fractional week number)
```

### ID System
- Tất cả entities (phase, team, task, output) dùng integer ID từ `_nextId`
- `nextId()` tự increment `S._nextId`
- Không dùng UUID

---

## 10. Files trong Project Directory

```
[Claude] Project Roadmap/
├── timeline.html          ← FILE DUY NHẤT của app (~4100 dòng)
├── PROJECT_CONTEXT.md     ← file này — technical reference (stable)
├── WORKING.md             ← sprint hiện tại, decisions, backlog (volatile)
├── vercel.json            ← Vercel config (redirect / → /timeline.html)
├── Logo.png               ← Logo source (embedded as base64 trong HTML)
├── firestore.rules        ← (cần tạo) Firestore security rules
├── .firebaserc            ← (cần tạo sau firebase init) project alias
├── .vercel/
│   └── project.json       ← projectId + orgId (đừng xóa)
└── .claude/
    └── launch.json        ← Preview server config (port 3333)
```

---

## 11. Design Decisions Log

> Append-only. Không xóa entry cũ — dùng để trace lý do đằng sau các quyết định.

### [2026-06-07] Firebase Integration
| # | Quyết định |
|---|-----------|
| D12 | Auth required — không có account không xem được project (trừ read-only share link) |
| D13 | Storage: Firestore là source of truth, localStorage là write-through cache (offline fallback) |
| D14 | Real-time: `onSnapshot` + `_fbSaving` guard để tránh echo loop khi chính mình save |
| D15 | Migration: first login tự detect localStorage projects → migrate lên Firestore, không hỏi |
| D16 | `_projIndex` in-memory array thay cho `localStorage roadmap-index` — không persist index riêng |
| D17 | Collaborator: hiện tại chỉ owner (last-write-wins). Invite/share role để sau. |
| D18 | Security rules: hiện test mode. Cần deploy rules trước khi production. |

### [2026-06-03] UX Overhaul — Grill-me Session
| # | Quyết định |
|---|-----------|
| D01 | Sidebar collapse → thin rail 48px (icon list + badge số backlog tasks). Click để expand. |
| D02 | Muốn drag task từ backlog khi rail collapsed → phải expand sidebar trước, không có flyout. |
| D03 | Filter sidebar: xoá select "Tag" (trùng với tag pills). Giữ tag pills (dual: filter + drag source). Gộp Phase/Nhóm/Trạng thái thành 1 row. |
| D04 | Task drag-reorder trong cùng phase+team: **insert before** target (không swap). |
| D05 | Insert-before visual indicator: **gold line ngang phía trên** task target. |
| D06 | Phase Scope & Output rows: có toggle collapse riêng, nhớ state per-row trong `roadmap-row-state` localStorage. |
| D07 | First-run default (chưa có localStorage): cả 2 rows expanded. |
| D08 | "Hôm nay" label gắn vào **week column sticky (week row)**, màu gold, cùng highlight `.wk-c.cur`. |
| D09 | Header stats (Tổng/Đã xếp/Backlog/Tuần): giữ nguyên, chưa xử lý declutter. |
| D10 | CSS token rename (--s1 → --surface-base...): **bỏ qua**, zero user value, rủi ro cao. |
| D11 | Keyboard drag-drop alternative: **bỏ qua**, known limitation. |

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
8. **Drag state bị stuck?** → Kiểm tra `S.ui.dragData`, `S.ui.teamDragId`, `S.ui.phaseDragId` — Escape phải reset hết
9. **Lane overlap?** → `assignLanes()` — phase tasks dùng sequential lanes, no-phase dùng greedy. Xem bug note mục 7.

---

## 13. Deployment Checklist

```bash
cd "/Users/arthur/Desktop/[Claude] Project Roadmap"
git add timeline.html PROJECT_CONTEXT.md WORKING.md
git commit -m "feat: mô tả thay đổi"
git push origin main
vercel deploy --prod
```

**Vercel project ID:** `prj_o0iwuBDrXnp8BRdKLNKR1vMRphyx`
**Team ID:** `team_P9FfhTlhYVKuixkXkc9Ge26j`

### Firebase Deployment (security rules)
```bash
# Cần firebase-tools đã install + login
firebase login
firebase init firestore   # chọn project a-roadmap
firebase deploy --only firestore:rules
```

**Firebase project:** `a-roadmap`
**Firestore region:** `asia-southeast1`
**Auth domain:** `project-roadmap-eight.vercel.app` (đã authorized)

### Firestore Security Rules (production-ready)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /projects/{projectId} {
      allow read, write: if request.auth != null
        && resource.data.ownerId == request.auth.uid;
      allow create: if request.auth != null
        && request.resource.data.ownerId == request.auth.uid;
    }
  }
}
```
