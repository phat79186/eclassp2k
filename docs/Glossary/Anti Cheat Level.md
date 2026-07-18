---
id: glossary-anti-cheat-level
title: Anti Cheat Level
type: glossary
status: stable
project: e-class-p2k
area: glossary
aliases:
  - Mức độ chống gian lận
  - Cấu hình chống gian lận
related:
  - Suspicious Score
  - Exam State
updated: 2026-07-18
---

# Thuật ngữ: Anti Cheat Level (Cấp độ Chống Gian lận)

## Định nghĩa
**Anti Cheat Level** là cấu hình quy định mức độ nghiêm ngặt của các bộ lọc phát hiện vi phạm và các hình phạt tương ứng được áp dụng cho bài thi.

## Các cấp độ cấu hình
- **Low (Thấp)**: Chỉ ghi nhận nhật ký vi phạm (logs), không khóa bài thi của học sinh bất kể [[Suspicious Score]] đạt mức nào.
- **Medium (Trung bình)**: Đưa ra cảnh báo bằng thông báo pop-up trên màn hình khi điểm nghi vấn đạt trên ngưỡng `50 điểm`.
- **Strict (Nghiêm ngặt)**: Khóa bài thi ngay lập tức hoặc nộp bài bắt buộc khi điểm nghi vấn vượt mức `80 điểm` hoặc phát hiện hành vi gian lận nghiêm trọng (như có người thi hộ/đa khuôn mặt trước camera).
