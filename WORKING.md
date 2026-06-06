# WORKING — Arthur Roadmap
> **File volatile — thay đổi mỗi session.**
> Đọc file này SAU `PROJECT_CONTEXT.md` để biết trạng thái hiện tại.
> Cập nhật lần cuối: 2026-06-07

---

## ▶ BẮT ĐẦU SESSION MỚI TỪ ĐÂY

**Prompt nạp context:**
```
Đọc PROJECT_CONTEXT.md và WORKING.md để nắm trạng thái dự án.
```

**Trạng thái hiện tại:**
- ✅ Commit mới nhất: `033e072` — đang live tại https://project-roadmap-eight.vercel.app
- ✅ Wave 1–4 hoàn thành (13 fixes + features)
- ✅ Firebase Firestore + Google Auth đã integrate
- ✅ **Firestore security rules đã deploy** — không còn test mode
- 📁 File cần edit: `/Users/arthur/Desktop/[Claude] Project Roadmap/timeline.html`

---

## ✅ Firestore Security Rules — HOÀN THÀNH (2026-06-07)

~~**Vấn đề:** Firestore đang ở test mode — bất kỳ ai biết projectId cũng có thể đọc/ghi.~~

**Đã làm:**
- Cài `firebase-tools` v15.19.1 qua `npm install -g firebase-tools`
- `firebase login` — xác thực Google account thành công
- Tạo `firestore.rules`, `.firebaserc`, `firebase.json`
- `firebase deploy --only firestore:rules` → compiled OK, released to cloud.firestore

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

> Hiện tại: chỉ owner mới xem/sửa được project. Để chia sẻ edit cần implement invite.

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
| D01–D11 | UX decisions từ session 2026-06-03 (xem PROJECT_CONTEXT.md) |
| D12 | Auth required — không có account không xem được project |
| D13 | Firestore = source of truth, localStorage = write-through cache |
| D14 | `_fbSaving` guard tránh onSnapshot echo loop |
| D15 | Migration tự động không hỏi khi first login |
| D16 | `_projIndex` in-memory, không persist index riêng |
| D17 | Collaborator: last-write-wins, invite để Wave 5 |
| D18 | ✅ Security rules: đã deploy lên production (2026-06-07) |

---

## 📝 Session Log

### 2026-06-07 — Firebase Security Rules Deploy

**Kiểm tra kết nối Firestore:**
- Xác nhận Firebase SDK v10.12.2 import đúng, config đủ 6 fields
- `initFirebase()` → `onAuthStateChanged` → migrate → `_refreshIndex` → `router()` — flow đúng
- Phát hiện `_fbSaving` timeout cứng 800ms (edge case nếu mạng chậm, không critical)
- Phát hiện `_saveToFirestore` catch chỉ `console.error`, không toast user (known limitation)

**Deploy security rules:**
- `npm install -g firebase-tools` → v15.19.1 (warning Node v26 chưa supported nhưng không ảnh hưởng)
- `firebase login` → xác thực thành công
- Tạo `firestore.rules`, `.firebaserc`, `firebase.json`
- `firebase deploy --only firestore:rules` → ✅ compiled + released to cloud.firestore

---

### 2026-06-07 — Wave 1→4 + Firebase

**Wave 1 (Bugs):**
- W1-1: `assignLanes` no-phase greedy packing — tách `noLaneEnds[]` riêng
- W1-2: Phase sort order — sort keys theo `startWeek` trước assign lanes
- W1-3: Escape key — reset cả 3 drag states
- W1-4: localStorage QuotaExceededError → toast thay vì silent fail

**Wave 2 (Polish):**
- W2-1: `--txt3` contrast `#857d75` → `#9a9490`
- W2-2: Today line 2px + "Hôm nay" label via `::after`
- W2-3: Home card `min-height: 240px` + circle number HTML overlay
- W2-4: ARIA resize handles `role="slider"`

**Wave 3 (Core UX):**
- W3-1: Task reorder → insert-before + gold line indicator
- W3-2: Sidebar filter: xoá Tag select, 3 selects thành 1 flex row
- W3-3: Focus trap trong modal
- W3-4: Phase Scope + Output rows collapsible, state persist

**Wave 4 (Feature):**
- W4-1: Sidebar thin rail collapse (48px ↔ 288px, state persist)

**Firebase Integration:**
- Chuyển `<script>` → `<script type="module">` + Firebase v10 CDN imports
- Google Sign-In, auth gate, sign-in screen
- Firestore CRUD: createProject, deleteProject, duplicateProject, renameProject, loadProject
- `onSnapshot` real-time listener với `_fbSaving` guard
- Auto-migration localStorage → Firestore khi first login
- localStorage giữ vai trò cache + offline fallback
- Firebase config: project `a-roadmap`, region `asia-southeast1`
- Commit: `033e072`
