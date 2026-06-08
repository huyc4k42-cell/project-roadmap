# /screenshot — Capture screenshot.png cho landing page

Tạo lại `screenshot.png` (1400×900px) dùng trong demo section của `index.html`.

## Quy trình

### 1. Khởi động preview server
```bash
python3 -m http.server 3333
```
Server chạy background tại http://localhost:3333

### 2. Load demo data qua share URL
Dùng `preview_eval` để navigate tới timeline với demo data:
```js
location.href = 'http://localhost:3333/timeline.html#v1=<LZ_COMPRESSED_DEMO_DATA>'
```

Demo data là project "Product Launch 2026" với 4 phases, 4 teams, 16 tasks.
LZ string được compress trong browser — không pre-compute.

### 3. Chuẩn bị layout trước khi capture
```js
// Ẩn read-only banner
document.querySelector('.ro-banner')?.style.setProperty('display','none')
// Hiện scheduled tasks trong sidebar (click stat)
document.querySelector('#stat-sched')?.click()
```

### 4. Capture bằng html2canvas
```js
const canvas = await html2canvas(document.body, {
  width: 1400, height: 900,
  windowWidth: 1400, windowHeight: 900,
  scale: 1, useCORS: true, allowTaint: true
})
const dataUrl = canvas.toDataURL('image/png')
```

### 5. Lưu file
POST dataUrl tới Python HTTP server phụ (port 8765) → ghi vào `screenshot.png`

### 6. Verify
- Kiểm tra file size (~150–220KB là bình thường)
- Xem ảnh: `open screenshot.png`
- Commit: `git add screenshot.png && git commit -m "feat: update demo screenshot"`

## Lưu ý

- Preview server cần chạy trước khi dùng `preview_eval`
- html2canvas KHÔNG chạy được từ Chrome headless CDP (Firebase ESM CDN block)
- Phải dùng preview browser (port 3333), không phải headless
- Demo data compress trong browser, tránh encoding mismatch với dấu `+` trong URL
