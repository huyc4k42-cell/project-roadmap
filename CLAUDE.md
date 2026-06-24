# CLAUDE.md — Aroadmap

> Auto-loaded by Claude Code. Concise reference — deep details in PROJECT_CONTEXT.md.
> Sprint hiện tại + decisions → WORKING.md

---

## Project

**Aroadmap** — Visual project roadmap timeline tool  
**Live:** https://aroadmap.cloud · **App:** https://aroadmap.cloud/app  
**Repo:** https://github.com/huyc4k42-cell/project-roadmap  

---

## Files chính

```
app.html        ← App entry point (Vite, 20 dòng) — served tại /app
src/app/        ← 54 ES modules: main.js, render/, events/, firebase, state...
src/styles/     ← 7 CSS files (base, layout, sidebar, timeline, modals, home, main)
index.html      ← Landing page (~1,120 dòng) — served tại /
vercel.json     ← Routing config (/app → app.html)
firestore.rules ← Firestore security rules (đã deploy)
timeline.html   ← DEPRECATED — backup của monolith cũ, không chỉnh sửa
PROJECT_CONTEXT.md  ← Deep technical reference (stable)
WORKING.md          ← Sprint hiện tại, decisions, backlog (volatile)
```

---

## Stack

- **Vite 5 + ES Modules** — 54 modules trong `src/`, build → `dist/`
- **Firebase 10.12.2** — Auth (Google Sign-In) + Firestore (asia-southeast1)
- **Vercel** — auto-build Vite + deploy khi push main
- **CDN:** lz-string, html2canvas, jsPDF via `window.*` (không npm)

---

## Deploy

```bash
git add src/ app.html index.html
git commit -m "feat/fix/style: mô tả"
git push origin main
# → Vercel chạy npm run build → dist/, live sau ~60s tại aroadmap.cloud
```

Không cần `vercel deploy --prod`. Không cần `firebase deploy` (trừ khi đổi rules).

---

## Data & State

- **Firestore:** source of truth — `/projects/{projectId}` per user
- **localStorage:** write-through cache (offline fallback)
- **State object `S`:** `{ cfg, phases, teams, tasks, tags, _nextId, ui }`
- **Hash routing:** `#home` | `#project-{id}` | `#v1=...` (read-only share)

---

## Conventions

```js
q('#id')           // document.querySelector
qAll('.class')     // querySelectorAll
esc(str)           // HTML escape
nextId()           // S._nextId++ (integer IDs, no UUID)
render(noSave?)    // re-render project view
renderHome()       // re-render home screen
rerender()         // render() hoặc renderHome() tùy currentProjId
pushHistory()      // call TRƯỚC khi mutate data (Ctrl+Z support)
showToast(msg)     // toast 3s
```

---

## CSS Design Tokens (Dark theme default)

```
--bg #080808  --s1 #111111  --s2 #1b1b1b  --s3 #262626
--bd #2e2e2e  --txt #ede9e4 --txt2 #b2aaa0
--gold #D0A052  --grn #4caf7d  --red #e05757
--hdr 94px  --sb 288px  --tlw 204px  --ww 64px
```

Border-radius: max 8px toàn bộ (trừ avatar circle + progress bars 2px).

---

## Firebase IDs

```
Project:      a-roadmap
Firestore:    asia-southeast1
Vercel proj:  prj_o0iwuBDrXnp8BRdKLNKR1vMRphyx
```

---

## Agent Workflow (Plan → Execute)

Dùng 2 agent trong `.claude/agents/` cho mọi task code có độ phức tạp trung bình trở lên:

```
1. code-analyst  →  quét codebase, tìm root cause, lên plan
2. [User approve plan]
3. code-executor →  thực thi đúng plan, không improvise
```

**Routing tự động — Claude tự quyết:**

| Task | Làm gì |
|------|--------|
| CSS, màu, spacing, font, border-radius | Làm thẳng — KHÔNG cần agent |
| Sửa text, label, icon đơn lẻ | Làm thẳng — KHÔNG cần agent |
| Bug logic, state, render sai | TỰ ĐỘNG gọi `code-analyst` trước |
| Feature chạm >1 file | TỰ ĐỘNG gọi `code-analyst` trước |
| Drag-drop, modal, Firebase, undo | TỰ ĐỘNG gọi `code-analyst` trước |
| Refactor hoặc thay đổi data flow | TỰ ĐỘNG gọi `code-analyst` trước |

**Cách chạy:**

```
# Bước 1 — Analyst scan và plan
/agent code-analyst
> [mô tả bug hoặc yêu cầu]

# Bước 2 — Đọc plan, reply "go" nếu đồng ý

# Bước 3 — Executor thực thi
/agent code-executor
> [paste plan từ analyst + "go"]
```

**Quy tắc:**
- `code-analyst` KHÔNG được viết/sửa file — chỉ đọc và lên plan
- `code-executor` KHÔNG được tự re-plan — nếu có blocker thì dừng, báo user
- Nếu executor báo 🚨 BLOCKER → quay lại analyst hoặc tự fix, không để executor đoán

---

## Debug nhanh

1. WW âm → `calcWW()` guard `Math.max(60, ...)`
2. Modal không đóng → `S.ui.modal = null` rồi `render()`
3. Drag stuck → check `S.ui.dragData`, `S.ui.teamDragId`, Escape reset hết
4. onSnapshot loop → `_fbSaving` guard trong `_saveToFirestore()`
5. Canvas không chạy → `initSignInCanvas()` gọi trong `bindHome()`, cần `currentUser === null`
