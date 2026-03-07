const mongoose = require('mongoose');

const TimetableSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  semester: { type: String, required: true },
  dayOfWeek: { type: String, required: true },
  session: { type: String, required: true }, // 'Sáng', 'Chiều', 'Tối'
  
  // Dành cho Môn học
  isNote: { type: Boolean, default: false }, // Phân biệt môn học và ghi chú
  subjectName: { type: String, required: true  },
  startPeriod: { type: Number, required: true  }, // 1 đến 12
  numberOfPeriods: { type: Number, required: true  }, // 1 đến 6
  room: { type: String },
  noteContent: { type: String }, // Dành cho Ghi chú
  startDate: { type: Date }, // Ngày bắt đầu môn học
  endDate: { type: Date },   // Ngày kết thúc môn học
  isTemporary: { type: Boolean, default: false }, // Ghi chú tạm thời
  createdAt: { type: Date, default: Date.now }    // Để check tuần

}, { timestamps: true });

module.exports = mongoose.model('Timetable', TimetableSchema);