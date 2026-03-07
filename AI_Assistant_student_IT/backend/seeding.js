// backend/seed.js
const mongoose = require('mongoose');
require('dotenv').config();

// 1. ĐỊNH NGHĨA CÁC LƯỢC ĐỒ (SCHEMAS) TỐI ƯU
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // Dùng username thay vì email
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'student'], default: 'student' }
});

const UniversitySchema = new mongoose.Schema({
  name: String,
  code: String
});

const MajorSchema = new mongoose.Schema({
  name: String,
  facultyName: String, // Gom chung Khoa vào Ngành cho tối ưu NoSQL
  universityId: { type: mongoose.Schema.Types.ObjectId, ref: 'University' }
});

const SubjectSchema = new mongoose.Schema({
  name: String,
  semester: Number,
  startDate: Date,
  majorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Major' }
});

const StudentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fullName: String,
  dob: Date,
  enrollmentYear: Number,
  majorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Major' }
});

// Tạo Models
const User = mongoose.model('User', UserSchema);
const University = mongoose.model('University', UniversitySchema);
const Major = mongoose.model('Major', MajorSchema);
const Subject = mongoose.model('Subject', SubjectSchema);
const Student = mongoose.model('Student', StudentSchema);

// 2. HÀM CHẠY SEED DỮ LIỆU
const seedDB = async () => {
  try {
    // Kết nối CSDL
    await mongoose.connect('mongodb://localhost:27017/KHOA');
    console.log("Đã kết nối MongoDB để tạo dữ liệu...");

    // Xóa sạch dữ liệu cũ để tránh lỗi trùng lặp
    await User.deleteMany({});
    await University.deleteMany({});
    await Major.deleteMany({});
    await Subject.deleteMany({});
    await Student.deleteMany({});
    console.log("Đã dọn dẹp dữ liệu cũ.");

    // --- TẠO DỮ LIỆU ---

    // 1. Tạo Tài khoản Admin
    await User.create({
      username: 'admin',
      password: 'admin',
      role: 'admin'
    });

    // 2. Tạo Trường Đại học
    const uni = await University.create({
      name: 'Đại học Công nghệ Sài Gòn (STU)',
      code: 'STU'
    });

    // 3. Tạo Ngành & Khoa
    const major = await Major.create({
      name: 'Công nghệ thông tin',
      facultyName: 'Khoa Công nghệ thông tin',
      universityId: uni._id
    });

    // 4. Tạo Môn học mẫu
    await Subject.create([
      { name: 'Cấu trúc dữ liệu và Giải thuật', semester: 1, startDate: new Date('2024-09-05'), majorId: major._id },
      { name: 'Lập trình Web', semester: 1, startDate: new Date('2024-09-05'), majorId: major._id }
    ]);

    // 5. Tạo 1 tài khoản Sinh viên mẫu để test
    const studentUser = await User.create({
      username: 'khoa',
      password: '123',
      role: 'student'
    });

    await Student.create({
      userId: studentUser._id,
      fullName: 'Đăng Khoa',
      dob: new Date('2004-01-01'),
      enrollmentYear: 2022,
      majorId: major._id
    });

    console.log("🎉 KHỞI TẠO DỮ LIỆU THÀNH CÔNG!");
    process.exit();
  } catch (error) {
    console.error("Lỗi khi seed:", error);
    process.exit(1);
  }
};

seedDB();