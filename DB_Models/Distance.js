const mongoose = require('mongoose');

const distanceSchema = new mongoose.Schema({
  names: Array,
  X: Array,
  Y: Array,
  Z: Array,
  distance: Number
});

const Distance = mongoose.model('Distance', distanceSchema);

module.exports = Distance;