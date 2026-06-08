# WORKING — Aroadmap
> **File volatile — thay đổi mỗi session.**
> Đọc file này SAU `PROJECT_CONTEXT.md` để biết trạng thái hiện tại.
> Cập nhật lần cuối: 2026-06-09 · Session: Vite Migration B6

---

## ▶ BẮT ĐẦU SESSION MỚI TỪ ĐÂY

**Prompt nạp context:**
```
Đọc PROJECT_CONTEXT.md và WORKING.md để nắm trạng thái dự án.
```

**Trạng thái hiện tại:**
- ✅ Commit mới nhất: `a8cb16a` — đang live tại https://aroadmap.cloud
- ✅ Landing page `index.html` live tại https://aroadmap.cloud
- ✅ App tại https://aroadmap.cloud/app
- ✅ Firebase Auth + Firestore + Security rules đã deploy
- ✅ Custom domain `aroadmap.cloud` live
- ✅ GitHub → Vercel auto-deploy
- 🔄 **BIG UPDATE đang triển khai** — xem checklist bên dưới
- 📁 `timeline.html` — App chính (~4200 dòng)
- 📁 `index.html` — Landing page (~874 dòng)

---

## 🚀 BIG UPDATE — Pre-Launch Checklist

> Deploy từng Phase riêng. Mỗi phase = 1 commit + 1 `git push`.
> Đánh dấu `✅` khi xong, ghi commit hash vào cột Hash.

### PHASE 1 — Bug Fixes · ~2h · 🟢 Risk thấp
```bash
git commit -m "fix: keyboard shortcuts, resize handles, team row, scope collapse"
```

| # | Item | Mô tả kỹ thuật | Done | Hash |
|---|------|----------------|------|------|
| B1 | **Ctrl+Z/Ctrl+K trong input** | Di chuyển guard `if (['INPUT','TEXTAREA','SELECT'].includes(activeElement?.tagName)) return` lên TRƯỚC `Ctrl+Z` handler (dòng 2979). Giữ Escape hoạt động mọi nơi | ✅ | 7113d05 |
| B2 | **Team row min-height** | CSS: `.tm-row { min-height: 52px }`. Thêm "Drop tasks here" hint text (opacity 0.3) khi row không có task, ẩn khi có task | ✅ | 7113d05 |
| B3 | **Resize handle hit area** | CSS `::before` pseudo-element trên `.tb-lh`, `.tb-rh`, `.ph-lh`, `.ph-rh`, `.scope-resize-handle`: `content:''; position:absolute; inset:-12px 0` (horizontal expand ~30px) | ✅ | 7113d05 |
| B4 | **Scope/Output collapse clip** | Timeline container đang `overflow:hidden` cắt collapse toggle. Fix: dùng `clip-path` hoặc đổi overflow strategy để button không bị clip | ✅ | 7113d05 |
| B5 | **Verify n/p/t guard** | Confirm shortcut `n`/`p`/`t` (dòng 2994–2996) đã có guard. Thêm `.isContentEditable` check nếu cần | ✅ | 7113d05 |

---

### PHASE 2 — Visual System · ~2h · 🟢 CSS only
```bash
git commit -m "style: classic mood — border-radius system, nav opacity, txt3 sync"
```

| # | Item | Mô tả kỹ thuật | Done | Hash |
|---|------|----------------|------|------|
| V1 | **Border-radius toàn bộ** | **timeline.html:** `--r: 6→4px`, `--r2: 10→6px`, hardcoded `100px` → `6px` (tag pills, badges, buttons). **index.html:** nav pill `100px→8px`, CTA buttons `100px→6px`, waitlist form `100px→6px`, beta badge `100px→4px`, step-n `50%→6px`, feature cards `14px→4px`, demo device `20→12px`. **Rule:** max 8px trừ avatar (circle) và progress bars (2px) | ✅ | 8eea115 |
| V2 | **Landing nav scrolled opacity** | `.scrolled .nav-inner`: `rgba(8,8,8,.92)→rgba(8,8,8,.75)`, `blur(20px)→blur(28px)` | ✅ | 8eea115 |
| V3 | **--txt3 landing sync** | index.html: `--txt3: #857d75 → #9a9490` | ✅ | 8eea115 |

---

### PHASE 3 — Modal Architecture · ~10h · 🟡 Medium risk — Test kỹ
```bash
git commit -m "feat: modal-root separation, settings 2-col, phase mini calendar, theme toggle → home"
```

| # | Item | Mô tả kỹ thuật | Done | Hash |
|---|------|----------------|------|------|
| M1 | **Tách #modal-root** | Thêm `<div id="modal-root"></div>` vào HTML tĩnh ngoài `#app`. `openModal()` render vào `#modal-root` thay vì include trong `buildApp()`. Modal không bị replace khi `render()` chạy → fix jitter + focus + animation fade-in | ✅ | 7dc74d8 |
| M2 | **Settings modal 2-column** | Grid 2 cột. **Trái:** Project name, description, Start date input, End date input, week calendar reference (highlight range đã chọn). **Phải:** Delete project button (red, trái) + Cancel/Save (phải). Accent color picker bỏ khỏi đây | ✅ | 7dc74d8 |
| M3 | **Add Phase: mini calendar** | Thay number input `startWeek`/`endWeek` bằng mini calendar inline. Click = start, click lại = end. Footer: "Week X → Week Y · N weeks" | ☐ | — |
| M4 | **Theme toggle → Home** | Bỏ theme toggle khỏi project detail header. Thêm vào Home header (cạnh avatar) | ✅ | 7dc74d8 |

**Test checklist Phase 3:**
- [ ] Mọi modal type mở/đóng bình thường (cfg, add-phase, edit-phase, add-task, edit-task, add-team, edit-team, share, new-project, rename-project, import)
- [ ] Tab/Shift+Tab focus trap hoạt động trong modal
- [ ] Escape đóng modal
- [ ] Enter submit modal (trừ textarea)
- [ ] Không còn giật khi modal mở

---

### PHASE 4 — Component Redesigns · ~15h · 🟡 Medium risk
```bash
git commit -m "feat: avatar dropdown, 2-row header, cards redesign, empty state, filter, lane algorithm"
```

| # | Item | Mô tả kỹ thuật | Done | Hash |
|---|------|----------------|------|------|
| C1 | **Avatar dropdown** | Click avatar → dropdown: "Signed in as [email]" (muted) + divider + "Sign Out" với icon. Bỏ logout button riêng. Close khi click outside | ✅ | 5e78c8a |
| C2 | **App header 2-row** | **Row 1** (58px): breadcrumb + hdr-btns (Share, Export, Settings — không còn Theme, không còn Stats). **Row 2** (36px, bg --s2, border-bottom): stats compact (Tổng / Đã xếp / Backlog / Tuần). Update `--hdr: 58px → 94px` | ✅ | 5e78c8a |
| C3 | **Project cards redesign** | Primary: name 22px Crimson Pro + subtitle 12px. Secondary: 1 progress bar đơn giản (% tasks scheduled, màu accent). Hover: `-4px translateY` + shadow + "Open →" badge góc phải dưới. Stats ẩn vào hover tooltip. Min-height 160px. Bỏ circle SVG + time-elapsed bar | ✅ | 5e78c8a |
| C4 | **Empty state** | Khi `_projIndex.length === 0`: dot matrix canvas bg (opacity 0.15, tái dùng canvas logic từ sign-in). Center: headline + sub + "New Project" (btn-gold) + "View Sample →" (btn-ghost → load `#v1=...` demo read-only) | ✅ | pending |
| C5 | **Filter đơn giản** | Bỏ dropdown Trạng thái. Gộp Phase + Team thành 1 dropdown với `optgroup` hoặc tab toggle. Giữ Search + Tag pills | ✅ | pending |
| C6 | **Lane algorithm fix** | `assignLanes()`: row height = `max(lanes per phase group)` không cộng dồn. No-phase tasks = nhóm riêng, global max = `Math.max(...phaseGroupMaxes, noPhaseLanes)`. Task span tính theo `phaseId` | ✅ | pending |

---

### PHASE 5 — New Features · ~6h · 🟡 Quick wins
```bash
git commit -m "feat: task description UI, task done state, first-login sample project"
```

| # | Item | Mô tả kỹ thuật | Done | Hash |
|---|------|----------------|------|------|
| F1 | **Task description UI** | Modal `edit-task`: thêm `<textarea>` cho `desc` field. Label "Notes", placeholder "Add context, links, or details…", 3 rows. Không required. Field đã có trong data model | ✅ | pending |
| F2 | **Task done/complete state** | Thêm `done: boolean` (default `false`) vào task. Click trái task bar → toggle done. Visual: opacity 0.45 + strikethrough text. Context menu: "Mark as done" / "Mark as active". Stats: thêm done count | ✅ | pending |
| F3 | **First-login sample project** | Sau `_refreshIndex()` nếu `_projIndex.length === 0`: auto-tạo project demo "Product Launch Q3 · Sample" với compressed data. Home header: nút "This is a sample — create your own +". Xóa sample khi tạo project thật đầu tiên | ☐ | — |

---

### PHASE 6 — Landing Page · ~14h · 🟢 Low risk
```bash
git commit -m "feat: landing — spotlight nav, features dropdown, features-9, CTA closer, flickering footer, meta"
```

| # | Item | Mô tả kỹ thuật | Done | Hash |
|---|------|----------------|------|------|
| L1 | **Nav spotlight effect** | `mousemove` trên `.nav-inner`. CSS custom props `--mouse-x`, `--mouse-y`. Pseudo-element background: `radial-gradient(200px circle at var(--mouse-x) var(--mouse-y), rgba(208,160,82,.25), transparent)`. Remove khi mouse leaves | ✅ | pending |
| L2 | **Features dropdown** | Click "Features" link trong nav → dropdown panel. 3 card: Visual Timeline / Real-time Sync / Share & Export (icon + title + desc). Hover card: gold gradient bg tint. Click outside → close. Vanilla JS, không dùng framework | ✅ | pending |
| L3 | **"Everything you need" rebuild** | Xóa `#features` bento grid hiện tại. Thay bằng features-9 layout: center stat "**73%**" + "more productive" + subtext. 3 pain→solution bordered cards, 3 cột: (1) "Spreadsheets don't show the big picture" → Visual Timeline (2) "Changes get lost between meetings" → Real-time Sync (3) "Stakeholders need progress, not complexity" → One-click Share | ✅ | pending |
| L4 | **CTA section minimal** | Replace `#cta-final`: centered, bg `--s1`. Crimson Pro 4rem "Your roadmap is waiting." + sub "Start building in minutes." + 1 btn-gold "Get Started →". Không có email input | ✅ | pending |
| L5 | **Footer flickering** | Replace footer: "Aroadmap" Crimson Pro ~6rem, mỗi char có CSS `@keyframes flicker` (opacity jumps, random delay). Links nhỏ bên dưới (Privacy · Terms · © 2026 Aroadmap) | ✅ | pending |
| L6 | **Meta + lang fixes** | `index.html`: `og:title` → "Aroadmap — Visual Project Roadmap", `<title>` → "Aroadmap", `alt` → "Aroadmap". `timeline.html`: `lang="vi"→"en"`, `<title>` → "Aroadmap — Timeline" | ✅ | 8eea115 |

---

## 📊 Progress Summary

| Phase | Items | Status |
|-------|-------|--------|
| 1 — Bug Fixes | 5 | ✅ Done — `7113d05` |
| 2 — Visual System | 3 | ✅ Done — `8eea115` |
| 3 — Modal Architecture | 4 | 🔄 3/4 done — M3 pending |
| 4 — Component Redesigns | 6 | ✅ 6/6 done — C1-C3: `5e78c8a`, C4-C6: pending |
| 5 — New Features | 3 | 🔄 2/3 done — F1+F2 pending commit, F3 skipped |
| 6 — Landing Page | 6 | ✅ 6/6 done — pending commit |
| **Total** | **27** | **26/27 done** |

---

## 📌 Decisions từ Grill Session (2026-06-08)

> Chi tiết đầy đủ trong `PROJECT_CONTEXT.md` → mục 11. Chỉ ghi những decision mới từ Big Update.

| Code | Quyết định |
|------|-----------|
| D34 | Features dropdown landing: 3 card — Visual Timeline / Real-time Cloud Sync / Share & Export |
| D35 | "Everything you need" section: pain→solution format, target PM/team lead quản lý nhiều dự án |
| D36 | CTA section: minimal — serif headline + 1 button, không repeat email input |
| D37 | Footer: flickering style, text "Aroadmap" |
| D38 | Border-radius: max 8px toàn bộ app + landing (trừ avatar circle + progress bars 2px) |
| D39 | Project cards: title+subtitle primary, 1 progress bar, stats on hover, "Open →" on hover |
| D40 | Avatar → dropdown menu (email context + Sign Out) |
| D41 | App header: 2 tầng — Row 1 breadcrumb+actions, Row 2 stats bar |
| D42 | Theme toggle + accent color picker → Home screen |
| D43 | Empty state: dot matrix canvas bg + "View Sample →" load demo read-only |
| D44 | Filter: Search + Phase/Team toggle + Tags. Bỏ Status dropdown |
| D45 | Settings modal: 2-column layout, date input + calendar reference |
| D46 | Add Phase: mini calendar inline thay number input |
| D47 | Lane algorithm: row height = max(per phase group), phaseId-based not time-range |
| D48 | Team row empty: min-height 52px + "Drop tasks here" hint |
| D49 | Scope/Output collapse toggle: fix clip bug |
| D50 | Keyboard shortcuts: Ctrl+Z/Ctrl+K disable trong input, Escape exempt |
| D51 | Nav spotlight: cursor-following gold glow trên toàn header pill |
| D52 | Task done/complete state: done boolean, strikethrough + opacity 0.5 |
| D53 | First-login sample project: auto-load khi _projIndex.length === 0 |
| D54 | Task description UI: textarea cho desc field trong edit-task modal |

---

## 📝 Session Log

### 2026-06-08 — Big Update Planning Session

**Quy trình đã hoàn thành:**
1. ✅ `/grill-me` — 17 câu hỏi, resolve 25 design decisions (D34–D54)
2. ✅ `/accessibility-review` — 10 issues: 2 critical, 4 major, 4 minor
3. ✅ `/design-critique` — Border-radius inconsistency, modal architecture, typography
4. ✅ `/product-brainstorming` — Task done state + description UI + first-login sample project
5. ✅ `/roadmap-update` — 27 items / 6 phases / ~49h total effort

**Key additions từ brainstorm (không có trong feedback gốc):**
- F2: Task done/complete state (critical gap cho PM usecase)
- F3: First-login sample project (wow moment)
- F1: Task description UI (data model đã có, chỉ thiếu UI)

---

### 2026-06-08 — Landing Page Screenshot + ContainerScroll
*(session trước — đã hoàn thành)*

| Hash | Mô tả |
|------|-------|
| `01bfd1d` | feat: add screenshot.png (1400×900px dark-mode timeline) |
| `a8cb16a` | feat: ContainerScroll — macOS device mock, 3D tilt, gold eyebrow |

---

---

## 🔧 Vite + ES Modules Migration — Branch `feat/vite-migration`

> Song song với BIG UPDATE trên `main`. Không ảnh hưởng production.

| Phase | Mô tả | Done | Commit |
|-------|-------|------|--------|
| B1 | Vite infra setup (vite.config.js, app.html, npm, tsconfig) | ✅ | — |
| B2 | CSS split (base, layout, sidebar, timeline, modals, home, main.css) | ✅ | `fe8554d` |
| B3 | JS foundations (constants, utils, theme, date, state, storage) | ✅ | `cb7aabe` |
| B4 | Firebase + persistence (firebase.js, persistence.js) | ✅ | `574c267` |
| B5 | Feature modules (algorithms, weekpicker, canvas) | ✅ | `067a7a9` |
| B6 | Render layer (icons, sidebar, timeline, modals, home, render/index) | ✅ | `0be6f46` |
| B7 | Events + drag-drop + import + export | ✅ | `7313aea` |
| B8 | Router + main.js entry + full wiring | ✅ | `7f48ebb` |
| B9 | Static analysis + bug fixes | ✅ | `479faeb` |

**Tổng tiến độ: 9/9 phases ✅ — sẵn sàng manual test + deploy**

**Cần làm để deploy:**
1. `npm run dev` → mở http://localhost:3333/app — test thủ công các flows chính
2. Nếu pass: `git checkout main && git merge feat/vite-migration`
3. Update `vercel.json` routing nếu cần (app.html → /app)
4. `git push origin main` → Vercel auto-deploy

**B9 bug fixes đã xử lý:**
- `createProject` nav callback double-prefix bug (`#project-#project-...`)
- Import CSV button `null` → `undefined` (fallback to currentProjId)
- Default `S.cfg.scopeRowHeight = 100` cho share view

---

## ❌ Won't Do (Documented)

| Item | Lý do |
|------|-------|
| CSS token rename (`--s1` → `--surface-base`...) | Zero user value, rủi ro miss cao |
| Keyboard drag-drop alternative | Known limitation |
| Mobile responsive | Desktop-first by design |
| Google Sheets template URL | Cần tạo real Sheet riêng |
| Collaborator invite (Wave 5) | Post-launch |
| Presence indicator (Wave 5) | Post-launch |
