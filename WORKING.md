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
- ✅ Code app: commit `c6c217a` — đang live tại https://project-roadmap-eight.vercel.app
- ✅ Wave 1 + Wave 2: hoàn thành, commit `c6c217a`
- ✅ Wave 3: hoàn thành, commit `2cb3d53`
- ✅ Wave 4: hoàn thành, commit `70b903f` — đang live
- 🎉 Tất cả Wave 1–4 đã hoàn thành và deployed
- 📁 File cần edit: `/Users/arthur/Desktop/[Claude] Project Roadmap/timeline.html`

---

## 🎯 Active Sprint — Wave 1 + 2

> Mục tiêu: fix bugs + quick wins trước khi thêm feature mới.
> Estimate: ~1.5–2h. Deploy ngay sau khi hoàn thành Wave 2.

### 🔴 Wave 1 — Stability (Bugs)

- [x] **W1-1** Fix `assignLanes` — no-phase tasks greedy packing bị broken.
  - **Nguyên nhân:** `laneEnds = new Array(nextLane).fill(Infinity)` nên `laneEnds.length === nextLane`, loop `for (i = nextLane; i < laneEnds.length)` không bao giờ chạy.
  - **Fix:** Tách `noLaneEnds = []` riêng (empty array) cho no-phase tasks, loop tìm lane trống trong `noLaneEnds`, map về `globalLane = nextLane + i`.

- [x] **W1-2** Fix phase stacking sort theo visual order.
- [x] **W1-3** Fix `Escape` key không reset drag states.
- [x] **W1-4** `localStorage` error boundary.

### 🟡 Wave 2 — Quick Wins (Polish)

- [x] **W2-1** Fix contrast `--txt3` → `#9a9490`.
- [x] **W2-2** Today line 2px + "Hôm nay" label via `::after`.
- [x] **W2-3** Home card `min-height: 240px` + circle HTML overlay.
- [x] **W2-4** ARIA resize handles `role="slider"` + `aria-orientation`.

---

## ✅ Wave 3 — Done

- [x] **W3-1** Task drag reorder → insert-before + gold line indicator
- [x] **W3-2** Sidebar filter: xoá Tag select, gộp 3 selects thành 1 flex row
- [x] **W3-3** Focus trap trong modal (Tab/Shift+Tab cycle)
- [x] **W3-4** Phase Scope + Output rows collapsible, state nhớ qua reload

---

## ✅ Wave 4 — Done

- [x] **W4-1** Sidebar thin rail collapse (48px rail ↔ 288px expanded, state persist)

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
