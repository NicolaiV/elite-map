const bluebird = require('bluebird');
const mongoose = require('mongoose');
const fsp = require('fs-es6-promise');
const downloader = require('./downloader');

const pathToSystemsJSON = downloader.getJsonPath('systems');
Promise = bluebird;
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
  distances: Array
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


function distance(initial, target){
  const {x: initialX, y: initialY, z: initialZ} = initial;
  const {x: targetX, y: targetY, z: targetZ} = target;
  return Math.sqrt(Math.pow((initialX - targetX), 2) + Math.pow((initialY - targetY), 2 ) + Math.pow((initialZ - targetZ), 2))
}

const distanceSchema = new mongoose.Schema({
  docAId: Number,
  docBId: Number,
  dist: Number
});

const Distance = mongoose.model('Distance', distanceSchema);

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
    })
    .then(()=> new Promise((resolve) => {
      System.find({}, function (err, docs) {
        let dists = [];
        return Promise.each(docs, (itemA, indexA) => {
            console.log(indexA);
            return Promise.each(docs, (itemB, indexB) => {
               if(indexB > indexA){
                   dists.push({
                   docAId: itemA.id,
                   docBId: itemB.id,
                   dist: distance(itemA, itemB)
                 });
               if(dists.length > 100000){
                 return Distance.collection.insert(dists)
                   .then(() => { dists = []; });
               }
               }
            });
         })
		   .then(() => Distance.collection.insert(dists)
						.then(() => { dists = []; }));
       })
    })
  )
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
  System,
  Distance
};
