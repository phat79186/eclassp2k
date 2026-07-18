---
id: adr-0001
title: Liveness Detection Strategy
type: adr
status: accepted
project: e-class-p2k
area: proctoring
aliases:
  - Liveness Decision
  - Blink Liveness
  - Drafting Mode ADR
related:
  - Master Elearning Proctoring
  - Liveness
  - Drafting Mode
updated: 2026-07-18
---

# ADR-0001: Chiến lược Phát hiện Chống giả mạo và Chế độ Nháp

Ghi lại quyết định kiến trúc kỹ thuật về cơ chế xác định liveness (chống giả mạo ảnh tĩnh 2D) thông qua chớp mắt thầm lặng và tích hợp chế độ làm nháp (Drafting Mode) cho học sinh.

---

# Status
Accepted

# Context
Hệ thống thi trực tuyến E-Class P2K đòi hỏi giám thị AI (Proctoring) phải chạy liên tục trên trình duyệt học sinh để đảm bảo tính trung thực. Tuy nhiên, hệ thống đối mặt với hai vấn đề lớn về UX và bảo mật:
1. **Liveness chống ảnh tĩnh**: Kẻ gian có thể đưa ảnh tĩnh 2D của học sinh trước camera để điểm danh hoặc làm bài hộ. Thuật toán kiểm tra nháy mắt (Blink) cũ lấy mẫu chu kỳ chậm (250ms) thường bỏ lỡ các cử động nháy mắt nhanh, dẫn đến tỷ lệ nhận diện sai cao. Đồng thời, việc hiển thị thông báo "VUI LÒNG NHÁY MẮT" liên tục làm ảnh hưởng nghiêm trọng đến trải nghiệm làm bài.
2. **Học sinh cúi đầu làm nháp**: Khi học sinh cúi xuống viết nháp trên giấy nháp, góc quay khuôn mặt (pitch angle) thay đổi. Giám thị AI nhận diện đây là hành vi "quay đi nơi khác" (Focus Loss) và lập tức báo vi phạm, gây ức chế lớn cho học sinh thực sự làm bài nghiêm túc.

# Decision
Chúng tôi quyết định triển khai các thay đổi kỹ thuật sau:
1. **Xác thực Liveness thầm lặng**:
   - Loại bỏ hoàn toàn cảnh báo nháy mắt trên UI. Việc quét chạy hoàn toàn ngầm bên dưới camera.
   - Nâng chu kỳ quét ảnh từ **250ms** lên **45ms** để không bỏ sót các pha nháy mắt nhanh của học sinh.
   - Chuyển sang cơ chế **Landmarks-Only tracking** (chỉ theo dõi 68 điểm khuôn mặt) sau khi khớp Face Descriptor ban đầu. Việc này duy trì FPS camera ổn định từ 40-60 FPS trên máy học sinh.
   - Sử dụng bộ lọc đệm cuộn **V-Shape EAR (Eye Aspect Ratio)** lưu trữ 20 frames gần nhất để tự động hiệu chuẩn độ giảm tương đối EAR (>= 18% với mức tối thiểu < 0.24) tương thích với mọi hình dáng mắt và ánh sáng.
2. **Cơ chế Hẹn giờ Nháp (Drafting Mode)**:
   - Cho phép học sinh cúi đầu viết nháp (pitch angle âm xuống -35° hoặc chỉ số `pitchRatio >= 0.40`).
   - Khi phát hiện học sinh cúi đầu, hệ thống kích hoạt bộ đếm ngược **30 giây** thầm lặng thay vì báo vi phạm gian lận ngay lập tức.
   - Hiển thị dải LED trạng thái chuyển đổi thông minh (Xanh lá -> Vàng -> Đỏ cảnh báo) cùng đồng hồ đếm ngược trên camera để nhắc nhở học sinh tập trung trở lại bài thi sau khi nháp xong.

# Consequences
- **Điểm tốt**:
  - Tỷ lệ bắt ảnh giả mạo tĩnh đạt hiệu suất cao, phát hiện chớp mắt nhanh chính xác >= 98%.
  - Trải nghiệm làm bài tự nhiên, học sinh không bị làm phiền bởi các thông báo ép buộc nháy mắt.
  - Giải quyết triệt để lỗi báo vi phạm oan khi học sinh cúi xuống nháp bài tập toán/văn.
- **Điểm yếu**:
  - Việc lấy mẫu 45ms tiêu thụ CPU cao hơn một chút so với 250ms cũ trên các dòng máy tính cấu hình quá yếu (khắc phục bằng cách sử dụng bộ lọc Landmarks-only gọn nhẹ).

# Alternatives Considered
- **Yêu cầu quay đầu ngẫu nhiên (Head turn challenge)**: Bị loại bỏ vì làm giảm UX nghiêm trọng, học sinh liên tục phải thực hiện hành động quay trái/phải cản trở sự tập trung làm bài kiểm tra.
- **Khóa camera báo lỗi ngay lập tức**: Bị loại bỏ vì gây ra tỷ lệ cảnh báo sai (false positive) cực kỳ lớn khi học sinh làm bài tự nhiên.
