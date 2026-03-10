// Nạp các thư viện cần thiết
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

require('dotenv').config(); // Nạp biến môi trường từ file .env

// Khởi tạo ứng dụng Express
const app = express();

// Middleware giúp xử lý dữ liệu JSON và cho phép gọi API chéo miền
app.use(express.json());
app.use(cors());
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes); // Tất cả API của admin sẽ bắt đầu bằng /api/admin
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
app.use('/api/timetable', require('./routes/timetable')); //lấy API lichj học
const roadmapRoute = require('./routes/roadmap');
app.use('/api/roadmap', roadmapRoute);
const semesterRoute = require('./routes/semester');
app.use('/api/semester', semesterRoute);
// Lấy cổng và chuỗi kết nối từ file .env
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Kết nối tới MongoDB
mongoose.connect(MONGODB_URI, { family: 4 })
  .then(() => {
    console.log('Đã kết nối thành công tới MongoDB cơ sở dữ liệu!');
  })
  .catch((error) => {
    console.error('Lỗi kết nối MongoDB:', error.message);
  });

// Một route (đường dẫn) kiểm tra cơ bản
app.get('/', (req, res) => {
  res.send('API của AI_Assistant_student_IT đang hoạt động!');
});
// Import hàm AI chúng ta vừa viết
const { generateAIResponse } = require('./utils/geminiAI');

// Tạo một API dạng POST để nhận câu hỏi và trả về câu trả lời từ AI
app.post('/api/test-ai', async (req, res) => {
  try {
    // Lấy câu hỏi (prompt) từ phía client gửi lên
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, message: "Vui lòng cung cấp prompt (câu hỏi)!" });
    }

    // Gọi hàm AI
    const aiText = await generateAIResponse(prompt);

    // Trả kết quả về cho client
    res.json({ success: true, data: aiText });
  } catch (error) {
    res.status(500).json({ success: false, message: "Đã có lỗi xảy ra khi gọi AI." });
  }
});
// Lắng nghe các yêu cầu trên cổng đã cấu hình
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});