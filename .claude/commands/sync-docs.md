# /sync-docs — Đồng bộ WORKING.md + PROJECT_CONTEXT.md

Cập nhật documentation để phản ánh đúng trạng thái thực tế của project.

## Quy trình

### 1. Kiểm tra git log
```bash
git log --oneline -10
```
So sánh commits mới nhất với trạng thái trong WORKING.md để tìm items "✅ | pending" cần điền hash.

### 2. Update WORKING.md
- Điền commit hash thực tế cho các items đã có ✅ nhưng hash còn "pending"
- Cập nhật Progress Summary table (số items done / total)
- Nếu có sprint/phase mới hoàn thành → đánh dấu Done trong bảng tổng
- Update dòng "Cập nhật lần cuối" với ngày hôm nay

### 3. Update PROJECT_CONTEXT.md (nếu cần)
Chỉ update nếu có thay đổi về:
- Architecture mới (thêm module, đổi data model)
- Decision mới (append vào mục 11 "Design Decisions Log")
- Features đã implement (append vào mục 8 "Features Implemented")
- Bug đã fix (update mục 7 nếu liên quan đến algorithms)

### 4. Commit docs
```bash
git add WORKING.md PROJECT_CONTEXT.md
git commit -m "docs: sync — <tóm tắt session>"
git push origin main
```

## Lưu ý

- PROJECT_CONTEXT.md là **append-only** cho Design Decisions Log (không xóa entry cũ)
- WORKING.md là **volatile** — cập nhật tự do
- Không cần commit docs riêng nếu vừa deploy feature cùng lúc (gộp vào 1 commit)
