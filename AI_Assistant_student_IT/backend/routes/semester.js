/**
 * =====================================================
 * SEMESTER ROUTES - API Documentation
 * =====================================================
 * 
 * Base URL: /api/semester
 * 
 * ENDPOINTS:
 * -----------
 * 1. GET  /:userId    - Get semester config for user
 * 2. POST /:userId    - Create or Update semester config
 * 
 * =====================================================
 */

const express = require('express');
const router = express.Router();
const Semester = require('../models/Semester');

// =====================================================
// 1. GET SEMESTER CONFIG
// Method: GET
// Response: { success, data: { userId, semester1_start, semester1_end, ... } }
// =====================================================
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    let semester = await Semester.findOne({ userId });
    
    if (!semester) {
      // Return default empty config if not exists
      const year = new Date().getFullYear();
      return res.json({
        success: true,
        data: {
          userId,
          semester1_start: `${year}-09-05`,
          semester1_end: `${year + 1}-01-15`,
          semester2_start: `${year + 1}-02-15`,
          semester2_end: `${year + 1}-06-30`,
          semester_he_start: `${year + 1}-07-05`,
          semester_he_end: `${year + 1}-08-30`
        }
      });
    }
    
    res.json({ success: true, data: semester });
  } catch (error) {
    console.error("Lỗi lấy semester:", error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// =====================================================
// 2. CREATE OR UPDATE SEMESTER CONFIG
// Method: POST
// Body: { userId, semester1_start, semester1_end, semester2_start, semester2_end, semester_he_start, semester_he_end }
// Response: { success, data, message }
// =====================================================
router.post('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      semester1_start, semester1_end, 
      semester2_start, semester2_end, 
      semester_he_start, semester_he_end 
    } = req.body;

    // Check if semester config exists
    let semester = await Semester.findOne({ userId });

    if (semester) {
      // Update existing
      semester.semester1_start = semester1_start || '';
      semester.semester1_end = semester1_end || '';
      semester.semester2_start = semester2_start || '';
      semester.semester2_end = semester2_end || '';
      semester.semester_he_start = semester_he_start || '';
      semester.semester_he_end = semester_he_end || '';
      await semester.save();
      
      return res.json({ 
        success: true, 
        data: semester,
        message: 'Cập nhật cấu hình học kỳ thành công!' 
      });
    } else {
      // Create new
      semester = new Semester({
        userId,
        semester1_start: semester1_start || '',
        semester1_end: semester1_end || '',
        semester2_start: semester2_start || '',
        semester2_end: semester2_end || '',
        semester_he_start: semester_he_start || '',
        semester_he_end: semester_he_end || ''
      });
      await semester.save();
      
      return res.json({ 
        success: true, 
        data: semester,
        message: 'Tạo cấu hình học kỳ thành công!' 
      });
    }
  } catch (error) {
    console.error("Lỗi lưu semester:", error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;

