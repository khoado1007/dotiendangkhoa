const mongoose = require('mongoose');

const semesterSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  semester1_start: {
    type: String,
    default: ''
  },
  semester1_end: {
    type: String,
    default: ''
  },
  semester2_start: {
    type: String,
    default: ''
  },
  semester2_end: {
    type: String,
    default: ''
  },
  semester_he_start: {
    type: String,
    default: ''
  },
  semester_he_end: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Semester', semesterSchema);

