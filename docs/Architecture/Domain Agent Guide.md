---
id: domain-agent-guide
title: Domain Agent Guide
type: architecture
status: stable
project: e-class-p2k
area: agent
aliases:
  - Domain Guide
  - Domain Agent
related:
  - Coding Rules
  - Index
updated: 2026-07-18
---

# Hướng dẫn Bối cảnh Domain (Domain Agent Guide)

Tài liệu này quy định cách các kỹ năng kỹ thuật và AI-Agent tiêu thụ và tương tác với tài liệu nghiệp vụ (domain) của kho lưu trữ.

---

## 1. Trước khi khám phá mã nguồn
AI-Agent trước khi thực hiện viết code, sửa đổi hoặc thêm mới các component React hay class Java bắt buộc phải:
- Kiểm tra các tài liệu quy định bối cảnh nghiệp vụ có trong thư mục `docs/`.
- Đọc kỹ các quyết định kiến trúc tại thư mục `docs/ADR/` liên quan trực tiếp đến phân vùng nghiệp vụ sắp sửa đổi.

## 2. Sử dụng thuật ngữ thống nhất (Glossary)
Khi mô tả hoặc viết code cho bất kỳ khái niệm nghiệp vụ nào, phải sử dụng đúng các thuật ngữ chính xác được định nghĩa tại bảng thuật ngữ [[Index#Bảng thuật ngữ Nghiệp vụ (Glossary)|Glossary]], tuyệt đối không tự ý chuyển sang dùng các từ đồng nghĩa khác để tránh gây nhiễu và sai lệch bối cảnh khi AI RAG truy vấn.

## 3. Cảnh báo xung đột thiết kế
Nếu mã nguồn hiện tại hoặc đề xuất của người dùng xung đột trực tiếp với các tài liệu quyết định thiết kế đã có (như các file ADR):
- **Dừng lại**: Không tự ý sửa đổi hay ghi đè.
- **Báo cáo**: Nêu rõ điểm xung đột, tên tài liệu ADR tương ứng và chờ xác nhận từ người dùng.
