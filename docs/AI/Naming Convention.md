---
id: ai-naming-convention
title: AI Naming Convention
type: instruction
status: stable
project: e-class-p2k
area: ai-rules
aliases:
  - Naming Convention for AI
  - Quy chuẩn đặt tên
related:
  - Coding Rules
updated: 2026-07-18
---

# Chỉ thị AI: Quy chuẩn Đặt tên & Cấu trúc (Naming Convention)

Tài liệu này quy định cách đặt tên file, biến, class và phân chia cấu trúc dự án để đảm bảo tính nhất quán trên cả Frontend (React) và Backend (Java/Node).

---

## 1. Quy chuẩn Đặt tên File & Thư mục (Obsidian Vault)
- **Title Case**: Tất cả các file tài liệu `.md` trong thư mục `docs/` bắt buộc phải đặt tên dạng Title Case (ví dụ: `Deploy Guide.md`, `Master Elearning Proctoring.md`).
- **Không đặt tên file chứa khoảng trắng vô tổ chức**: Dùng dấu cách bình thường thay vì gạch ngang (`-`) hay gạch dưới (`_`) đối với tài liệu Obsidian (ngoại trừ các file ADR cần định dạng `ADR-XXXX-Name`).

## 2. Quy chuẩn Frontend (React + Vite)
- **Component File**: Đặt tên dạng **PascalCase** (ví dụ: `AdminDashboard.jsx`, `GradeCalculatorPage.jsx`).
- **CSS Class**: Sử dụng các biến CSS variables toàn cục được định nghĩa sẵn trong hệ thống (như `var(--accent)`, `var(--surface)`, `var(--text)`) để đảm bảo tính thẩm mỹ, nhất quán về Theme.

## 3. Quy chuẩn Backend (Java / Node)
- **Java Class**: Đặt tên theo dạng **PascalCase** kết thúc bằng Role tương ứng (ví dụ: `AuthController.java`, `BulkImportController.java`).
- **REST API Endpoint**: Đặt tên dạng số nhiều, viết thường ngăn cách bằng gạch chéo (ví dụ: `/api/admin/import/schools`, `/api/students/:id`).
- **Không lạm dụng Singleton/Utils**:
  - Không tạo các class dạng `Utils.java` chung chung.
  - Phân vùng nghiệp vụ rõ ràng vào các Controller hoặc Service độc lập.
