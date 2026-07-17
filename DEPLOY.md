# Hướng dẫn Deploy E-Class P2K

## Kiến trúc

```
Frontend (Vercel) ──REST API──▶ Backend (Render/Railway) ──▶ Supabase (PostgreSQL + Storage)
```

---

## Bước 1: Tạo Supabase Project

1. Truy cập [supabase.com](https://supabase.com) → **New Project**
2. Chọn region gần nhất (Singapore hoặc Tokyo)
3. Đặt mật khẩu database → **Create Project**
4. Chờ project khởi tạo xong

### Lấy credentials:
- **Settings → Database → Connection string (URI)** → copy `DATABASE_URL`
- **Settings → API → Project URL** → copy `SUPABASE_URL`
- **Settings → API → service_role (secret)** → copy `SUPABASE_SERVICE_KEY`

### Tạo bảng:
- Vào **SQL Editor** → **New Query**
- Paste toàn bộ nội dung file `server/schema.sql` → **Run**

### Tạo Storage bucket:
- Vào **Storage** → **New Bucket**
- Tên: `class-files`
- Chọn **Public bucket** → Create
- Vào bucket → **Policies** → thêm policy cho phép public SELECT

---

## Bước 2: Deploy Backend trên Render

1. Push code lên GitHub (nếu chưa có)
2. Truy cập [render.com](https://render.com) → **New Web Service**
3. Kết nối repo GitHub
4. Cấu hình:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Instance Type**: Free

5. **Environment Variables**:
   ```
   DATABASE_URL = postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres
   JWT_SECRET = <chuỗi ngẫu nhiên 32+ ký tự>
   SUPABASE_URL = https://xxx.supabase.co
   SUPABASE_SERVICE_KEY = eyJhbGciOiJIUzI1NiIs...
   FRONTEND_URL = https://your-app.vercel.app
   PORT = 3001
   ```

6. Deploy → chờ build thành công

### Seed dữ liệu ban đầu:
Sau khi deploy xong, chạy seed script trên Render Shell:
```bash
node seed.js
```
Hoặc chạy local:
```bash
cd server
cp .env.example .env
# Điền DATABASE_URL thật vào .env
node seed.js
```

> **Lưu ý Render Free**: Instance sẽ tự sleep sau 15 phút không có request. Request đầu tiên sẽ mất ~30s để khởi động lại.

---

## Bước 2 (thay thế): Deploy Backend trên Railway

1. Truy cập [railway.app](https://railway.app) → **New Project**
2. Chọn **Deploy from GitHub repo**
3. Cấu hình:
   - **Root Directory**: `server`
   - **Start Command**: `node index.js`

4. **Variables** → thêm các biến môi trường giống Render

5. Railway tự detect và deploy

---

## Bước 3: Deploy Frontend trên Vercel

1. Truy cập [vercel.com](https://vercel.com) → **Import Project**
2. Kết nối repo GitHub
3. Cấu hình:
   - **Framework Preset**: Vite
   - **Root Directory**: `.` (root)

4. **Environment Variables**:
   ```
   VITE_API_URL = https://your-backend.onrender.com
   ```
   *(Thay bằng URL backend thật từ Render/Railway)*

5. Deploy

---

## Bước 4: Test

1. Mở URL Vercel → đăng nhập: `admin / admin123`
2. Tạo lớp → thêm học sinh → test các chức năng
3. Mở 2 trình duyệt khác nhau → xác nhận dữ liệu đồng bộ
4. Test đăng ký học sinh → duyệt → đăng nhập bằng mã HS

---

## Chạy local (Development)

### Backend:
```bash
cd server
cp .env.example .env
# Điền các biến môi trường thật vào .env
npm install
node seed.js        # Chạy 1 lần để tạo bảng + admin
npm start           # Server chạy ở port 3001
```

### Frontend:
```bash
# Ở root directory
npm run dev          # Vite dev server, proxy /api → localhost:3001
```

Mở `http://localhost:5173` → đăng nhập `admin / admin123`

---

## Troubleshooting

| Lỗi | Giải pháp |
|-----|-----------|
| `CORS error` | Kiểm tra `FRONTEND_URL` env var trên backend |
| `401 Unauthorized` | Token hết hạn, đăng nhập lại |
| `Connection refused` | Backend chưa chạy hoặc `VITE_API_URL` sai |
| `relation does not exist` | Chưa chạy `schema.sql` hoặc `seed.js` |
| File upload thất bại | Kiểm tra Supabase Storage bucket và policies |
