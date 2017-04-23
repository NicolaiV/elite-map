const mongoose = require('mongoose');

const distanceSchema = new mongoose.Schema({
  docAId: Number,
  docAx: Number,
  docAy: Number,
  docAz: Number,
  docBId: Number,
  docBx: Number,
  docBy: Number,
  docBz: Number,
  dist: Number
});

const Distance = mongoose.model('Distance', distanceSchema);

module.exports = Distance;