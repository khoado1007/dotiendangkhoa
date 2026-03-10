const mongoose = require('mongoose');

const ExerciseSchema = new mongoose.Schema({
  subjectName: { type: String, required: true },
  topicText: { type: String, required: true },
  semester: { type: String, default: '1' }, // Store semester for filtering
  subjectType: { type: String, enum: ['CODE', 'DATABASE', 'QUIZ'], default: 'QUIZ' },
  mode: { type: String, required: true, enum: ['REVIEW', 'EXAM'] },
  data: { type: Object, required: true }, // Lưu trữ JSON đề bài (CODE hoặc QUIZ)
  
  // New fields for Study Materials
  sourceType: { type: String, enum: ['school', 'internet', 'ai'], default: 'internet' },
  schoolName: { type: String, default: '' }, // Track which school the material belongs to
  materials: {
    notes: { type: String, default: '' }, // Tổng hợp kiến thức
    tutorials: [{ type: String }], // Danh sách tutorial/video bài giảng
    references: [{ type: String }], // Tài liệu tham khảo từ các trường khác
    summary: { type: String, default: '' } // Tóm tắt chương
  }
}, { timestamps: true });

// Index for faster queries
ExerciseSchema.index({ subjectName: 1, topicText: 1, mode: 1, semester: 1 });
// Index for materials search
ExerciseSchema.index({ subjectName: 1, sourceType: 1, schoolName: 1 });

module.exports = mongoose.model('Exercise', ExerciseSchema);
