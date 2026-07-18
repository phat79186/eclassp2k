---
id: glossary-exam-state
title: Exam State
type: glossary
status: stable
project: e-class-p2k
area: glossary
aliases:
  - Trạng thái bài thi
  - Trạng thái phòng thi
related:
  - Suspicious Score
  - Anti Cheat Level
updated: 2026-07-18
---

# Thuật ngữ: Exam State (Trạng thái Bài thi)

## Định nghĩa
**Exam State** mô tả vòng đời hoạt động của một phiên làm bài kiểm tra trực tuyến của học sinh từ lúc bắt đầu cho đến khi nộp bài và đánh giá kết quả.

## Các trạng thái chính
- `pending`: Bài kiểm tra đã được giao nhưng học sinh chưa bấm vào làm bài.
- `taking`: Học sinh đang trong phòng thi, camera giám thị AI đang hoạt động và giám sát trực tiếp.
- `submitted`: Học sinh đã hoàn thành và nộp bài lên hệ thống (bằng tay hoặc tự động do hết giờ/gian lận).
- `locked`: Trạng thái đặc biệt khi hệ thống phát hiện vi phạm vượt ngưỡng và tự động khóa bài thi của học sinh để chờ quyết định xử lý từ giáo viên/giám thị.
