const mongoose = require('mongoose');

const distanceSchema = new mongoose.Schema({
  docAId: Number,
  docBId: Number,
  dist: Number
});

const Distance = mongoose.model('Distance', distanceSchema);

module.exports = Distance;