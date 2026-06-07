# WORKING — Arthur Roadmap
> **File volatile — thay đổi mỗi session.**
> Đọc file này SAU `PROJECT_CONTEXT.md` để biết trạng thái hiện tại.
> Cập nhật lần cuối: 2026-06-07 (session Sign-in Redesign)

---

## ▶ BẮT ĐẦU SESSION MỚI TỪ ĐÂY

**Prompt nạp context:**
```
Đọc PROJECT_CONTEXT.md và WORKING.md để nắm trạng thái dự án.
```

**Trạng thái hiện tại:**
- ✅ Commit mới nhất: `e58b021` — đang live tại https://aroadmap.cloud
- ✅ Wave 1–4 hoàn thành (13 fixes + features)
- ✅ Firebase Firestore + Google Auth đã integrate
- ✅ Firestore security rules đã deploy — không còn test mode
- ✅ Custom domain `aroadmap.cloud` đã live (mua tại Mắt Bão)
- ✅ GitHub → Vercel auto-deploy (push là live, không cần `vercel deploy --prod`)
- ✅ **Sign-in screen redesign hoàn thành** — canvas dot matrix animation
- 📁 File cần edit: `/Users/arthur/Desktop/[Claude] Project Roadmap/timeline.html`

---

## ✅ Sign-in Screen Redesign — HOÀN THÀNH (2026-06-07)

### Thay đổi so với màn đăng nhập cũ

| | Trước | Sau |
|---|---|---|
| Layout | Nằm trong home header | Full-screen standalone |
| Background | Màu nền app đơn thuần | Canvas dot matrix WebGL-style animation |
| Dot shape | Không có | Rounded square (roundRect) |
| Dot size | — | 2.6px half-size, grid 13px spacing |
| Colors | Gold icon nhỏ | 30% gold (#D0A052) + 70% white/gray |
| Twinkling | Không có | Shader-accurate: jump qua OP_LEVELS mỗi ~4.5s |
| Opacity mask | Không có | Radial: tối nhất center, sáng dần ra rìa (quadratic) |
| Logo | Trong content block | Pinned top-center + dark blur strip |
| Title | Không có | "Turn your roadmap into reality." (Crimson Pro 40px) |
| Description | Text nhỏ đơn giản | "Plan visually, align your team…" |
| Button | `btn btn-gold` cũ | Glassmorphism: `backdrop-filter:blur(14px)` |
| Legal | Không có | "By logging in, you agree to Policies…" |
| Header/navbar | Có home header | Không có — clean auth screen |

### Kỹ thuật canvas animation

```js
// Cấu hình hiện tại (initSignInCanvas)
const GRID = 13;    // grid spacing (px)
const DOT  = 2.6;   // dot half-size (px) → diameter 5.2px
const CORN = 0.9;   // rounded-square corner radius
const FREQ = 4.5;   // twinkling cycle (seconds) — mirrors shader frequency

// Twinkling logic (port từ GLSL shader của 21st.dev)
const OP_LEVELS = [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1.0];
const slot   = Math.floor(t / FREQ + d.showOffset + FREQ);
const randV  = hash(d.gx * 1009 + d.gy * 1013 + slot * 7919);
const baseOp = OP_LEVELS[Math.floor(randV * 10)];

// Radial opacity mask (tối center, sáng rìa)
const edgeMult = 0.04 + 0.96 * (distNorm * distNorm); // quadratic
```

### Commits session này
| Hash | Mô tả |
|------|-------|
| `879a933` | feat: sign-in v1 — canvas dot matrix animation (circles) |
| `8de0039` | feat: sign-in v2 — shader-accurate twinkling, rounded squares, radial mask |
| `0d7b1b2` | fix: thu nhỏ radial mask chỉ phủ text area, button glassmorphism trong hơn |
| `e58b021` | tweak: dot size 1.8→2.6px, grid 16→13px |
| `2e37ad4` | feat: thêm roadmap-template.csv cho CSV import |

### Quyết định thiết kế (D19–D23)
| Code | Quyết định |
|------|-----------|
| D19 | Sign-in screen = full-screen standalone, không dùng home header |
| D20 | Canvas 2D thay vì WebGL/Three.js — đủ cho effect này, zero dependency |
| D21 | Twinkling: port discrete jump logic từ GLSL shader (OP_LEVELS array) thay vì sin liên tục |
| D22 | Radial mask chỉ phủ text (title+desc), button để dots hiện qua glass blur |
| D23 | Dot shape: roundRect thay vì arc — phù hợp aesthetic boxy của app |

---

## ✅ Firestore Security Rules — HOÀN THÀNH (2026-06-07)

**Rules đang live:**
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

---

## 🟡 Backlog — Collaborator (Wave 5)

- [ ] **W5-1** Invite collaborator bằng email
  - Thêm `collaborators: [uid]` vào Firestore document
  - Update security rules: `|| request.auth.uid in resource.data.collaborators`
  - UI: nút "Chia sẻ edit" trong project header → nhập email → lookup uid → add to array

- [ ] **W5-2** Presence indicator — "Huy đang xem" badge
  - Dùng Firestore realtime: `presence/{projectId}/{uid}` document
  - TTL: update mỗi 30s, cleanup khi disconnect

- [ ] **W5-3** Conflict toast rõ hơn
  - Hiện tại: "🔄 Cập nhật từ thiết bị khác" — generic
  - Cải thiện: hiện tên người vừa save + thời gian

---

## 🔵 Backlog — Nice to Have

- [ ] Task description field trong modal edit-task (field `desc` đã có trong data model, chưa có UI)
- [ ] Keyboard shortcut: `N` để thêm task nhanh từ bất kỳ đâu
- [ ] Export Excel/CSV từ timeline data
- [ ] Project archive (ẩn khỏi home grid mà không xóa)
- [ ] Thêm Three.js via CDN để dùng GLSL shader từ 21st.dev trực tiếp (không cần port)

---

## ❌ Won't Do (Documented)

| Item | Lý do bỏ qua |
|------|-------------|
| CSS token rename (`--s1` → `--surface-base`...) | Zero user value, rủi ro miss cao |
| Keyboard drag-drop alternative | Conflict với shortcuts hiện có |
| Header stats declutter | Stats là thông tin scanning quan trọng |
| Mobile responsive | Desktop-first by design |
| Google Sheets template URL | Cần tạo real Sheet riêng |
| Phase scope per-block resize | Quá phức tạp |

---

## 📌 Key Decisions

> Chi tiết đầy đủ trong `PROJECT_CONTEXT.md` → mục 11 Design Decisions Log.

| Code | Quyết định |
|------|-----------|
| D01–D11 | UX decisions từ session 2026-06-03 |
| D12 | Auth required — không có account không xem được project |
| D13 | Firestore = source of truth, localStorage = write-through cache |
| D14 | `_fbSaving` guard tránh onSnapshot echo loop |
| D15 | Migration tự động không hỏi khi first login |
| D16 | `_projIndex` in-memory, không persist index riêng |
| D17 | Collaborator: last-write-wins, invite để Wave 5 |
| D18 | ✅ Security rules: đã deploy lên production (2026-06-07) |
| D19–D23 | Sign-in redesign decisions (xem mục trên) |

---

## 📝 Session Log

### 2026-06-07 — Sign-in Screen Redesign

**Nguồn tham khảo:** Component `sign-in-flow-1.tsx` từ 21st.dev (Erik X @erikx)
- React + Three.js + GLSL shader + framer-motion
- Port sang vanilla Canvas 2D vì project là single HTML file

**Iteration 1 (commit `879a933`):**
- Thay màn đăng nhập cũ bằng full-screen auth screen
- Canvas dot matrix: hình tròn, GRID=22, DOT=3.2
- Sin-based twinkling (smooth, không đúng với shader gốc)
- Logo + subtitle + Google button + legal text

**Iteration 2 (commit `8de0039`):**
- Port chính xác twinkling logic từ GLSL shader:
  `hash(gx*1009 + gy*1013 + floor(t/FREQ)*7919)` → jump qua OP_LEVELS
- Dots đổi từ `arc()` → `roundRect()` (rounded square)
- Radial opacity mask (quadratic): tối center, sáng rìa
- Logo pinned top-center + dark blur strip
- Title "Turn your roadmap into reality." (Crimson Pro)
- Button glassmorphism: `backdrop-filter:blur(14px)` + `rgba(255,255,255,.04)`

**Iteration 3 (commit `0d7b1b2`):**
- Thu nhỏ radial mask: `ellipse 44% 16% at 50% 40%`
- Chỉ phủ text area, button để dots hiện qua glass
- Button background 0.07→0.04, blur 10→14px

**Iteration 4 (commit `e58b021`):**
- GRID 16→13px (dày hơn), DOT 1.8→2.6px (to hơn)
- Dots rõ và đẹp hơn ở mọi màn hình

**Tips dùng 21st.dev:**
- Copy toàn bộ source code (tab tsx) + dependencies list
- Thêm Three.js CDN nếu muốn dùng shader trực tiếp không cần port

---

### 2026-06-07 — Custom Domain + Auto-deploy Setup

**Custom domain `aroadmap.cloud`:**
- Mua domain tại Mắt Bão
- Thêm A record `@` → `76.76.21.21` và CNAME `www` → `cname.vercel-dns.com`
- Add domain vào Vercel + Firebase Authorized domains
- Fix lỗi `auth/unauthorized-domain`

**GitHub → Vercel auto-deploy:**
- Từ giờ `git push origin main` → Vercel tự deploy, không cần `vercel --prod`

---

### 2026-06-07 — Firebase Security Rules + Wave 1→4

**Wave 1–4:** 13 fixes/features (bugs, polish, UX, sidebar rail) — xem PROJECT_CONTEXT.md

**Firebase:** Google Sign-In, Firestore CRUD, onSnapshot, auto-migration, security rules deploy
