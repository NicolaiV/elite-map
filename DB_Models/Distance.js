const mongoose = require('mongoose');

const distanceSchema = new mongoose.Schema({
  names: [String],
  X: [Number],
  Y: [Number],
  Z: [Number],
  distance: [String]
});

const Distance = mongoose.model('Distance', distanceSchema);

module.exports = Distance;