---
id: rfc-partitioned-cookies
title: RFC - Partitioned Cookies
type: rfc
status: stable
project: e-class-p2k
area: security
aliases:
  - Partitioned Cookies
  - CHIPS
  - Cookie Partitioning
related:
  - Index
updated: 2026-07-18
---

# RFC: Partitioned Cookies (CHIPS)

Tài liệu này tóm tắt đặc tả kỹ thuật và lý do áp dụng phân vùng Cookie (Cookies Having Independent Partitioned State - CHIPS) trong ngữ cảnh tích hợp các module iframe giám thị của bên thứ ba trong các ứng dụng E-Learning.

---

## 1. Bối cảnh
Khi chạy các iframe đa nguồn (Cross-Site) để tích hợp dịch vụ thi cử hoặc camera giám sát, trình duyệt chặn các Third-Party Cookies thông thường để bảo vệ quyền riêng tư. Điều này khiến việc duy trì session hoặc trạng thái xác thực trong iframe gặp lỗi.

## 2. Giải pháp Phân vùng Cookie (Partitioned Cookies)
CHIPS cho phép đặt Cookie với thuộc tính `Partitioned`, liên kết trạng thái Cookie với tên miền cấp cao nhất (Top-Level Site) nơi iframe được nhúng:

```http
Set-Cookie: __Host-partitioned-sid=12345; Secure; Path=/; SameSite=None; Partitioned;
```

## 3. Lợi ích
- **Bảo mật**: Cookie chỉ được gửi đi khi người dùng truy cập trang thông qua đúng tên miền cha chỉ định.
- **Tránh bị chặn**: Các trình duyệt hiện đại (Chrome, Edge, Safari) hỗ trợ CHIPS để cho phép duy trì session trong các Iframe đa nguồn được tích hợp hợp lệ.
