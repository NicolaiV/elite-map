const mongoose = require('mongoose');

const systemSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true
  },
  edsm_id: Number,
  name: String,
  x: Number,
  y: Number,
  z: Number,
  population: Number,
  /*is_populated: Boolean,
  government_id: Number,
  government: String,
  allegiance_id: Number,
  allegiance: String,
  state_id: Number,
  state: String,
  security_id: Number,
  security: String,
  primary_economy_id: Number,
  primary_economy: String,
  power: String,
  power_state: Number,
  power_state_id: Number,
  needs_permit: Boolean,
  updated_at: Number,
  simbad_ref: String,
  controlling_minor_faction_id: Number,
  controlling_minor_faction: String,
  reserve_type_id: Number,
  reserve_type: String*/
});

const System = mongoose.model('System', systemSchema);

module.exports = System;