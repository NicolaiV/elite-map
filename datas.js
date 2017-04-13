const http = require('https')
const fs = require('fs')
const eachOfLimit = require('async').eachOfLimit;
const bluebird = require('bluebird')
const mongoose = require('mongoose')

mongoose.Promise = bluebird;
   
const connect = mongoose.connect('mongodb://localhost:27017/')
let db = mongoose.connection.db;

const System = mongoose.model('System', 
{  
  id: Number,
  edsm_id: Number,
  name: String,
  x: Number,
  y: Number,
  z: Number 
});

function downloadFile(url, path, callback){  
  let stream = new fs.createWriteStream(path);
  http.get(url, function (res) {
    console.log(`Загрузка ${url}`);
    let strJson = '';
    res.on('data', function (chunk) {
      stream.write(chunk);
    });
    res.on('end', function () {
      console.log(`Запись ${url} в ${path}`);
      stream.end()
      fs.readFile(path, (code, data)=>{
        if(code){
          callback(e);
        } else {
          try{
            JSON.parse(data.toString())
          }
          catch(e) {
            downloadFile(url, path, callback);
          }
          callback();
        }
      });
    });
    res.on('error', (e) => {
      callback(e);
    });
  })
}

function getFile(url, path, callback){
  try{
    fs.stat(path, (err, stat) => {
      const date = new Date();
      if( stat
        && (stat.ctime.getFullYear() === date.getFullYear())
        && (stat.ctime.getMonth() === date.getMonth())
        && (stat.ctime.getDate() === date.getDate())){
          callback();
        } else {
          downloadFile(url, path, callback)    
        }
    })
  } catch (err){
    callback(err)
  }
}

function getJsonPath(item){
  return `data/${item}.json`  
}

function getAPI(api, done){
  try {
    eachOfLimit(api, 1, (value, key, callback) => getFile(value, getJsonPath(key), (code)=>{if(code){done(code)} callback()}), () => done(0, Object.keys(api).map( item => getJsonPath(item))))
  } catch (err){
    done(err)
  }
}

function updateDB() {
  return new Promise(function(resolve, reject) {
    const pathToSystemsJSON = getJsonPath('systems');
    getFile("https://eddb.io/archive/v5/systems_populated.json", pathToSystemsJSON, (err, data)=>{
      if(err){
        console.log('Ошибка чтения файла')
        reject(err);
      }
      console.log('Файл прочитан')
      fs.readFile(pathToSystemsJSON, (code, data)=>{
        if(code){
          reject(e);
        } else {
          systems = JSON.parse(data.toString());
          console.log(systems.length)
          eachOfLimit(systems, 1, (value, key, callback) => {
            let system = new System(value);
            system.save((err, data, affected) => callback());
          }, () =>{console.log('END'); 
          System.count({}, function(err, c) {
            console.log('Count is ' + c);
          });
          resolve()});
          delete systems;
        }
      });
    })
  });
}

function closeDB(){
  return new Promise(function(resolve) {
    console.log('closeDB');
    mongoose.connection.close(resolve);
  })
}

function getDb() { 
  return connect
    .then(() => connect.connection.db); 
}

module.exports = {
  getAPI: getAPI,
  getJsonPath: getJsonPath,
  getFile: getFile,
  updateDB: updateDB,
  closeDB: closeDB,
  db: db,
  getDb: getDb
}