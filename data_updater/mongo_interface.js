const bluebird = require('bluebird');
const mongoose = require('mongoose');
const fsp = require('fs-es6-promise');
const downloader = require('./downloader');
const System = require('../DB_Models/System')
const Distance = require('../DB_Models/Distance')

const pathToSystemsJSON = downloader.getJsonPath('systems');
Promise = bluebird;
mongoose.Promise = bluebird;

const connect = mongoose.connect('mongodb://localhost:27017/elite');

let db = mongoose.connection.db;

function distance(initial, target){
  const {x: initialX, y: initialY, z: initialZ} = initial;
  const {x: targetX, y: targetY, z: targetZ} = target;
  return Math.sqrt(Math.pow((initialX - targetX), 2) + Math.pow((initialY - targetY), 2 ) + Math.pow((initialZ - targetZ), 2))
}

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
				const d = distance(itemA, itemB)
               if(indexB > indexA && d < 100){
                   dists.push({
                   docAId: itemA.id,
                   docBId: itemB.id,
                   dist: d
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
