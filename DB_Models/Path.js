const mongoose = require('mongoose');

const pathSchema = new mongoose.Schema({
  path: [String],
  names: [String],
  maxRadius: Number,
  code: Boolean,
  generated: Boolean
});

const Path = mongoose.model('Path', pathSchema);

module.exports = Path;