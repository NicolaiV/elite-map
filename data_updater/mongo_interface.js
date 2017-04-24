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


//TODO: сделать построчное чтение файла
function updateDB() {
  return downloader.downloadFile(config.systemsUrl, pathToSystemsJSON)
    .then(() => new Promise((resolve, reject) => {
       const instream = fs.createReadStream(pathToSystemsJSON);
       const outstream = new Stream();
       outstream.readable = true;
       outstream.writable = true;
       let systems = [];
       let rl = readline.createInterface({
          input: instream,
          output: outstream
       })
       .on('line', function(line) {
          try {
            systems.push(JSON.parse(line));
          } catch (e){}
          if(systems.length > 1000) {
            System.collection.insert(systems)
            systems = [];
          }
        })
       .on('error', err => reject(err))
       .on('close', () => {
          System.collection.insert(systems)
          systems = [];
          resolve();
        });
    }))
    .then(() => new Promise((resolve) => {
      System.find({}, (err, docs) => {
        let dists = [];
        return Promise.each(docs, (itemA, indexA) => {
          console.log(indexA);
          return Promise.each(docs, (itemB, indexB) => {
            const d = distance(itemA, itemB);
            if (indexB > indexA && d < config.maxRadius) {
              dists.push({
                names: [itemA.name,  itemB.name],
                X: [itemA.x, itemB.x],
                Y: [itemA.y, itemB.y],
                Z: [itemA.z, itemB.z],
                distance: d
              });
              if (dists.length > config.mongoose.size) {
                return Distance.collection.insert(dists)
                  .then(() => { dists = []; });
              }
            }
            return null;
          });
        })
        .then(() => Distance.collection.insert(dists)
        .then(() => { dists = []; }))
        .then(resolve);
      });
    })
  );
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
