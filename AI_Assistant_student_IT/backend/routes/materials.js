/**
 * MATERIALS ROUTES
 * Priority: school materials → internet materials → AI search → AI generate
 */

const express = require('express');
const router = express.Router();
const Exercise = require('../models/Exercise');
const Timetable = require('../models/Timetable');
const Student = require('../models/Students');
const { generateAIResponse } = require('../utils/geminiAI');

// Get all materials for user's current semester subjects
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { semester } = req.query;
    
    const student = await Student.findOne({ userId });
    const userSchool = student?.schoolName || '';
    
    const timetableQuery = { userId, isNote: false };
    if (semester) timetableQuery.semester = semester;
    
    const timetableItems = await Timetable.find(timetableQuery);
    const uniqueSubjects = [...new Set(timetableItems.map(t => t.subjectName))];
    
    const materialsData = [];
    
    for (const subjectName of uniqueSubjects) {
      let schoolMaterial = await Exercise.findOne({
        subjectName, sourceType: 'school', schoolName: userSchool, mode: 'REVIEW'
      });
      
      if (!schoolMaterial) {
        schoolMaterial = await Exercise.findOne({
          subjectName, sourceType: 'school', mode: 'REVIEW'
        });
      }
      
      let internetMaterial = await Exercise.findOne({
        subjectName, sourceType: 'internet', mode: 'REVIEW'
      });
      
      materialsData.push({
        subjectName,
        schoolName: userSchool,
        hasSchoolMaterial: !!schoolMaterial,
        hasInternetMaterial: !!internetMaterial,
        schoolMaterial: schoolMaterial?.materials || null,
        internetMaterial: internetMaterial?.materials || null,
        source: schoolMaterial ? 'school' : (internetMaterial ? 'internet' : 'none')
      });
    }
    
    res.json({ success: true, data: materialsData, schoolName: userSchool });
  } catch (error) {
    console.error("Lỗi lấy materials:", error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Generate materials - AI searches internet first, then generates if needed
router.post('/generate', async (req, res) => {
  try {
    const { subjectName, semester, userId, forceGenerate } = req.body;
    
    const student = await Student.findOne({ userId });
    const userSchool = student?.schoolName || '';
    
    const existingInternet = await Exercise.findOne({
      subjectName, sourceType: 'internet', mode: 'REVIEW'
    });
    
    const sourceType = existingInternet ? 'school' : 'internet';
    const schoolName = sourceType === 'school' ? userSchool : 'Internet';
    
    // Check if exists
    if (!forceGenerate) {
      const existing = await Exercise.findOne({ subjectName, sourceType, mode: 'REVIEW' });
      if (existing) {
        return res.json({ success: true, data: existing.materials, source: sourceType, message: 'Materials already exist' });
      }
    }
    
    // AI searches for REAL materials on internet
    const searchPrompt = `Bạn là trợ lý tìm kiếm tài liệu học tập.
    Môn học: "${subjectName}"
    
    Hãy tìm kiếm và liệt kê các tài liệu THỰC TẾ trên internet:
    1. Video bài giảng trên YouTube (link cụ thể)
    2. Trang tutorial (W3Schools, GeeksforGeeks, MDN)
    3. Tài liệu từ các trường đại học Việt Nam
    
    Trả về JSON:
    {
      "summary": "Tóm tắt 3-4 câu về môn học",
      "notes": "Các chủ đề chính cần học",
      "tutorials": ["Tên - LINK", "Tên - LINK"],
      "references": ["Tên - LINK", "Tên - LINK"]
    }
    
    QUAN TRỌNG: Chỉ liệt kê LINK THỰC SỰ. Ưu tiên tiếng Việt.
    BẮT BUỘC: CHỈ TRẢ VỀ JSON.`;

    let responseText = await generateAIResponse(searchPrompt);
    let startIndex = responseText.indexOf('{');
    let endIndex = responseText.lastIndexOf('}');
    
    let materials;
    if (startIndex !== -1 && endIndex !== -1) {
      try {
        const cleanJson = responseText.substring(startIndex, endIndex + 1);
        materials = JSON.parse(cleanJson);
      } catch (e) {
        materials = { summary: `Tài liệu ${subjectName}`, notes: "Đang cập nhật", tutorials: [], references: [] };
      }
    } else {
      materials = { summary: `Tài liệu ${subjectName}`, notes: "Đang cập nhật", tutorials: [], references: [] };
    }
    
    // Save to database
    const newMaterial = new Exercise({
      subjectName,
      topicText: 'Tổng hợp tài liệu',
      semester: semester || '1',
      subjectType: 'QUIZ',
      mode: 'REVIEW',
      data: { type: 'MATERIALS', generatedAt: new Date().toISOString() },
      sourceType,
      schoolName,
      materials
    });
    
    await newMaterial.save();
    
    res.json({ success: true, data: materials, source: sourceType, message: 'Materials found/generated' });
  } catch (error) {
    console.error("Lỗi AI generate materials:", error);
    res.status(500).json({ success: false, message: 'Lỗi server khi tạo tài liệu' });
  }
});

// Get specific subject materials
router.get('/:userId/:subjectName', async (req, res) => {
  try {
    const { userId, subjectName } = req.params;
    const student = await Student.findOne({ userId });
    const userSchool = student?.schoolName || '';
    
    let material = await Exercise.findOne({ subjectName, sourceType: 'school', schoolName: userSchool, mode: 'REVIEW' });
    if (!material) material = await Exercise.findOne({ subjectName, sourceType: 'school', mode: 'REVIEW' });
    if (!material) material = await Exercise.findOne({ subjectName, sourceType: 'internet', mode: 'REVIEW' });
    
    if (material) {
      res.json({ success: true, data: material.materials, source: material.sourceType, schoolName: material.schoolName });
    } else {
      res.json({ success: true, data: null, source: 'none', message: 'No materials found' });
    }
  } catch (error) {
    console.error("Lỗi lấy materials:", error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;

