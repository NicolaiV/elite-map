const http = require('https');
const fs = require('fs');
const fsp = require('fs-es6-promise');
const eachOfLimit = require('async').eachOfLimit;
const bluebird = require('bluebird');
const mongoose = require('mongoose');

mongoose.Promise = bluebird;
     
const connect = mongoose.connect('mongodb://localhost:27017/');
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
        res.on('data', function (chunk) {
            stream.write(chunk);
        });
        res.on('end', function () {
            console.log(`Запись ${url} в ${path}`);
            stream.end();
            
            fsp.readFile(path)
                .then(data=>{
                    try{
                        JSON.parse(data.toString());
                    }
                    catch(e) {
                        downloadFile(url, path, callback);
                    }
                    callback();
                });
        });
        res.on('error', (e) => {
            callback(e);
        });
    });
}

function getFile(url, path, callback){
    fsp.stat(path)
        .then(stat => {
            const date = new Date();
            if( stat
                && (stat.ctime.getFullYear() === date.getFullYear())
                && (stat.ctime.getMonth() === date.getMonth())
                && (stat.ctime.getDate() === date.getDate())){
                callback();
            } else {
                downloadFile(url, path, callback);
            }    
        })
        .catch(err=>{
            if (err.code === 'ENOENT'){
                downloadFile(url, path, callback);
            } else {
                callback(err);
            }
        });
}

function getJsonPath(item){
    return `data/${item}.json`;
}

function getAPI(api, done){
    try {
        eachOfLimit(api, 1, (value, key, callback) => getFile(value, getJsonPath(key), (code)=>{
            if(code){
                done(code);
            } 
            callback();
        }), () => done(0, Object.keys(api).map( item => getJsonPath(item))));
    } catch (err){
        done(err);
    }
}

function updateDB() {
    return new Promise(function(resolve, reject) {
        const pathToSystemsJSON = getJsonPath('systems');
        getFile('https://eddb.io/archive/v5/systems_populated.json', pathToSystemsJSON, (err)=>{
            if(err){
                console.log('Ошибка чтения файла: ' + JSON.stringify(err));
                reject(err);
                return;
            }
            console.log('Файл прочитан');
            fsp.readFile(pathToSystemsJSON)
                .then(data=>{
                    let systems = JSON.parse(data.toString());
                    console.log(systems.length);
                    eachOfLimit(systems, 1, (value, key, callback) => {
                        let system = new System(value);
                        system.save(() => callback());
                    }, () =>{console.log('END'); 
                        System.count({}, function(err, c) {
                            console.log('Count is ' + c);
                            resolve();
                        });
                    });
                });
        });
    });
}

function closeDB(){
    return new Promise(function(resolve) {
        console.log('closeDB');
        mongoose.connection.close(resolve);
    });
}

function initDb() { 
    return connect
        .then(() => db = connect.connection.db);
}

module.exports = {
    getAPI: getAPI,
    getJsonPath: getJsonPath,
    getFile: getFile,
    updateDB: updateDB,
    closeDB: closeDB,
    db: db,
    initDb: initDb
};