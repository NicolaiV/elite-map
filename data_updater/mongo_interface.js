const bluebird = require('bluebird');
const mongoose = require('mongoose');
const fsp = require('fs-es6-promise');
const fs = require('fs');
const readline = require('readline');
const downloader = require('./downloader');
const System = require('../DB_Models/System');
const Distance = require('../DB_Models/Distance');
const config = require('./config');
const Stream = require('stream');

const pathToSystemsJSON = downloader.getJsonPath('systems');
Promise = bluebird;
mongoose.Promise = bluebird;

const connect = mongoose.connect(config.mongoose.colletction);

let db = mongoose.connection.db;

function distance(initial, target) {
  const { x: initialX, y: initialY, z: initialZ } = initial;
  const { x: targetX, y: targetY, z: targetZ } = target;
  return Math.sqrt(((initialX - targetX) ** 2)
            + ((initialY - targetY) ** 2)
            + ((initialZ - targetZ) ** 2));
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
  const names = [];
  return downloader.downloadFile(config.systemsUrl, pathToSystemsJSON)
    .then(() => new Promise((resolve, reject) => {
      const instream = fs.createReadStream(pathToSystemsJSON);
      const outstream = new Stream();
      outstream.readable = true;
      outstream.writable = true;
      readline.createInterface({
        input: instream,
        output: outstream
      })
      .on('line', (line) => {
        if (line !== '') {
          const system = JSON.parse(line);
          System.find({ name: system.name })
            .then(systemsInDB => systemsInDB.length === 0)
            .then((write) => {
              if (write) {
                names.push(system.name);
                return new System(system).save();
              }
              return null;
            });
        }
      })
      .on('error', err => reject(err))
      .on('close', resolve);
    }))
    .then(() => {
      let dists = [];
      return Promise.each(names, (name, index) => {
        process.stdout.write(`\r [${index}/${names.length}]`);
        return System.findOne({ name })
          .then(system => System.find({ $and: [
              { x: { $lt: (system.x + config.maxRadius) } },
              { x: { $gt: (system.x - config.maxRadius) } },
              { y: { $lt: (system.y + config.maxRadius) } },
              { y: { $gt: (system.y - config.maxRadius) } },
              { z: { $lt: (system.z + config.maxRadius) } },
              { z: { $gt: (system.z - config.maxRadius) } }]
          })
          .then((docs) => {
            return {
              system,
              docs
            };
          }))
          .then(({ system, docs }) => Promise.each(docs, (target) => {
            const d = distance(system, target);
            if (d < config.maxRadius) {
              dists.push({
                names: [system.name, target.name],
                X: [system.x, target.x],
                Y: [system.y, target.y],
                Z: [system.z, target.z],
                distance: d
              });
              if (dists.length > config.mongoose.size) {
                return Distance.collection.insert(dists)
                  .then(() => { dists = []; });
              }
            }
            return null;
          })
        );
      })
      .then(() => Distance.collection.insert(dists))
      .then(() => {
        process.stdout.write('\n');
        dists = [];
      });
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
  System,
  Distance
};
