# 🚀 Hướng dẫn Setup và Chạy Ứng dụng

## Bước 1: Cài đặt MongoDB

### Windows:
1. Tải MongoDB Community Server từ: https://www.mongodb.com/try/download/community
2. Cài đặt và chạy MongoDB Service
3. Hoặc sử dụng MongoDB Atlas (cloud) - miễn phí

### Hoặc sử dụng MongoDB Atlas (Khuyến nghị):
1. Đăng ký tại: https://www.mongodb.com/cloud/atlas
2. Tạo cluster miễn phí
3. Lấy connection string và thay vào `MONGODB_URI` trong file `.env`

## Bước 2: Tạo file .env

Tạo file `.env` trong thư mục `server/` với nội dung:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/review-code
OPENROUTE_API_KEY=
```

Hoặc nếu dùng MongoDB Atlas:
```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/review-code
OPENROUTE_API_KEY=
```

## Bước 3: Cài đặt Dependencies

```bash
# Cài đặt dependencies cho server
npm install

# Cài đặt dependencies cho client
cd client
npm install
cd ..
```

## Bước 4: Chạy ứng dụng

### Cách 1: Chạy cả server và client cùng lúc
```bash
npm run dev
```

### Cách 2: Chạy riêng từng phần

**Terminal 1 - Server:**
```bash
npm run server
```

**Terminal 2 - Client:**
```bash
npm run client
```

## Bước 5: Truy cập ứng dụng

Mở trình duyệt và truy cập: **http://localhost:3001**

**Lưu ý:** Nếu port 3001 cũng bị chiếm, bạn có thể thay đổi trong `client/package.json`:
```json
"start": "set PORT=3002 && react-scripts start"
```

## 🔧 Troubleshooting

### Lỗi kết nối MongoDB:
- Kiểm tra MongoDB đang chạy: `mongosh` hoặc kiểm tra MongoDB Service
- Kiểm tra `MONGODB_URI` trong file `.env`
- Nếu dùng MongoDB Atlas, đảm bảo đã whitelist IP của bạn

### Lỗi Port đã được sử dụng:
- Thay đổi `PORT` trong file `.env`
- Hoặc đóng ứng dụng đang dùng port đó

### Lỗi khi cài đặt dependencies:
- Xóa `node_modules` và `package-lock.json`
- Chạy lại `npm install`

### Lỗi API OpenRoute:
- Kiểm tra API key trong file `.env`
- Kiểm tra kết nối internet
- Kiểm tra model name có đúng không

## 📝 Ghi chú

- Đảm bảo MongoDB đang chạy trước khi start server
- API key OpenRoute đã được cấu hình sẵn trong code
- Ứng dụng sẽ tự động tạo database và collection khi chạy lần đầu
