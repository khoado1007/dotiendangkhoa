const mongoose = require('mongoose');

const RoadmapSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  semester: { type: String, required: true },
  subjectName: { type: String, required: true },
  todos: [{
    id: { type: String, required: true }, // ĐÃ SỬA THÀNH STRING
    text: { type: String, required: true },
    isCompleted: { type: Boolean, default: false }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Roadmap', RoadmapSchema);