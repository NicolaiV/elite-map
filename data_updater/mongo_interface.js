const bluebird = require('bluebird');
const mongoose = require('mongoose');
const fsp = require('fs-es6-promise');
const fs = require('fs');
const downloader = require('./downloader');
const System = require('../DB_Models/System');
const config = require('../config');
const es = require('event-stream');

const pathToSystemsJSON = downloader.getJsonPath('systems');
Promise = bluebird;
mongoose.Promise = bluebird;

const connect = mongoose.connect(config.mongoose.colletction);

let db = mongoose.connection.db;

function closeDB() {
  console.log('closeDB');
  return mongoose.connection.close();
}

function initDb() {
  return connect
    .then(() => (db = connect.connection.db));
}

function updateDB() {
  let systemsLength = 0;
  return downloader.downloadFile(config.systemsUrl, pathToSystemsJSON)
    .then(() => new Promise((resolve, reject) => {
      console.log('Recording systems');
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
        .on('end', resolve));
    }))
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
      return updateDB()
               .then(() => process.stdout.write('\n'));
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
