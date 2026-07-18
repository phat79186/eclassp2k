---
id: triage-labels-guide
title: Triage Labels Guide
type: guide
status: stable
project: e-class-p2k
area: triage
aliases:
  - Triage Labels
  - Labels
related:
  - Issue Tracker Guide
  - Index
updated: 2026-07-18
---

# Hướng dẫn Nhãn Phân loại Lỗi (Triage Labels Guide)

Tài liệu này quy ước cách ánh xạ và sử dụng 5 nhãn phân loại (Triage Labels) chính thức dùng cho việc theo dõi, gán lỗi và phân loại tác vụ phát triển trong dự án E-Class P2K.

---

## 1. Bảng nhãn phân loại

| Nhãn tiêu chuẩn | Nhãn trong hệ thống | Ý nghĩa |
| :--- | :--- | :--- |
| `needs-triage` | `needs-triage` | Lỗi mới cần người quản trị/giám sát xem xét và đánh giá. |
| `needs-info` | `needs-info` | Đang đợi người báo cáo cung cấp thêm thông tin chi tiết. |
| `ready-for-agent` | `ready-for-agent` | Đã đầy đủ đặc tả chi tiết, sẵn sàng cho Agent AI thực hiện tự động. |
| `ready-for-human` | `ready-for-human` | Yêu cầu lập trình viên (con người) trực tiếp thực hiện vì độ phức tạp cao. |
| `wontfix` | `wontfix` | Lỗi hoặc yêu cầu sẽ không được xử lý (hủy bỏ/không khả thi). |

---

## 2. Quy tắc áp dụng
Mỗi khi một skill hoặc quy trình yêu cầu gán trạng thái (ví dụ: "gán nhãn sẵn sàng cho Agent"), AI-Agent cần điền đúng chuỗi nhãn từ cột **"Nhãn trong hệ thống"** của bảng trên vào trường `Status` của ticket tương ứng.
