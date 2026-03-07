const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  semester: { type: Number },
  startDate: { type: Date },
  majorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Major' }
}, { timestamps: true });

module.exports = mongoose.model('Subject', SubjectSchema);