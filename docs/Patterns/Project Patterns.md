---
id: project-patterns
title: Project Patterns
type: guide
status: stable
project: e-class-p2k
area: patterns
aliases:
  - Design Patterns
  - Patterns
related:
  - Index
updated: 2026-07-18
---

# Các Mẫu Thiết kế (Project Patterns)

Tài liệu này lưu trữ các mẫu thiết kế kiến trúc chuẩn được sử dụng và khuyến khích áp dụng trong toàn bộ dự án E-Class P2K để đảm bảo tính dễ mở rộng và tái sử dụng mã nguồn.

---

## 1. Strategy Pattern (Mẫu Chiến lược)
- **Áp dụng**: Sử dụng trong module chống gian lận (Proctoring) để cấu hình các cấp độ nghiêm ngặt khác nhau ([[Anti Cheat Level]]).
- **Lý do**: Cho phép thay đổi linh hoạt các thuật toán phát hiện gian lận và hình phạt tương ứng ở runtime tùy theo kỳ thi mà không làm thay đổi core engine của Proctoring.

## 2. Observer Pattern (Mẫu Quan sát)
- **Áp dụng**: Sử dụng trong module camera giám sát để phân phối sự kiện nháy mắt hoặc quay đi nơi khác tới các bộ phận xử lý nghiệp vụ khác nhau (như bộ ghi log, bộ đếm ngược nháp, bộ tích lũy điểm nghi vấn).

## 3. Repository Pattern (Mẫu Kho lưu trữ)
- **Áp dụng**: Sử dụng ở Java Backend để trừu tượng hóa các câu lệnh SQL truy vấn trực tiếp khỏi Controller, giúp việc kiểm thử (Unit Test) và chuyển đổi database sau này dễ dàng hơn.
