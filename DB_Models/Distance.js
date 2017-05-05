const mongoose = require('mongoose');

const distanceSchema = new mongoose.Schema({
  names: {
    type: [String],
    index: true
  },
  X: [Number],
  Y: [Number],
  Z: [Number],
  distance: Number
});

distanceSchema.index({ names: 1, type: -1 });

const Distance = mongoose.model('Distance', distanceSchema);

module.exports = Distance;