const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Student = require('../models/Students');

// API lấy dữ liệu thống kê cho Dashboard
router.get('/dashboard-stats', async (req, res) => {
  try {
    // 1. Lấy tổng số sinh viên (role: 'student')
    const totalUsers = await User.countDocuments({ role: 'student' });

    // 2. Thống kê số lượng sinh viên theo Trường (School) - lấy từ Student model
    const schoolStats = await Student.aggregate([
      { $group: { _id: '$schoolName', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // 3. Thống kê số lượng sinh viên theo Ngành học (Major) - lấy từ Student model
    const majorStats = await Student.aggregate([
      { $group: { _id: '$majorName', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Trả dữ liệu về cho Front-end
    res.json({
      success: true,
      data: {
        totalUsers,
        schoolStats,
        majorStats
      }
    });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê:", error);
    res.status(500).json({ success: false, message: 'Đã xảy ra lỗi trên server.' });
  }
});

module.exports = router;