---
id: ai-coding-rules
title: AI Coding Rules
type: instruction
status: stable
project: e-class-p2k
area: ai-rules
aliases:
  - Coding Rules for AI
  - Quy tắc viết code
related:
  - Naming Convention
updated: 2026-07-18
---

# Chỉ thị AI: Quy tắc Viết Code (Coding Rules)

Tài liệu này quy định các tiêu chuẩn viết code bắt buộc áp dụng cho mọi AI-Agent khi thực hiện chỉnh sửa, tối ưu hóa hoặc tạo mới mã nguồn trong dự án E-Class P2K.

---

## 1. Triết lý Thiết kế Tối giản (Ponytail)
- **Lazy Mode**: Chỉ làm những gì thực sự cần thiết để giải quyết vấn đề của người dùng. Tránh over-engineering, không tạo cấu trúc thư mục thừa, không cài thêm dependency không cần thiết.
- **YAGNI (You Aren't Gonna Need It)**: Không phát triển trước các tính năng dự phòng tương lai.
- **Native Platform**: Ưu tiên sử dụng thư viện tiêu chuẩn hoặc API có sẵn của ngôn ngữ/framework trước khi nghĩ đến package bên ngoài.

## 2. Bảo toàn Mã nguồn gốc
- **Giữ nguyên Comment**: Không tự ý xóa bỏ các comment hoặc Javadoc/Docstring không liên quan đến phạm vi sửa đổi.
- **Không lược bớt logic**: Khi viết file hoặc component, viết mã chi tiết và đầy đủ. Tuyệt đối không dùng mã giả (pseudo-code) hoặc viết tắt (như `// rest of code remains the same...`).

## 3. Quản lý Giao dịch & DB (Java Backend)
- **Manual Transactions**: Khi thực hiện các tác vụ ghi/chèn dữ liệu số lượng lớn (Batch Insert), bắt buộc phải tắt `autoCommit` (`conn.setAutoCommit(false)`), quản lý thủ công qua JDBC Connection và gọi rollback/commit rõ ràng trong khối try-catch-finally.
- **ON CONFLICT**: Các câu lệnh INSERT vào bảng nhạy cảm (như `teachers`, `students`, `schools`) phải đi kèm mệnh đề chống trùng lặp `ON CONFLICT (username/name) DO NOTHING` hoặc xử lý tương đương.
- **Giải phóng tài nguyên**: Đảm bảo đóng PreparedStatement và Connection trong khối `finally`.
