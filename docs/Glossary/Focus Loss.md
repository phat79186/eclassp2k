---
id: glossary-focus-loss
title: Focus Loss
type: glossary
status: stable
project: e-class-p2k
area: glossary
aliases:
  - Mất tập trung
  - Rời màn hình
related:
  - Drafting Mode
  - Suspicious Score
updated: 2026-07-18
---

# Thuật ngữ: Focus Loss (Sự kiện Mất Tập trung)

## Định nghĩa
**Focus Loss** là sự kiện được giám thị AI ghi nhận khi học sinh không tập trung nhìn vào màn hình bài thi trực tuyến hoặc rời mắt khỏi phạm vi camera cho phép ngoài giới hạn thời gian viết nháp.

## Các trường hợp ghi nhận
- **Rời khỏi camera**: Không phát hiện thấy khuôn mặt của học sinh trong khung hình camera quá 3 giây.
- **Quay mặt sang hướng khác**: Góc quay đầu (yaw/roll angle) lệch quá giới hạn cho phép (nhìn sang trái/phải quá lâu).
- **Cúi đầu quá lâu**: Học sinh cúi đầu quá 30 giây (vượt qua giới hạn tối đa cho phép của chế độ [[Drafting Mode]]).
- **Mất tiêu điểm tab (Fullscreen Loss)**: Học sinh thoát chế độ toàn màn hình hoặc chuyển sang tab trình duyệt khác.
