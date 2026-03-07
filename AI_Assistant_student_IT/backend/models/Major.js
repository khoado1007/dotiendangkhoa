const mongoose = require('mongoose');

const MajorSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Tên ngành (VD: Công nghệ thông tin)
  facultyName: { type: String },          // Tên khoa (VD: Khoa CNTT)
  universityId: { type: mongoose.Schema.Types.ObjectId, ref: 'University' }
}, { timestamps: true });

module.exports = mongoose.model('Major', MajorSchema);