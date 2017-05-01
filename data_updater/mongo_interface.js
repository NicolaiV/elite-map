const bluebird = require('bluebird');
const mongoose = require('mongoose');
const fsp = require('fs-es6-promise');
const fs = require('fs');
const readline = require('readline');
const downloader = require('./downloader');
const System = require('../DB_Models/System');
const Distance = require('../DB_Models/Distance');
const config = require('./config');
const stream = require('stream');
const es = require('event-stream');

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

// TODO: Разбить функцию на меньшие функции и добавить комментарии
function updateDB() {
  const names = [];
  let systemsLength = 0;
  return downloader.downloadFile(config.systemsUrl, pathToSystemsJSON)
    .then(() => new Promise((resolve, reject) => {
  console.log('Recording systems')
      const instream = fs.createReadStream(pathToSystemsJSON)
        .pipe(es.split())
        .pipe(es.mapSync((line) => {
                if (line !== '') {
                  instream.pause();
                  const system = JSON.parse(line);
                  System.find({ name: system.name })
                    .then(systemsInDB => systemsInDB.length === 0)
                    .then((write) => {
                      if (write) {
                        names.push(system.name);
                        systemsLength++;
                        process.stdout.write(`[${systemsLength}]\r`);
                        return new System(system).save();
                      }
                      return null;
                    })
                    .then(instream.resume);
                }
            })
            .on('error', reject)
            .on('end', resolve))
    }))
    .then(() => {
      console.log('\nRecording distances')
      let dists = [];
      return Promise.each(names, (name, index) => {
        process.stdout.write(`[${index + 1}/${names.length}]\r`);
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
