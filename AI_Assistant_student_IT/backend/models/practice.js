const express = require('express');
const router = express.Router();
const Exercise = require('../models/Exercise');
const { generateAIResponse } = require('../utils/aiHelper');

router.post('/generate-exercise', async (req, res) => {
  try {
    const { subjectName, topicText, mode } = req.body;
    const dbMode = mode === 'EXAM' ? 'EXAM' : 'REVIEW';
    
    // 1. TÌM TRONG DB: Nếu cùng môn, cùng chủ đề, cùng chế độ -> Lấy ra luôn!
    const existingExercise = await Exercise.findOne({ subjectName, topicText, mode: dbMode });
    if (existingExercise) {
      return res.json({ success: true, data: existingExercise.data, source: 'database' });
    }

    // 2. NẾU CHƯA CÓ TRONG DB -> GỌI A.I
    const difficulty = dbMode === 'EXAM' ? 'Medium' : 'Easy';
    const prompt = `Bạn là hệ thống tạo bài tập tự động.
    Môn học: "${subjectName}"
    Chủ đề (Step trong lộ trình): "${topicText}"
    Độ khó yêu cầu: ${difficulty}

    NHIỆM VỤ: Hãy xác định xem môn học này thiên về LẬP TRÌNH/CƠ SỞ DỮ LIỆU hay LÝ THUYẾT.
    
    NẾU LÀ MÔN LẬP TRÌNH/CSDL (Toán rời rạc, DSA, C++, SQL...):
    Trả về định dạng JSON sau:
    {
      "type": "CODE",
      "problem": "Mô tả bài toán chi tiết giống LeetCode...",
      "level": "${difficulty}",
      "language": "javascript", // hoặc sql, python
      "starterCode": "function solution(n) {\n  // Code here\n}",
      "testCases": ["Input: n = 5\\nOutput: 120", "Input: n = 3\\nOutput: 6"]
    }

    NẾU LÀ MÔN LÝ THUYẾT (Triết, Kinh tế, Quản trị, Mạng máy tính...):
    Trả về định dạng JSON là một bộ 5 câu hỏi trắc nghiệm:
    {
      "type": "QUIZ",
      "questions": [
        {
          "question": "Nội dung câu hỏi 1?",
          "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
          "correctIndex": 0,
          "explanation": "Giải thích tại sao A đúng"
        }
      ]
    }
    BẮT BUỘC: CHỈ TRẢ VỀ JSON THUẦN TÚY TỪ DẤU { ĐẾN DẤU }.`;

    let responseText = await generateAIResponse(prompt);
    const startIndex = responseText.indexOf('{');
    const endIndex = responseText.lastIndexOf('}');
    if (startIndex === -1 || endIndex === -1) throw new Error("Lỗi định dạng JSON từ AI");

    const cleanJson = responseText.substring(startIndex, endIndex + 1);
    const exerciseData = JSON.parse(cleanJson);

    // 3. LƯU VÀO DATABASE ĐỂ NGƯỜI SAU DÙNG CHUNG
    const newExercise = new Exercise({
      subjectName, topicText, mode: dbMode, data: exerciseData
    });
    await newExercise.save();

    res.json({ success: true, data: exerciseData, source: 'ai' });
  } catch (error) {
    console.error("Lỗi AI Tạo bài tập:", error);
    res.status(500).json({ success: false, message: 'Lỗi server khi tạo đề' });
  }
});

module.exports = router;