# 🔍 Code Review AI - Website Review Code cho Middle Developer

Website review code tự động sử dụng AI (Google Gemma 3n 2B) để phân tích code theo các tiêu chí chuyên nghiệp.

## ✨ Tính năng

- 📋 **Paste Code**: Dán code trực tiếp vào trình duyệt
- 📁 **Upload File**: Upload file code để review
- 🔍 **Review chi tiết** theo 8 khía cạnh:
  - 🔒 **Security**: Phân quyền, injection, abuse
  - ⚡ **Performance**: Query DB, populate, write không cần thiết
  - 📈 **Scalability**: Data lớn, bulk action, async/queue
  - 💾 **Data Integrity**: Mất dữ liệu, orphan, transaction
  - 🧠 **Business Logic**: Rule nghiệp vụ có nhất quán không
  - 🏗️ **Architecture / Maintainability**: Dễ sửa, dễ mở rộng
  - ✅ **Testability / Reliability**: Dễ test, xử lý lỗi chuẩn
  - 👁️ **Observability / Audit**: Log, trace, ai làm gì
- 💡 **Đề xuất khắc phục** cụ thể cho từng vấn đề
- 📚 **Lịch sử review** được lưu trong MongoDB
- 📝 **Tóm tắt code** tự động

## 🛠️ Tech Stack

- **Backend**: Node.js + Express.js
- **Frontend**: React.js
- **Database**: MongoDB
- **AI Model**: Google Gemma 3n 2B (qua OpenRoute API)

## 📦 Cài đặt

### 1. Cài đặt dependencies

```bash
# Cài đặt dependencies cho server và client
npm run install-all
```

Hoặc cài đặt riêng:

```bash
# Server
npm install

# Client
cd client
npm install
```

### 2. Cấu hình MongoDB

Đảm bảo MongoDB đang chạy trên máy của bạn, hoặc sử dụng MongoDB Atlas.

Tạo file `.env` trong thư mục gốc:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/review-code
OPENROUTE_API_KEY=
```

### 3. Chạy ứng dụng

```bash
# Chạy cả server và client cùng lúc
npm run dev
```

Hoặc chạy riêng:

```bash
# Terminal 1 - Server
npm run server

# Terminal 2 - Client
npm run client
```

Ứng dụng sẽ chạy tại:
- **Frontend**: http://localhost:3001
- **Backend**: http://localhost:5000

## 📖 Cách sử dụng

1. Mở trình duyệt và truy cập http://localhost:3000
2. Chọn phương thức nhập code:
   - **Paste Code**: Dán code trực tiếp
   - **Upload File**: Chọn file code từ máy tính
3. Chọn ngôn ngữ lập trình
4. Click **"🚀 Review Code"**
5. Xem kết quả review chi tiết với các vấn đề được phân loại theo từng khía cạnh
6. Xem lịch sử review bằng cách click **"Hiện Lịch sử"**

## 🎯 API Endpoints

### POST `/api/review`
Review code

**Body:**
```json
{
  "code": "const x = 1;",
  "language": "javascript",
  "fileName": "app.js"
}
```

### GET `/api/history`
Lấy lịch sử review

### GET `/api/history/:id`
Lấy chi tiết một review

### DELETE `/api/history/:id`
Xóa một review

## 📝 Cấu trúc dự án

```
review-code/
├── server/
│   ├── index.js           # Server entry point
│   ├── routes/
│   │   ├── review.js      # Review routes
│   │   └── history.js     # History routes
│   └── models/
│       └── CodeReview.js  # MongoDB model
├── client/
│   ├── src/
│   │   ├── App.js         # Main App component
│   │   ├── components/
│   │   │   ├── CodeInput.js      # Input component
│   │   │   ├── ReviewResult.js   # Result display
│   │   │   └── HistoryPanel.js   # History panel
│   │   └── index.js
│   └── public/
└── package.json
```

## 🔧 Troubleshooting

- **Lỗi kết nối MongoDB**: Đảm bảo MongoDB đang chạy hoặc kiểm tra `MONGODB_URI` trong `.env`
- **Lỗi API**: Kiểm tra `OPENROUTE_API_KEY` trong `.env`
- **Port đã được sử dụng**: Thay đổi `PORT` trong `.env` hoặc đóng ứng dụng đang dùng port đó

## 📄 License

ISC
