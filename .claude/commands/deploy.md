# /deploy — Deploy Aroadmap lên production

Deploy timeline.html và/hoặc index.html lên aroadmap.cloud qua Vercel auto-deploy.

## Quy trình

1. **Kiểm tra git status** — liệt kê files đã thay đổi
2. **Hỏi commit message** nếu user không cung cấp sẵn (gợi ý format: `feat/fix/style/docs: mô tả`)
3. **Stage files liên quan** — chỉ stage files đã được đề cập hoặc modified:
   - App changes: `timeline.html`
   - Landing changes: `index.html`
   - Docs changes: `PROJECT_CONTEXT.md`, `WORKING.md`
   - Rules changes: `firestore.rules`
4. **Commit và push:**
   ```bash
   git add <files>
   git commit -m "<message>"
   git push origin main
   ```
5. **Xác nhận deploy** — thông báo: "Live tại https://aroadmap.cloud sau ~30s"
6. **Nhắc update WORKING.md** nếu có feature/fix mới chưa được đánh dấu ✅

## Lưu ý

- KHÔNG dùng `git add .` — stage từng file cụ thể
- KHÔNG push nếu có unresolved merge conflicts
- Nếu đổi `firestore.rules` → nhắc chạy `firebase deploy --only firestore:rules` riêng
- Vercel tự deploy sau `git push`, không cần `vercel deploy --prod`
