/**
 * SEEDING.JS - Khởi tạo dữ liệu mẫu cho ứng dụng
 * 
 * Dữ liệu được tổ chức theo userID để đảm bảo mỗi user có dữ liệu riêng
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import các Models thực tế
const User = require('./models/user');
const Student = require('./models/Students');
const Major = require('./models/Major');
const University = require('./models/University');
const Subject = require('./models/Subject');
const Timetable = require('./models/Timetable');
const Roadmap = require('./models/Roadmap');
const Semester = require('./models/Semester');
const Exercise = require('./models/Exercise');

// Hàm chạy seed dữ liệu
const seedDB = async () => {
  try {
    // Kết nối CSDL
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/KHOA';
    await mongoose.connect(mongoURI);
    console.log("✅ Đã kết nối MongoDB...");

    // Xóa sạch dữ liệu cũ
    await User.deleteMany({});
    await Student.deleteMany({});
    await Major.deleteMany({});
    await University.deleteMany({});
    await Subject.deleteMany({});
    await Timetable.deleteMany({});
    await Roadmap.deleteMany({});
    await Semester.deleteMany({});
    console.log("🗑️ Đã dọn dẹp dữ liệu cũ.");

    // ========================================
    // 1. TẠO TÀI KHOẢN ADMIN
    // ========================================
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
      isProfileComplete: true,
      settings: {
        period1Start: '07:00',
        period7Start: '13:00',
        periodDuration: 50,
        hasBreak: true,
        breakDuration: 5
      }
    });
    console.log("✅ Tạo tài khoản Admin: admin / admin123");

    // ========================================
    // 2. TẠO TRƯỜNG ĐẠI HỌC (Dữ liệu mẫu có sẵn)
    // ========================================
    const universities = await University.create([
      { name: 'Đại học Công nghệ Sài Gòn (STU)', code: 'STU' },
      { name: 'Đại học Bách Khoa TP.HCM (HUTECH)', code: 'HUTECH' },
      { name: 'Đại học Khoa học Tự nhiên TP.HCM (HCMUS)', code: 'HCMUS' },
      { name: 'Đại học Kinh tế TP.HCM (UEH)', code: 'UEH' },
      { name: 'Đại học Quốc tế (IU)', code: 'IU' }
    ]);
    console.log("✅ Tạo dữ liệu Trường Đại học mẫu");

    // ========================================
    // 3. TẠO NGÀNH HỌC (Liên kết với University)
    // ========================================
    const majors = await Major.create([
      { name: 'Công nghệ thông tin', facultyName: 'Khoa Công nghệ Thông tin', universityId: universities[0]._id },
      { name: 'Kỹ thuật phần mềm', facultyName: 'Khoa Công nghệ Thông tin', universityId: universities[0]._id },
      { name: 'Khoa học dữ liệu', facultyName: 'Khoa Công nghệ Thông tin', universityId: universities[0]._id },
      { name: 'An toàn thông tin', facultyName: 'Khoa An ninh mạng', universityId: universities[1]._id },
      { name: 'Kỹ thuật máy tính', facultyName: 'Khoa Kỹ thuật', universityId: universities[1]._id },
      { name: 'Toán học', facultyName: 'Khoa Toán', universityId: universities[2]._id },
      { name: 'Vật lý học', facultyName: 'Khoa Vật lý', universityId: universities[2]._id },
      { name: 'Kinh tế', facultyName: 'Khoa Kinh tế', universityId: universities[3]._id },
      { name: 'Tài chính - Ngân hàng', facultyName: 'Khoa Tài chính', universityId: universities[3]._id },
      { name: 'Ngôn ngữ Anh', facultyName: 'Khoa Ngoại ngữ', universityId: universities[4]._id }
    ]);
    console.log("✅ Tạo dữ liệu Ngành học mẫu");

    // ========================================
    // 4. TẠO MÔN HỌC (Liên kết với Major)
    // ========================================
    const subjects = await Subject.create([
      // CNTT - STU - Học kỳ 1
      { name: 'Nhập môn lập trình', semester: 1, majorId: majors[0]._id },
      { name: 'Cấu trúc dữ liệu và Giải thuật', semester: 1, majorId: majors[0]._id },
      { name: 'Toán rời rạc', semester: 1, majorId: majors[0]._id },
      { name: 'Tiếng Anh 1', semester: 1, majorId: majors[0]._id },
      // CNTT - STU - Học kỳ 2
      { name: 'Lập trình hướng đối tượng', semester: 2, majorId: majors[0]._id },
      { name: 'Cơ sở dữ liệu', semester: 2, majorId: majors[0]._id },
      { name: 'Mạng máy tính', semester: 2, majorId: majors[0]._id },
      { name: 'Tiếng Anh 2', semester: 2, majorId: majors[0]._id },
      // CNTT - STU - Học kỳ 3
      { name: 'Lập trình Web', semester: 3, majorId: majors[0]._id },
      { name: 'Lập trình di động', semester: 3, majorId: majors[0]._id },
      { name: 'Trí tuệ nhân tạo', semester: 3, majorId: majors[0]._id },
      // Kỹ thuật phần mềm
      { name: 'Phân tích thiết kế hệ thống', semester: 1, majorId: majors[1]._id },
      { name: 'Kiểm thử phần mềm', semester: 2, majorId: majors[1]._id },
      // An toàn thông tin
      { name: 'An ninh mạng', semester: 1, majorId: majors[3]._id },
      { name: 'Mật mã học', semester: 2, majorId: majors[3]._id }
    ]);
    console.log("✅ Tạo dữ liệu Môn học mẫu");

    // ========================================
    // 5. TẠO USER VÀ STUDENT MẪU (Có userID để test)
    // ========================================
    
    // Tạo user sinh viên mẫu 1
    const studentUser1 = await User.create({
      username: 'khoa',
      email: 'khoa@example.com',
      password: '123',
      role: 'student',
      isProfileComplete: true,
      settings: {
        period1Start: '07:00',
        period7Start: '12:35',
        periodDuration: 50,
        hasBreak: true,
        breakDuration: 5
      }
    });

    const student1 = await Student.create({
      userId: studentUser1._id,
      fullName: 'Nguyễn Đăng Khoa',
      dob: new Date('2004-01-01'),
      enrollmentYear: 2022,
      schoolName: 'Đại học Công nghệ Sài Gòn (STU)',
      majorName: 'Công nghệ thông tin',
      majorId: majors[0]._id
    });

    // Tạo user sinh viên mẫu 2
    const studentUser2 = await User.create({
      username: 'minh',
      email: 'minh@example.com',
      password: '123',
      role: 'student',
      isProfileComplete: true,
      settings: {
        period1Start: '07:30',
        period7Start: '13:00',
        periodDuration: 45,
        hasBreak: true,
        breakDuration: 10
      }
    });

    const student2 = await Student.create({
      userId: studentUser2._id,
      fullName: 'Trần Văn Minh',
      dob: new Date('2003-05-15'),
      enrollmentYear: 2021,
      schoolName: 'Đại học Bách Khoa TP.HCM (HUTECH)',
      majorName: 'An toàn thông tin',
      majorId: majors[3]._id
    });

    // Tạo user sinh viên mẫu 3 (chưa hoàn thành profile)
    const studentUser3 = await User.create({
      username: 'lan',
      email: 'lan@example.com',
      password: '123',
      role: 'student',
      isProfileComplete: false,
      settings: {
        period1Start: '07:00',
        period7Start: '13:00',
        periodDuration: 50,
        hasBreak: true,
        breakDuration: 5
      }
    });

    await Student.create({
      userId: studentUser3._id,
      fullName: 'Phạm Thị Lan',
      dob: new Date('2004-03-20'),
      enrollmentYear: 2022,
      schoolName: '',
      majorName: ''
    });

    console.log("✅ Tạo tài khoản sinh viên mẫu:");
    console.log("   - khoa / 123 (CNTT - STU)");
    console.log("   - minh / 123 (An toàn thông tin - HUTECH)");
    console.log("   - lan / 123 (Chưa hoàn thành profile)");

    // ========================================
    // 6. TẠO DỮ LIỆU TIMETABLE THEO USER (userID)
    // ========================================
    const timetables = await Timetable.create([
      // User 1 - Khoa (CNTT)
      {
        userId: studentUser1._id,
        semester: '2024-1',
        dayOfWeek: 'Thứ 2',
        session: 'Sáng',
        subjectName: 'Nhập môn lập trình',
        startPeriod: 1,
        numberOfPeriods: 3,
        room: 'A101',
        startDate: new Date('2024-09-02')
      },
      {
        userId: studentUser1._id,
        semester: '2024-1',
        dayOfWeek: 'Thứ 2',
        session: 'Chiều',
        subjectName: 'Tiếng Anh 1',
        startPeriod: 7,
        numberOfPeriods: 2,
        room: 'B205',
        startDate: new Date('2024-09-02')
      },
      {
        userId: studentUser1._id,
        semester: '2024-1',
        dayOfWeek: 'Thứ 3',
        session: 'Sáng',
        subjectName: 'Cấu trúc dữ liệu và Giải thuật',
        startPeriod: 1,
        numberOfPeriods: 3,
        room: 'A102',
        startDate: new Date('2024-09-03')
      },
      {
        userId: studentUser1._id,
        semester: '2024-1',
        dayOfWeek: 'Thứ 4',
        session: 'Chiều',
        subjectName: 'Toán rời rạc',
        startPeriod: 7,
        numberOfPeriods: 2,
        room: 'C301',
        startDate: new Date('2024-09-04')
      },
      // User 2 - Minh (ATTT)
      {
        userId: studentUser2._id,
        semester: '2024-1',
        dayOfWeek: 'Thứ 2',
        session: 'Sáng',
        subjectName: 'An ninh mạng',
        startPeriod: 1,
        numberOfPeriods: 3,
        room: 'LAB1',
        startDate: new Date('2024-09-02')
      }
    ]);
    console.log("✅ Tạo dữ liệu Thời khóa biểu mẫu");

    // ========================================
    // 7. TẠO DỮ LIỆU ROADMAP THEO USER (userID)
    // ========================================
    const roadmaps = await Roadmap.create([
      // User 1 - Khoa
      {
        userId: studentUser1._id,
        semester: '2024-1',
        subjectName: 'Nhập môn lập trình',
        todos: [
          { id: '1', text: 'Hoàn thành bài tập tuần 1-4', isCompleted: true },
          { id: '2', text: 'Làm project cuối kỳ', isCompleted: false },
          { id: '3', text: 'Ôn thi giữa kỳ', isCompleted: false }
        ]
      },
      {
        userId: studentUser1._id,
        semester: '2024-1',
        subjectName: 'Cấu trúc dữ liệu và Giải thuật',
        todos: [
          { id: '1', text: 'Học thuật toán sắp xếp', isCompleted: false },
          { id: '2', text: 'Làm bài tập Linked List', isCompleted: false }
        ]
      },
      // User 2 - Minh
      {
        userId: studentUser2._id,
        semester: '2024-1',
        subjectName: 'An ninh mạng',
        todos: [
          { id: '1', text: 'Cài đặt Kali Linux', isCompleted: true },
          { id: '2', text: 'Thực hành Wireshark', isCompleted: false }
        ]
      }
    ]);
    console.log("✅ Tạo dữ liệu Lộ trình học tập mẫu");

    // ========================================
    // 8. TẠO DỮ LIỆU SEMESTER THEO USER (userID)
    // ========================================
const semesters = await Semester.create([
      // User 1 - Khoa
      {
        userId: studentUser1._id,
        semester1_start: '2024-09-02',
        semester1_end: '2024-12-31',
        semester2_start: '2025-01-06',
        semester2_end: '2025-05-31',
        semester_he_start: '2025-06-01',
        semester_he_end: '2025-08-31'
      },
      // User 2 - Minh
      {
        userId: studentUser2._id,
        semester1_start: '2024-09-02',
        semester1_end: '2024-12-20',
        semester2_start: '2025-01-10',
        semester2_end: '2025-05-25',
        semester_he_start: '2025-06-01',
        semester_he_end: '2025-08-30'
      }
    ]);
    console.log("✅ Tạo dữ liệu Cấu hình học kỳ mẫu");

    // ========================================
    // 9. TẠO DỮ LIỆU EXERCISE MẪU (Bài tập chia sẻ)
    // ========================================
    const exercises = await Exercise.create([
      // Programming exercises
      {
        subjectName: 'Cấu trúc dữ liệu và Giải thuật',
        topicText: 'Thuật toán sắp xếp',
        semester: '1',
        subjectType: 'CODE',
        mode: 'REVIEW',
        data: {
          type: 'CODE',
          subjectType: 'CODE',
          problem: 'Cho một mảng số nguyên, hãy sắp xếp mảng theo thứ tự tăng dần bằng thuật toán Quick Sort.',
          level: 'Medium',
          language: 'javascript',
          starterCode: 'function quickSort(arr) {\n  // Viết code tại đây\n  return arr;\n}',
          testCases: ['Input: [3, 6, 8, 10, 1, 2, 1]\nOutput: [1, 1, 2, 3, 6, 8, 10]', 'Input: [5, 4, 3, 2, 1]\nOutput: [1, 2, 3, 4, 5]']
        }
      },
      {
        subjectName: 'Cơ sở dữ liệu',
        topicText: 'Câu truy vấn SQL cơ bản',
        semester: '2',
        subjectType: 'DATABASE',
        mode: 'REVIEW',
        data: {
          type: 'CODE',
          subjectType: 'DATABASE',
          problem: 'Từ bảng Employees(id, name, salary, department_id), viết câu SQL để lấy danh sách nhân viên có lương trên 5000.',
          level: 'Easy',
          language: 'sql',
          starterCode: '-- Viết câu SELECT để giải bài toán này\nSELECT ',
          testCases: ['Table: Employees(id, name, salary, department_id)\nOutput: Tên nhân viên có lương > 5000']
        }
      },
      // Quiz exercises
      {
        subjectName: 'Toán rời rạc',
        topicText: 'Đại số Boole',
        semester: '1',
        subjectType: 'QUIZ',
        mode: 'REVIEW',
        data: {
          type: 'QUIZ',
          subjectType: 'QUIZ',
          questions: [
            { question: 'Phép toán AND trong đại số Boole tương ứng với phép toán nào trong tập hợp?', options: ['Hợp', 'Giao', 'Hiệu', 'Phần bù'], correctIndex: 1, explanation: 'Phép AND tương ứng với phép giao (∩) trong tập hợp.' },
            { question: 'Phép toán OR trong đại số Boole tương ứng với phép toán nào?', options: ['Hợp', 'Giao', 'Hiệu', 'Phần bù'], correctIndex: 0, explanation: 'Phép OR tương ứng với phép hợp (∪) trong tập hợp.' },
            { question: 'Luật De Morgan: (A AND B)\' bằng?', options: ['A\' OR B\'', 'A\' AND B\'', 'A OR B', 'A AND B'], correctIndex: 0, explanation: 'Theo luật De Morgan: (A ∧ B)\' = A\' ∨ B\'.' }
          ]
        }
      }
    ]);
    console.log("✅ Tạo dữ liệu Bài tập mẫu");

    console.log("\n🎉 KHỞI TẠO DỮ LIỆU HOÀN TẤT!");
    console.log("===========================================");
    console.log("Tài khoản Admin: admin / admin123");
    console.log("Tài khoản Test 1: khoa / 123");
    console.log("Tài khoản Test 2: minh / 123");
    console.log("Tài khoản Test 3: lan / 123 (chưa hoàn thành profile)");
    console.log("===========================================");

    process.exit();
  } catch (error) {
    console.error("❌ Lỗi khi seed dữ liệu:", error);
    process.exit(1);
  }
};

// Chạy seed
seedDB();

