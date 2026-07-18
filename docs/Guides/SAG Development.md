---
id: sag-development
title: SAG Development
type: guide
status: stable
project: e-class-p2k
area: development
aliases:
  - SAG Guide
  - RAG Development
related:
  - Master Elearning Proctoring
  - Index
updated: 2026-07-18
---

# Hướng dẫn Phát triển và Chạy ứng dụng SAG (SQL-Retrieval Augmented Generation)

Mã nguồn dự án SAG của **Zleap-AI** đã được cài đặt vào thư mục `sag/` của dự án E-Class P2K.

## 📁 Cấu trúc thư mục mã nguồn
- `sag/apps/api/`: Backend FastAPI được viết bằng Python, sử dụng thư viện `zleap-sag` cho việc xử lý Event-Entity RAG và lưu trữ SQLite/LanceDB.
- `sag/apps/web/`: Frontend Next.js được cấu hình kết nối trực tiếp đến backend thông qua cổng `8000`.

---

## 🛠️ Thiết lập Môi trường & Chạy ứng dụng

### 1. Backend Python (`apps/api`)

Backend yêu cầu Python 3.11+. Hệ thống của bạn đã được cấu hình sẵn API Key Gemini tại file `sag/apps/api/.env`. Do xung đột phiên bản của `onnxruntime` trên Python 3.14, hệ thống đã cài đặt và cấu hình **Python 3.12** chạy độc lập.

**Cách chạy backend:**
1. Mở Terminal và di chuyển vào thư mục backend:
   ```bash
   cd sag/apps/api
   ```
2. Đồng bộ hóa thư viện bằng `uv` sử dụng Python 3.12:
   ```bash
   python -m uv sync --python 3.12
   ```
3. Khởi chạy máy chủ API:
   ```bash
   python -m uv run uvicorn sag_api.main:app --reload --port 8000
   ```
   *Lúc này, tài liệu API tương tác sẽ mở tại: [http://localhost:8000/docs](http://localhost:8000/docs)*

---

### 2. Frontend Next.js (`apps/web`)

Frontend Next.js dùng để hiển thị giao diện Web quản lý tri thức, đồ thị thực thể, và chat Agent.

**Cách chạy frontend:**
1. Mở Terminal mới và di chuyển vào thư mục web:
   ```bash
   cd sag/apps/web
   ```
2. Khởi chạy máy chủ phát triển:
   ```bash
   npm run dev
   ```
   *Mở trình duyệt truy cập: [http://localhost:3000](http://localhost:3000)*

---

## 🚀 Tính năng nổi bật & Phát triển thêm
- **SQL-Retrieval (RAG)**: Sử dụng các câu lệnh truy vấn quan hệ SQLite kết hợp LanceDB Vector Search để tìm kiếm ngữ cảnh chính xác cao thay vì sử dụng RAG truyền thống.
- **Thư viện Python `zleap-sag`**: Bạn có thể import trực tiếp thư viện này trong các file Python khác để tích hợp tìm kiếm RAG:
  ```python
  from zleap_sag import SAGEngine
  # Viết logic tìm kiếm và truy vấn của riêng bạn tại đây
  ```
- **Tài liệu đặc tả**: Xem thêm chi tiết kiến trúc tại [[Master Elearning Proctoring]].
