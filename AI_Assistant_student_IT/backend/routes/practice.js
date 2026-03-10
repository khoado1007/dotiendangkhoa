const express = require('express');
const router = express.Router();
const Exercise = require('../models/Exercise');
const { generateAIResponse } = require('../utils/geminiAI');

// List of programming/database subjects keywords
const PROGRAMMING_KEYWORDS = ['lập trình', 'programming', 'code', 'c++', 'java', 'python', 'javascript', 'algorithm', 'thuật toán', 'dsa', 'data structure', 'cấu trúc dữ liệu'];
const DATABASE_KEYWORDS = ['database', 'csdl', 'sql', 'mysql', 'mongodb', 'oracle', 'cơ sở dữ liệu', 'data', 'query'];
const THEORY_KEYWORDS = ['triết', 'kinh tế', 'quản trị', 'marketing', 'luật', 'lịch sử', 'văn hóa', 'ngôn ngữ', 'mạng máy tính', 'network'];

// Determine subject type based on keywords
const determineSubjectType = (subjectName) => {
  const lowerName = subjectName.toLowerCase();
  
  // Check for database first (more specific)
  if (DATABASE_KEYWORDS.some(keyword => lowerName.includes(keyword))) {
    return 'DATABASE';
  }
  
  // Check for programming
  if (PROGRAMMING_KEYWORDS.some(keyword => lowerName.includes(keyword))) {
    return 'CODE';
  }
  
  // Check for theory
  if (THEORY_KEYWORDS.some(keyword => lowerName.includes(keyword))) {
    return 'QUIZ';
  }
  
  // Default to QUIZ (theoretical) if unknown
  return 'QUIZ';
};

// Get exercises by user and semester
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { semester } = req.query;
    
    const query = {};
    if (semester) {
      query.semester = semester;
    }
    
    const exercises = await Exercise.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: exercises });
  } catch (error) {
    console.error("Lỗi lấy danh sách bài tập:", error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Generate or get exercise
router.post('/generate-exercise', async (req, res) => {
  try {
    const { subjectName, topicText, mode, semester } = req.body;
    const dbMode = mode === 'EXAM' ? 'EXAM' : 'REVIEW';
    const dbSemester = semester || '1';
    
    // Determine subject type
    const subjectType = determineSubjectType(subjectName);
    
    // 1. TÌM TRONG DB: Nếu cùng môn, cùng chủ đề, cùng chế độ, cùng kỳ -> Lấy ra luôn!
    const existingExercise = await Exercise.findOne({ 
      subjectName, 
      topicText, 
      mode: dbMode,
      semester: dbSemester 
    });
    
    if (existingExercise) {
      return res.json({ 
        success: true, 
        data: existingExercise.data, 
        source: 'database',
        subjectType: existingExercise.subjectType,
        examTime: existingExercise.subjectType === 'QUIZ' ? 60 : 75
      });
    }

    // 2. NẾU CHƯA CÓ TRONG DB -> GỌI A.I
    const difficulty = dbMode === 'EXAM' ? 'Medium' : 'Easy';
    
    let prompt = '';
    
    if (subjectType === 'DATABASE') {
      // Database exercises (SQL queries)
      prompt = `Bạn là hệ thống tạo bài tập Cơ sở dữ liệu tự động.
      Môn học: "${subjectName}"
      Chủ đề (Step trong lộ trình): "${topicText}"
      Độ khó yêu cầu: ${difficulty}

      NHIỆM VỤ: Tạo bài tập SQL/Query giống LeetCode style.
      
      Trả về định dạng JSON sau:
      {
        "type": "CODE",
        "subjectType": "DATABASE",
        "problem": "Mô tả bài toán chi tiết yêu cầu viết câu truy vấn SQL...",
        "level": "${difficulty}",
        "language": "sql",
        "starterCode": "-- Viết câu SELECT để giải bài toán này\nSELECT ",
        "testCases": ["Table: Employees(id, name, salary, department_id)\\nOutput: Tổng lương theo phòng", "Table: Orders(id, customer_id, amount)\\nOutput: Top 5 khách hàng mua nhiều nhất"],
        "schema": "Mô tả cấu trúc bảng nếu cần"
      }
      BẮT BUỘC: CHỈ TRẢ VỀ JSON THUẦN TÚY TỪ DẤU { ĐẾN DẤU }.`;
      
    } else if (subjectType === 'CODE') {
      // Programming exercises
      prompt = `Bạn là hệ thống tạo bài tập lập trình tự động.
      Môn học: "${subjectName}"
      Chủ đề (Step trong lộ trình): "${topicText}"
      Độ khó yêu cầu: ${difficulty}

      NHIỆM VỤ: Tạo bài tập lập trình giống LeetCode style.
      
      Trả về định dạng JSON sau:
      {
        "type": "CODE",
        "subjectType": "CODE",
        "problem": "Mô tả bài toán chi tiết...",
        "level": "${difficulty}",
        "language": "javascript",
        "starterCode": "function solution(n) {\n  // Code here\n}",
        "testCases": ["Input: n = 5\\nOutput: 120", "Input: n = 3\\nOutput: 6"]
      }
      BẮT BUỘC: CHỈ TRẢ VỀ JSON THUẦN TÚY TỪ DẤU { ĐẾN DẤU }.`;
      
    } else {
      // Theory/Quiz exercises
      prompt = `Bạn là hệ thống tạo bài tập trắc nghiệm tự động.
      Môn học: "${subjectName}"
      Chủ đề (Step trong lộ trình): "${topicText}"
      Độ khó yêu cầu: ${difficulty}

      NHIỆM VỤ: Tạo 5 câu hỏi trắc nghiệm cho môn lý thuyết.
      
      Trả về định dạng JSON là một bộ 5 câu hỏi trắc nghiệm:
      {
        "type": "QUIZ",
        "subjectType": "QUIZ",
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
    }

    let responseText = await generateAIResponse(prompt);
    const startIndex = responseText.indexOf('{');
    const endIndex = responseText.lastIndexOf('}');
    if (startIndex === -1 || endIndex === -1) throw new Error("Lỗi định dạng JSON từ AI");

    const cleanJson = responseText.substring(startIndex, endIndex + 1);
    const exerciseData = JSON.parse(cleanJson);
    
    // Ensure subjectType is in the data
    if (!exerciseData.subjectType) {
      exerciseData.subjectType = subjectType;
    }

    // 3. LƯU VÀO DATABASE ĐỂ NGƯỜI SAU DÙNG CHUNG
    const newExercise = new Exercise({
      subjectName,
      topicText,
      semester: dbSemester,
      subjectType,
      mode: dbMode,
      data: exerciseData
    });
    await newExercise.save();

    res.json({ 
      success: true, 
      data: exerciseData, 
      source: 'ai',
      subjectType,
      examTime: subjectType === 'QUIZ' ? 60 : 75
    });
  } catch (error) {
    console.error("Lỗi AI Tạo bài tập:", error);
    res.status(500).json({ success: false, message: 'Lỗi server khi tạo đề' });
  }
});

// Save exam result
router.post('/save-result', async (req, res) => {
  try {
    const { userId, subjectName, topicText, mode, score, answers, semester } = req.body;
    
    // Store in localStorage on client side, but we can also track here
    // For now, we'll just acknowledge the save
    // The actual storage is done on client via LocalStorage
    
    res.json({ 
      success: true, 
      message: 'Kết quả đã được lưu' 
    });
  } catch (error) {
    console.error("Lỗi lưu kết quả:", error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;

