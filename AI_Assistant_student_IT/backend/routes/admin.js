/**
 * =====================================================
 * ADMIN ROUTES - API Documentation for Developers
 * =====================================================
 * 
 * Base URL: /api/admin
 * 
 * ENDPOINTS:
 * -----------
 * 1. GET /dashboard-stats  - Lấy dữ liệu thống kê dashboard
 * 
 * NOTE: Cần kiểm tra user.role === 'admin' để bảo mật
 * =====================================================
 */

const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Student = require('../models/Students');

// =====================================================
// 1. API LẤY DỮ LIỆU THỐNG KÊ CHO DASHBOARD
// Method: GET
// Response: { success, data: { totalUsers, schoolStats, majorStats } }
// 
// NOTE: 
// - totalUsers: Tổng số sinh viên (role: 'student')
// - schoolStats: Thống kê theo trường (schoolName)
// - majorStats: Thống kê theo ngành (majorName)
// =====================================================
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
