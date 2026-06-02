# WORKING — Arthur Roadmap
> **File volatile — thay đổi mỗi session.**
> Đọc file này SAU `PROJECT_CONTEXT.md` để biết trạng thái hiện tại.
> Cập nhật lần cuối: 2026-06-03

---

## 🎯 Active Sprint — Wave 1 + 2

> Mục tiêu: fix bugs + quick wins trước khi thêm feature mới.
> Estimate: ~1.5–2h. Deploy sau khi hoàn thành Wave 1+2.

### 🔴 Wave 1 — Stability (Bugs)
- [ ] **W1-1** Fix `assignLanes` — no-phase tasks greedy packing bị broken (loop không chạy). Tách `noLaneEnds[]` riêng cho no-phase tasks.
- [ ] **W1-2** Fix phase stacking sort — phase groups phải sort theo `startWeek` (visual order), không theo ID.
- [ ] **W1-3** Fix `Escape` key — reset `S.ui.dragData`, `S.ui.teamDragId`, `S.ui.phaseDragId` khi Escape. Hiện chỉ đóng modal.
- [ ] **W1-4** `localStorage` error boundary — wrap `saveState()` trong try/catch, toast cảnh báo khi `QuotaExceededError`.

### 🟡 Wave 2 — Quick Wins (Polish)
- [ ] **W2-1** Fix `--txt3: #857d75` → `#9a9490` — WCAG AA contrast 4.5:1.
- [ ] **W2-2** Today line: tăng `width: 2px`, `opacity: 0.75`. Thêm label "Hôm nay" vào `.wk-c.cur` (week row sticky).
- [ ] **W2-3** Home card: `min-height: 240px` để đồng đều. Circle progress text đổi thành HTML overlay (số to hơn, dễ đọc hơn).
- [ ] **W2-4** Fix `role="separator"` → `role="slider"` trên `.tb-lh` / `.tb-rh` resize handles.

---

## 🟢 Backlog — Wave 3 (Core UX)

> Làm sau khi Wave 1+2 stable và deployed.

- [ ] **W3-1** Task insert-before: đổi logic drag từ swap → insert-before. Thêm gold line indicator phía trên task target.
- [ ] **W3-2** Sidebar filter: xoá select "Tag". Gộp 3 select còn lại (Phase/Nhóm/Trạng thái) thành 1 row.
- [ ] **W3-3** Focus trap trong modal — Tab không thoát ra ngoài backdrop.
- [ ] **W3-4** Phase Scope + Output rows collapsible — toggle per row, nhớ state trong `roadmap-row-state` localStorage. First-run default: cả 2 expanded.

---

## 🔵 Backlog — Wave 4 (New Feature)

> Làm sau khi Wave 3 stable. Rủi ro layout cao nhất.

- [ ] **W4-1** Sidebar thin rail collapse: thu gọn thành 48px, hiện icon list + badge số backlog. Click expand. Drag task từ backlog yêu cầu expand trước.

---

## ❌ Won't Do (Documented)

| Item | Lý do |
|------|-------|
| CSS token rename (--s1 → --surface-base) | Zero user value, rủi ro miss cao trong 3750 dòng |
| Keyboard drag-drop alternative | Conflict với shortcuts hiện có, edge case ít dùng |
| Header stats declutter | Chưa cần — stats là thông tin scanning quan trọng |
| Mobile responsive | Desktop-first by design |
| Google Sheets template URL | Cần tạo real Sheet riêng |
| Phase scope per-block resize | Quá phức tạp, toàn row resize là đủ |

---

## 📌 Key Decisions (2026-06-03 Grill-me)

> Xem chi tiết trong `PROJECT_CONTEXT.md` mục 11 — Design Decisions Log.

| Code | Tóm tắt |
|------|---------|
| D01 | Sidebar collapse → thin rail 48px, icon + badge |
| D02 | Drag từ collapsed sidebar → expand trước |
| D03 | Xoá Tag select, giữ tag pills, gộp 3 selects còn lại |
| D04 | Task reorder → insert before (không swap) |
| D05 | Insert indicator → gold line phía trên target |
| D06 | Scope/Output collapsible, nhớ state per-row |
| D07 | First-run: cả 2 rows expanded |
| D08 | "Hôm nay" label trên week row sticky, màu gold |
| D09 | Header stats: giữ nguyên |
| D10 | CSS token rename: skip |
| D11 | Keyboard drag: skip |

---

## 📝 Session Log

### 2026-06-02 — UX Overhaul Session
**Đã làm:**
- Tags trong roadmap task bars: bỏ prefix `#`
- Home card: title 24px, circle SVG progress, bỏ 1 progress bar trùng lặp
- `assignLanes`: refactor — same phase → vertical stack theo S.tasks order
- Team row: thêm grip drag handle ở cuối label, drag để reorder
- Task bars: drag lên task khác cùng phase+team → swap position (⚠️ cần đổi thành insert-before ở W3-1)
- Export PDF: expand scope/output trước capture để hiện full content
- Deploy: `cc3d12c` → https://project-roadmap-eight.vercel.app

### 2026-06-03 — Planning Session
**Đã làm:**
- Review toàn diện: design critique, accessibility audit, code review
- Grill-me session: chốt 11 design decisions (D01–D11)
- Lập kế hoạch Wave 1–4 với thứ tự tối ưu
- Tạo cấu trúc 2-file: PROJECT_CONTEXT.md + WORKING.md
