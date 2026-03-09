const express = require('express');
const router = express.Router();
const User = require('../models/user'); // Lưu ý: Chữ U viết hoa cho đồng bộ
const Student = require('../models/Students'); // Lưu ý: Bỏ chữ s dư ở model Students nếu cần
const Major = require('../models/Major'); 
const University = require('../models/University'); 

// 1. API ĐĂNG KÝ
router.post('/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email hoặc Tên tài khoản đã được sử dụng!' 
      });
    }

    const newUser = new User({ email, username, password, role: 'student' });
    await newUser.save();

    res.json({ success: true, message: 'Đăng ký thành công!', user: newUser });
  } catch (error) {
    console.error("Lỗi đăng ký:", error);
    res.status(500).json({ success: false, message: 'Lỗi server khi đăng ký.' });
  }
});

// 2. API ĐĂNG NHẬP THỦ CÔNG
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne({ 
      $or: [{ username: username }, { email: username }], 
      password: password 
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Tài khoản hoặc mật khẩu không chính xác!' });
    }

    res.json({ success: true, message: 'Đăng nhập thành công!', user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi đăng nhập.' });
  }
});

// 3. API ĐĂNG NHẬP GOOGLE (Mock - for testing)
// Note: For production, use real Google OAuth via passport-google-oauth20
router.post('/google', async (req, res) => {
  try {
    const { email, googleId, displayName } = req.body;
    let user = await User.findOne({ email });
    
    if (!user) {
      const baseUsername = displayName || email.split('@')[0];
      user = new User({ 
        email: email, 
        username: baseUsername, 
        googleId: googleId,
        role: 'student'
      });
      await user.save();
    }

    res.json({ success: true, message: 'Đăng nhập Google thành công!', user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi đăng nhập Google.' });
  }
});

// 3a. Google OAuth callback (real implementation)
router.get('/google/callback', async (req, res) => {
  try {
    // This endpoint is called by Google after authentication
    // We'll redirect to frontend with user data
    const { googleId, email, displayName } = req.query;
    
    let user = await User.findOne({ email });
    
    if (!user) {
      const baseUsername = displayName || email.split('@')[0];
      user = new User({ 
        email: email, 
        username: baseUsername, 
        googleId: googleId,
        role: 'student'
      });
      await user.save();
    }

    // Redirect to frontend with success
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/home?googleAuth=success&userId=${user._id}`);
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth?googleAuth=error`);
  }
});

// 4. API CẬP NHẬT HỒ SƠ (Bao gồm Cấu hình giờ học ban đầu)
router.put('/update-profile/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { fullName, dob, enrollmentYear, school, major, settings } = req.body;

    console.log("=== BẮT ĐẦU CẬP NHẬT HỒ SƠ & CÀI ĐẶT ===");

    // Cập nhật User: Đánh dấu hoàn tất và lưu Settings từ Popup
    const userUpdateData = { isProfileComplete: true };
    if (settings) {
        userUpdateData.settings = settings; // Lưu period1Start, period7Start, hasBreak...
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      userUpdateData,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản!" });
    }

    // Cập nhật hoặc Tạo mới Student
    const studentProfile = await Student.findOneAndUpdate(
      { userId: userId }, 
      {
        userId: userId,
        fullName: fullName,
        dob: dob ? new Date(dob) : null,
        enrollmentYear: enrollmentYear,
        schoolName: school, 
        majorName: major    
      },
      { new: true, upsert: true } 
    );

    res.json({ 
      success: true, 
      message: 'Cập nhật hồ sơ và cấu hình giờ học thành công!', 
      user: updatedUser,
      student: studentProfile 
    });

  } catch (error) {
    console.error("❌ LỖI KHI LƯU HỒ SƠ:", error);
    res.status(500).json({ success: false, message: "Lỗi server khi lưu hồ sơ." });
  }
});

// 5. API LẤY THÔNG TIN SINH VIÊN
router.get('/student/:userId', async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.params.userId });
    if (!student) {
      return res.status(404).json({ success: false, message: "Chưa có hồ sơ" });
    }
    res.json({ success: true, student });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// 6. API LẤY CÀI ĐẶT
router.get('/settings/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
    res.json({ success: true, settings: user.settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// 7. API CẬP NHẬT CÀI ĐẶT (Tại trang Settings)
router.put('/settings/:id', async (req, res) => {
  try {
    // Thêm semesterConfig vào danh sách lấy từ req.body
    const { period1Start, period7Start, periodDuration, hasBreak, breakDuration, periodsPerBreak, semesterConfig } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          settings: { 
            period1Start, period7Start, periodDuration, hasBreak, breakDuration, periodsPerBreak,
            semesterConfig // Lưu cấu hình học kỳ vào DB
          } 
        } 
      },
      { new: true }
    );
    res.json({ success: true, settings: updatedUser.settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// 8. API XÁC THỰC USER (Kiểm tra user có tồn tại trong DB không)
router.get('/validate/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User không tồn tại trong database' 
      });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});
module.exports = router;
