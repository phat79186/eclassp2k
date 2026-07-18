---
id: glossary-drafting-mode
title: Drafting Mode
type: glossary
status: stable
project: e-class-p2k
area: glossary
aliases:
  - Chế độ nháp
  - Viết nháp
related:
  - Focus Loss
  - ADR-0001-Liveness-Detection
updated: 2026-07-18
---

# Thuật ngữ: Drafting Mode (Chế độ Nháp)

## Định nghĩa
**Drafting Mode** là cơ chế tạm hoãn ghi nhận vi phạm khi học sinh cúi đầu xuống làm bài nháp trên giấy trong quá trình thi trực tuyến có giám sát bằng camera.

## Cơ chế hoạt động
- **Kích hoạt**: Được kích hoạt tự động khi góc cúi đầu (pitch angle) của học sinh vượt ngưỡng âm (nhỏ hơn -35° hoặc chỉ số `pitchRatio >= 0.40`).
- **Thời gian cho phép**: Học sinh được phép ở trạng thái này tối đa **30 giây** liên tục cho một lần viết nháp.
- **Trạng thái LED**: Dải LED chỉ thị trên camera sẽ chuyển từ Xanh lá (Bình thường) -> Vàng (Đang viết nháp) và hiển thị đồng hồ đếm ngược thầm lặng.
- **Kết thúc**: 
  - Nếu học sinh ngẩng đầu lên trước 30 giây: Đồng hồ đếm ngược reset, LED quay lại màu Xanh lá, không ghi nhận lỗi.
  - Nếu vượt quá 30 giây liên tục: Hệ thống ghi nhận sự kiện [[Focus Loss]] và phát tín hiệu cảnh báo vi phạm.
