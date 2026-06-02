# WORKING — Arthur Roadmap
> **File volatile — thay đổi mỗi session.**
> Đọc file này SAU `PROJECT_CONTEXT.md` để biết trạng thái hiện tại.
> Cập nhật lần cuối: 2026-06-03

---

## ▶ BẮT ĐẦU SESSION MỚI TỪ ĐÂY

**Prompt nạp context:**
```
Đọc PROJECT_CONTEXT.md và WORKING.md.
Bắt đầu implement Wave 1 theo thứ tự W1-1 → W1-2 → W1-3 → W1-4,
sau đó tiếp tục Wave 2: W2-1 → W2-2 → W2-3 → W2-4.
Deploy sau khi hoàn thành Wave 2.
```

**Trạng thái hiện tại:**
- ✅ Code app: commit `cc3d12c` — đang live tại https://project-roadmap-eight.vercel.app
- ✅ Docs: commit `8399e74` — PROJECT_CONTEXT.md + WORKING.md đã tạo
- 🔜 Chưa làm: Wave 1 (4 bug fixes) + Wave 2 (4 quick wins)
- 📁 File cần edit: `/Users/arthur/Desktop/[Claude] Project Roadmap/timeline.html`

---

## 🎯 Active Sprint — Wave 1 + 2

> Mục tiêu: fix bugs + quick wins trước khi thêm feature mới.
> Estimate: ~1.5–2h. Deploy ngay sau khi hoàn thành Wave 2.

### 🔴 Wave 1 — Stability (Bugs)

- [ ] **W1-1** Fix `assignLanes` — no-phase tasks greedy packing bị broken.
  - **Nguyên nhân:** `laneEnds = new Array(nextLane).fill(Infinity)` nên `laneEnds.length === nextLane`, loop `for (i = nextLane; i < laneEnds.length)` không bao giờ chạy.
  - **Fix:** Tách `noLaneEnds = []` riêng (empty array) cho no-phase tasks, loop tìm lane trống trong `noLaneEnds`, map về `globalLane = nextLane + i`.

- [ ] **W1-2** Fix phase stacking sort theo visual order.
  - **Nguyên nhân:** `Object.keys(byPhase)` trả về insertion order của integer keys — không đảm bảo đúng thứ tự trái→phải.
  - **Fix:** Sort phase keys theo `S.phases.find(p => p.id === +k)?.startWeek` trước khi assign lanes.

- [ ] **W1-3** Fix `Escape` key không reset drag states.
  - **Nguyên nhân:** Handler Escape hiện tại chỉ đóng modal, không reset `S.ui.teamDragId` và `S.ui.phaseDragId`.
  - **Fix:** Thêm reset 3 drag states vào Escape handler: `dragData`, `teamDragId`, `phaseDragId`.

- [ ] **W1-4** `localStorage` error boundary.
  - **Fix:** Wrap `localStorage.setItem(...)` trong `saveState()` bằng try/catch. Khi `QuotaExceededError` → `showToast('⚠️ Bộ nhớ đầy — không thể lưu. Xoá bớt project cũ.', 5000)`.

### 🟡 Wave 2 — Quick Wins (Polish)

- [ ] **W2-1** Fix contrast `--txt3`.
  - **Fix:** Đổi `--txt3: #857d75` → `#9a9490` trong `:root`. Đổi tương tự trong `[data-theme="light"]` nếu cần.

- [ ] **W2-2** Today line + "Hôm nay" label.
  - **Fix today line:** `.today-line { width: 2px; opacity: 0.75; }`
  - **Fix label:** Trong `buildTimeline()`, tìm `wkCells` render, thêm class `cur-today` vào week column của tuần hiện tại. Trong CSS: `.wk-c.cur::after { content: 'Hôm nay'; font-size: 9px; ... }`

- [ ] **W2-3** Home card improvements.
  - **Card height:** `.proj-card { min-height: 240px; }`
  - **Circle progress:** Đổi từ SVG text (khó đọc) sang HTML overlay — `position: absolute` div bên trong `.proj-circle-ring`, hiện số tuần to hơn (16px bold).

- [ ] **W2-4** Fix ARIA `role="separator"` → `role="slider"` trên resize handles.
  - **Vị trí:** Tìm `data-resize-left` và `data-resize` trong `buildTeamRow()` → đổi `role="separator"` thành `role="slider"` + thêm `aria-label` mô tả.

---

## 🟢 Backlog — Wave 3 (Core UX)

> Làm sau khi Wave 1+2 stable và deployed.

- [ ] **W3-1** Task drag reorder: đổi từ **swap** → **insert-before**.
  - Logic hiện tại (sai): `splice(fromIdx,1)` rồi `splice(toIdx,0,drag)` — đây là insert-before nhưng visual indicator vẫn dùng outline, không có gold line.
  - **Fix cần làm:** Đảm bảo logic insert-before đúng + thêm gold line `position: absolute` phía **trên** task target khi dragover.

- [ ] **W3-2** Sidebar filter cleanup.
  - Xoá `<select id="f-tag">` khỏi `buildSidebar()`.
  - Gộp 3 select còn lại (Phase/Nhóm/Trạng thái) thành 1 row `display: flex; gap: 5px`.

- [ ] **W3-3** Focus trap trong modal.
  - Khi modal render xong: query tất cả focusable elements, bind Tab/Shift+Tab để trap focus bên trong.
  - Auto-focus element đầu tiên trong modal khi mở.

- [ ] **W3-4** Phase Scope + Output rows collapsible.
  - Thêm toggle button vào `.row-lbl` của cả 2 rows.
  - State lưu vào `localStorage.setItem('roadmap-row-state', JSON.stringify({scope, output}))`.
  - First-run default: `{ scope: 'expanded', output: 'expanded' }`.

---

## 🔵 Backlog — Wave 4 (New Feature)

> Làm sau khi Wave 3 stable. Thay đổi layout lớn nhất — để sau cùng.

- [ ] **W4-1** Sidebar thin rail collapse.
  - Thu gọn sidebar thành 48px: hiện icon list + badge số backlog tasks.
  - Click badge/icon để expand lại full 288px.
  - Khi collapsed: drag task từ backlog yêu cầu expand trước (không có flyout).
  - State lưu trong `localStorage.setItem('roadmap-sidebar-state', 'collapsed'|'expanded')`.

---

## ❌ Won't Do (Documented)

| Item | Lý do bỏ qua |
|------|-------------|
| CSS token rename (`--s1` → `--surface-base`...) | Zero user value, rủi ro miss cao trong 3750 dòng |
| Keyboard drag-drop alternative | Conflict với shortcuts hiện có (Ctrl+Z, K, Esc), edge case ít dùng |
| Header stats declutter | Stats là thông tin scanning quan trọng — chưa cần thay đổi |
| Mobile responsive | Desktop-first by design |
| Google Sheets template URL | Cần tạo real Sheet riêng — outside scope |
| Phase scope per-block resize | Quá phức tạp, toàn row resize là đủ |

---

## 📌 Key Decisions (2026-06-03 Grill-me)

> Chi tiết đầy đủ trong `PROJECT_CONTEXT.md` → mục 11 Design Decisions Log.

| Code | Quyết định |
|------|-----------|
| D01 | Sidebar collapse → thin rail 48px, icon list + badge số backlog |
| D02 | Drag task từ collapsed sidebar → phải expand trước, không có flyout |
| D03 | Xoá select "Tag" (trùng với tag pills). Giữ pills. Gộp 3 selects còn lại thành 1 row |
| D04 | Task drag-reorder → insert-before target (không swap) |
| D05 | Insert-before indicator → gold line ngang phía trên task target |
| D06 | Scope/Output rows → collapsible, nhớ state riêng từng row trong localStorage |
| D07 | First-run default → cả 2 rows expanded |
| D08 | "Hôm nay" label → gắn vào week row sticky, màu gold |
| D09 | Header stats → giữ nguyên, chưa xử lý |
| D10 | CSS token rename → skip hoàn toàn |
| D11 | Keyboard drag-drop → skip, known limitation |

---

## 📝 Session Log

### 2026-06-02 — UX Overhaul
**Đã làm:**
- Tags roadmap: bỏ prefix `#` khỏi tag chips
- Home card: title 24px Crimson Pro, circle SVG progress weeks, bỏ 1 progress bar trùng
- `assignLanes`: refactor — cùng phase → vertical stack theo `S.tasks` order
- Team row: thêm grip drag handle, drag để reorder rows
- Task bars: drag lên task cùng phase+team → swap ⚠️ (W3-1 sẽ đổi thành insert-before)
- Export PDF: auto-expand scope/output trước capture
- Deploy: `cc3d12c` → https://project-roadmap-eight.vercel.app

### 2026-06-03 — Planning + Documentation
**Đã làm:**
- Review toàn diện: design critique, accessibility audit (WCAG 2.1 AA), code review
- Lập danh sách 34 issues phân loại: bug logic, UX, accessibility, code quality
- Grill-me session: chốt 11 design decisions (D01–D11) với lý do cụ thể
- Lập Wave 1–4 với thứ tự tối ưu theo ROI
- Tạo cấu trúc 2-file docs: `PROJECT_CONTEXT.md` (stable) + `WORKING.md` (volatile)
- Không ship code trong session này
- Deploy docs: `8399e74`

**Tiếp tục session sau:**
- Bắt đầu Wave 1 từ W1-1 (`assignLanes` bug fix)
