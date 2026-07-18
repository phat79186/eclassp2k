---
id: master-elearning-proctoring
title: Master Elearning Proctoring
type: guide
status: stable
project: e-class-p2k
area: proctoring
aliases:
  - Proctoring Specification
  - Proctoring Guide
related:
  - ADR-0001-Liveness-Detection
  - Index
updated: 2026-07-18
---

# Tài liệu Đặc tả Thiết kế: Đăng nhập Google (Google Sign-In)

Hệ thống E-Class P2K hỗ trợ đăng nhập nhanh bằng tài khoản Google dành cho 3 đối tượng người dùng chính: Giáo viên (Teacher/Proctor), Học sinh (Student), và Phụ huynh (Parent).

## 1. Luồng Xác thực (Authentication Flow)

```mermaid
sequenceDiagram
    actor User as Người dùng
    participant FE as Frontend (Login.jsx)
    participant Google as Google OAuth Server
    participant BE as Backend (AuthController.java)
    database DB as Database (PostgreSQL/SQL)

    User->>FE: Click "Đăng nhập bằng Google"
    FE->>Google: Yêu cầu xác thực tài khoản Google
    Google-->>User: Hiển thị popup đăng nhập & cấp quyền
    User->>Google: Xác nhận thông tin đăng nhập
    Google-->>FE: Trả về Google ID Token (Credential JWT)
    FE->>BE: HTTP POST /api/auth/google (Gửi ID Token)
    Note over BE: Xác thực chữ ký số của Google ID Token<br/>bằng GoogleIdTokenVerifier
    BE->>DB: Truy vấn email tìm vai trò của người dùng
    DB-->>BE: Kết quả truy vấn (Role, Id, Name, Photo)
    Note over BE: Sinh JWT Token hệ thống cho phiên làm việc
    BE-->>FE: HTTP 200 OK (Trả về JWT & User Info)
    FE->>User: Chuyển hướng vào trang Dashboard tương ứng
```

## 2. Đặc tả API Endpoint

### `POST /api/auth/google`

Gửi ID Token thu được từ Google Client để Backend xác thực và đăng nhập.

- **Request Body**:
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
}
```

- **Response (200 OK - Đăng nhập thành công)**:
```json
{
  "token": "eclass.jwt.token.here...",
  "user": {
    "id": "stu_12345",
    "name": "Nguyễn Văn A",
    "email": "nguyenvana@gmail.com",
    "role": "student",
    "photo": "https://lh3.googleusercontent.com/a/...",
    "emoji": "😊"
  }
}
```

## 3. Cấu trúc Ánh xạ Vai trò (Database Role Mapping)

Backend kiểm tra Email trích xuất từ Google Token lần lượt qua các bảng dữ liệu:

1. **Bảng `teachers`**:
   - Nếu `email` tồn tại trong bảng:
     - Nếu `is_admin = TRUE` -> Gán vai trò `admin`.
     - Nếu `subject = 'Quản sinh'` -> Gán vai trò `proctor`.
     - Ngược lại -> Gán vai trò `teacher`.
2. **Bảng `students`**:
   - Nếu `email` tồn tại trong bảng -> Gán vai trò `student`.
3. **Bảng `parents`**:
   - Nếu `email` tồn tại trong bảng -> Gán vai trò `parent`.
4. **Trường hợp Ngoại lệ**:
   - Nếu email không khớp với bất kỳ bản ghi nào trong 3 bảng trên -> Trả về lỗi `403 Forbidden` ("Tài khoản Google chưa được đăng ký trên hệ thống E-Class P2K. Vui lòng liên hệ Admin.").

---

# Tài liệu Đặc tả Thiết kế: Nhập nhanh (Bulk Import) qua CSV

Tính năng cho phép quản trị viên (Admin) nhập số lượng lớn Trường học và Giáo viên từ file CSV một cách nhanh chóng, có giao diện Xem trước (Preview) dữ liệu trước khi lưu chính thức vào cơ sở dữ liệu.

## 1. Cấu trúc định dạng File CSV

### a. File CSV Trường học (Schools)
Chỉ gồm cột tên trường học.
- Dòng tiêu đề bắt buộc: `TenTruong`
- Ví dụ nội dung file `schools.csv`:
```csv
TenTruong
THPT Nguyễn Du
THPT Lương Thế Vinh
THPT Chuyên Lê Hồng Phong
```

### b. File CSV Giáo viên (Teachers)
Gồm các thông tin định danh và phân công môn học, trường học của giáo viên.
- Dòng tiêu đề bắt buộc: `HoTen`, `TenDangNhap`, `MatKhau`, `MonHoc`, `TruongHoc`, `Email`
- Ví dụ nội dung file `teachers.csv`:
```csv
HoTen,TenDangNhap,MatKhau,MonHoc,TruongHoc,Email
Nguyễn Văn A,nguyena,123456,Toán,THPT Nguyễn Du,nguyena@gmail.com
Trần Thị B,tranb,qwerty,Vật lý,THPT Lương Thế Vinh,tranb@gmail.com
```

## 2. Đặc tả API Endpoint Import

### `POST /api/admin/import/schools`
Nhập danh sách trường học dạng Batch.
- **Request Body**:
```json
[
  { "name": "THPT Nguyễn Du" },
  { "name": "THPT Lương Thế Vinh" }
]
```
- **Response (200 OK)**:
```json
{
  "message": "Nhập thành công 2 trường học.",
  "importedCount": 2
}
```

### `POST /api/admin/import/teachers`
Nhập danh sách giáo viên dạng Batch.
- **Request Body**:
```json
[
  {
    "name": "Nguyễn Văn A",
    "username": "nguyena",
    "password": "password123",
    "subject": "Toán",
    "school": "THPT Nguyễn Du",
    "email": "nguyena@gmail.com"
  }
]
```
- **Response (200 OK)**:
```json
{
  "message": "Nhập thành công 1 giáo viên.",
  "importedCount": 1
}
```
