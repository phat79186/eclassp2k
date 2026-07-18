---
id: index
title: E-Class P2K Knowledge Index
type: index
status: stable
project: e-class-p2k
updated: 2026-07-18
---

# E-Class P2K — Map of Content (MOC)

Chào mừng bạn đến với kho lưu trữ tri thức chính thức của dự án E-Class P2K. Đây là mục lục trung tâm kết nối toàn bộ các tài liệu hướng dẫn, đặc tả nghiệp vụ và quyết định kiến trúc của hệ thống.

---

## 🏛️ Kiến trúc & Quyết định cốt lõi (ADR)
Lưu trữ các ghi chép về quyết định thiết kế kỹ thuật, lý do lựa chọn giải pháp và các đánh giá ảnh hưởng trong hệ thống.
- [[ADR-0001-Liveness-Detection]] — Quyết định kiến trúc cho thuật toán phát hiện nhấp nháy mắt (Liveness Detection) và chế độ làm nháp (Drafting Mode).

---

## 🎨 Đặc tả Tính năng & Hướng dẫn (Guides)
Đặc tả chi tiết nghiệp vụ các tính năng lớn và các tài liệu hướng dẫn tích hợp phát triển.
- [[Master Elearning Proctoring]] — Đặc tả thiết kế giám thị AI, liveness chống ảnh tĩnh, đăng nhập Google SSO và bulk import.
- [[SAG Development]] — Hướng dẫn chạy và phát triển thêm dịch vụ RAG nâng cao dựa trên SQL-Retrieval của Zleap-AI.

---

## 🚀 Cấu hình & Triển khai (Deployment)
Các hướng dẫn kỹ thuật thiết lập môi trường chạy thử và triển khai hạ tầng.
- [[Deploy Guide]] — Hướng dẫn cài đặt PostgreSQL/Supabase, cấu hình Node.js server và môi trường biến.

---

## 🤖 Chỉ dẫn dành cho AI-Agent (AI)
Các bộ quy tắc cấu hình và chuẩn mực dành riêng cho các AI Assistant khi đọc mã nguồn hoặc tạo code mới để tránh phá vỡ thiết kế.
- [[Coding Rules]] — Quy tắc viết code, lập trình tối giản (Ponytail), xử lý transaction và bảo vệ comment.
- [[Naming Convention]] — Quy chuẩn đặt tên React component, backend class Java và phân hoạch deep module.

---

## 🐞 Theo dõi Lỗi & Quy trình (Issues)
Mô tả quy trình theo dõi lỗi ngoại tuyến và các quy tắc gán nhãn phân loại.
- [[Issue Tracker Guide]] — Quy trình quản lý danh sách issues dưới dạng file Markdown cục bộ.
- [[Triage Labels Guide]] — Danh sách và hướng dẫn sử dụng các nhãn gán phân loại lỗi của Agent.

---

## 📜 Tài liệu Tham khảo & Đặc tả Ngoài (RFC)
Các tài liệu tiêu chuẩn kỹ thuật internet và các RFC liên quan.
- [[RFC - Partitioned Cookies]] — Đặc tả về phân vùng cookie (CHIPS) phục vụ chạy iframe đa nguồn bảo mật.

---

## 📖 Bảng thuật ngữ Nghiệp vụ (Glossary)
Định nghĩa nhanh các khái niệm, thông số đo lường đặc thù được sử dụng độc quyền trong hệ thống giám sát của dự án.
- [[Drafting Mode]] — Chế độ làm bài nháp, cho phép học sinh cúi đầu viết nháp trong thời gian giới hạn.
- [[Suspicious Score]] — Điểm số nghi vấn tích lũy khi học sinh có dấu hiệu bất thường trước camera.
- [[Exam State]] — Các trạng thái hoạt động của bài thi đang được proctoring.
- [[Anti Cheat Level]] — Mức độ nghiêm ngặt của cơ chế chống gian lận.
- [[Focus Loss]] — Sự kiện ghi nhận học sinh mất tập trung (quay mặt đi hoặc rời khỏi khung hình).
