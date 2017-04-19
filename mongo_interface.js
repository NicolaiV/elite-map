const bluebird = require('bluebird');
const mongoose = require('mongoose');
const fsp = require('fs-es6-promise');
const downloader = require('./downloader');

const pathToSystemsJSON = downloader.getJsonPath('systems');

mongoose.Promise = bluebird;

const connect = mongoose.connect('mongodb://localhost:27017/elite');

let db = mongoose.connection.db;

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

function closeDB() {
  console.log('closeDB');
  return mongoose.connection.close();
}

function initDb() {
  return connect
    .then(() => (db = connect.connection.db));
}

function updateDB() {
  return downloader.downloadFile('https://eddb.io/archive/v5/systems_populated.json', pathToSystemsJSON)
    .then(() => fsp.readFile(pathToSystemsJSON))
    .then((data) => {
      const systems = JSON.parse(data.toString());
      return bluebird.map(systems, system => new System(system).save());
    });
}

function actualDB(force) {
  return fsp.stat(pathToSystemsJSON)
    .then((stat) => {
      const date = new Date();
      if (stat
        && (stat.ctime.getFullYear() === date.getFullYear())
        && (stat.ctime.getMonth() === date.getMonth())
        && (stat.ctime.getDate() === date.getDate()) && !force) {
        return null;
      }
      return updateDB();
    })
    .catch((err) => {
      if (err.code === 'ENOENT') {
        return updateDB();
      }
      throw err;
    });
}


module.exports = {
  actualDB,
  updateDB,
  closeDB,
  db,
  initDb,
  System
};
