const mongoose = require('mongoose');

const UniversitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('University', UniversitySchema);