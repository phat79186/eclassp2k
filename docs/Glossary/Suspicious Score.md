---
id: glossary-suspicious-score
title: Suspicious Score
type: glossary
status: stable
project: e-class-p2k
area: glossary
aliases:
  - Điểm nghi vấn
  - Điểm phạt
related:
  - Focus Loss
  - Anti Cheat Level
updated: 2026-07-18
---

# Thuật ngữ: Suspicious Score (Điểm Nghi vấn)

## Định nghĩa
**Suspicious Score** là chỉ số tích lũy đo lường mức độ nghi ngờ gian lận của học sinh trong một phiên làm bài thi trực tuyến dựa trên các hành vi bất thường được AI Proctoring ghi nhận.

## Cơ chế tích lũy
- Điểm nghi vấn ban đầu là `0`.
- Mỗi khi có sự kiện vi phạm xảy ra (ví dụ: phát hiện khuôn mặt thứ hai, quay đi hướng khác quá lâu, rời khỏi khung hình), hệ thống tự động tăng điểm nghi vấn lên.
- Mức độ nghiêm trọng của mỗi hành vi vi phạm sẽ quyết định lượng điểm cộng thêm (ví dụ: rời khỏi khung hình cộng `15 điểm`, phát hiện đa khuôn mặt cộng `30 điểm`).
- Khi điểm nghi vấn vượt qua ngưỡng quy định của [[Anti Cheat Level]], bài thi sẽ tự động bị khóa hoặc nộp bài bắt buộc tùy theo thiết lập phòng thi.
