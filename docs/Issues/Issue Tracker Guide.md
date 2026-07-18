---
id: issue-tracker-guide
title: Issue Tracker Guide
type: guide
status: stable
project: e-class-p2k
area: tracking
aliases:
  - Issue Tracker
  - Issues
related:
  - Triage Labels Guide
  - Index
updated: 2026-07-18
---

# Hướng dẫn Theo dõi Lỗi (Issue Tracker Guide)

Tài liệu này quy định quy trình theo dõi và ghi chép lỗi dưới dạng Markdown cục bộ (Local Markdown) trong dự án E-Class P2K.

---

## 1. Quy ước thư mục
Các lỗi, ticket và đặc tả kịch bản kiểm thử được lưu trữ cục bộ dưới dạng file Markdown trong thư mục `.scratch/`.
- **Mỗi tính năng là một thư mục con**: `.scratch/<feature-slug>/`
- **Đặc tả nghiệp vụ chính**: `.scratch/<feature-slug>/spec.md`
- **Các tickets triển khai**: Được viết tách biệt, mỗi ticket một file độc lập nằm tại thư mục `.scratch/<feature-slug>/issues/<NN>-<slug>.md` (được đánh số thứ tự từ `1`). Tuyệt đối không gộp chung toàn bộ tickets vào một file duy nhất.

## 2. Ghi chép trạng thái phân loại (Triage State)
Trạng thái phân loại của lỗi được ghi nhận tại dòng `Status:` nằm ở đầu mỗi file issue (xem thêm chi tiết tại [[Triage Labels Guide]]).

## 3. Cách thức xử lý Ticket
- **Đăng ký (Claim)**: Chuyển dòng `Status: claimed` và lưu lại trước khi bắt đầu viết code thực thi lỗi đó.
- **Giải quyết (Resolve)**: Viết câu trả lời hoặc tóm tắt các thay đổi bên dưới tiêu đề `## Answer` hoặc `## Comments`, đổi trạng thái thành `Status: resolved`.
