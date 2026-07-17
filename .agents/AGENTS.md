# Quy tắc Agent — E-Class P2K

## QUY TẮC BỐI CẢNH (BẮT BUỘC)

### 1. Quét Obsidian trước khi viết code

Trước khi viết bất kỳ **React Component** hoặc **Class Java** mới nào, LUÔN LUÔN:

1. Tìm và quét các file .md trong thư mục Obsidian (tìm ở C:\Users\User\ các folder có tên chứa Obsidian, vault, hoặc .obsidian).
2. Kiểm tra xem đã có:
   - Kế hoạch kiến trúc liên quan đến component/class sắp viết
   - Sơ đồ logic / flow nghiệp vụ
   - Quy chuẩn đặt tên (naming convention)
3. Nếu tìm thấy tài liệu → đọc kỹ và tuân thủ trước khi viết code.
4. Nếu không tìm thấy vault → hỏi người dùng đường dẫn trước khi tiếp tục.

### 2. Tuân thủ logic nghiệp vụ từ Obsidian

- Logic trong Obsidian có độ ưu tiên CAO NHẤT, cao hơn cả code hiện tại.
- Không tự suy diễn hoặc rút gọn flow nếu Obsidian đã mô tả rõ.

### 3. Cảnh báo xung đột trước khi sửa

Nếu code hiện tại XUNG ĐỘT với tài liệu Obsidian:
1. DỪNG — không tự sửa.
2. Báo cáo: tên file Obsidian, đoạn code xung đột, điểm khác biệt.
3. Chờ xác nhận của người dùng trước khi thực hiện.

---

## Ngữ cảnh dự án

- Framework: React + Vite
- State: localStorage (client-side, không có backend thật)
- Theme: dark navy, accent #4FACFE
- Roles: Teacher / Student / Parent / Admin / Proctor
- Files chính: src/App.jsx, src/GradeCalculatorPage.jsx, src/VideoQuizPage.jsx
- Ngôn ngữ UI: Tiếng Việt

---

## Agent skills

### Issue tracker

Issues được lưu dưới dạng local markdown files trong `.scratch/`. Xem `docs/agents/issue-tracker.md`.

### Triage labels

Dùng labels mặc định: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. Xem `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` tại root + `docs/adr/`. Xem `docs/agents/domain.md`.

