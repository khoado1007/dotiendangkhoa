const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, 
  email: { type: String, required: true, unique: true },   
  password: { type: String, required: false },              
  googleId: { type: String, unique: true, sparse: true },  // Added for Google OAuth
  
  // role đổi default thành 'student' cho khớp với file seed.js hôm trước
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  
  isProfileComplete: { type: Boolean, default: false } ,
  settings: {
    period1Start: { type: String, default: '07:00' }, // Giờ bắt đầu tiết 1 (Sáng)
    period7Start: { type: String, default: '13:00' }, // Giờ bắt đầu tiết 7 (Chiều)
    periodDuration: { type: Number, default: 50 } ,    // Thời lượng 1 tiết (phút)
    hasBreak: { type: Boolean, default: true },      // Thêm: Có nghỉ giữa tiết không
    breakDuration: { type: Number, default: 5 },     // Thêm: Số phút nghỉ giữa tiết (nếu có)
    semesterConfig: { type: Object, default: {} } // Thêm: Cấu hình học kỳ (để lưu vào DB)
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);