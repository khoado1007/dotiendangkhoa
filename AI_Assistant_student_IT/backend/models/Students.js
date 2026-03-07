const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: { type: String, required: true },
  dob: { type: Date },
  enrollmentYear: { type: Number },
  schoolName: { type: String }, 
  majorName: { type: String },
  
  majorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Major' }
}, { timestamps: true });

module.exports = mongoose.model('Student', StudentSchema);