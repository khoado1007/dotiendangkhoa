const express = require('express');
const router = express.Router();
const Roadmap = require('../models/Roadmap');
const { generateAIResponse } = require('../utils/geminiAI'); 
// 1. LẤY DANH SÁCH LỘ TRÌNH
router.get('/:userId/:semester', async (req, res) => {
  try {
    const roadmaps = await Roadmap.find({ userId: req.params.userId, semester: req.params.semester });
    res.json({ success: true, data: roadmaps });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// 2. LƯU LỘ TRÌNH MỚI
router.post('/save', async (req, res) => {
  try {
    const { userId, semester, subjectName, todos } = req.body;
    const updatedRoadmap = await Roadmap.findOneAndUpdate(
      { userId, semester, subjectName },
      { todos },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: updatedRoadmap });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// 3. TOGGLE TODO
router.put('/toggle', async (req, res) => {
  try {
    const { userId, semester, subjectName, taskId } = req.body;
    const roadmap = await Roadmap.findOne({ userId, semester, subjectName });
    if (!roadmap) return res.status(404).json({ success: false, message: 'Không tìm thấy' });

    const task = roadmap.todos.find(t => String(t.id) === String(taskId));
    if (task) {
      task.isCompleted = !task.isCompleted;
      await roadmap.save();
    }
    res.json({ success: true, data: roadmap });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// 4. API XÓA ROADMAP (Gọi khi xóa môn học)
router.delete('/:userId/:semester/:subjectName', async (req, res) => {
  try {
    await Roadmap.findOneAndDelete({
      userId: req.params.userId,
      semester: req.params.semester,
      subjectName: req.params.subjectName
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// 5. GỌI A.I TỪ FILE CÓ SẴN CỦA BẠN VÀ BÓC TÁCH JSON
router.post('/generate-ai', async (req, res) => {
  try {
    const { subjectName } = req.body;
    const {school} = req.body; // Lấy thông tin trường học nếu cần thiết để tùy chỉnh lộ trình
    // Prompt chuẩn ép JSON
    const prompt = `Bạn là một Senior giảng viên đại học xuất sắc và am hiểu sâu sắc về môn học "${subjectName}", ưu tiên dựa trên tên trường học "${school}" nếu có. Hãy cung cấp một lộ trình học tập hiệu quả, chia thành từng bước nhỏ (check-list) cho môn học này.
    Hãy cung cấp một lộ trình học tập hiệu quả, chia thành từng bước nhỏ (check-list) cho môn học này.
    BẮT BUỘC: Không giải thích, không chào hỏi. CHỈ TRẢ VỀ DUY NHẤT 1 MẢNG JSON ARRAY.
    Ví dụ cấu trúc trả về đúng:
    [
      { "text": "Đọc hiểu cấu trúc dữ liệu Array và Linked List" },
      { "text": "Thực hành thuật toán Sắp xếp và Tìm kiếm" }
    ]`;

    // SỬ DỤNG HÀM A.I CỦA BẠN (Đã bọc try/catch ở file gốc)
    let responseText = await generateAIResponse(prompt);

    // THUẬT TOÁN ÉP TÌM JSON (Chống lỗi khi AI "nói nhiều" hoặc bọc markdown)
    const startIndex = responseText.indexOf('[');
    const endIndex = responseText.lastIndexOf(']');
    
    if (startIndex === -1 || endIndex === -1) {
      throw new Error("AI không trả về JSON hợp lệ");
    }

    const cleanJson = responseText.substring(startIndex, endIndex + 1);
    const parsedData = JSON.parse(cleanJson);

    res.json({ success: true, data: parsedData });
  } catch (error) {
    console.error("Lỗi quá trình xử lý AI:", error);
    res.status(500).json({ success: false, message: 'Lỗi kết nối AI hoặc bóc tách dữ liệu' });
  }
});

module.exports = router;